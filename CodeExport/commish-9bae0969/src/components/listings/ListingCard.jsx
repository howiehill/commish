import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, MapPin, Calendar, DollarSign, Trophy } from "lucide-react";
import { format } from 'date-fns';
import { toValidDate } from '@/components/utils/dateUtils';

const stageColors = {
  active: "bg-blue-100 text-blue-800 border-blue-200",
  under_offer: "bg-yellow-100 text-yellow-800 border-yellow-200",
  conditional: "bg-orange-100 text-orange-800 border-orange-200",
  exchanged: "bg-purple-100 text-purple-800 border-purple-200"
};

export default function ListingCard({ listing, onEdit, onDelete, onConvertToProperty }) {
  const listingDate = toValidDate(listing.listing_date);

  return (
    <Card className="card-shadow bg-white border-0 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <h3 className="font-semibold text-slate-900 truncate">{listing.address}</h3>
            </div>
            {listing.client_name && (
              <p className="text-sm text-slate-600 mb-2">{listing.client_name}</p>
            )}
            <Badge className={`${stageColors[listing.stage]} border text-xs`}>
              {listing.stage.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onConvertToProperty(listing)} className="text-slate-400 hover:text-green-600" title="Mark as Sold"><Trophy className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(listing)} className="text-slate-400 hover:text-slate-600"><Edit2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(listing.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Listing Price</span>
            <span className="font-semibold text-slate-900">
              ${listing.estimated_sale_price?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Listed On</span>
            </div>
            <span className="text-sm text-slate-900">
              {listingDate ? format(listingDate, 'MMM d, yyyy') : 'N/A'}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">Est. Commission</span>
              <span className="font-bold text-lg gold-accent">
                ${listing.estimated_commission?.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}