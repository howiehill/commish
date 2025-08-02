import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, MapPin, Calendar, User, Trophy } from "lucide-react";
import { format } from 'date-fns';
import { toValidDate } from '@/components/utils/dateUtils';

const stageColors = {
  active: "bg-blue-100 text-blue-800 border-blue-200",
  under_offer: "bg-yellow-100 text-yellow-800 border-yellow-200",
  conditional: "bg-orange-100 text-orange-800 border-orange-200",
  exchanged: "bg-purple-100 text-purple-800 border-purple-200"
};

export default function ListingList({ listings, onEdit, onDelete, onConvertToProperty }) {
  return (
    <div className="bg-white rounded-xl card-shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 font-medium text-slate-900">Property</th>
              <th className="text-left p-4 font-medium text-slate-900">Listing Price</th>
              <th className="text-left p-4 font-medium text-slate-900">Est. Commission</th>
              <th className="text-left p-4 font-medium text-slate-900">Stage</th>
              <th className="text-right p-4 font-medium text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => {
              const listingDate = toValidDate(listing.listing_date);
              return (
                <tr key={listing.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{listing.address}</span>
                    </div>
                    {listing.client_name && <div className="flex items-center gap-2 text-sm text-slate-600"><User className="w-3 h-3" /><span>{listing.client_name}</span></div>}
                    {listingDate && <div className="flex items-center gap-2 text-xs text-slate-500 mt-1"><Calendar className="w-3 h-3" /><span>Listed: {format(listingDate, 'MMM d, yyyy')}</span></div>}
                  </td>
                  <td className="p-4 font-semibold">${listing.estimated_sale_price?.toLocaleString('en-AU')}</td>
                  <td className="p-4 font-bold gold-accent">${listing.estimated_commission?.toLocaleString('en-AU')}</td>
                  <td className="p-4"><Badge className={`${stageColors[listing.stage]} border text-xs`}>{listing.stage.replace('_', ' ')}</Badge></td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onConvertToProperty(listing)} className="text-slate-400 hover:text-green-600" title="Mark as Sold"><Trophy className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(listing)} className="text-slate-400 hover:text-slate-600"><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(listing.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}