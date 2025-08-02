
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Calculator, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { User } from '@/api/entities'; // Corrected import path

export default function ListingForm({ listing, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(listing || {
    address: "",
    client_name: "",
    estimated_sale_price: "",
    commission_percentage: "1.98", // Updated default commission percentage
    listing_date: new Date().toISOString().split('T')[0],
    stage: "active",
    notes: "",
    convertToProperty: false // Initialize for new listings
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateEstimatedCommission = () => {
    const salePrice = parseFloat(formData.estimated_sale_price) || 0;
    const commissionPercentage = parseFloat(formData.commission_percentage) || 0;
    return (salePrice * commissionPercentage) / 100;
  };

  // Add retry logic for API calls
  const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
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
    if (listing) {
      // When an existing listing is passed, initialize formData with its values
      // and ensure convertToProperty is false (it's only true upon "SOLD" submission)
      setFormData(prev => ({ ...prev, ...listing, convertToProperty: false }));
      // The outline included `calculateCommission({ ...listing });` which is not a defined function.
      // The `estimatedCommission` is already reactively calculated based on `formData`,
      // so no explicit call is needed here.
    } else {
      // When adding a new listing, fetch user settings for default commission
      const fetchUserSettings = async () => {
        try {
          // Use retryApiCall for fetching user settings
          const user = await retryApiCall(() => User.me());
          if (user && user.commission_percentage) {
            setFormData(prev => ({ ...prev, commission_percentage: user.commission_percentage }));
          }
        } catch (error) {
          console.error("Failed to fetch user settings for listing form:", error);
        }
      };
      fetchUserSettings();
    }
  }, [listing]); // Dependency array: run when 'listing' prop changes (e.g., component switches between add/edit mode)

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      estimated_sale_price: parseFloat(formData.estimated_sale_price),
      commission_percentage: parseFloat(formData.commission_percentage),
      estimated_commission: calculateEstimatedCommission()
    });
  };

  const handleSoldSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      estimated_sale_price: parseFloat(formData.estimated_sale_price),
      commission_percentage: parseFloat(formData.commission_percentage),
      estimated_commission: calculateEstimatedCommission(),
      convertToProperty: true // Flag to convert to a property upon submission
    });
  };

  const estimatedCommission = calculateEstimatedCommission();

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
              {listing ? 'Edit Listing' : 'Add New Listing'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="address">Property Address *</Label>
                <Input id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input id="client_name" value={formData.client_name} onChange={(e) => handleInputChange('client_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_sale_price">Listing Price *</Label>
                <Input id="estimated_sale_price" type="number" value={formData.estimated_sale_price} onChange={(e) => handleInputChange('estimated_sale_price', e.target.value)} required />
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
                    placeholder="1.98" // Added placeholder
                    required
                    className="pr-8" // Added padding-right for the percentage symbol
                  />
                   <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 pointer-events-none">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="listing_date">Listing Date</Label>
                <Input id="listing_date" type="date" value={formData.listing_date} onChange={(e) => handleInputChange('listing_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="under_offer">Under Offer</SelectItem>
                    <SelectItem value="conditional">Conditional</SelectItem>
                    <SelectItem value="exchanged">Exchanged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} rows={3} />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 gold-accent" />
                <h4 className="font-semibold text-slate-900">Commission Forecast (Inc. GST)</h4>
              </div>
              <p className="font-bold text-lg gold-accent">
                ${estimatedCommission.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit" className="commission-gradient text-white">
                <Save className="w-4 h-4 mr-2" />
                {listing ? 'Update Listing' : 'Save Listing'}
              </Button>
              {listing && (
                <Button type="button" onClick={handleSoldSubmit} className="bg-green-600 hover:bg-green-700 text-white">
                  <Trophy className="w-4 h-4 mr-2" />
                  SOLD
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
