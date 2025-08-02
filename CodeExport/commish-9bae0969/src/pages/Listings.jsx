import React, { useState, useEffect } from "react";
import { Listing } from "@/api/entities";
import { Property } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFinancialYearForDate } from "@/components/utils/dateUtils";

import ListingForm from "../components/listings/ListingForm";
import ListingCard from "../components/listings/ListingCard";
import ListingList from "../components/listings/ListingList";
import ListingFilters from "../components/listings/ListingFilters";

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ stage: "all" });
  const [viewMode, setViewMode] = useState('list');
  const [error, setError] = useState(null);

  // Add retry logic for API calls
  const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (error.response?.status === 429 && attempt < maxRetries) {
          console.log(`Rate limited, retrying in ${delay * attempt}ms... (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
        throw error;
      }
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, searchTerm, filters]);

  const loadListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await retryApiCall(() => Listing.list('-listing_date'));
      setListings(data);
    } catch (err) {
      console.error('Error loading listings:', err);
      if (err.response?.status === 429) {
        setError("Too many requests. Please wait a moment and refresh the page.");
      } else {
        setError("Failed to load listings. Please try refreshing the page.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterListings = () => {
    let filtered = listings.filter(item =>
      item.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filters.stage !== "all") {
      filtered = filtered.filter(item => item.stage === filters.stage);
    }
    setFilteredListings(filtered);
  };
  
  function getCurrentFinancialYear(date) {
    const aDate = date ? new Date(date) : new Date();
    return getFinancialYearForDate(aDate);
  }

  const handleSubmit = async (listingData) => {
    try {
      if (listingData.convertToProperty) {
        await handleConvertToProperty({ ...editingListing, ...listingData });
      } else if (editingListing) {
        await Listing.update(editingListing.id, listingData);
      } else {
        await Listing.create(listingData);
      }
      setShowForm(false);
      setEditingListing(null);
      loadListings();
    } catch (error) {
      console.error('Error saving listing:', error);
      alert('Failed to save listing. Please try again.');
    }
  };

  const handleConvertToProperty = async (listing) => {
    if (window.confirm('Are you sure you want to mark this listing as SOLD? This will move it to your Properties Sold page.')) {
      try {
        const settlement_date = new Date().toISOString().split('T')[0];
        const sale_price = listing.estimated_sale_price;
        const commission_percentage = listing.commission_percentage;
        const gross_commission_inc_gst = (sale_price * commission_percentage) / 100;
        
        const propertyData = {
          address: listing.address,
          client_name: listing.client_name,
          sale_price: sale_price,
          commission_percentage: commission_percentage,
          settlement_date: settlement_date,
          status: 'settled',
          financial_year: getCurrentFinancialYear(settlement_date),
          gross_commission_inc_gst: gross_commission_inc_gst,
          net_commission: gross_commission_inc_gst, // Simplified default
        };
        await Property.create(propertyData);
        await Listing.delete(listing.id);
        
        loadListings();
        alert('Listing successfully marked as SOLD and moved to Properties!');
      } catch (error) {
        console.error('Error converting to property:', error);
        alert('Failed to convert listing to property. Please try again.');
        throw error;
      }
    }
  };

  const handleEdit = (listing) => {
    setEditingListing(listing);
    setShowForm(true);
  };

  const handleDelete = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await Listing.delete(listingId);
        loadListings();
      } catch (error) {
        console.error('Error deleting listing:', error);
      }
    }
  };

  const totalPotential = filteredListings.reduce((sum, item) => sum + item.estimated_commission, 0);

  if (error) {
    return (
      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 p-4 md:p-8 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Listings</h1>
              <p className="text-slate-600 mt-1">
                Manage your active property listings
              </p>
            </div>
            <div className="flex gap-3">
              {/* View Mode Toggle Buttons */}
              <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'commission-gradient text-white hover:opacity-90' : 'hover:bg-slate-50'}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'commission-gradient text-white hover:opacity-90' : 'hover:bg-slate-50'}
                >
                  List
                </Button>
              </div>
              <Button 
                onClick={() => setShowForm(true)}
                className="commission-gradient text-white hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Listing
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by address or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200"
              />
            </div>
            <ListingFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl card-shadow">
              <p className="text-sm text-slate-500">Total Listings</p>
              <p className="text-2xl font-bold text-slate-900">{filteredListings.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl card-shadow">
              <p className="text-sm text-slate-500">Active Listings</p>
              <p className="text-2xl font-bold text-slate-900">
                {filteredListings.filter(l => l.stage === 'active').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl card-shadow">
              <p className="text-sm text-slate-500">Total Potential</p>
              <p className="text-2xl font-bold gold-accent">
                ${totalPotential.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full px-4 md:px-8">
          <div className="max-w-7xl mx-auto h-full">
            {/* Listing Form */}
            <AnimatePresence>
              {showForm && (
                <ListingForm
                  listing={editingListing}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingListing(null);
                  }}
                />
              )}
            </AnimatePresence>

            {/* Listings Display */}
            <div className="h-full pb-8 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500">Loading listings...</p>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-24 h-24 commission-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                      <List className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Listings Found</h3>
                    <p className="text-slate-600 mb-6">
                      {searchTerm || filters.stage !== "all"
                        ? "Try adjusting your search or filters"
                        : "Get started by adding your first listing"
                      }
                    </p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      className="commission-gradient text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Listing
                    </Button>
                  </div>
                </div>
              ) : viewMode === 'list' ? (
                <ListingList
                  listings={filteredListings}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onConvertToProperty={handleConvertToProperty}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredListings.map((listing) => (
                      <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ListingCard
                          listing={listing}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onConvertToProperty={handleConvertToProperty}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}