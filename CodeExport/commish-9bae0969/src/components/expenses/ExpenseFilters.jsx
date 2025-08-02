
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function ExpenseFilters({ filters, onFiltersChange, financialYearOptions = [] }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="flex items-center gap-3">
      <Filter className="w-5 h-5 text-slate-400" />
      
      <Select 
        value={filters.category} 
        onValueChange={(value) => handleFilterChange('category', value)}
      >
        <SelectTrigger className="w-44 bg-white border-slate-200">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
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

      <Select 
        value={filters.financialYear} 
        onValueChange={(value) => handleFilterChange('financialYear', value)}
      >
        <SelectTrigger className="w-32 bg-white border-slate-200">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {financialYearOptions.map(year => (
            <SelectItem key={year} value={year}>{year}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
