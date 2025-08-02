
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Calendar } from "lucide-react";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { toValidDate } from '@/components/utils/dateUtils'; // Updated import path for toValidDate

const statusColors = {
  settled: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  conditional: "bg-blue-100 text-blue-800 border-blue-200"
};

export default function RecentProperties({ properties, isLoading }) {
  return (
    <Card className="card-shadow bg-white border-0">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Home className="w-5 h-5 gold-accent" />
          Recent Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => {
              const settlementDate = toValidDate(property.settlement_date);
              return (
                <div key={property.id} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{property.address}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span>${property.sale_price?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        {settlementDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(settlementDate, 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${statusColors[property.status]} border text-xs`}>
                        {property.status}
                      </Badge>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          ${property.net_commission?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-slate-500">{property.commission_percentage}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {properties.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Home className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No properties recorded yet</p>
                <p className="text-sm">Add your first property to get started</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
