
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, MapPin, Calendar, DollarSign } from "lucide-react";
import { format } from 'date-fns';
import { motion } from "framer-motion";
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

export default function PropertyCard({ property, onEdit, onDelete }) {
  const settlementDate = toValidDate(property.settlement_date);

  const handleDeleteClick = () => {
    // Add validation before calling delete
    if (!property || !property.id) {
      console.warn('Invalid property data for deletion. Property or property ID is missing.');
      return;
    }
    onDelete(property.id);
  };

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
                <h3 className="font-semibold text-slate-900 truncate">{property.address}</h3>
              </div>
              {property.client_name && (
                <p className="text-sm text-slate-600 mb-2">{property.client_name}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${statusColors[property.status]} border text-xs`}>
                  {property.status}
                </Badge>
                <Badge variant="outline" className={`${typeColors[property.property_type]} text-xs`}>
                  {property.property_type}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-1">
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
                onClick={handleDeleteClick}
                className="text-slate-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">Sale Price</span>
              </div>
              <span className="font-semibold text-slate-900">
                ${property.sale_price?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">Settlement</span>
              </div>
              <span className="text-sm text-slate-900">
                {settlementDate ? format(settlementDate, 'MMM d, yyyy') : 'N/A'}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Gross Commission ({property.commission_percentage}%)</span>
                <span className="text-sm font-medium text-slate-900">
                  ${property.gross_commission_inc_gst?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              
              <div className="pl-4 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>
                    Marketing Levy ({property.marketing_levy_type === 'percentage' ? `${property.marketing_levy_value}%` : `$${property.marketing_levy_value}`})
                  </span>
                  <span>-${property.marketing_levy?.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Franchise Fee ({property.franchise_fee_type === 'percentage' ? `${property.franchise_fee_value}%` : `$${property.franchise_fee_value}`})
                  </span>
                  <span>-${property.franchise_fee?.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {property.transaction_fee > 0 && (
                  <div className="flex justify-between">
                    <span>
                      Transaction Fee ({property.transaction_fee_type === 'percentage' ? `${property.transaction_fee_value}%` : `$${property.transaction_fee_value}`})
                    </span>
                    <span>-${property.transaction_fee?.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {property.other_fees > 0 && (
                  <div className="flex justify-between">
                    <span>Other Fees</span>
                    <span>-${property.other_fees?.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-50">
                <span className="font-medium text-slate-900">Net Commission</span>
                <span className="font-bold text-lg gold-accent">
                  ${property.net_commission?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
