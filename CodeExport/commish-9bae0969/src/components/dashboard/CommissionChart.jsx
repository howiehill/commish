
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
        <p className="font-sans text-slate-900 font-semibold">{`${label}`}</p>
        <p className="font-sans text-slate-600">
          Commission: <span className="font-semibold text-emerald-700">
            ${payload[0].value?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function CommissionChart({ data, isLoading }) {
  return (
    <Card className="card-shadow bg-white border-0">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 font-sans text-lg text-slate-900 font-semibold">
          <BarChart3 className="w-5 h-5 gold-accent" />
          Monthly Commission Earnings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#33C7F0" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6AE8A8" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280" 
                  fontSize={11}
                  tickLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={11}
                  tickLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="commission" 
                  fill="url(#barGradient)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
