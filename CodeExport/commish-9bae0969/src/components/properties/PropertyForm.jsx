
import React, { useState, useEffect, useMemo } from 'react';
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { getFinancialYearOptions } from '@/components/utils/dateUtils';

export default function PropertyForm({ property, onSubmit, onCancel }) {
  const [isLoading, setIsLoading] = useState(true); // State to manage loading status
  // formData is initialized to null and will be populated after fetching user settings
  const [formData, setFormData] = useState(null);

  const financialYearOptions = getFinancialYearOptions();

  // Utility function for getting current financial year (Australian financial year)
  function getCurrentFinancialYear() {
    const now = new Date();
    const year = now.getFullYear();
    // Australian financial year: July 1st to June 30th
    return now.getMonth() >= 6 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
  }

  // Function to add retry logic for API calls, especially for rate limits (429 errors)
  const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await apiCall();
        } catch (error) {
          // Check if it's an Axios error with a 429 status and if there are retries left
          if (error.response?.status === 429 && attempt < maxRetries) {
            console.log(`Rate limited, retrying in ${delay * attempt}ms... (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
            continue; // Continue to the next attempt
          }
          throw error; // Re-throw other errors or if retries are exhausted
        }
      }
  };

  // useEffect hook to fetch initial data (user settings) and set up formData
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true); // Start loading
      try {
        // Fetch user settings with retry logic
        const userSettingsFetched = await retryApiCall(() => User.me());

        // Consolidate user settings with default fallbacks
        const userSettings = {
          marketing_levy_type: userSettingsFetched.marketing_levy_type || 'percentage',
          marketing_levy_value: userSettingsFetched.marketing_levy_value || 1,
          franchise_fee_type: userSettingsFetched.franchise_fee_type || 'percentage',
          franchise_fee_value: userSettingsFetched.franchise_fee_value || 6,
          transaction_fee_type: userSettingsFetched.transaction_fee_type || 'fixed',
          transaction_fee_value: userSettingsFetched.transaction_fee_value || 0
        };

        // Define base default form data, incorporating user settings as initial defaults
        const baseDefaultData = {
          address: "",
          sale_price: "",
          commission_percentage: "1.98", // Updated default
          gst_inclusive: true,
          marketing_levy_type: userSettings.marketing_levy_type,
          marketing_levy_value: userSettings.marketing_levy_value.toString(),
          franchise_fee_type: userSettings.franchise_fee_type,
          franchise_fee_value: userSettings.franchise_fee_value.toString(),
          transaction_fee_type: userSettings.transaction_fee_type,
          transaction_fee_value: userSettings.transaction_fee_value.toString(),
          other_fees: "0",
          settlement_date: "",
          financial_year: getCurrentFinancialYear(),
          status: "settled",
          client_name: "",
          property_type: "house",
          agent_count: "1"
        };

        let initialFormData = { ...baseDefaultData }; // Start with these defaults

        // If 'property' prop is provided (editing an existing property)
        if (property) {
          // Merge existing property data, ensuring numbers are converted to strings for input fields
          // and falling back to user settings if specific property fields are null/undefined
          initialFormData = {
            ...baseDefaultData, // Start with defaults (which include user settings)
            ...property, // Override with existing property data
            sale_price: property.sale_price?.toString() || "",
            commission_percentage: property.commission_percentage?.toString() || "1.98", // Updated default
            // Apply property-specific type/value, falling back to user settings if not defined on property
            marketing_levy_type: property.marketing_levy_type ?? userSettings.marketing_levy_type,
            marketing_levy_value: property.marketing_levy_value?.toString() ?? userSettings.marketing_levy_value.toString(),
            franchise_fee_type: property.franchise_fee_type ?? userSettings.franchise_fee_type,
            franchise_fee_value: property.franchise_fee_value?.toString() ?? userSettings.franchise_fee_value.toString(),
            transaction_fee_type: property.transaction_fee_type ?? userSettings.transaction_fee_type,
            transaction_fee_value: property.transaction_fee_value?.toString() ?? userSettings.transaction_fee_value.toString(),
            other_fees: property.other_fees?.toString() || "0",
            agent_count: property.agent_count?.toString() || "1",
          };
        }
        
        setFormData(initialFormData); // Set the form data state

      } catch(err) {
        console.error("Failed to load initial data for property form:", err);
        // TODO: Implement user-friendly error display (e.g., a toast notification) here
      } finally {
        setIsLoading(false); // End loading, regardless of success or failure
      }
    };
    fetchInitialData();
  }, [property]); // Dependency array includes 'property' to re-run when the property prop changes

  // Show loading indicator if data is still being fetched or not yet set
  if (isLoading || !formData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 text-white text-lg font-semibold"
      >
        Loading Property Form...
      </motion.div>
    );
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculations = useMemo(() => {
    const salePrice = parseFloat(formData.sale_price) || 0;
    const commissionPerc = parseFloat(formData.commission_percentage) || 0;
    const agent_count = parseInt(formData.agent_count, 10) || 1;
    
    const mktLevyVal = parseFloat(formData.marketing_levy_value) || 0;
    const franFeeVal = parseFloat(formData.franchise_fee_value) || 0;
    const transFeeVal = parseFloat(formData.transaction_fee_value) || 0;
    const otherFees = parseFloat(formData.other_fees) || 0;

    let gross_commission_inc_gst = (salePrice * commissionPerc) / 100;
    let gross_commission_ex_gst = formData.gst_inclusive
      ? gross_commission_inc_gst / 1.1
      : gross_commission_inc_gst;

    if (!formData.gst_inclusive) {
      gross_commission_inc_gst = gross_commission_ex_gst * 1.1;
    }

    const marketing_levy = formData.marketing_levy_type === 'percentage'
      ? gross_commission_ex_gst * (mktLevyVal / 100)
      : mktLevyVal;

    const franchise_fee = formData.franchise_fee_type === 'percentage'
      ? gross_commission_ex_gst * (franFeeVal / 100)
      : franFeeVal;
      
    const transaction_fee = formData.transaction_fee_type === 'percentage'
      ? gross_commission_ex_gst * (transFeeVal / 100)
      : transFeeVal;

    const total_fees = marketing_levy + franchise_fee + transaction_fee + otherFees;
    const net_commission = gross_commission_inc_gst - total_fees;

    const gross_commission_per_agent = gross_commission_ex_gst / agent_count;
    const sale_price_per_agent = salePrice / agent_count;

    return {
      gross_commission_inc_gst,
      gross_commission_ex_gst,
      marketing_levy,
      franchise_fee,
      transaction_fee,
      net_commission,
      gross_commission_per_agent,
      sale_price_per_agent
    };
  }, [formData]); // Recalculate when formData changes

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      sale_price: parseFloat(formData.sale_price) || 0,
      commission_percentage: parseFloat(formData.commission_percentage) || 0,
      marketing_levy_value: parseFloat(formData.marketing_levy_value) || 0,
      franchise_fee_value: parseFloat(formData.franchise_fee_value) || 0,
      transaction_fee_value: parseFloat(formData.transaction_fee_value) || 0,
      other_fees: parseFloat(formData.other_fees) || 0,
      agent_count: parseInt(formData.agent_count, 10) || 1,
      gross_commission_inc_gst: calculations.gross_commission_inc_gst,
      gross_commission_ex_gst: calculations.gross_commission_ex_gst,
      marketing_levy: calculations.marketing_levy,
      franchise_fee: calculations.franchise_fee,
      transaction_fee: calculations.transaction_fee,
      net_commission: calculations.net_commission,
      gross_commission_per_agent: calculations.gross_commission_per_agent,
      sale_price_per_agent: calculations.sale_price_per_agent,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <Card className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-900">
              {property ? 'Edit Property' : 'Add New Property'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="address">Property Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street, Suburb, State"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => handleInputChange('client_name', e.target.value)}
                  placeholder="John & Jane Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sale_price">Sale Price *</Label>
                <Input
                  id="sale_price"
                  type="number"
                  value={formData.sale_price}
                  onChange={(e) => handleInputChange('sale_price', e.target.value)}
                  placeholder="750000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission_percentage">Commission % * (Inc. GST)</Label>
                <div className="relative">
                  <Input
                    id="commission_percentage"
                    type="number"
                    step="0.01" // Changed step
                    value={formData.commission_percentage}
                    onChange={(e) => handleInputChange('commission_percentage', e.target.value)}
                    placeholder="1.98" // Changed placeholder
                    required
                    className="pr-8" // Added padding for the % symbol
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 pointer-events-none">%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agent_count">Number of Agents</Label>
                <Input
                  id="agent_count"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.agent_count}
                  onChange={(e) => handleInputChange('agent_count', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_type">Property Type</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => handleInputChange('property_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="settled">Settled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="conditional">Conditional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settlement_date">Settlement Date *</Label>
                <Input
                  id="settlement_date"
                  type="date"
                  value={formData.settlement_date}
                  onChange={(e) => handleInputChange('settlement_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="financial_year">Financial Year</Label>
                <Select
                  value={formData.financial_year}
                  onValueChange={(value) => handleInputChange('financial_year', value)}
                >
                  <SelectTrigger id="financial_year">
                    <SelectValue placeholder="Select a year" />
                  </SelectTrigger>
                  <SelectContent>
                    {financialYearOptions.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* GST Setting */}
            <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
              <Checkbox
                id="gst_inclusive"
                checked={formData.gst_inclusive}
                onCheckedChange={(checked) => handleInputChange('gst_inclusive', checked)}
              />
              <Label htmlFor="gst_inclusive">Commission is GST inclusive</Label>
            </div>

            {/* Additional Fees */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Additional Fees</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Marketing Levy */}
                <div className="space-y-2">
                  <Label>Marketing Levy</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.marketing_levy_type}
                      onValueChange={(value) => handleInputChange('marketing_levy_type', value)}
                    >
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">$</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative flex-grow">
                      <Input
                        type="number" step="0.1"
                        value={formData.marketing_levy_value}
                        onChange={(e) => handleInputChange('marketing_levy_value', e.target.value)}
                        placeholder="Value"
                        className={formData.marketing_levy_type === 'percentage' ? 'pr-7' : 'pl-7'}
                      />
                      <span className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-500 ${formData.marketing_levy_type === 'percentage' ? 'right-0 pr-3' : 'left-0 pl-3'}`}>
                        {formData.marketing_levy_type === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Franchise Fee */}
                <div className="space-y-2">
                  <Label>Franchise Fee</Label>
                   <div className="flex gap-2">
                    <Select
                      value={formData.franchise_fee_type}
                      onValueChange={(value) => handleInputChange('franchise_fee_type', value)}
                    >
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">$</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative flex-grow">
                      <Input
                        type="number" step="0.1"
                        value={formData.franchise_fee_value}
                        onChange={(e) => handleInputChange('franchise_fee_value', e.target.value)}
                        placeholder="Value"
                        className={formData.franchise_fee_type === 'percentage' ? 'pr-7' : 'pl-7'}
                      />
                      <span className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-500 ${formData.franchise_fee_type === 'percentage' ? 'right-0 pr-3' : 'left-0 pl-3'}`}>
                        {formData.franchise_fee_type === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Fee */}
                <div className="space-y-2">
                  <Label>Transaction Fee</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.transaction_fee_type}
                      onValueChange={(value) => handleInputChange('transaction_fee_type', value)}
                    >
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">$</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative flex-grow">
                      <Input
                        type="number" step="0.01"
                        value={formData.transaction_fee_value}
                        onChange={(e) => handleInputChange('transaction_fee_value', e.target.value)}
                        placeholder="Value"
                        className={formData.transaction_fee_type === 'percentage' ? 'pr-7' : 'pl-7'}
                      />
                      <span className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-500 ${formData.transaction_fee_type === 'percentage' ? 'right-0 pr-3' : 'left-0 pl-3'}`}>
                        {formData.transaction_fee_type === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="other_fees">Other Fees ($)</Label>
                  <Input
                    id="other_fees"
                    type="number"
                    step="0.01"
                    value={formData.other_fees}
                    onChange={(e) => handleInputChange('other_fees', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Commission Summary */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 gold-accent" />
                <h4 className="font-semibold text-slate-900">Commission Summary</h4>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Gross (ex. GST):</p>
                  <p className="font-semibold">
                    ${calculations.gross_commission_ex_gst.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Gross (inc. GST):</p>
                  <p className="font-semibold">
                    ${calculations.gross_commission_inc_gst.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Total Fees:</p>
                  <p className="font-semibold text-red-600">
                    -${(calculations.marketing_levy + calculations.franchise_fee + calculations.transaction_fee + (parseFloat(formData.other_fees) || 0)).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Net Commission:</p>
                  <p className="font-bold text-lg gold-accent">
                    ${calculations.net_commission.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2 grid grid-cols-2 gap-x-4">
                  <span>
                    Mkt Levy: ${calculations.marketing_levy.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span>
                    Fran Fee: ${calculations.franchise_fee.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span>
                    Trans Fee: ${calculations.transaction_fee.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span>
                    Gross Commission Per Agent: ${calculations.gross_commission_per_agent.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span>
                    Sale Price Per Agent: ${calculations.sale_price_per_agent.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="commission-gradient text-white">
                <Save className="w-4 h-4 mr-2" />
                {property ? 'Update Property' : 'Save Property'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
