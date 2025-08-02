
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, MapPin, Calendar, DollarSign, User, ChevronUp, ChevronDown } from "lucide-react";
import { format } from 'date-fns';
import { toValidDate } from '@/components/utils/dateUtils';

const statusColors = {
  settled: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  conditional: "bg-blue-100 text-blue-800 border-blue-200"
};

const typeColors = {
  house: "bg-blue-50 text-blue-700",
  apartment: "bg-purple-50 text-purple-700",
  townhouse: "bg-green-50 text-green-700",
  land: "bg-orange-50 text-orange-700",
  commercial: "bg-red-50 text-red-700"
};

const SortableHeader = ({ children, sortKey, currentSort, onSort }) => {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort.direction : null;
  
  return (
    <button
      className="flex items-center gap-2 text-left font-medium text-slate-900 hover:text-slate-600 transition-colors"
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

export default function PropertyList({ 
  properties, 
  selectedProperties = [], 
  selectAll = false,
  onSelectAll,
  onSelectProperty,
  onEdit, 
  onDelete, 
  isScrollable = false,
  sortConfig = { key: null, direction: 'asc' },
  onSort
}) {
  
  const handleDeleteClick = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) {
      console.warn('Property not found in current list, refreshing...');
      return;
    }
    onDelete(propertyId);
  };

  return (
    <Card className={`card-shadow bg-white border-0 ${isScrollable ? 'h-full flex flex-col' : ''}`}>
      <CardHeader className="flex-shrink-0 border-b border-slate-100">
        <CardTitle>Properties List</CardTitle>
      </CardHeader>
      <CardContent className={`p-0 ${isScrollable ? 'flex-1 overflow-hidden' : ''}`}>
        <div className={`${isScrollable ? 'h-full overflow-y-auto' : 'overflow-x-auto'}`}>
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="text-left p-4 font-medium text-slate-900 w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={onSelectAll}
                  />
                </th>
                <th className="text-left p-4 font-medium text-slate-900">
                  <SortableHeader sortKey="address" currentSort={sortConfig} onSort={onSort}>
                    Property
                  </SortableHeader>
                </th>
                <th className="text-left p-4 font-medium text-slate-900">
                  <SortableHeader sortKey="sale_price" currentSort={sortConfig} onSort={onSort}>
                    Sale Price
                  </SortableHeader>
                </th>
                <th className="text-left p-4 font-medium text-slate-900">
                  <SortableHeader sortKey="commission_percentage" currentSort={sortConfig} onSort={onSort}>
                    Commission
                  </SortableHeader>
                </th>
                <th className="text-left p-4 font-medium text-slate-900">
                  <SortableHeader sortKey="settlement_date" currentSort={sortConfig} onSort={onSort}>
                    Settlement
                  </SortableHeader>
                </th>
                <th className="text-left p-4 font-medium text-slate-900">
                  <SortableHeader sortKey="status" currentSort={sortConfig} onSort={onSort}>
                    Status
                  </SortableHeader>
                </th>
                <th className="text-left p-4 font-medium text-slate-900">
                  <SortableHeader sortKey="net_commission" currentSort={sortConfig} onSort={onSort}>
                    Net
                  </SortableHeader>
                </th>
                <th className="text-right p-4 font-medium text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => {
                const settlementDate = toValidDate(property.settlement_date);
                const isSelected = selectedProperties.includes(property.id);
                return (
                  <tr key={property.id} className={`border-b border-slate-100 hover:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <td className="p-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectProperty(property.id, checked)}
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{property.address}</span>
                        </div>
                        {property.client_name && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <User className="w-3 h-3" />
                            <span>{property.client_name}</span>
                          </div>
                        )}
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className={`${typeColors[property.property_type]} text-xs`}>
                            {property.property_type}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold">
                          ${property.sale_price?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium">
                        {property.commission_percentage}%
                      </span>
                      <p className="text-xs text-slate-500">
                        ${property.gross_commission_inc_gst?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">
                          {settlementDate ? format(settlementDate, 'MMM d, yyyy') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={`${statusColors[property.status]} border text-xs`}>
                        {property.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="font-bold gold-accent">
                        ${property.net_commission?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(property)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(property.id)}
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
