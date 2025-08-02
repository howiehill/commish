import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function PipelineFilters({ filters, onFiltersChange }) {
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
        value={filters.stage} 
        onValueChange={(value) => handleFilterChange('stage', value)}
      >
        <SelectTrigger className="w-36 bg-white border-slate-200">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stages</SelectItem>
          <SelectItem value="appraised">Appraised</SelectItem>
          <SelectItem value="awaiting_decision">Awaiting Decision</SelectItem>
          <SelectItem value="listed">Listed</SelectItem>
          <SelectItem value="sold">Sold</SelectItem>
          <SelectItem value="lost">Lost</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.probability} 
        onValueChange={(value) => handleFilterChange('probability', value)}
      >
        <SelectTrigger className="w-32 bg-white border-slate-200">
          <SelectValue placeholder="Probability" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="high">High (70%+)</SelectItem>
          <SelectItem value="medium">Medium (40-69%)</SelectItem>
          <SelectItem value="low">Low (&lt;40%)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}