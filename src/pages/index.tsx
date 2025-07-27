import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  Receipt,
  TrendingUp,
  Calendar,
  Upload,
  Download,
  Search,
  Loader2,
} from 'lucide-react';
import axiosInstance from '@/lib/axios';
import router from 'next/router';
import { useUserStore } from '@/store/useUserStore';

// Type definitions
interface Receipt {
  id: string;
  vendor: string;
  date: string;
  amount: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface CategoryBreakdown {
  category_name: string;
  totalAmount: number;
}

interface MonthlyTrend {
  month: string;
  totalAmount: number;
}

interface DashboardMetrics {
  totalSpending: number;
  spendingGrowthPercentage: number;
  totalReceipts: number;
  receiptsGrowth: number;
  averageReceiptAmount: number;
  avgGrowthPercentage: number;
  pendingReceipts: number;
}

interface DashboardData {
  metrics?: DashboardMetrics;
  categoryBreakdown?: CategoryBreakdown[];
  monthlyTrend?: MonthlyTrend[];
  recentReceipts?: Receipt[];
  availableCategories?: string[];
}

interface ProcessedData {
  categoryData: Array<{
    name: string;
    amount: number;
  }>;
  monthlyData: Array<{
    month: string;
    amount: number;
  }>;
}

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  name: string;
}

type TimeRange = '7days' | '30days' | '90days' | 'year';

