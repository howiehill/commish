import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

export default function GoalGauge({ current, target, title }) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <Card className="card-shadow bg-white border-0 w-full">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 commission-gradient rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-lg font-bold text-slate-900">
              {percentage.toFixed(0)}% Complete
            </p>
          </div>
        </div>
        
        {/* Running Total on top of progress bar */}
        <div className="mb-2 flex justify-end">
          <span className="text-lg font-bold text-slate-900">
            ${current.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full h-8 bg-slate-100 rounded-lg overflow-hidden">
            <div 
              className="h-full transition-all duration-1000 ease-out rounded-lg commission-gradient"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Target Labels */}
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>$0</span>
          <span>Target: ${target.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>

        {/* Achievement Message */}
        {percentage >= 100 && (
          <div className="mt-2 text-center">
            <p className="text-sm font-semibold text-green-600">🎉 Goal Achieved!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}