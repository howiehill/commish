
import React, { useState, useEffect } from "react";
import { Pipeline as PipelineEntity } from "@/api/entities";
import { Listing } from "@/api/entities"; // Added import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import PipelineForm from "../components/pipeline/PipelineForm";
import PipelineCard from "../components/pipeline/PipelineCard";
import PipelineList from "../components/pipeline/PipelineList";
import PipelineFilters from "../components/pipeline/PipelineFilters";
import MonthlyPipelineView from "../components/pipeline/MonthlyPipelineView";

export default function Pipeline() {
  const [pipeline, setPipeline] = useState([]);
  const [filteredPipeline, setFilteredPipeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    stage: "all",
    probability: "all"
  });
  const [viewMode, setViewMode] = useState('list'); // Default to list view
  const [selectedOpportunities, setSelectedOpportunities] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
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
    let isMounted = true;
    const loadPipelineData = async () => {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      try {
        const data = await retryApiCall(() => PipelineEntity.list('-expected_settlement'));
        if (isMounted) {
          setPipeline(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading pipeline:', err);
          if (err.response?.status === 429) {
            setError("Too many requests. Please wait a moment and refresh the page.");
          } else {
            setError("Failed to load pipeline data. Please try refreshing the page.");
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadPipelineData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    filterPipeline();
  }, [pipeline, searchTerm, filters]);

  const loadPipeline = async () => {
    setIsLoading(true);
    setError(null); // Clear any previous errors
    try {
      const data = await retryApiCall(() => PipelineEntity.list('-expected_settlement'));
      setPipeline(data);
    } catch (error) {
      console.error('Error loading pipeline:', error);
      if (error.response?.status === 429) {
        setError("Too many requests. Please wait a moment before trying again.");
      } else {
        setError("Failed to reload pipeline data.");
      }
    }
    setIsLoading(false);
  };

  const filterPipeline = () => {
    let filtered = pipeline;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.stage !== "all") {
      filtered = filtered.filter(item => item.stage === filters.stage);
    }

    if (filters.probability !== "all") {
      if (filters.probability === "high") {
        filtered = filtered.filter(item => item.probability >= 70);
      } else if (filters.probability === "medium") {
        filtered = filtered.filter(item => item.probability >= 40 && item.probability < 70);
      } else if (filters.probability === "low") {
        filtered = filtered.filter(item => item.probability < 40);
      }
    }

    setFilteredPipeline(filtered);
    // Reset selection when pipeline is filtered
    setSelectAll(false);
    setSelectedOpportunities([]);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort the filtered pipeline
  const sortedPipeline = React.useMemo(() => {
    if (!sortConfig.key) return filteredPipeline;

    return [...filteredPipeline].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle weighted value calculation
      if (sortConfig.key === 'weighted_value') {
        aValue = a.estimated_commission * (a.probability / 100);
        bValue = b.estimated_commission * (b.probability / 100);
      } else if (sortConfig.key === 'expected_settlement') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      } else if (typeof aValue === 'number') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredPipeline, sortConfig]);

  function getCurrentFinancialYear() {
    const now = new Date();
    const year = now.getFullYear();
    // Australian financial year: July 1st to June 30th
    return now.getMonth() >= 6 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
  }

  // Updated handleSubmit logic as per outline
  const handleSubmit = async (opportunityData) => {
    try {
      if (opportunityData.convertToListing) {
        await handleConvertToListing({ ...editingOpportunity, ...opportunityData });
      } else if (editingOpportunity) {
        await PipelineEntity.update(editingOpportunity.id, opportunityData);
      } else {
        await PipelineEntity.create(opportunityData);
      }
      setShowForm(false);
      setEditingOpportunity(null);
      loadPipeline();
    } catch (error) {
      console.error('Error saving opportunity:', error);
      alert('Failed to save opportunity. Please try again.');
    }
  };

  // New function to convert to Listing
  const handleConvertToListing = async (opportunity) => {
    if (window.confirm('Are you sure you want to convert this opportunity to a listing? This will remove it from your pipeline.')) {
      try {
        const listingData = {
          address: opportunity.address,
          client_name: opportunity.client_name,
          estimated_sale_price: opportunity.estimated_sale_price,
          commission_percentage: opportunity.commission_percentage,
          estimated_commission: opportunity.estimated_commission,
          listing_date: new Date().toISOString().split('T')[0],
          stage: 'active',
          notes: opportunity.notes
        };

        await Listing.create(listingData);
        await PipelineEntity.delete(opportunity.id);
        
        loadPipeline();
        alert('Opportunity successfully converted to a listing!');
      } catch(error) {
        console.error('Error converting to listing:', error);
        alert('Failed to convert opportunity to a listing. Please try again.');
        throw error;
      }
    }
  };

  // Existing function for converting to Property (still needed for direct conversion from cards/list, not from form submit anymore)
  const handleConvertNewOpportunity = async (opportunityData) => {
    try {
      const { Property } = await import("@/api/entities");
      
      const propertyData = {
        address: opportunityData.address,
        sale_price: opportunityData.estimated_sale_price,
        commission_percentage: opportunityData.commission_percentage,
        settlement_date: opportunityData.expected_settlement || new Date().toISOString().split('T')[0],
        client_name: opportunityData.client_name,
        status: 'settled',
        property_type: opportunityData.address && opportunityData.address.includes('/') ? 'apartment' : 'house',
        gst_inclusive: true,
        financial_year: getCurrentFinancialYear(),
        gross_commission_inc_gst: (opportunityData.estimated_sale_price * opportunityData.commission_percentage) / 100,
        gross_commission_ex_gst: ((opportunityData.estimated_sale_price * opportunityData.commission_percentage) / 100) / 1.1,
        net_commission: opportunityData.estimated_commission || ((opportunityData.estimated_sale_price * opportunityData.commission_percentage) / 100)
      };

      await Property.create(propertyData);
      alert('New opportunity successfully created as a property!');
    } catch (error) {
      console.error('Error converting new opportunity:', error);
      alert('Failed to convert new opportunity to property. Please try again.');
      throw error; // Re-throw to allow handleSubmit to handle error gracefully
    }
  };

  const handleConvert = async (opportunity) => {
    if (window.confirm('Convert this opportunity to a property? This will remove it from your pipeline.')) {
      try {
        // Import Property entity dynamically to avoid circular dependencies or unnecessary loading
        const { Property } = await import("@/api/entities");
        
        // Create property from opportunity
        const propertyData = {
          address: opportunity.address,
          sale_price: opportunity.estimated_sale_price,
          commission_percentage: opportunity.commission_percentage,
          settlement_date: opportunity.expected_settlement || new Date().toISOString().split('T')[0],
          client_name: opportunity.client_name,
          status: 'settled',
          property_type: opportunity.address && opportunity.address.includes('/') ? 'apartment' : 'house',
          gst_inclusive: true,
          financial_year: getCurrentFinancialYear(),
          // Calculate basic commission values
          gross_commission_inc_gst: (opportunity.estimated_sale_price * opportunity.commission_percentage) / 100,
          gross_commission_ex_gst: ((opportunity.estimated_sale_price * opportunity.commission_percentage) / 100) / 1.1,
          net_commission: opportunity.estimated_commission
        };

        await Property.create(propertyData);
        await PipelineEntity.delete(opportunity.id);
        
        loadPipeline();
        alert('Opportunity successfully converted to property!');
      } catch (error) {
        console.error('Error converting opportunity:', error);
        alert('Failed to convert opportunity. Please try again.');
        throw error; // Re-throw to allow handleSubmit to handle error gracefully
      }
    }
  };

  const handleEdit = (opportunity) => {
    setEditingOpportunity(opportunity);
    setShowForm(true);
  };

  const handleDelete = async (opportunityId) => {
    if (window.confirm('Are you sure you want to delete this opportunity?')) {
      try {
        await PipelineEntity.delete(opportunityId);
        loadPipeline();
      } catch (error) {
        console.error('Error deleting opportunity:', error);
      }
    }
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedOpportunities(filteredPipeline.map(p => p.id));
    } else {
      setSelectedOpportunities([]);
    }
  };

  const handleSelectOpportunity = (opportunityId, checked) => {
    if (checked) {
      setSelectedOpportunities(prev => [...prev, opportunityId]);
    } else {
      setSelectedOpportunities(prev => prev.filter(id => id !== opportunityId));
      setSelectAll(false); // If one is deselected, 'select all' should no longer be true
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOpportunities.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedOpportunities.length} selected opportunities?`)) {
      try {
        // Using Promise.all to delete all selected items concurrently
        await Promise.all(selectedOpportunities.map(id => PipelineEntity.delete(id)));
        
        setSelectedOpportunities([]);
        setSelectAll(false);
        loadPipeline();
        alert(`Successfully deleted ${selectedOpportunities.length} opportunities.`);
      } catch (error) {
        console.error('Error in bulk delete:', error);
        alert('An error occurred during bulk delete. Please refresh and try again.');
        loadPipeline(); // Reload even on error to reflect partial changes if any
      }
    }
  };

  const totalPotential = filteredPipeline.reduce((sum, item) => 
    sum + (item.estimated_commission * (item.probability / 100)), 0);
    
  const totalEstimated = filteredPipeline.reduce((sum, item) => 
    sum + item.estimated_commission, 0);

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
              <h1 className="text-3xl font-bold text-slate-900">Pipeline</h1>
              <p className="text-slate-600 mt-1">
                View and manage all your opportunities
              </p>
            </div>
            <div className="flex gap-3">
              {/* View Mode Toggle Buttons */}
              <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('monthly')}
                  className={viewMode === 'monthly' ? 'commission-gradient text-white hover:opacity-90' : 'hover:bg-slate-50'}
                >
                  Monthly
                </Button>
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
                New Opportunity
              </Button>
            </div>
          </div>

          {/* Search and Filters - Only show for non-monthly views */}
          {viewMode !== 'monthly' && (
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
              <PipelineFilters filters={filters} onFiltersChange={setFilters} />
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl card-shadow">
              <p className="text-sm text-slate-500">Total Opportunities</p>
              <p className="text-2xl font-bold text-slate-900">
                {viewMode === 'monthly' ? pipeline.length : filteredPipeline.length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl card-shadow">
              <p className="text-sm text-slate-500">Potential Value</p>
              <p className="text-2xl font-bold gold-accent">
                ${(viewMode === 'monthly' 
                  ? pipeline.reduce((sum, item) => sum + (item.estimated_commission * (item.probability / 100)), 0)
                  : totalPotential
                ).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl card-shadow">
              <p className="text-sm text-slate-500">Full Potential</p>
              <p className="text-2xl font-bold text-slate-900">
                ${(viewMode === 'monthly'
                  ? pipeline.reduce((sum, item) => sum + item.estimated_commission, 0)
                  : totalEstimated
                ).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedOpportunities.length > 0 && viewMode === 'list' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedOpportunities.length} opportunities selected
                </span>
                <Button 
                  onClick={handleBulkDelete}
                  variant="destructive"
                  size="sm"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full px-4 md:px-8">
          <div className="max-w-7xl mx-auto h-full">
            {/* Pipeline Form */}
            <AnimatePresence>
              {showForm && (
                <PipelineForm
                  opportunity={editingOpportunity}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingOpportunity(null);
                  }}
                />
              )}
            </AnimatePresence>

            {/* Pipeline Display */}
            <div className="h-full pb-8 overflow-y-auto">
              {viewMode === 'monthly' ? (
                <MonthlyPipelineView
                  pipeline={pipeline}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onConvert={handleConvert}
                />
              ) : viewMode === 'list' ? (
                <PipelineList
                  pipeline={sortedPipeline}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onConvert={handleConvert}
                  selectedOpportunities={selectedOpportunities}
                  selectAll={selectAll}
                  onSelectAll={handleSelectAll}
                  onSelectOpportunity={handleSelectOpportunity}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              ) : ( // Default to Grid view
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {sortedPipeline.map((opportunity) => (
                      <motion.div
                        key={opportunity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <PipelineCard
                          opportunity={opportunity}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onConvert={handleConvert}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Empty State */}
              {((viewMode === 'monthly' && pipeline.length === 0) || 
                (viewMode !== 'monthly' && filteredPipeline.length === 0)) && !isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-24 h-24 commission-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Opportunities Found</h3>
                    <p className="text-slate-600 mb-6">
                      {viewMode !== 'monthly' && (searchTerm || filters.stage !== "all" || filters.probability !== "all")
                        ? "Try adjusting your search or filters"
                        : "Get started by adding your first opportunity"
                      }
                    </p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      className="commission-gradient text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Opportunity
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
