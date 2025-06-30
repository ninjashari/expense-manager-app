/**
 * @file report-charts.tsx
 * @description This file contains chart components for financial data visualization.
 * It provides various chart types using Recharts for comprehensive financial reporting.
 */

"use client"

import React from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'
import { format } from 'date-fns'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
  TransactionSummary,
  CategoryBreakdown,
  TimeSeriesData,
  AccountPerformance,
  PayeeAnalysis,
  ChartType
} from '@/types/report'

/**
 * Format currency for display
 * @description Formats amounts in Indian Rupees
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format compact currency for charts
 * @description Formats large amounts in compact form (K, L, Cr)
 * @param amount - Amount to format
 * @returns Compact currency string
 */
function formatCompactCurrency(amount: number): string {
  if (amount >= 10000000) { // 1 Crore
    return `₹${(amount / 10000000).toFixed(1)}Cr`
  } else if (amount >= 100000) { // 1 Lakh
    return `₹${(amount / 100000).toFixed(1)}L`
  } else if (amount >= 1000) { // 1 Thousand
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return `₹${amount.toFixed(0)}`
}

/**
 * Custom tooltip for charts
 * @description Custom tooltip component for better data display
 */
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>
  label?: string
  labelFormatter?: (label: string) => string
  valueFormatter?: (value: number) => string
}

