
import React, { useState, useEffect } from 'react';
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { X, Save, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function PipelineForm({ opportunity, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(opportunity || {
    address: "",
    estimated_sale_price: "",
    commission_percentage: "1.98", // Changed default to "1.98"
    probability: 50,
    expected_settlement: "",
    stage: "appraised",
    client_name: "",
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateEstimatedCommission = () => {
    const salePrice = parseFloat(formData.estimated_sale_price) || 0;
    const commissionPercentage = parseFloat(formData.commission_percentage) || 0;
    // This now calculates the gross commission INCLUDING GST
    return (salePrice * commissionPercentage) / 100;
  };

  // Add retry logic for API calls
  const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        // Check for Axios-like error response structure and 429 status code
        if (error.response?.status === 429 && attempt < maxRetries) {
          console.log(`Rate limited, retrying in ${delay * attempt}ms... (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
        throw error;
      }
    }
  };

  useEffect(() => {
    if (opportunity) {
      setFormData({ ...opportunity });
      // The original outline included `calculateCommission({ ...opportunity });`.
      // This function is not defined in the current component. `calculateEstimatedCommission` exists.
      // Setting `formData` will automatically trigger re-calculations of display values
      // due to React's rendering cycle. So, this line is omitted to avoid errors and redundancy.
    } else {
      const fetchUserSettings = async () => {
        setIsLoading(true); // Set loading true when starting fetch
        try {
          const user = await retryApiCall(() => User.me());
          if (user && user.commission_percentage) {
            // Ensure the value is a string as expected by the Input component
            setFormData(prev => ({ ...prev, commission_percentage: user.commission_percentage.toString() }));
          }
        } catch (error) {
          console.error("Failed to fetch user settings for pipeline form", error);
          // Optionally, handle error display to user
        } finally {
          setIsLoading(false); // Set loading false after fetch completes
        }
      };
      fetchUserSettings();
    }
  }, [opportunity]); // Dependency array to re-run effect when opportunity prop changes

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      estimated_sale_price: parseFloat(formData.estimated_sale_price),
      commission_percentage: parseFloat(formData.commission_percentage),
      // The `estimated_commission` field in the database stores the full GST-inclusive amount
      estimated_commission: calculateEstimatedCommission()
    });
  };

  const handleListSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      estimated_sale_price: parseFloat(formData.estimated_sale_price),
      commission_percentage: parseFloat(formData.commission_percentage),
      estimated_commission: calculateEstimatedCommission(),
      convertToListing: true // Signal to the parent component to convert this opportunity to a listing
    });
  };

  const estimatedCommissionIncGst = calculateEstimatedCommission();
  const estimatedCommissionExGst = estimatedCommissionIncGst / 1.1;
  const weightedCommissionExGst = estimatedCommissionExGst * (formData.probability / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <Card className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-900">
              {opportunity ? 'Edit Opportunity' : 'Add New Opportunity'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="address">Property Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street, Suburb, State"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => handleInputChange('client_name', e.target.value)}
                  placeholder="John & Jane Smith"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_sale_price">Estimated Sale Price *</Label>
                <Input
                  id="estimated_sale_price"
                  type="number"
                  value={formData.estimated_sale_price}
                  onChange={(e) => handleInputChange('estimated_sale_price', e.target.value)}
                  placeholder="750000"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission_percentage">Commission % * (Inc. GST)</Label>
                <div className="relative">
                  <Input
                    id="commission_percentage"
                    type="number"
                    step="0.01" // Changed step to 0.01
                    value={formData.commission_percentage}
                    onChange={(e) => handleInputChange('commission_percentage', e.target.value)}
                    placeholder="1.98" // Changed placeholder to "1.98"
                    required
                    disabled={isLoading}
                    className="pr-8" // Added className "pr-8"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 pointer-events-none">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Current Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => handleInputChange('stage', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appraised">Appraised</SelectItem>
                    <SelectItem value="awaiting_decision">Awaiting Decision</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_settlement">Expected Settlement</Label>
                <Input
                  id="expected_settlement"
                  type="date"
                  value={formData.expected_settlement}
                  onChange={(e) => handleInputChange('expected_settlement', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Probability Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Probability of Sale</Label>
                <span className="font-semibold text-slate-900">{formData.probability}%</span>
              </div>
              <Slider
                value={[formData.probability]}
                onValueChange={(value) => handleInputChange('probability', value[0])}
                max={100}
                step={5}
                className="w-full"
                disabled={isLoading}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this opportunity..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Commission Calculation */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 gold-accent" />
                <h4 className="font-semibold text-slate-900">Commission Forecast (Ex GST)</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Full Commission:</p>
                  <p className="font-semibold">
                    ${estimatedCommissionExGst.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Weighted Value:</p>
                  <p className="font-bold text-lg gold-accent">
                    ${weightedCommissionExGst.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="commission-gradient text-white" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {opportunity ? 'Update Opportunity' : 'Save Opportunity'}
              </Button>
              {opportunity && (
                <Button type="button" onClick={handleListSubmit} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                  {/* Icon removed as 'List' is no longer imported. */}
                  LISTED
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
