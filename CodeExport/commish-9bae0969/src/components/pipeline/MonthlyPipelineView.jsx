
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target } from "lucide-react";
import { format, isSameMonth, eachMonthOfInterval, addMonths } from 'date-fns';
import PipelineCard from './PipelineCard';
import { toValidDate } from '@/components/utils/dateUtils';

const stageColors = {
  listing: "bg-gray-100 text-gray-800 border-gray-200",
  marketing: "bg-blue-100 text-blue-800 border-blue-200",
  under_offer: "bg-yellow-100 text-yellow-800 border-yellow-200",
  conditional: "bg-orange-100 text-orange-800 border-orange-200",
  unconditional: "bg-green-100 text-green-800 border-green-200"
};

export default function MonthlyPipelineView({ pipeline, onEdit, onDelete, onConvert }) {
  // Group pipeline by expected settlement month
  const groupedPipeline = React.useMemo(() => {
    // Get next 12 months starting from current month
    const months = eachMonthOfInterval({
      start: new Date(),
      end: addMonths(new Date(), 11)
    });

    return months.map(month => {
      const monthOpportunities = pipeline.filter(item => {
        const expectedDate = toValidDate(item.expected_settlement);
        return expectedDate && isSameMonth(expectedDate, month);
      });

      const totalWeightedValue = monthOpportunities.reduce((sum, item) => 
        sum + (item.estimated_commission * (item.probability / 100)), 0);

      const totalEstimatedValue = monthOpportunities.reduce((sum, item) => 
        sum + item.estimated_commission, 0);

      return {
        month,
        opportunities: monthOpportunities,
        totalWeightedValue,
        totalEstimatedValue,
        count: monthOpportunities.length
      };
    }).filter(monthData => monthData.count > 0); // Only show months with opportunities
  }, [pipeline]);

  // Handle items without expected settlement date
  const unscheduledOpportunities = pipeline.filter(item => !toValidDate(item.expected_settlement));

  return (
    <div className="space-y-6">
      {groupedPipeline.map(({ month, opportunities, totalWeightedValue, totalEstimatedValue, count }) => (
        <Card key={month.toISOString()} className="card-shadow bg-white border-0">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Calendar className="w-5 h-5 gold-accent" />
                {format(month, 'MMMM yyyy')}
                <Badge variant="outline" className="ml-2">
                  {count} {count === 1 ? 'opportunity' : 'opportunities'}
                </Badge>
              </CardTitle>
              <div className="text-right">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Weighted: </span>
                    <span className="font-bold gold-accent">
                      ${totalWeightedValue.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Potential: </span>
                    <span className="font-semibold text-slate-900">
                      ${totalEstimatedValue.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {opportunities.map((opportunity) => (
                <PipelineCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onConvert={onConvert}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Unscheduled Opportunities */}
      {unscheduledOpportunities.length > 0 && (
        <Card className="card-shadow bg-white border-0">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Target className="w-5 h-5 text-slate-400" />
              Unscheduled Opportunities
              <Badge variant="outline" className="ml-2 bg-slate-50">
                {unscheduledOpportunities.length} {unscheduledOpportunities.length === 1 ? 'opportunity' : 'opportunities'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {unscheduledOpportunities.map((opportunity) => (
                <PipelineCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onConvert={onConvert}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {groupedPipeline.length === 0 && unscheduledOpportunities.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Pipeline Opportunities</h3>
          <p className="text-slate-600">Add opportunities to see them organized by expected settlement month</p>
        </div>
      )}
    </div>
  );
}
