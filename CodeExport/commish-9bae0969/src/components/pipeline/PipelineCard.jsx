
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit2, Trash2, MapPin, Calendar, Target, User, ArrowRight } from "lucide-react";
import { format } from 'date-fns';
import { motion } from "framer-motion";
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

export default function PipelineCard({ opportunity, onEdit, onDelete, onConvert }) {
  const weightedValue = opportunity.estimated_commission * (opportunity.probability / 100);
  const expectedDate = toValidDate(opportunity.expected_settlement);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card className="card-shadow bg-white border-0 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <h3 className="font-semibold text-slate-900 truncate">{opportunity.address}</h3>
              </div>
              {opportunity.client_name && (
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3 h-3 text-slate-400" />
                  <p className="text-sm text-slate-600">{opportunity.client_name}</p>
                </div>
              )}
              <Badge className={`${stageColors[opportunity.stage]} border text-xs`}>
                {opportunity.stage.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="flex gap-1">
              {onConvert && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onConvert(opportunity)}
                  className="text-slate-400 hover:text-green-600"
                  title="Convert to Property"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
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
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Estimated Sale</span>
              <span className="font-semibold text-slate-900">
                ${opportunity.estimated_sale_price?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            {expectedDate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Expected</span>
                </div>
                <span className="text-sm text-slate-900">
                  {format(expectedDate, 'MMM yyyy')}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Probability</span>
                </div>
                <span className={`text-sm font-medium ${probabilityColor(opportunity.probability)}`}>
                  {opportunity.probability}%
                </span>
              </div>
              <Progress value={opportunity.probability} className="h-2" />
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">
                  Full Commission ({opportunity.commission_percentage}%) (Ex GST)
                </span>
                <span className="text-sm font-medium text-slate-900">
                  ${(opportunity.estimated_commission / 1.1)?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <span className="font-medium text-slate-900">Weighted Value</span>
                <span className="font-bold text-lg gold-accent">
                  ${(weightedValue / 1.1).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {opportunity.notes && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-600 truncate">{opportunity.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
