/**
 * @file report-templates.tsx
 * @description This file contains predefined report templates for common financial analysis scenarios.
 * It provides quick-start configurations for various types of financial reporting needs.
 */

"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  PieChart, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Target,
  CreditCard,
  Building2,
  Users,
  Zap
} from 'lucide-react'

import { ReportConfig, DEFAULT_REPORT_FILTERS } from '@/types/report'

/**
 * Report template interface
 * @description Defines the structure of a report template
 */
export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'analysis' | 'overview' | 'comparison' | 'trends'
  icon: React.ComponentType<{ className?: string }>
  config: Partial<ReportConfig>
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
}

/**
 * Predefined report templates
 * @description Common financial analysis templates
 */
export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'monthly-expense-analysis',
    name: 'Monthly Expense Analysis',
    description: 'Comprehensive breakdown of monthly expenses by category, payee, and account with trend analysis.',
    category: 'analysis',
    icon: PieChart,
    config: {
      name: 'Monthly Expense Analysis',
      type: 'category_breakdown',
      filters: {
        ...DEFAULT_REPORT_FILTERS,
        dateRange: 'this_month',
        transactionTypes: ['withdrawal'],
        transactionStatuses: ['completed']
      },
      chartType: 'pie',
      timeGrouping: 'monthly',
      showChart: true,
      showTable: true
    },
    tags: ['expenses', 'categories', 'monthly'],
    difficulty: 'beginner',
    estimatedTime: '2 minutes'
  },
  {
    id: 'quarterly-trends',
    name: 'Quarterly Financial Trends',
    description: 'Analyze quarterly income and expense trends with year-over-year comparisons.',
    category: 'trends',
    icon: TrendingUp,
    config: {
      name: 'Quarterly Financial Trends',
      type: 'monthly_trends',
      filters: {
        ...DEFAULT_REPORT_FILTERS,
        dateRange: 'this_quarter',
        transactionTypes: ['deposit', 'withdrawal'],
        transactionStatuses: ['completed']
      },
      chartType: 'line',
      timeGrouping: 'quarterly',
      showChart: true,
      showTable: false
    },
    tags: ['trends', 'quarterly', 'comparison'],
    difficulty: 'intermediate',
    estimatedTime: '3 minutes'
  },
  {
    id: 'account-comparison',
    name: 'Account Performance Comparison',
    description: 'Compare transaction volume, income, and expenses across all your accounts.',
    category: 'comparison',
    icon: Building2,
    config: {
      name: 'Account Performance Comparison',
      type: 'account_performance',
      filters: {
        ...DEFAULT_REPORT_FILTERS,
        dateRange: 'last_30_days',
        transactionTypes: ['deposit', 'withdrawal', 'transfer'],
        transactionStatuses: ['completed']
      },
      chartType: 'bar',
      timeGrouping: 'monthly',
      showChart: true,
      showTable: true
    },
    tags: ['accounts', 'comparison', 'performance'],
    difficulty: 'intermediate',
    estimatedTime: '2 minutes'
  },
  {
    id: 'payee-analysis',
    name: 'Top Payee Analysis',
    description: 'Identify your most frequent transaction partners and spending patterns by payee.',
    category: 'analysis',
    icon: Users,
    config: {
      name: 'Top Payee Analysis',
      type: 'payee_analysis',
      filters: {
        ...DEFAULT_REPORT_FILTERS,
        dateRange: 'last_30_days',
        transactionTypes: ['withdrawal'],
        transactionStatuses: ['completed']
      },
      chartType: 'bar',
      timeGrouping: 'monthly',
      showChart: true,
      showTable: true
    },
    tags: ['payees', 'spending', 'analysis'],
    difficulty: 'beginner',
    estimatedTime: '2 minutes'
  },
  {
    id: 'income-vs-expenses',
    name: 'Income vs Expenses Dashboard',
    description: 'Complete overview of income versus expenses with net income tracking for the financial year.',
    category: 'overview',
    icon: DollarSign,
    config: {
      name: 'Income vs Expenses Dashboard',
      type: 'income_vs_expenses',
      filters: {
        ...DEFAULT_REPORT_FILTERS,
        dateRange: 'this_financial_year',
        transactionTypes: ['deposit', 'withdrawal'],
        transactionStatuses: ['completed']
      },
      chartType: 'bar',
      timeGrouping: 'monthly',
      showChart: true,
      showTable: false
    },
    tags: ['income', 'expenses', 'overview', 'financial-year'],
    difficulty: 'beginner',
    estimatedTime: '1 minute'
  },
  {
    id: 'yearly-summary',
    name: 'Annual Financial Summary',
    description: 'Comprehensive yearly financial summary with month-by-month breakdown.',
    category: 'overview',
    icon: Calendar,
    config: {
      name: 'Annual Financial Summary',
      type: 'yearly_trends',
      filters: {
        ...DEFAULT_REPORT_FILTERS,
        dateRange: 'this_year',
        transactionTypes: ['deposit', 'withdrawal'],
        transactionStatuses: ['completed']
      },
      chartType: 'area',
      timeGrouping: 'monthly',
      showChart: true,
      showTable: true
    },
    tags: ['yearly', 'summary', 'comprehensive'],
    difficulty: 'intermediate',
    estimatedTime: '4 minutes'
  },
  {
    id: 'credit-card-analysis',
    name: 'Credit Card Spending Analysis',
    description: 'Analyze spending patterns and utilization across credit card accounts.',
    category: 'analysis',
    icon: CreditCard,
    config: {
      name: 'Credit Card Spending Analysis',
      type: 'custom_analysis',
      filters: {
        ...DEFAULT_REPORT_FILTERS,
        dateRange: 'this_month',
        accountTypes: ['credit_card'],
        transactionTypes: ['withdrawal'],
        transactionStatuses: ['completed']
      },
      chartType: 'bar',
      timeGrouping: 'weekly',
      showChart: true,
      showTable: true
    },
    tags: ['credit card', 'spending', 'utilization'],
    difficulty: 'intermediate',
    estimatedTime: '3 minutes'
  },
  {
    id: 'cash-flow-tracker',
    name: 'Cash Flow Tracker',
    description: 'Track cash inflows and outflows with net cash flow analysis.',
    category: 'trends',
    icon: Zap,
    config: {
      name: 'Cash Flow Tracker',
      type: 'income_vs_expenses',
      filters: {
        ...DEFAULT_REPORT_FILTERS,
        dateRange: 'last_30_days',
        transactionTypes: ['deposit', 'withdrawal'],
        transactionStatuses: ['completed']
      },
      chartType: 'combo',
      timeGrouping: 'daily',
      showChart: true,
      showTable: false
    },
    tags: ['cash flow', 'daily', 'tracking'],
    difficulty: 'advanced',
    estimatedTime: '3 minutes'
  }
]

