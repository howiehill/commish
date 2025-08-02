
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, MapPin, Calendar, Target, User, ArrowRight, ChevronUp, ChevronDown } from "lucide-react";
import { format } from 'date-fns';
import { toValidDate } from '@/components/utils/dateUtils';

const stageColors = {
  appraised: "bg-gray-100 text-gray-800 border-gray-200",
  awaiting_decision: "bg-blue-100 text-blue-800 border-blue-200",
  listed: "bg-yellow-100 text-yellow-800 border-yellow-200",
  sold: "bg-green-100 text-green-800 border-green-200",
  lost: "bg-red-100 text-red-800 border-red-200"
};

const probabilityColor = (probability) => {
  if (probability >= 70) return "text-green-600";
  if (probability >= 40) return "text-yellow-600";
  return "text-red-600";
};

const SortableHeader = ({ children, sortKey, currentSort, onSort }) => {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort.direction : null;
  
  return (
    <button
      className="flex items-center gap-2 font-medium text-slate-900 hover:text-slate-600 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      {children}
      <div className="flex flex-col">
        <ChevronUp 
          className={`w-3 h-3 ${isActive && direction === 'asc' ? 'text-slate-900' : 'text-slate-300'}`} 
        />
        <ChevronDown 
          className={`w-3 h-3 -mt-1 ${isActive && direction === 'desc' ? 'text-slate-900' : 'text-slate-300'}`} 
        />
      </div>
    </button>
  );
};

export default function PipelineList({ 
  pipeline, 
  onEdit, 
  onDelete, 
  onConvert, 
  selectedOpportunities = [], 
  selectAll = false, 
  onSelectAll, 
  onSelectOpportunity,
  sortConfig = { key: null, direction: 'asc' },
  onSort
}) {
  return (
    <Card className="card-shadow bg-white border-0">
      <CardHeader>
        <CardTitle>Pipeline List</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-medium text-slate-900 w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={onSelectAll}
                  />
                </th>
                <th className="text-left p-4">
                  <SortableHeader sortKey="address" currentSort={sortConfig} onSort={onSort}>
                    Property
                  </SortableHeader>
                </th>
                <th className="text-left p-4">
                  <SortableHeader sortKey="estimated_sale_price" currentSort={sortConfig} onSort={onSort}>
                    Estimated Value
                  </SortableHeader>
                </th>
                <th className="text-left p-4">
                  <SortableHeader sortKey="commission_percentage" currentSort={sortConfig} onSort={onSort}>
                    Commission (Ex GST)
                  </SortableHeader>
                </th>
                <th className="text-left p-4">
                  <SortableHeader sortKey="stage" currentSort={sortConfig} onSort={onSort}>
                    Stage
                  </SortableHeader>
                </th>
                <th className="text-left p-4">
                  <SortableHeader sortKey="probability" currentSort={sortConfig} onSort={onSort}>
                    Probability
                  </SortableHeader>
                </th>
                <th className="text-left p-4">
                  <SortableHeader sortKey="weighted_value" currentSort={sortConfig} onSort={onSort}>
                    Weighted Value
                  </SortableHeader>
                </th>
                <th className="text-right p-4 font-medium text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pipeline.map((opportunity) => {
                const weightedValue = opportunity.estimated_commission * (opportunity.probability / 100);
                const expectedDate = toValidDate(opportunity.expected_settlement);
                const isSelected = selectedOpportunities.includes(opportunity.id);
                return (
                  <tr key={opportunity.id} className={`border-b border-slate-100 hover:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <td className="p-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectOpportunity(opportunity.id, checked)}
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{opportunity.address}</span>
                        </div>
                        {opportunity.client_name && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <User className="w-3 h-3" />
                            <span>{opportunity.client_name}</span>
                          </div>
                        )}
                        {expectedDate && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>Expected: {format(expectedDate, 'MMM yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold">
                        ${opportunity.estimated_sale_price?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium">
                        {opportunity.commission_percentage}%
                      </span>
                      <p className="text-xs text-slate-500">
                        ${(opportunity.estimated_commission / 1.1)?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </td>
                    <td className="p-4">
                      <Badge className={`${stageColors[opportunity.stage]} border text-xs`}>
                        {opportunity.stage.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${probabilityColor(opportunity.probability)}`}>
                            {opportunity.probability}%
                          </span>
                        </div>
                        <Progress value={opportunity.probability} className="h-2" />
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold gold-accent">
                        ${(weightedValue / 1.1).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onConvert(opportunity)}
                          className="text-slate-400 hover:text-green-600"
                          title="Convert to Property"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(opportunity)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(opportunity.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