function CustomTooltip({ 
  active, 
  payload, 
  label, 
  labelFormatter,
  valueFormatter = formatCurrency 
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">
          {labelFormatter ? labelFormatter(label || '') : label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {valueFormatter(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

/**
 * Summary cards component
 * @description Displays key financial metrics
 */
interface SummaryCardsProps {
  summary: TransactionSummary
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const netIncomeColor = summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
  const netIncomeLabel = summary.netIncome >= 0 ? 'Net Profit' : 'Net Loss'

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <Badge variant="outline" className="text-green-600">+</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</div>
          <p className="text-xs text-muted-foreground">
            {format(summary.dateRange.start, 'MMM dd')} - {format(summary.dateRange.end, 'MMM dd')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <Badge variant="outline" className="text-red-600">-</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            {summary.transactionCount} transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{netIncomeLabel}</CardTitle>
          <Badge variant="outline" className={netIncomeColor}>
            {summary.netIncome >= 0 ? '+' : '-'}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netIncomeColor}`}>
            {formatCurrency(Math.abs(summary.netIncome))}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.netIncome >= 0 ? 'Surplus' : 'Deficit'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.avgTransactionAmount)}</div>
          <p className="text-xs text-muted-foreground">
            Per transaction average
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Income vs Expenses chart
 * @description Bar/Line chart showing income vs expenses over time
 */
interface IncomeVsExpensesChartProps {
  data: TimeSeriesData[]
  chartType?: ChartType
  title?: string
  description?: string
}

export function IncomeVsExpensesChart({ 
  data, 
  chartType = 'bar',
  title = "Income vs Expenses",
  description = "Compare your income and expenses over time"
}: IncomeVsExpensesChartProps) {
  const chartData = data.map(item => ({
    ...item,
    period: item.period.length > 10 ? item.period.substring(0, 10) : item.period,
    // Ensure values are valid numbers
    income: Number(item.income) || 0,
    expenses: Number(item.expenses) || 0,
    net: Number(item.net) || 0
  }))

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="period" 
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tickFormatter={formatCompactCurrency}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="oklch(0.7 0.15 150)" 
              name="Income"
              strokeWidth={2}
              dot={{ fill: 'oklch(0.7 0.15 150)', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="oklch(0.6 0.18 320)" 
              name="Expenses"
              strokeWidth={2}
              dot={{ fill: 'oklch(0.6 0.18 320)', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="period" 
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tickFormatter={formatCompactCurrency}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="oklch(0.7 0.15 150)" 
              fill="oklch(0.7 0.15 150)"
              fillOpacity={0.3}
              name="Income"
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stroke="oklch(0.6 0.18 320)" 
              fill="oklch(0.6 0.18 320)"
              fillOpacity={0.3}
              name="Expenses"
            />
          </AreaChart>
        )

      case 'combo':
        return (
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="period" 
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tickFormatter={formatCompactCurrency}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" fill="oklch(0.7 0.15 150)" name="Income" />
            <Bar dataKey="expenses" fill="oklch(0.6 0.18 320)" name="Expenses" />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke="oklch(0.65 0.15 270)" 
              name="Net"
              strokeWidth={2}
              dot={{ fill: 'oklch(0.65 0.15 270)', strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        )

      default: // bar
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="period" 
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tickFormatter={formatCompactCurrency}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" fill="oklch(0.7 0.15 150)" name="Income" radius={[2, 2, 0, 0]} />
            <Bar dataKey="expenses" fill="oklch(0.6 0.18 320)" name="Expenses" radius={[2, 2, 0, 0]} />
          </BarChart>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Category breakdown chart
 * @description Pie/Doughnut chart showing expense distribution by category
 */
interface CategoryBreakdownChartProps {
  data: CategoryBreakdown[]
  chartType?: 'pie' | 'doughnut' | 'bar'
  title?: string
  description?: string
}

export function CategoryBreakdownChart({ 
  data, 
  chartType = 'pie',
  title = "Category Breakdown",
  description = "See where your money goes by category"
}: CategoryBreakdownChartProps) {
  // Limit to top 8 categories and group others
  const maxCategories = 8
  const sortedData = [...data].sort((a, b) => b.amount - a.amount)
  const topCategories = sortedData.slice(0, maxCategories)
  const otherCategories = sortedData.slice(maxCategories)
  
  const chartData = [...topCategories]
  if (otherCategories.length > 0) {
    const othersTotal = otherCategories.reduce((sum, cat) => sum + cat.amount, 0)
    const othersPercentage = otherCategories.reduce((sum, cat) => sum + cat.percentage, 0)
    chartData.push({
      categoryId: 'others',
      categoryName: 'Others',
      amount: othersTotal,
      percentage: othersPercentage,
      transactionCount: otherCategories.reduce((sum, cat) => sum + cat.transactionCount, 0),
      color: 'oklch(0.5 0.04 270)'
    })
  }

  if (chartType === 'bar') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number"
                  className="text-xs fill-muted-foreground"
                  tickFormatter={formatCompactCurrency}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category"
                  dataKey="categoryName"
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip 
                  content={<CustomTooltip 
                    valueFormatter={(value) => `${formatCurrency(value)} (${((value / chartData.reduce((sum, item) => sum + item.amount, 0)) * 100).toFixed(1)}%)`}
                  />} 
                />
                <Bar 
                  dataKey="amount" 
                  fill="oklch(0.65 0.15 270)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderPieChart = (innerRadius: number = 0) => (
    <PieChart>
      <Pie
        data={chartData}
        dataKey="amount"
        nameKey="categoryName"
        cx="50%"
        cy="50%"
        innerRadius={innerRadius}
        outerRadius="80%"
        paddingAngle={2}
        label={({ categoryName, percentage }) => 
          percentage > 5 ? `${categoryName} (${percentage.toFixed(1)}%)` : ''
        }
        labelLine={false}
      >
        {chartData.map((entry, index) => (
          <Cell 
            key={`cell-${index}`} 
                                fill={entry.color || `oklch(0.65 0.15 ${270 + (index * 30) % 120})`} 
          />
        ))}
      </Pie>
      <Tooltip 
        content={<CustomTooltip 
          valueFormatter={(value) => `${formatCurrency(value)} (${((value / chartData.reduce((sum, item) => sum + item.amount, 0)) * 100).toFixed(1)}%)`}
        />} 
      />
      <Legend 
        verticalAlign="bottom" 
        height={36}
        iconType="circle"
        formatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
      />
    </PieChart>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'doughnut' ? renderPieChart(60) : renderPieChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Account performance chart
 * @description Bar chart showing performance across accounts
 */
interface AccountPerformanceChartProps {
  data: AccountPerformance[]
  title?: string
  description?: string
}

export function AccountPerformanceChart({ 
  data,
  title = "Account Performance",
  description = "Compare performance across your accounts"
}: AccountPerformanceChartProps) {
  const chartData = data.map(account => ({
    ...account,
    accountName: account.accountName.length > 15 
      ? `${account.accountName.substring(0, 15)}...` 
      : account.accountName
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="accountName" 
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tickFormatter={formatCompactCurrency}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="totalIncome" 
                fill="oklch(0.7 0.15 150)" 
                name="Income"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="totalExpenses" 
                fill="oklch(0.6 0.18 320)" 
                name="Expenses"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Payee analysis chart
 * @description Bar chart showing top payees by transaction amount
 */
interface PayeeAnalysisChartProps {
  data: PayeeAnalysis[]
  chartType?: 'bar' | 'pie'
  title?: string
  description?: string
  maxPayees?: number
}

export function PayeeAnalysisChart({ 
  data,
  chartType = 'bar',
  title = "Top Payees",
  description = "Your most frequent transaction partners",
  maxPayees = 10
}: PayeeAnalysisChartProps) {
  const topPayees = data.slice(0, maxPayees)
  const chartData = topPayees.map(payee => ({
    ...payee,
    payeeName: payee.payeeName.length > 20 
      ? `${payee.payeeName.substring(0, 20)}...` 
      : payee.payeeName
  }))

  if (chartType === 'pie') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="totalAmount"
                  nameKey="payeeName"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  paddingAngle={2}
                  label={({ payeeName, totalAmount }) => {
                    const percentage = (totalAmount / chartData.reduce((sum, item) => sum + item.totalAmount, 0)) * 100
                    return percentage > 8 ? payeeName : ''
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`oklch(0.65 0.15 ${270 + (index * 25) % 90})`} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={<CustomTooltip 
                    valueFormatter={(value) => `${formatCurrency(value)}`}
                  />} 
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number"
                className="text-xs fill-muted-foreground"
                tickFormatter={formatCompactCurrency}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                type="category"
                dataKey="payeeName"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip 
                content={<CustomTooltip 
                  valueFormatter={(value) => `${formatCurrency(value)}`}
                />} 
              />
              <Bar 
                dataKey="totalAmount" 
                fill="oklch(0.65 0.15 270)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 