/**
 * Template category configurations
 * @description Metadata for template categories
 */
export const TEMPLATE_CATEGORIES = [
  {
    value: 'analysis',
    label: 'Analysis',
    description: 'Deep dive into specific financial aspects',
    color: 'bg-violet-100 text-violet-800'
  },
  {
    value: 'overview',
    label: 'Overview',
    description: 'High-level financial summaries',
    color: 'bg-green-100 text-green-800'
  },
  {
    value: 'comparison',
    label: 'Comparison',
    description: 'Compare different accounts or time periods',
    color: 'bg-violet-200 text-violet-900'
  },
  {
    value: 'trends',
    label: 'Trends',
    description: 'Track changes over time',
    color: 'bg-orange-100 text-orange-800'
  }
] as const

/**
 * Difficulty level configurations
 * @description Metadata for template difficulty levels
 */
export const DIFFICULTY_LEVELS = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Simple, quick reports',
    color: 'bg-emerald-100 text-emerald-700'
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Moderate complexity',
    color: 'bg-yellow-100 text-yellow-700'
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Complex analysis',
    color: 'bg-red-100 text-red-700'
  }
] as const

/**
 * Props interface for ReportTemplates component
 * @description Defines the props for the report templates component
 */
interface ReportTemplatesProps {
  /**
   * Callback function called when a template is selected
   * @param template - Selected template configuration
   */
  onTemplateSelect: (template: ReportTemplate) => void
  /**
   * Filter templates by category (optional)
   */
  categoryFilter?: string
  /**
   * Filter templates by difficulty (optional)
   */
  difficultyFilter?: string
}

/**
 * ReportTemplates component
 * @description Renders a grid of predefined report templates
 */
export function ReportTemplates({ 
  onTemplateSelect, 
  categoryFilter, 
  difficultyFilter 
}: ReportTemplatesProps) {
  // Filter templates based on criteria
  const filteredTemplates = REPORT_TEMPLATES.filter(template => {
    if (categoryFilter && template.category !== categoryFilter) {
      return false
    }
    if (difficultyFilter && template.difficulty !== difficultyFilter) {
      return false
    }
    return true
  })

  /**
   * Get category styling
   * @description Returns styling for template category badge
   * @param category - Template category
   * @returns CSS classes for styling
   */
  const getCategoryStyle = (category: string) => {
    const config = TEMPLATE_CATEGORIES.find(c => c.value === category)
    return config?.color || 'bg-gray-100 text-gray-800'
  }

  /**
   * Get difficulty styling
   * @description Returns styling for difficulty level badge
   * @param difficulty - Difficulty level
   * @returns CSS classes for styling
   */
  const getDifficultyStyle = (difficulty: string) => {
    const config = DIFFICULTY_LEVELS.find(d => d.value === difficulty)
    return config?.color || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => {
          const Icon = template.icon
          
          return (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:shadow-md transition-all duration-200 border hover:border-primary/20"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getCategoryStyle(template.category)}`}
                        >
                          {TEMPLATE_CATEGORIES.find(c => c.value === template.category)?.label}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getDifficultyStyle(template.difficulty)}`}
                        >
                          {template.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <CardDescription className="text-sm mb-4 line-clamp-3">
                  {template.description}
                </CardDescription>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="text-xs px-2 py-0.5"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      +{template.tags.length - 3}
                    </Badge>
                  )}
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    ~{template.estimatedTime}
                  </span>
                  <Button 
                    size="sm" 
                    onClick={() => onTemplateSelect(template)}
                    className="h-8"
                  >
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
              <p>Try adjusting your filters to see more templates.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Get template by ID
 * @description Retrieves a specific template by its ID
 * @param templateId - Template ID to retrieve
 * @returns Template object or undefined if not found
 */
export function getTemplateById(templateId: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find(template => template.id === templateId)
}

/**
 * Get templates by category
 * @description Retrieves all templates in a specific category
 * @param category - Category to filter by
 * @returns Array of templates in the category
 */
export function getTemplatesByCategory(category: string): ReportTemplate[] {
  return REPORT_TEMPLATES.filter(template => template.category === category)
}

/**
 * Get templates by difficulty
 * @description Retrieves all templates of a specific difficulty level
 * @param difficulty - Difficulty level to filter by
 * @returns Array of templates with the specified difficulty
 */
export function getTemplatesByDifficulty(difficulty: string): ReportTemplate[] {
  return REPORT_TEMPLATES.filter(template => template.difficulty === difficulty)
} 