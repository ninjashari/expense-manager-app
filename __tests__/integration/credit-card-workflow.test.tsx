/**
 * Credit Card Workflow Integration Tests
 * 
 * End-to-end integration tests for the complete credit card bill management
 * workflow including bill creation, filtering, payment processing, and UI interactions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import CreditCardsPage from '@/app/(dashboard)/credit-cards/page';

// Mock the API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/credit-cards',
}));

// Mock authentication
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: 'user-123', email: 'test@example.com' },
    },
    status: 'authenticated',
  }),
}));

// Test data
const mockAccounts = [
  {
    _id: 'account-1',
    name: 'Chase Sapphire',
    type: 'Credit Card',
    currency: 'USD',
    creditLimit: 500000,
  },
  {
    _id: 'account-2',
    name: 'American Express',
    type: 'Credit Card',
    currency: 'USD',
    creditLimit: 300000,
  },
];

const mockBills = [
  {
    _id: 'bill-1',
    userId: 'user-123',
    accountId: 'account-1',
    billGenerationDate: new Date('2024-01-01'),
    billDueDate: new Date('2024-01-15'),
    billAmount: 150000, // $1500.00
    isPaid: false,
    billingPeriodStart: new Date('2023-12-01'),
    billingPeriodEnd: new Date('2023-12-31'),
    transactionCount: 25,
    minimumPayment: 7500, // $75.00
    status: 'generated',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    account: mockAccounts[0],
  },
  {
    _id: 'bill-2',
    userId: 'user-123',
    accountId: 'account-2',
    billGenerationDate: new Date('2024-01-05'),
    billDueDate: new Date('2024-01-20'),
    billAmount: 250000, // $2500.00
    isPaid: true,
    paidAmount: 250000,
    paidDate: new Date('2024-01-18'),
    billingPeriodStart: new Date('2023-12-01'),
    billingPeriodEnd: new Date('2023-12-31'),
    transactionCount: 40,
    minimumPayment: 12500, // $125.00
    status: 'paid',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-18'),
    account: mockAccounts[1],
  },
];

// Test wrapper
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

describe('Credit Card Workflow Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default API responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/accounts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAccounts),
        });
      }
      
      if (url.includes('/api/credit-card-bills')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            bills: mockBills,
            pagination: {
              page: 1,
              limit: 10,
              total: 2,
              pages: 1,
            },
            summary: {
              totalOutstanding: 150000,
              totalOverdue: 0,
              upcomingDue: 150000,
              billsCount: {
                total: 2,
                paid: 1,
                unpaid: 1,
                overdue: 0,
              },
            },
          }),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  describe('Initial Page Load', () => {
    it('should load and display bills correctly', async () => {
      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      // Wait for bills to load
      await waitFor(() => {
        expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      });

      // Check that both bills are displayed
      expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      expect(screen.getByText('American Express')).toBeInTheDocument();
      
      // Check bill amounts
      expect(screen.getByText('$1,500.00')).toBeInTheDocument();
      expect(screen.getByText('$2,500.00')).toBeInTheDocument();
      
      // Check status badges
      expect(screen.getByText('Generated')).toBeInTheDocument();
      expect(screen.getByText('Paid')).toBeInTheDocument();
    });

    it('should display summary statistics', async () => {
      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Total Outstanding')).toBeInTheDocument();
      });

      // Check summary cards
      expect(screen.getByText('$1,500.00')).toBeInTheDocument(); // Outstanding amount
      expect(screen.getByText('2')).toBeInTheDocument(); // Total bills
    });
  });

  describe('Bill Filtering', () => {
    it('should filter bills by status', async () => {
      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      });

      // Mock filtered response
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            bills: [mockBills[1]], // Only paid bill
            pagination: { page: 1, limit: 10, total: 1, pages: 1 },
          }),
        })
      );

      // Find and click status filter
      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);
      
      // Select "Paid" option
      const paidOption = screen.getByText('Paid');
      await user.click(paidOption);

      // Verify API was called with correct filter
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('status=paid'),
          expect.any(Object)
        );
      });
    });

    it('should search bills by account name', async () => {
      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      });

      // Find search input
      const searchInput = screen.getByPlaceholderText(/search bills/i);
      
      // Type search term
      await user.type(searchInput, 'Chase');

      // Verify search functionality
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('search=Chase'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Bill Payment Workflow', () => {
    it('should complete bill payment process', async () => {
      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      });

      // Find and click pay bill button for unpaid bill
      const payButtons = screen.getAllByText(/pay bill/i);
      const payButton = payButtons[0]; // First unpaid bill
      
      await user.click(payButton);

      // Verify payment dialog opens
      await waitFor(() => {
        expect(screen.getByText(/pay bill/i)).toBeInTheDocument();
      });

      // Mock successful payment response
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            bill: {
              ...mockBills[0],
              isPaid: true,
              paidAmount: 150000,
              status: 'paid',
            },
            message: 'Bill paid successfully',
          }),
        })
      );

      // Enter payment amount
      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '1500');

      // Submit payment
      const confirmButton = screen.getByRole('button', { name: /confirm payment/i });
      await user.click(confirmButton);

      // Verify payment API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/credit-card-bills/bill-1/pay'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('150000'),
          })
        );
      });
    });

    it('should handle payment validation errors', async () => {
      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      });

      // Click pay bill button
      const payButton = screen.getAllByText(/pay bill/i)[0];
      await user.click(payButton);

      // Try to submit without amount
      const confirmButton = screen.getByRole('button', { name: /confirm payment/i });
      await user.click(confirmButton);

      // Verify validation error
      await waitFor(() => {
        expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bill Creation', () => {
    it('should create new bill successfully', async () => {
      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      });

      // Find and click create bill button
      const createButton = screen.getByRole('button', { name: /create bill/i });
      await user.click(createButton);

      // Verify create bill dialog opens
      await waitFor(() => {
        expect(screen.getByText(/create new bill/i)).toBeInTheDocument();
      });

      // Mock successful creation response
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            bill: {
              _id: 'bill-3',
              ...mockBills[0],
              billAmount: 100000,
            },
            message: 'Bill created successfully',
          }),
        })
      );

      // Fill form
      const accountSelect = screen.getByLabelText(/account/i);
      await user.click(accountSelect);
      await user.click(screen.getByText('Chase Sapphire'));

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '1000');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create bill/i });
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/credit-card-bills',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('account-1'),
          })
        );
      });
    });
  });

  describe('Pagination', () => {
    it('should handle pagination correctly', async () => {
      // Mock paginated response
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('page=2')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              bills: [],
              pagination: { page: 2, limit: 10, total: 15, pages: 2 },
            }),
          });
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            bills: mockBills,
            pagination: { page: 1, limit: 10, total: 15, pages: 2 },
          }),
        });
      });

      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      });

      // Find and click next page button
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Verify pagination API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal server error' }),
        })
      );

      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/error loading bills/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      // Mock network error
      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      });

      // Verify mobile-specific elements
      const mobileMenu = screen.queryByRole('button', { name: /menu/i });
      expect(mobileMenu).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // Test tab navigation
      await user.tab();
      const nextElement = document.activeElement;
      expect(nextElement).not.toBe(firstButton);
    });

    it('should have proper ARIA labels', async () => {
      render(
        <TestWrapper>
          <CreditCardsPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Chase Sapphire')).toBeInTheDocument();
      });

      // Check for ARIA labels
      const billCards = screen.getAllByRole('article');
      expect(billCards[0]).toHaveAttribute('aria-label');
    });
  });
}); 