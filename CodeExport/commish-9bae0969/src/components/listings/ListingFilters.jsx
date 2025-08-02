import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function ListingFilters({ filters, onFiltersChange }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex items-center gap-3">
      <Filter className="w-5 h-5 text-slate-400" />
      
      <Select 
        value={filters.stage} 
        onValueChange={(value) => handleFilterChange('stage', value)}
      >
        <SelectTrigger className="w-40 bg-white border-slate-200">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stages</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="under_offer">Under Offer</SelectItem>
          <SelectItem value="conditional">Conditional</SelectItem>
          <SelectItem value="exchanged">Exchanged</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}