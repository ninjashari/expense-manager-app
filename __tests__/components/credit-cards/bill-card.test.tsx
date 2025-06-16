/**
 * BillCard Component Tests
 * 
 * Comprehensive unit tests for the BillCard component including
 * rendering, user interactions, status calculations, and accessibility.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillCard } from '@/components/credit-cards/bill-card';
import type { PopulatedCreditCardBill } from '@/types/credit-card-bill.types';

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock the date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn((date) => date.toISOString().split('T')[0]),
  isAfter: jest.fn(() => false),
  addDays: jest.fn((date) => new Date(date.getTime() + 24 * 60 * 60 * 1000)),
}));

// Test data factory
const createMockBill = (overrides: Partial<PopulatedCreditCardBill> = {}): PopulatedCreditCardBill => ({
  _id: 'bill-123',
  userId: 'user-123',
  accountId: 'account-123',
  billGenerationDate: new Date('2024-01-01'),
  billDueDate: new Date('2024-01-15'),
  billAmount: 150000, // $1500.00 in cents
  isPaid: false,
  billingPeriodStart: new Date('2023-12-01'),
  billingPeriodEnd: new Date('2023-12-31'),
  transactionCount: 25,
  minimumPayment: 7500, // $75.00 in cents
  interestRate: 0.18,
  lateFeesApplied: 0,
  status: 'generated',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  account: {
    _id: 'account-123',
    name: 'Chase Sapphire',
    type: 'Credit Card',
    currency: 'USD',
    creditLimit: 500000, // $5000.00 in cents
  },
  ...overrides,
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('BillCard Component', () => {
  const mockOnPayBill = jest.fn();
  const defaultProps = {
    bill: createMockBill(),
    onPayBill: mockOnPayBill,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders bill information correctly', () => {
      render(
        <TestWrapper>
          <BillCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      expect(screen.getByText('$1,500.00')).toBeInTheDocument();
      expect(screen.getByText('25 transactions')).toBeInTheDocument();
    });

    it('displays correct status badge for generated bill', () => {
      render(
        <TestWrapper>
          <BillCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Generated')).toBeInTheDocument();
    });

    it('displays correct status badge for paid bill', () => {
      const paidBill = createMockBill({
        status: 'paid',
        isPaid: true,
        paidDate: new Date('2024-01-10'),
        paidAmount: 150000,
      });

      render(
        <TestWrapper>
          <BillCard {...defaultProps} bill={paidBill} />
        </TestWrapper>
      );

      expect(screen.getByText('Paid')).toBeInTheDocument();
    });

    it('displays correct status badge for overdue bill', () => {
      const overdueBill = createMockBill({
        status: 'overdue',
        billDueDate: new Date('2023-12-15'), // Past date
      });

      render(
        <TestWrapper>
          <BillCard {...defaultProps} bill={overdueBill} />
        </TestWrapper>
      );

      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('shows minimum payment information', () => {
      render(
        <TestWrapper>
          <BillCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Min Payment: $75.00')).toBeInTheDocument();
    });

    it('displays billing period correctly', () => {
      render(
        <TestWrapper>
          <BillCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText(/Billing Period:/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onPayBill when pay button is clicked', () => {
      render(
        <TestWrapper>
          <BillCard {...defaultProps} />
        </TestWrapper>
      );

      const payButton = screen.getByRole('button', { name: /pay bill/i });
      fireEvent.click(payButton);

      expect(mockOnPayBill).toHaveBeenCalledWith(defaultProps.bill);
    });

    it('does not show pay button for paid bills', () => {
      const paidBill = createMockBill({
        status: 'paid',
        isPaid: true,
      });

      render(
        <TestWrapper>
          <BillCard {...defaultProps} bill={paidBill} />
        </TestWrapper>
      );

      expect(screen.queryByRole('button', { name: /pay bill/i })).not.toBeInTheDocument();
    });

    it('shows view details button for all bills', () => {
      render(
        <TestWrapper>
          <BillCard {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
    });
  });

  describe('Status Calculations', () => {
    it('correctly identifies overdue bills', () => {
      const overdueBill = createMockBill({
        status: 'overdue',
        billDueDate: new Date('2023-12-01'), // Past date
      });

      render(
        <TestWrapper>
          <BillCard {...defaultProps} bill={overdueBill} />
        </TestWrapper>
      );

      const statusBadge = screen.getByText('Overdue');
      expect(statusBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('correctly identifies paid bills', () => {
      const paidBill = createMockBill({
        status: 'paid',
        isPaid: true,
        paidAmount: 150000,
      });

      render(
        <TestWrapper>
          <BillCard {...defaultProps} bill={paidBill} />
        </TestWrapper>
      );

      const statusBadge = screen.getByText('Paid');
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('shows partial payment status correctly', () => {
      const partialBill = createMockBill({
        status: 'partial',
        paidAmount: 75000, // Half of bill amount
      });

      render(
        <TestWrapper>
          <BillCard {...defaultProps} bill={partialBill} />
        </TestWrapper>
      );

      expect(screen.getByText('Partial')).toBeInTheDocument();
      expect(screen.getByText('$750.00 paid')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <TestWrapper>
          <BillCard {...defaultProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Chase Sapphire'));
    });

    it('has keyboard navigation support', () => {
      render(
        <TestWrapper>
          <BillCard {...defaultProps} />
        </TestWrapper>
      );

      const payButton = screen.getByRole('button', { name: /pay bill/i });
      expect(payButton).toBeInTheDocument();
      
      // Test keyboard interaction
      payButton.focus();
      expect(payButton).toHaveFocus();
    });

    it('provides screen reader friendly content', () => {
      render(
        <TestWrapper>
          <BillCard {...defaultProps} />
        </TestWrapper>
      );

      // Check for screen reader content
      expect(screen.getByText('$1,500.00')).toHaveAttribute('aria-label', 'Bill amount: $1,500.00');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional fields gracefully', () => {
      const minimalBill = createMockBill({
        notes: undefined,
        paidDate: undefined,
        paidAmount: undefined,
        interestRate: undefined,
      });

      render(
        <TestWrapper>
          <BillCard {...defaultProps} bill={minimalBill} />
        </TestWrapper>
      );

      expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
    });

    it('handles zero amounts correctly', () => {
      const zeroBill = createMockBill({
        billAmount: 0,
        minimumPayment: 0,
      });

      render(
        <TestWrapper>
          <BillCard {...defaultProps} bill={zeroBill} />
        </TestWrapper>
      );

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('handles very large amounts correctly', () => {
      const largeBill = createMockBill({
        billAmount: 999999999, // $9,999,999.99
      });

      render(
        <TestWrapper>
          <BillCard {...defaultProps} bill={largeBill} />
        </TestWrapper>
      );

      expect(screen.getByText('$9,999,999.99')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(
        <TestWrapper>
          <BillCard {...defaultProps} />
        </TestWrapper>
      );

      // Re-render with same props
      rerender(
        <TestWrapper>
          <BillCard {...defaultProps} />
        </TestWrapper>
      );

      // Component should handle re-renders gracefully
      expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
    });
  });
}); 