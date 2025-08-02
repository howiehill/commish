
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target } from "lucide-react";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { toValidDate } from '@/components/utils/dateUtils';

const stageColors = {
  listing: "bg-gray-100 text-gray-800 border-gray-200",
  marketing: "bg-blue-100 text-blue-800 border-blue-200",
  under_offer: "bg-yellow-100 text-yellow-800 border-yellow-200",
  conditional: "bg-orange-100 text-orange-800 border-orange-200",
  unconditional: "bg-green-100 text-green-800 border-green-200"
};

export default function PipelinePreview({ pipeline, isLoading }) {
  const totalPotential = pipeline.reduce((sum, item) => 
    sum + (item.estimated_commission * (item.probability / 100)), 0);

  return (
    <Card className="card-shadow bg-white border-0">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center justify-between text-slate-900">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 gold-accent" />
            Pipeline Overview
          </div>
          <div className="text-right">
            <p className="text-sm font-normal text-slate-500">Potential</p>
            <p className="text-lg font-bold gold-accent">
              ${totalPotential.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-3 border border-slate-100 rounded-lg">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-24 mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {pipeline.map((item) => {
              const expectedDate = toValidDate(item.expected_settlement);
              return (
                <div key={item.id} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{item.address}</p>
                      {expectedDate && (
                        <p className="text-xs text-slate-500">
                          Expected: {format(expectedDate, 'MMM yyyy')}
                        </p>
                      )}
                    </div>
                    <Badge className={`${stageColors[item.stage]} border text-xs ml-2`}>
                      {item.stage.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-3 h-3 text-slate-400" />
                      <span className="text-sm text-slate-600">{item.probability}% likely</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 text-sm">
                        ${(item.estimated_commission * (item.probability / 100)).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-slate-500">
                        of ${item.estimated_commission?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {pipeline.length === 0 && (
              <div className="text-center py-6 text-slate-500">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No pipeline opportunities</p>
                <p className="text-xs">Add potential deals to track future earnings</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
