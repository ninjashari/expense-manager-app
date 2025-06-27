/**
 * @file index.ts
 * @description Index file for reports components.
 * Exports all report-related components for easier importing.
 */

// Main report builder
export { CustomReportBuilder } from './custom-report-builder'

// Filter components
export { ReportFilters } from './report-filters'

// Chart components
export { 
  SummaryCards,
  IncomeVsExpensesChart,
  CategoryBreakdownChart,
  AccountPerformanceChart,
  PayeeAnalysisChart
} from './report-charts'

// Template components
export { 
  ReportTemplates,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByDifficulty,
  REPORT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  DIFFICULTY_LEVELS
} from './report-templates'

// Export types
export type { ReportTemplate } from './report-templates' 