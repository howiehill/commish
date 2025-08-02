
import React, { useState, useEffect, useMemo } from "react";
import { Property } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import PropertyForm from "../components/properties/PropertyForm";
import PropertyCard from "../components/properties/PropertyCard";
import PropertyList from "../components/properties/PropertyList";
import PropertyFilters from "../components/properties/PropertyFilters";
import ImportCSVModal from "../components/properties/ImportCSVModal";
import { getFinancialYearOptions, getFinancialYearForDate } from "@/components/utils/dateUtils";

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get saved financial year preference from localStorage
  const [filters, setFilters] = useState(() => {
    const savedFinancialYear = localStorage.getItem('selectedFinancialYear');
    return {
      status: "all",
      financialYear: savedFinancialYear || "all", // Use saved value or default to "all"
      propertyType: "all"
    };
  });

  const [viewMode, setViewMode] = useState('list');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [user, setUser] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [error, setError] = useState(null);

  const userRegion = user?.region || 'australia';
  const financialYearOptions = getFinancialYearOptions(userRegion);

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
    const loadPageData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [propertiesData, userData] = await Promise.all([
          retryApiCall(() => Property.list('-settlement_date')),
          retryApiCall(() => User.me())
        ]);
        if (isMounted) {
          setProperties(propertiesData);
          setUser(userData);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Could not load properties page data", err);
          if (err.response?.status === 429) {
            setError("Too many requests. Please wait a moment and try refreshing the page.");
          } else {
            setError("Failed to load properties. Please try refreshing the page.");
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadPageData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, filters, user]);

  // Effect to save financialYear preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedFinancialYear', filters.financialYear);
  }, [filters.financialYear]);

  const loadProperties = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await retryApiCall(() => Property.list('-settlement_date'));
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
      if (error.response?.status === 429) {
        setError("Too many requests. Please wait a moment before trying again.");
      } else {
        setError("Failed to reload properties.");
      }
    }
    setIsLoading(false);
  };

  const filterProperties = () => {
    let filtered = properties;

    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(property => property.status === filters.status);
    }

    if (filters.financialYear !== "all") {
      filtered = filtered.filter(property => {
        // Calculate financial year based on settlement_date and user's region
        const propertyFY = getFinancialYearForDate(property.settlement_date, userRegion);
        return propertyFY === filters.financialYear;
      });
    }

    if (filters.propertyType !== "all") {
      filtered = filtered.filter(property => property.property_type === filters.propertyType);
    }

    setFilteredProperties(filtered);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort the filtered properties
  const sortedProperties = useMemo(() => {
    if (!sortConfig.key) return filteredProperties;

    const sortableItems = [...filteredProperties]; // Create a shallow copy to avoid mutating

    return sortableItems.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle different data types for robust sorting
      if (sortConfig.key === 'settlement_date') {
        aValue = aValue ? new Date(aValue) : new Date(0); // Use epoch for null/undefined
        bValue = bValue ? new Date(bValue) : new Date(0);
      } else if (typeof aValue === 'string' || typeof bValue === 'string') {
        aValue = String(aValue || '').toLowerCase(); // Ensure string and handle null/undefined
        bValue = String(bValue || '').toLowerCase();
      } else if (typeof aValue === 'number' || typeof bValue === 'number') {
        aValue = Number(aValue || 0); // Ensure number and handle null/undefined
        bValue = Number(bValue || 0);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredProperties, sortConfig]);

  const handleSubmit = async (propertyData) => {
    try {
      if (editingProperty) {
        await Property.update(editingProperty.id, propertyData);
      } else {
        await Property.create(propertyData);
      }
      setShowForm(false);
      setEditingProperty(null);
      loadProperties();
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await Property.delete(propertyId);
        loadProperties(); // Always reload from the server to ensure UI is in sync
      } catch (error) {
        console.error('Error deleting property:', error);
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log('Property already deleted, refreshing list to sync UI.');
          loadProperties(); // If it was already gone, just refresh the list.
        } else {
          alert('Failed to delete property. Please try again.');
        }
      }
    }
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedProperties(filteredProperties.map(p => p.id));
    } else {
      setSelectedProperties([]);
    }
  };

  const handleSelectProperty = (propertyId, checked) => {
    if (checked) {
      setSelectedProperties(prev => [...prev, propertyId]);
    } else {
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
      setSelectAll(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProperties.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedProperties.length} selected properties?`)) {
      try {
        const deletePromises = selectedProperties.map(id => Property.delete(id));
        const results = await Promise.allSettled(deletePromises);
        
        const failedDeletes = results.filter(res => res.status === 'rejected' && !res.reason.message.includes('404'));
        if (failedDeletes.length > 0) {
          console.error('Some properties failed to delete:', failedDeletes);
          alert(`${failedDeletes.length} properties could not be deleted. Please try again.`);
        }

      } catch (error) {
        console.error('An error occurred during the bulk delete process:', error);
        alert('An unexpected error occurred. Please refresh and try again.');
      } finally {
        // Always clear selection and reload data to reflect the current state
        setSelectedProperties([]);
        setSelectAll(false);
        loadProperties();
      }
    }
  };

  const totalCommissions = filteredProperties
    .filter(p => p.status === 'settled')
    .reduce((sum, p) => sum + (p.net_commission || 0), 0);

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
              <h1 className="text-3xl font-bold text-slate-900">Sold Properties</h1>
              <p className="text-slate-600 mt-1">
                Manage your sold property records and commissions
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowImportModal(true)}
                className="bg-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'commission-gradient text-white' : ''}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'commission-gradient text-white' : ''}
                >
                  List
                </Button>
              </div>
              <Button 
                onClick={() => setShowForm(true)}
                className="commission-gradient text-white hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Sold Property
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
            <PropertyFilters filters={filters} onFiltersChange={setFilters} financialYearOptions={financialYearOptions} />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl card-shadow">
              <p className="text-sm text-slate-500">Total Properties</p>
              <p className="text-2xl font-bold text-slate-900">{filteredProperties.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl card-shadow">
              <p className="text-sm text-slate-500">Settled Properties</p>
              <p className="text-2xl font-bold text-slate-900">
                {filteredProperties.filter(p => p.status === 'settled').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl card-shadow">
              <p className="text-sm text-slate-500">Total Commissions</p>
              <p className="text-2xl font-bold gold-accent">
                ${totalCommissions.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProperties.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedProperties.length} properties selected
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

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full px-4 md:px-8">
          <div className="max-w-7xl mx-auto h-full">
            {/* Modals */}
            <AnimatePresence>
              {showForm && (
                <PropertyForm
                  property={editingProperty}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingProperty(null);
                  }}
                />
              )}
              {showImportModal && (
                <ImportCSVModal 
                  onClose={() => setShowImportModal(false)}
                  onImportSuccess={() => {
                    setShowImportModal(false);
                    loadProperties();
                  }}
                />
              )}
            </AnimatePresence>

            {/* Properties Display */}
            <div className="h-full pb-8">
              {viewMode === 'list' ? (
                <div className="h-full">
                  <PropertyList
                    properties={sortedProperties}
                    selectedProperties={selectedProperties}
                    selectAll={selectAll}
                    onSelectAll={handleSelectAll}
                    onSelectProperty={handleSelectProperty}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isScrollable={true}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
                    <AnimatePresence>
                      {sortedProperties.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {filteredProperties.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-24 h-24 commission-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Properties Found</h3>
                    <p className="text-slate-600 mb-6">
                      {searchTerm || filters.status !== "all" || filters.financialYear !== "all" || filters.propertyType !== "all"
                        ? "Try adjusting your search or filters"
                        : "Get started by adding your first property"
                      }
                    </p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      className="commission-gradient text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Property
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
