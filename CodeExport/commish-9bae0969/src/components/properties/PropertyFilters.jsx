
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function PropertyFilters({ filters, onFiltersChange, financialYearOptions = [] }) {
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
        value={filters.status} 
        onValueChange={(value) => handleFilterChange('status', value)}
      >
        <SelectTrigger className="w-32 bg-white border-slate-200">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="settled">Settled</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="conditional">Conditional</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.propertyType} 
        onValueChange={(value) => handleFilterChange('propertyType', value)}
      >
        <SelectTrigger className="w-36 bg-white border-slate-200">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="house">House</SelectItem>
          <SelectItem value="apartment">Apartment</SelectItem>
          <SelectItem value="townhouse">Townhouse</SelectItem>
          <SelectItem value="land">Land</SelectItem>
          <SelectItem value="commercial">Commercial</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.financialYear} 
        onValueChange={(value) => handleFilterChange('financialYear', value)}
      >
        <SelectTrigger className="w-32 bg-white border-slate-200">
          <SelectValue placeholder="FY" />
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
