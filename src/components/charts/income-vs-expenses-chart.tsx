/**
 * Income vs Expenses Chart Component
 * 
 * This component renders a comprehensive bar chart comparing income and expenses
 * over different time periods. It provides interactive filtering, responsive design,
 * and detailed tooltips for financial data visualization.
 */

'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Label } from '@/components/ui/label';
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ... existing code ...

/**
 * Custom tooltip component for the chart
 * Displays formatted income and expense data with currency formatting
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const income = payload.find(p => p.dataKey === 'income')?.value || 0;
    const expenses = payload.find(p => p.dataKey === 'expenses')?.value || 0;
    const net = income - expenses;

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              Income:
            </span>
            <span className="font-medium">${income.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-sm" />
              Expenses:
            </span>
            <span className="font-medium">${expenses.toLocaleString()}</span>
          </div>
          <div className="border-t pt-1 mt-2">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium">Net:</span>
              <span className={`font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${net.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Main Income vs Expenses Chart Component
 * 
 * Features:
 * - Multiple time period selections (week, month, quarter, year, custom)
 * - Interactive date range picker for custom periods
 * - Responsive bar chart with income/expense comparison
 * - Summary statistics and trend indicators
 * - Loading and error states
 * - Multi-currency support
 */
export function IncomeVsExpensesChart() {
  // State for time period selection and date range
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [currency, setCurrency] = useState('USD');

  // Calculate date range based on selected time period
  const dateRange = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timePeriod) {
      case 'week':
        const weekStart = new Date(startOfDay);
        weekStart.setDate(startOfDay.getDate() - startOfDay.getDay());
        return {
          start: weekStart,
          end: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
        };
      
      case 'month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
      
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        return {
          start: new Date(now.getFullYear(), quarterStart, 1),
          end: new Date(now.getFullYear(), quarterStart + 3, 0)
        };
      
      case 'year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31)
        };
      
      case 'custom':
        return {
          start: customStartDate || new Date(now.getFullYear(), now.getMonth(), 1),
          end: customEndDate || new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
      
      default:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
    }
  }, [timePeriod, customStartDate, customEndDate]);

  // Fetch income vs expenses data
  const { data, isLoading, error } = useQuery({
    queryKey: ['income-vs-expenses', dateRange.start, dateRange.end, currency],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        currency,
        groupBy: timePeriod === 'week' ? 'day' : timePeriod === 'year' ? 'month' : 'day'
      });

      const response = await fetch(`/api/reports/income-vs-expenses?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch income vs expenses data');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!data?.data) return null;

    const totalIncome = data.data.reduce((sum: number, item: { income: number }) => sum + item.income, 0);
    const totalExpenses = data.data.reduce((sum: number, item: { expenses: number }) => sum + item.expenses, 0);
    const netAmount = totalIncome - totalExpenses;
    const avgIncome = data.data.length > 0 ? totalIncome / data.data.length : 0;
    const avgExpenses = data.data.length > 0 ? totalExpenses / data.data.length : 0;

    return {
      totalIncome,
      totalExpenses,
      netAmount,
      avgIncome,
      avgExpenses,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
    };
  }, [data]);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading chart data: {(error as Error).message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Income vs Expenses
        </CardTitle>
        <CardDescription>
          Compare your income and expenses over time to track your financial health
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="timePeriod">Time Period</Label>
            <Select value={timePeriod} onValueChange={(value: typeof timePeriod) => setTimePeriod(value)}>
              <SelectTrigger id="timePeriod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="INR">INR (₹)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Date Range */}
        {timePeriod === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? customStartDate.toLocaleDateString() : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? customEndDate.toLocaleDateString() : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${summary.totalIncome.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${summary.totalExpenses.toLocaleString()}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Amount</p>
                    <p className={`text-2xl font-bold ${summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${summary.netAmount.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className={`h-8 w-8 ${summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chart */}
        <div className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available for the selected period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="income" 
                  name="Income" 
                  fill="#22c55e" 
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="expenses" 
                  name="Expenses" 
                  fill="#ef4444" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Additional Statistics */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Average Income</p>
              <p className="text-lg font-semibold text-green-600">
                ${summary.avgIncome.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Average Expenses</p>
              <p className="text-lg font-semibold text-red-600">
                ${summary.avgExpenses.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <p className={`text-lg font-semibold ${summary.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 