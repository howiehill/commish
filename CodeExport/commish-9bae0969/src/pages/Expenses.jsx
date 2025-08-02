
import React, { useState, useEffect, useMemo } from "react";
import { Expense } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ExpenseForm from "../components/expenses/ExpenseForm";
import ExpenseList from "../components/expenses/ExpenseList";
import ExpenseFilters from "../components/expenses/ExpenseFilters";
import { getFinancialYearOptions, getFinancialYearForDate, getCurrentFinancialYear } from "@/components/utils/dateUtils";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState(() => {
    // Get saved financial year preference from localStorage
    const savedFinancialYear = localStorage.getItem('selectedFinancialYear');
    return {
      category: "all",
      financialYear: savedFinancialYear || "all"
    };
  });
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [user, setUser] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'expense_date', direction: 'desc' }); // Changed default sort
  const [error, setError] = useState(null); // New state for error handling

  const userRegion = user?.region || 'australia'; // Default to 'australia' if user not loaded or region not set
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
      setError(null); // Clear any previous errors
      try {
        const [expensesData, userData] = await Promise.all([
          retryApiCall(() => Expense.list('-expense_date')),
          retryApiCall(() => User.me())
        ]);
        if (isMounted) {
          setExpenses(expensesData);
          setUser(userData);
          // Set initial financial year filter to current year based on user's region
          // Only override if localStorage didn't provide a value or if 'all' was set initially
          setFilters(prev => {
            const currentFy = getCurrentFinancialYear(userData?.region || 'australia');
            // If the financial year from localStorage is 'all' or not present, use the current FY
            // Otherwise, respect the localStorage value.
            if (prev.financialYear === "all" || !localStorage.getItem('selectedFinancialYear')) {
                return { ...prev, financialYear: currentFy };
            }
            return prev; // Use the value from localStorage if it was set
          });
        }
      } catch (err) {
        if (isMounted) {
          console.error("Could not load expenses page data", err);
          if (err.response?.status === 429) {
            setError("Too many requests. Please wait a moment and refresh the page.");
          } else {
            setError("Failed to load expenses. Please try refreshing the page.");
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
    filterExpenses();
    // Save selected financial year to localStorage whenever filters change
    localStorage.setItem('selectedFinancialYear', filters.financialYear);
  }, [expenses, searchTerm, filters, user]); // Added user to dependencies

  const loadExpenses = async () => {
    setIsLoading(true);
    setError(null); // Clear any previous errors
    try {
      const data = await retryApiCall(() => Expense.list('-expense_date'));
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      if (error.response?.status === 429) {
        setError("Too many requests. Please wait a moment before trying again.");
      } else {
        setError("Failed to reload expenses.");
      }
    }
    setIsLoading(false);
  };

  const filterExpenses = () => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.property_address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.category !== "all") {
      filtered = filtered.filter(expense => expense.category === filters.category);
    }

    if (filters.financialYear !== "all") {
      filtered = filtered.filter(expense => {
        const expenseFY = getFinancialYearForDate(expense.expense_date, userRegion);
        return expenseFY === filters.financialYear;
      });
    }

    setFilteredExpenses(filtered);
    setSelectAll(false);
    setSelectedExpenses([]);
  };

  const handleSubmit = async (expenseData) => {
    try {
      if (editingExpense) {
        await Expense.update(editingExpense.id, expenseData);
      } else {
        await Expense.create(expenseData);
      }
      setShowForm(false);
      setEditingExpense(null);
      loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      setError('Failed to save expense. Please try again.');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await Expense.delete(expenseId);
        loadExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
        setError('Failed to delete expense. Please try again.');
      }
    }
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedExpenses(filteredExpenses.map(p => p.id));
    } else {
      setSelectedExpenses([]);
    }
  };

  const handleSelectExpense = (expenseId, checked) => {
    if (checked) {
      setSelectedExpenses(prev => [...prev, expenseId]);
    } else {
      setSelectedExpenses(prev => prev.filter(id => id !== expenseId));
      setSelectAll(false); // If one is deselected, "select all" is no longer true
    }
  };

  const handleBulkDelete = async () => {
    if (selectedExpenses.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedExpenses.length} selected expenses?`)) {
      try {
        // Perform deletions one by one
        for (const expenseId of selectedExpenses) {
          await Expense.delete(expenseId);
        }
        setSelectedExpenses([]);
        setSelectAll(false);
        loadExpenses(); // Reload all expenses to reflect changes
        alert(`Successfully deleted ${selectedExpenses.length} expenses.`);
      } catch (error) {
        console.error('Error in bulk delete:', error);
        alert('An error occurred during bulk delete. Please refresh and try again.');
        loadExpenses(); // Attempt to reload even on error to sync state
      }
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort the filtered expenses
  const sortedExpenses = useMemo(() => {
    if (!sortConfig.key) return filteredExpenses;

    return [...filteredExpenses].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle different data types
      if (sortConfig.key === 'expense_date') {
        aValue = aValue ? new Date(aValue) : new Date(0); // Treat null/undefined dates as epoch
        bValue = bValue ? new Date(bValue) : new Date(0);
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        aValue = aValue || 0; // Treat null/undefined numbers as 0
        bValue = bValue || 0;
      } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      } else {
        // Fallback for mixed types or other types (e.g., convert to string)
        aValue = String(aValue || '');
        bValue = String(bValue || '');
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredExpenses, sortConfig]);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Render error message if there's an error
  if (error) {
    return (
      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center shadow-lg">
            <h2 className="text-xl font-bold text-red-800 mb-3">Error Loading Data</h2>
            <p className="text-red-600 mb-5 text-lg">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </Button>
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
              <h1 className="text-3xl font-bold text-slate-900">Business Expenses</h1>
              <p className="text-slate-600 mt-1">Track and manage your business expenses</p>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="commission-gradient text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by description or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200"
              />
            </div>
            <ExpenseFilters filters={filters} onFiltersChange={setFilters} financialYearOptions={financialYearOptions} />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl card-shadow">
              <p className="text-sm text-slate-500">Total Expenses</p>
              <p className="text-2xl font-bold text-slate-900">{filteredExpenses.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl card-shadow">
              <p className="text-sm text-slate-500">This Year</p>
              <p className="text-2xl font-bold text-slate-900">
                {filteredExpenses.filter(e => {
                  const expenseFY = getFinancialYearForDate(e.expense_date, userRegion);
                  return expenseFY === getCurrentFinancialYear(userRegion);
                }).length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl card-shadow">
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="text-2xl font-bold text-red-600">
                ${totalExpenses.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedExpenses.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedExpenses.length} expenses selected
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
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto" // Adjust for full screen form
                >
                  <ExpenseForm
                    expense={editingExpense}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingExpense(null);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-full pb-8">
              <ExpenseList
                expenses={sortedExpenses}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isScrollable={true}
                selectedExpenses={selectedExpenses}
                selectAll={selectAll}
                onSelectAll={handleSelectAll}
                onSelectExpense={handleSelectExpense}
                sortConfig={sortConfig}
                onSort={handleSort}
              />

              {filteredExpenses.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-24 h-24 commission-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                      <Receipt className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Expenses Found</h3>
                    <p className="text-slate-600 mb-6">
                      {searchTerm || filters.category !== "all" || filters.financialYear !== "all"
                        ? "Try adjusting your search or filters"
                        : "Get started by adding your first expense"
                      }
                    </p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      className="commission-gradient text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Expense
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
