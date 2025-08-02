import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricCard({ title, value, icon: Icon, trend, trendUp }) {
  return (
    <Card className="card-shadow bg-white border-0 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 commission-gradient rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trendUp ? 'text-green-600' : 'text-slate-500'
            }`}>
              {trendUp && <TrendingUp className="w-4 h-4" />}
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mb-2">{value}</p>
          {trend && (
            <p className={`text-sm ${trendUp ? 'text-green-600' : 'text-slate-500'}`}>
              {trend}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}