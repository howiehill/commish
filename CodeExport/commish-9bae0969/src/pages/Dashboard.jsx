
import React, { useState, useEffect } from "react";
import { Property } from "@/api/entities";
import { Pipeline } from "@/api/entities";
import { Expense } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button"; // Added import for Button
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Target,
  Home,
  Clock,
  TrendingDown,
  Users,
  Upload // Added import for Upload icon
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { toValidDate, getFinancialYearOptions, getCurrentFinancialYear, getFinancialYearForDate } from "@/components/utils/dateUtils";
import { AnimatePresence } from "framer-motion"; // Added import for AnimatePresence

import MetricCard from "../components/dashboard/MetricCard";
import CommissionChart from "../components/dashboard/CommissionChart";
import RecentProperties from "../components/dashboard/RecentProperties";
import PipelinePreview from "../components/dashboard/PipelinePreview";
import GoalGauge from "../components/dashboard/GoalGauge";
import ImportCSVModal from "../components/properties/ImportCSVModal"; // Added import for ImportCSVModal

export default function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false); // New state for modal visibility

  // Get saved financial year preference from localStorage, or use current FY as default
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(() => {
    const saved = localStorage.getItem('selectedFinancialYear');
    return saved || getCurrentFinancialYear('australia');
  });

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

  // Function to refresh properties data, used after CSV import
  const refreshProperties = async () => {
    try {
      setIsLoading(true); // Indicate loading for properties re-fetch
      const propertiesData = await retryApiCall(() => Property.list('-settlement_date'));
      setProperties(propertiesData || []);
    } catch (err) {
      console.error('Error refreshing properties after import:', err);
      setError('Failed to refresh properties after import. Please refresh the page.');
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Add delays between API calls to avoid rate limiting
        const [propertiesData, pipelineData, expensesData, userData] = await Promise.all([
          retryApiCall(() => Property.list('-settlement_date')),
          retryApiCall(() => Pipeline.list('-created_date')),
          retryApiCall(() => Expense.list('-expense_date')),
          retryApiCall(() => User.me())
        ]);

        if (isMounted) {
          setProperties(propertiesData || []);
          setPipeline(pipelineData || []);
          setExpenses(expensesData || []);
          setUser(userData);

          const saved = localStorage.getItem('selectedFinancialYear');
          if (!saved) {
            const userRegion = userData?.region || 'australia';
            const currentFy = getCurrentFinancialYear(userRegion);
            setSelectedFinancialYear(currentFy);
            localStorage.setItem('selectedFinancialYear', currentFy);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading dashboard data:', err);
          if (err.response?.status === 429) {
            setError("Too many requests. Please wait a moment and try refreshing the page.");
          } else if (err.response?.status === 401) {
            setError("Your session may have expired. Please log in again.");
          } else {
            setError('Failed to load dashboard data. Please try refreshing the page.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle financial year change and save to localStorage
  const handleFinancialYearChange = (newYear) => {
    setSelectedFinancialYear(newYear);
    localStorage.setItem('selectedFinancialYear', newYear);
  };

  const generateChartData = (propertiesDataForChart) => {
    try {
      const last12Months = eachMonthOfInterval({
        start: subMonths(new Date(), 11),
        end: new Date()
      });

      const monthlyData = last12Months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        const monthProperties = propertiesDataForChart.filter(property => {
          const settlementDate = toValidDate(property.settlement_date);
          return settlementDate &&
                 settlementDate >= monthStart &&
                 settlementDate <= monthEnd &&
                 property.status === 'settled';
        });

        const totalCommission = monthProperties.reduce((sum, property) =>
          sum + (parseFloat(property.net_commission) || 0), 0);

        return {
          month: format(month, 'MMM'),
          commission: totalCommission,
          count: monthProperties.length
        };
      });

      setChartData(monthlyData);
    } catch (error) {
      console.error('Error generating chart data:', error);
      setChartData([]);
    }
  };

  const userRegion = user?.region || 'australia';
  const financialYearOptions = getFinancialYearOptions(userRegion);

  // Current Financial Year Calculations (always current FY for running totals)
  const currentFinancialYear = getCurrentFinancialYear(userRegion);
  const currentFYProperties = properties.filter(p => {
    try {
      const settlementDate = toValidDate(p.settlement_date);
      if (!settlementDate) return false;
      const propertyFY = getFinancialYearForDate(settlementDate, userRegion);
      return propertyFY === currentFinancialYear;
    } catch (error) {
      console.warn('Error filtering current FY property:', error);
      return false;
    }
  });

  const currentFYExpenses = expenses.filter(e => {
    try {
      const expenseDate = toValidDate(e.expense_date);
      if (!expenseDate) return false;
      const expenseFY = getFinancialYearForDate(expenseDate, userRegion);
      return expenseFY === currentFinancialYear;
    } catch (error) {
      console.warn('Error filtering current FY expense:', error);
      return false;
    }
  });

  // Financial Year Running Totals (Current FY)
  const settledCurrentFYProperties = currentFYProperties.filter(p => p.status === 'settled');

  const grossGCI = settledCurrentFYProperties.reduce((sum, property) =>
    sum + (parseFloat(property.gross_commission_inc_gst) || 0), 0);

  const totalFYCommissions = settledCurrentFYProperties.reduce((sum, property) =>
    sum + (parseFloat(property.net_commission) || 0), 0);

  const totalFYExpenses = currentFYExpenses.reduce((sum, expense) =>
    sum + (parseFloat(expense.amount) || 0), 0);

  const totalFYProperties = settledCurrentFYProperties.length;

  // Selected Financial Year Calculations (for filtered view)
  const selectedFYProperties = properties.filter(p => {
    try {
      const settlementDate = toValidDate(p.settlement_date);
      if (!settlementDate) return false;
      const propertyFY = getFinancialYearForDate(settlementDate, userRegion);
      return propertyFY === selectedFinancialYear;
    } catch (error) {
      console.warn('Error filtering selected FY property:', error);
      return false;
    }
  });

  const selectedFYExpenses = expenses.filter(e => {
    try {
      const expenseDate = toValidDate(e.expense_date);
      if (!expenseDate) return false;
      const expenseFY = getFinancialYearForDate(expenseDate, userRegion);
      return expenseFY === selectedFinancialYear;
    } catch (error) {
      console.warn('Error filtering selected FY expense:', error);
      return false;
    }
  });

  // Selected Financial Year Totals
  const settledSelectedFYProperties = selectedFYProperties.filter(p => p.status === 'settled');

  const selectedGrossGCI = settledSelectedFYProperties.reduce((sum, property) =>
    sum + (parseFloat(property.gross_commission_inc_gst) || 0), 0);
  
  const grossCommPerAgent = settledSelectedFYProperties.reduce((sum, property) => {
    // Use the imported gross_commission_per_agent value directly
    return sum + (parseFloat(property.gross_commission_per_agent) || 0);
  }, 0);

  const selectedTotalFYCommissions = settledSelectedFYProperties.reduce((sum, property) =>
    sum + (parseFloat(property.net_commission) || 0), 0);

  const selectedTotalFYExpenses = selectedFYExpenses.reduce((sum, expense) =>
    sum + (parseFloat(expense.amount) || 0), 0);

  const selectedTotalFYProperties = settledSelectedFYProperties.length;

  // Monthly Calculations (current month only)
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const thisMonthProperties = properties.filter(p => {
    const settlementDate = toValidDate(p.settlement_date);
    return settlementDate &&
           p.status === 'settled' &&
           settlementDate >= thisMonthStart &&
           settlementDate <= thisMonthEnd;
  });

  const thisMonthCommissions = thisMonthProperties.reduce((sum, property) =>
    sum + (parseFloat(property.net_commission) || 0), 0);

  const thisMonthExpenses = expenses.filter(e => {
    const expenseDate = toValidDate(e.expense_date);
    return expenseDate &&
           expenseDate >= thisMonthStart &&
           expenseDate <= thisMonthEnd;
  }).reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  const thisMonthNetTakeHome = thisMonthCommissions - thisMonthExpenses;

  // Pipeline value (not filtered by financial year as it represents future opportunities)
  const pipelineValue = pipeline.reduce((sum, item) =>
    sum + ((parseFloat(item.estimated_commission) || 0) * ((parseFloat(item.probability) || 0) / 100)), 0);

  // Regenerate chart data when properties change
  useEffect(() => {
    if (properties.length >= 0) {
      generateChartData(properties);
    }
  }, [properties]);

  // Show error state with retry option
  if (error) {
    return (
      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  setError(null);
                  window.location.reload();
                }}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 py-4 -mx-8 px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {user ? `Welcome Back, ${user.full_name}!` : 'Dashboard'}
              </h1>
              <p className="text-slate-600 mt-1">Here's your commission overview.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="bg-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </header>

        {/* Financial Year Running Totals */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 gold-accent" />
              Running Totals
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Financial Year:</label>
              <Select
                value={selectedFinancialYear}
                onValueChange={handleFinancialYearChange}
              >
                <SelectTrigger className="w-32 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {financialYearOptions.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Gross GCI"
                value={`$${selectedGrossGCI.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                icon={DollarSign}
                trend={`${selectedTotalFYProperties} properties settled`}
              />
              <MetricCard
                title="Gross Comm / Agent"
                value={`$${grossCommPerAgent.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                icon={Users}
                trend="Your total share (ex. GST)"
              />
              <MetricCard
                title="Net to Agent"
                value={`$${selectedTotalFYCommissions.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                icon={Target}
                trend="Take-home before tax & expenses"
              />
              <MetricCard
                title="Take Home Pay"
                value={`$${(selectedTotalFYCommissions - selectedTotalFYExpenses).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                icon={TrendingDown}
                trend={`Total Expenses $${selectedTotalFYExpenses.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              />
            </div>
            <div>
              <GoalGauge
                current={grossCommPerAgent}
                target={user?.gci_goal || 500000}
                title="Agent GCI Goal Progress"
              />
            </div>
          </div>
        </div>

        {/* Monthly Overview */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 gold-accent" />
            This Month - {format(now, 'MMMM yyyy')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Commission Earned"
              value={`$${thisMonthCommissions.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              icon={Calendar}
              trend={`${thisMonthProperties.length} properties settled`}
            />
            <MetricCard
              title="Expenses"
              value={`$${thisMonthExpenses.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              icon={TrendingDown}
              trend="Monthly business costs"
            />
            <MetricCard
              title="Net Take Home"
              value={`$${thisMonthNetTakeHome.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              icon={Target}
              trend={thisMonthNetTakeHome >= 0 ? "Positive cash flow" : "Negative cash flow"}
              trendUp={thisMonthNetTakeHome >= 0}
            />
            <MetricCard
              title="Pipeline Value"
              value={`$${pipelineValue.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              icon={TrendingUp}
              trend={`${pipeline.length} opportunities`}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CommissionChart data={chartData} isLoading={isLoading} />
          </div>
          <div>
            <PipelinePreview pipeline={pipeline.slice(0, 5)} isLoading={isLoading} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <RecentProperties properties={properties.slice(0, 5)} isLoading={isLoading} />

          <Card className="card-shadow bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Clock className="w-5 h-5 gold-accent" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to={createPageUrl('Properties')}
                  className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left block"
                >
                  <Home className="w-6 h-6 text-slate-600 mb-2" />
                  <p className="font-medium text-slate-900">Add Sold Property</p>
                  <p className="text-sm text-slate-500">Record a new sale</p>
                </Link>
                <Link
                  to={createPageUrl('Pipeline')}
                  className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left block"
                >
                  <TrendingUp className="w-6 h-6 text-slate-600 mb-2" />
                  <p className="font-medium text-slate-900">Add Pipeline</p>
                  <p className="text-sm text-slate-500">Track new opportunity</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Import CSV Modal */}
        <AnimatePresence>
          {showImportModal && (
            <ImportCSVModal 
              onClose={() => setShowImportModal(false)}
              onImportSuccess={() => {
                setShowImportModal(false);
                refreshProperties(); // Call the refresh function
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