// API functions
const fetchDashboardData = async (timeRange: TimeRange, category: string,userId:string): Promise<any> => {
  const params = new URLSearchParams({
    timeRange,
    category: category === 'all' ? '' : category,
    userId
  });

  const response = await axiosInstance.get(`/api/dashboard?${params}`);
  return response.data;
};

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: CustomLabelProps): JSX.Element | null => {
  if (percent < 0.03) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="black"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Dashboard(): JSX.Element {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const user = useUserStore(state => state.user);
    const userId = user?.email as string;

  // Fetch dashboard data using React Query
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
  } = useQuery<any, Error>({
    queryKey: ['dashboard', timeRange, selectedCategory],
    queryFn: () => fetchDashboardData(timeRange, selectedCategory,userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    // cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Helper function to safely access nested properties
  const safeGet = (obj: any, path: string, defaultValue: any = undefined) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  };

  // Process data for charts
  const processedData = useMemo((): ProcessedData | null => {
    if (!dashboardData) return null;

    // Try different possible property names for category breakdown
    const categoryData =
      safeGet(dashboardData, 'categoryBreakdown', []) ||
      safeGet(dashboardData, 'categories', []) ||
      safeGet(dashboardData, 'category_breakdown', []) ||
      [];

    // Try different possible property names for monthly trend
    const monthlyData =
      safeGet(dashboardData, 'monthlyTrend', []) ||
      safeGet(dashboardData, 'monthly_trend', []) ||
      safeGet(dashboardData, 'trends', []) ||
      [];

    // Process category data for pie chart
    const processedCategoryData = Array.isArray(categoryData)
      ? categoryData.map((item: any) => ({
          name: item.category_name || item.name || item.category || 'Unknown',
          amount: item.totalAmount || item.amount || item.total || 0,
        }))
      : [];

    // Process monthly data for bar chart
    const processedMonthlyData = Array.isArray(monthlyData)
      ? monthlyData.map((item: any) => ({
          month: item.month || item.period || item.date || 'Unknown',
          amount: item.totalAmount || item.amount || item.total || 0,
        }))
      : [];

    return {
      categoryData: processedCategoryData,
      monthlyData: processedMonthlyData,
    };
  }, [dashboardData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 safe-area-inset p-4 sm:p-6 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 safe-area-inset p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || 'Something went wrong'}
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 safe-area-inset p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
            No Data Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No receipts found for the selected criteria.
          </p>
        </div>
      </div>
    );
  }

  // Extract metrics with fallbacks
  const metrics = dashboardData?.metrics || dashboardData;
  const availableCategories =
    dashboardData?.availableCategories ||
    dashboardData?.available_categories ||
    dashboardData?.categories ||
    [];
  const recentReceipts =
    dashboardData?.recentReceipts ||
    dashboardData?.recent_receipts ||
    dashboardData?.receipts ||
    [];

  const handleTimeRangeChange = (value: TimeRange): void => {
    setTimeRange(value);
  };

  const handleCategoryChange = (value: string): void => {
    setSelectedCategory(value);
  };

  const handleUploadClick = (): void => {
    router.push('/upload');
  };

  const handleReceiptsClick = (): void => {
    router.push('/receipts');
  };

  const handleViewAllClick = (): void => {
    router.push('/receipts');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 safe-area-inset p-4 sm:p-6">
      <main>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Overview of your receipt management and spending analytics
            </p>
          </div>

          {/* Time Range and Category Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-6">
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-full sm:w-48 h-12">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full sm:w-48 h-12">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Array.isArray(availableCategories) &&
                  availableCategories.map((category: string) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Spending
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
                  $
                  {(metrics?.totalSpending || metrics?.total_spending || 0).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }
                  )}
                </div>
                <p
                  className={`text-xs mt-1 ${
                    (metrics?.spendingGrowthPercentage ||
                      metrics?.spending_growth_percentage ||
                      0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {(metrics?.spendingGrowthPercentage ||
                    metrics?.spending_growth_percentage ||
                    0) >= 0
                    ? '+'
                    : ''}
                  {metrics?.spendingGrowthPercentage || metrics?.spending_growth_percentage || 0}%
                  from last period
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Receipts
                </CardTitle>
                <Receipt className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {dashboardData.metrics.totalReceipts}
                </div>
                <p
                  className={`text-xs mt-1 ${
                    (metrics?.receiptsGrowth || metrics?.receipts_growth || 0) >= 0
                      ? 'text-blue-600'
                      : 'text-red-600'
                  }`}
                >
                  {(metrics?.receiptsGrowth || metrics?.receipts_growth || 0) >= 0 ? '+' : ''}
                  {metrics?.receiptsGrowth || metrics?.receipts_growth || 0} from last period
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Receipt
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
                  ${dashboardData.metrics.averageReceiptAmount.toFixed(2)}
                </div>
                <p
                  className={`text-xs mt-1 ${
                    (metrics?.avgGrowthPercentage || metrics?.avg_growth_percentage || 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {(metrics?.avgGrowthPercentage || metrics?.avg_growth_percentage || 0) >= 0
                    ? '+'
                    : ''}
                  {metrics?.avgGrowthPercentage || metrics?.avg_growth_percentage || 0}% from last
                  period
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Review
                </CardTitle>
                <Calendar className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {dashboardData.metrics.pendingReceipts}
                </div>
                <p className="text-xs text-orange-600 mt-1">Needs categorization</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-semibold">
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processedData?.categoryData && processedData.categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={processedData.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {processedData.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => {
                          const total = processedData.categoryData.reduce(
                            (sum, cat) => sum + cat.amount,
                            0
                          );
                          const percent = ((props.payload.amount / total) * 100).toFixed(1);
                          return [`$${value.toFixed(2)} (${percent}%)`, props.payload.name];
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No data available for selected filters
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-semibold">
                  {timeRange === '7days' ? 'Daily' : 'Monthly'} Spending Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processedData?.monthlyData && processedData.monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={processedData.monthlyData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={value => [`${value}`, 'Amount']} />
                      <Legend />
                      <Bar dataKey="amount" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No data available for selected filters
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Receipts */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base sm:text-lg font-semibold">
                Recent Receipts ({metrics?.totalReceipts || metrics?.total_receipts || 0} total)
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleViewAllClick}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {Array.isArray(recentReceipts) && recentReceipts.length > 0 ? (
                <div className="space-y-4">
                  {recentReceipts.map((receipt: any) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            receipt.status === 'pending'
                              ? 'bg-orange-100 dark:bg-orange-900/50'
                              : 'bg-blue-100 dark:bg-blue-900/50'
                          }`}
                        >
                          <Receipt
                            className={`h-5 w-5 ${
                              receipt.status === 'pending'
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-50 truncate text-sm sm:text-base">
                            {receipt.vendor}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {receipt.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-50 text-sm sm:text-base">
                          ${receipt?.amount?.toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {receipt.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No receipts found for the selected filters
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mt-6 sm:mt-8">
            <Card
              className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={handleUploadClick}
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <Upload className="h-8 w-8 text-blue-600 dark:text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 text-sm sm:text-base cursor-pointer">
                  Upload Receipt
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Add a new receipt with AI extraction
                </p>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={handleReceiptsClick}
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <Search className="h-8 w-8 text-green-600 dark:text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 text-sm sm:text-base">
                  Search Receipts
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Find and manage your receipts
                </p>
              </CardContent>
            </Card>

            {/* <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6 text-center">
                <Download className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                  Export Data
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Download filtered receipts as CSV
                </p>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </main>
    </div>
  );
}
