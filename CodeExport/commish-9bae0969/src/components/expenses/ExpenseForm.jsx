
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save } from "lucide-react";
import { motion } from "framer-motion";
import { getFinancialYearOptions, toValidDate } from '@/components/utils/dateUtils';
import { format } from 'date-fns';

import { Property } from '@/api/entities'; 

export default function ExpenseForm({ expense, onSubmit, onCancel }) {
  function getCurrentFinancialYear() {
    const now = new Date();
    const year = now.getFullYear();
    // Australian financial year: July 1st to June 30th
    return now.getMonth() >= 6 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
  }

  const [formData, setFormData] = useState(expense || {
    description: "",
    amount: "",
    expense_date: "",
    category: "other",
    property_address: "",
    financial_year: getCurrentFinancialYear(),
    tax_deductible: true
  });
  const [properties, setProperties] = useState([]);

  const financialYearOptions = getFinancialYearOptions();

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
    if (expense) {
      setFormData({
        ...expense,
        expense_date: expense.expense_date ? format(toValidDate(expense.expense_date), 'yyyy-MM-dd') : ''
      });
    }
    const fetchProperties = async () => {
      try {
        const propertiesData = await retryApiCall(() => Property.list());
        setProperties(propertiesData);
      } catch (error) {
        console.error("Failed to fetch properties for expense form", error);
      }
    };
    fetchProperties();
  }, [expense]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount) || 0
    });
  };

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
              {expense ? 'Edit Expense' : 'Add New Expense'}
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
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="250.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense_date">Expense Date *</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => handleInputChange('expense_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exchange_gift">Exchange Gift</SelectItem>
                    <SelectItem value="settlement_gift">Settlement Gift</SelectItem>
                    <SelectItem value="office_equipment">Office Equipment</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="wages">Wages</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="coaching">Coaching</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_address">Property Address</Label>
                <Input
                  id="property_address"
                  value={formData.property_address}
                  onChange={(e) => handleInputChange('property_address', e.target.value)}
                  placeholder="123 Main Street, Suburb"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Marketing materials for property listing"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial_year">Financial Year</Label>
              <Select
                value={formData.financial_year}
                onValueChange={(value) => handleInputChange('financial_year', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {financialYearOptions.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="tax_deductible"
                checked={formData.tax_deductible}
                onCheckedChange={(checked) => handleInputChange('tax_deductible', checked)}
              />
              <Label htmlFor="tax_deductible">Tax Deductible</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="commission-gradient text-white">
                <Save className="w-4 h-4 mr-2" />
                {expense ? 'Update Expense' : 'Save Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
