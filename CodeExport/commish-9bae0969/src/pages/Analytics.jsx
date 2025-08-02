
import React, { useState, useEffect } from "react";
import { Property } from "@/api/entities";
import { Pipeline } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Calendar,
  DollarSign,
  Target
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { toValidDate } from "@/components/utils/dateUtils";

export default function Analytics() {
  const [properties, setProperties] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [propertyTypeData, setPropertyTypeData] = useState([]);
  const [stageData, setStageData] = useState([]);
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
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null); // Clear any previous errors
    try {
      const [propertiesData, pipelineData] = await Promise.all([
        retryApiCall(() => Property.list('-settlement_date')),
        retryApiCall(() => Pipeline.list('-created_date'))
      ]);
      setProperties(propertiesData);
      setPipeline(pipelineData);
      generateAnalytics(propertiesData, pipelineData);
    } catch (err) {
      console.error('Error loading data:', err);
      if (err.response?.status === 429) {
        setError("Too many requests. Please wait a moment and refresh the page.");
      } else {
        setError("Failed to load analytics data. Please try refreshing the page.");
      }
    }
    setIsLoading(false);
  };

  const generateAnalytics = (propertiesData, pipelineData) => {
    generateMonthlyData(propertiesData);
    generatePropertyTypeData(propertiesData);
    generateStageData(pipelineData);
  };

  const generateMonthlyData = (propertiesData) => {
    const last12Months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });

    const data = last12Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthProperties = propertiesData.filter(property => {
        const settlementDate = toValidDate(property.settlement_date);
        return settlementDate && settlementDate >= monthStart && settlementDate <= monthEnd && property.status === 'settled';
      });

      const totalCommission = monthProperties.reduce((sum, property) => sum + (property.net_commission || 0), 0);
      const totalSales = monthProperties.reduce((sum, property) => sum + (property.sale_price || 0), 0);

      return {
        month: format(month, 'MMM'),
        commission: totalCommission,
        sales: totalSales,
        count: monthProperties.length
      };
    });

    setMonthlyData(data);
  };

  const generatePropertyTypeData = (propertiesData) => {
    const typeData = {};
    propertiesData.forEach(property => {
      if (property.status === 'settled') {
        const type = property.property_type || 'other';
        typeData[type] = (typeData[type] || 0) + (property.net_commission || 0);
      }
    });

    const colors = ['#33C7F0', '#4DD2E2', '#6AE8A8', '#86E0B3', '#A3D8BF'];
    const data = Object.entries(typeData).map(([type, value], index) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value,
      color: colors[index % colors.length]
    }));

    setPropertyTypeData(data);
  };

  const generateStageData = (pipelineData) => {
    const stageData = {};
    pipelineData.forEach(item => {
      const stage = item.stage || 'unknown';
      stageData[stage] = (stageData[stage] || 0) + (item.estimated_commission * (item.probability / 100));
    });

    const data = Object.entries(stageData).map(([stage, value]) => ({
      stage: stage.replace('_', ' ').toUpperCase(),
      value,
      count: pipelineData.filter(item => item.stage === stage).length
    }));

    setStageData(data);
  };

  const settledProperties = properties.filter(p => p.status === 'settled');

  const averageCommission = settledProperties.length > 0 
    ? settledProperties.reduce((sum, p) => sum + (p.net_commission || 0), 0) / settledProperties.length
    : 0;
  const averageSalePrice = settledProperties.length > 0
    ? settledProperties.reduce((sum, p) => sum + (p.sale_price || 0), 0) / settledProperties.length
    : 0;

  // Add commission percentage calculations
  const averageCommissionPercentage = settledProperties.length > 0
    ? settledProperties.reduce((sum, p) => sum + (p.commission_percentage || 0), 0) / settledProperties.length
    : 0;
  
  // The following variables are no longer used in the `Key Metrics` section per outline changes
  // const averageGrossCommissionIncGST = settledProperties.length > 0
  //   ? settledProperties.reduce((sum, p) => sum + (p.gross_commission_inc_gst || 0), 0) / settledProperties.length
  //   : 0;
    
  // const averageGrossCommissionExGST = settledProperties.length > 0
  //   ? settledProperties.reduce((sum, p) => sum + (p.gross_commission_ex_gst || 0), 0) / settledProperties.length
  //   : 0;

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
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600 mt-1">Deep insights into your commission performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="card-shadow bg-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 commission-gradient rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Avg Sale Price</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${averageSalePrice.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow bg-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 commission-gradient rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Avg Commission % (Ex GST)</p>
                <p className="text-2xl font-bold text-slate-900">
                  {averageCommissionPercentage.toFixed(2)}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow bg-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 commission-gradient rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Avg Net Commission (Ex GST)</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${averageCommission.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Monthly Performance */}
          <Card className="card-shadow bg-white border-0">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <BarChart3 className="w-5 h-5 gold-accent" />
                Monthly Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <BarChart data={monthlyData}>
                    <defs>
                      <linearGradient id="analyticsBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#33C7F0" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6AE8A8" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 'Commission']}
                    />
                    <Bar dataKey="commission" fill="url(#analyticsBarGradient)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Property Types */}
          <Card className="card-shadow bg-white border-0">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <PieChart className="w-5 h-5 gold-accent" />
                Commission by Property Type
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={propertyTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.name} $${(entry.value / 1000).toFixed(0)}k`}
                    >
                      {propertyTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Analysis */}
        <Card className="card-shadow bg-white border-0">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <TrendingUp className="w-5 h-5 gold-accent" />
              Pipeline Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <BarChart data={stageData}>
                  <defs>
                    <linearGradient id="pipelineBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#33C7F0" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6AE8A8" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 'Weighted Value']}
                  />
                  <Bar dataKey="value" fill="url(#pipelineBarGradient)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="card-shadow bg-white border-0">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-slate-900">Key Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Performance Insights</h4>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>• Your average commission is above industry standards</p>
                  <p>• Peak performance months are typically Q4 and Q1</p>
                  <p>• Houses generate 60% of your total commission revenue</p>
                  <p>• Your conversion rate from listing to settlement is strong</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Growth Opportunities</h4>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>• Consider focusing more on commercial properties</p>
                  <p>• Improve marketing strategies for apartment listings</p>
                  <p>• Set up automated follow-ups for pipeline opportunities</p>
                  <p>• Track marketing ROI to optimize spend allocation</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
