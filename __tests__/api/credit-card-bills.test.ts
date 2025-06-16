/**
 * Credit Card Bills API Tests
 * 
 * Comprehensive integration tests for credit card bill API endpoints
 * including CRUD operations, filtering, pagination, and error handling.
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/credit-card-bills/route';
import { connectToDatabase } from '@/lib/mongodb';
import type { NextRequest } from 'next/server';

// Mock MongoDB connection
jest.mock('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn(),
}));

// Mock authentication
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' },
  })),
}));

describe('/api/credit-card-bills API Endpoints', () => {
  let mockDb: any;
  let mockCollection: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock database
    mockCollection = {
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    };

    mockDb = {
      collection: jest.fn(() => mockCollection),
    };

    (connectToDatabase as jest.Mock).mockResolvedValue({ db: mockDb });
  });

  describe('GET /api/credit-card-bills', () => {
    it('should fetch bills with default pagination', async () => {
      const mockBills = [
        {
          _id: 'bill-1',
          userId: 'user-123',
          accountId: 'account-1',
          billAmount: 150000,
          status: 'generated',
          billDueDate: new Date('2024-01-15'),
        },
        {
          _id: 'bill-2',
          userId: 'user-123',
          accountId: 'account-2',
          billAmount: 250000,
          status: 'paid',
          billDueDate: new Date('2024-01-20'),
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockBills),
            }),
          }),
        }),
      });

      mockCollection.countDocuments.mockResolvedValue(2);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/credit-card-bills',
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bills).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
    });

    it('should filter bills by status', async () => {
      const mockBills = [
        {
          _id: 'bill-1',
          userId: 'user-123',
          status: 'paid',
          billAmount: 150000,
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockBills),
            }),
          }),
        }),
      });

      mockCollection.countDocuments.mockResolvedValue(1);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/credit-card-bills?status=paid',
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCollection.find).toHaveBeenCalledWith({
        userId: 'user-123',
        status: 'paid',
      });
    });

    it('should handle pagination correctly', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      mockCollection.countDocuments.mockResolvedValue(25);

      const { req } = createMocks({
        method: 'GET',
        url: '/api/credit-card-bills?page=2&limit=5',
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 25,
        pages: 5,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockCollection.find.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/credit-card-bills',
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch bills');
    });
  });

  describe('POST /api/credit-card-bills', () => {
    it('should create a new bill successfully', async () => {
      const newBill = {
        accountId: 'account-123',
        billingPeriodStart: '2024-01-01',
        billingPeriodEnd: '2024-01-31',
        billAmount: 150000,
      };

      const mockInsertResult = {
        insertedId: 'bill-123',
      };

      const mockCreatedBill = {
        _id: 'bill-123',
        userId: 'user-123',
        ...newBill,
        billGenerationDate: new Date(),
        billDueDate: new Date(),
        status: 'generated',
        isPaid: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.insertOne.mockResolvedValue(mockInsertResult);
      mockCollection.findOne.mockResolvedValue(mockCreatedBill);

      const { req } = createMocks({
        method: 'POST',
        url: '/api/credit-card-bills',
        body: newBill,
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.bill._id).toBe('bill-123');
      expect(data.message).toBe('Bill created successfully');
    });

    it('should validate required fields', async () => {
      const invalidBill = {
        // Missing required accountId
        billingPeriodStart: '2024-01-01',
        billingPeriodEnd: '2024-01-31',
      };

      const { req } = createMocks({
        method: 'POST',
        url: '/api/credit-card-bills',
        body: invalidBill,
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('accountId is required');
    });

    it('should handle duplicate bill creation', async () => {
      const duplicateBill = {
        accountId: 'account-123',
        billingPeriodStart: '2024-01-01',
        billingPeriodEnd: '2024-01-31',
      };

      mockCollection.insertOne.mockRejectedValue({
        code: 11000, // MongoDB duplicate key error
      });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/credit-card-bills',
        body: duplicateBill,
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Bill already exists for this period');
    });
  });

  describe('PUT /api/credit-card-bills/[id]', () => {
    it('should update bill successfully', async () => {
      const updateData = {
        isPaid: true,
        paidAmount: 150000,
        paidDate: '2024-01-10',
        status: 'paid',
      };

      const mockUpdateResult = {
        matchedCount: 1,
        modifiedCount: 1,
      };

      const mockUpdatedBill = {
        _id: 'bill-123',
        userId: 'user-123',
        ...updateData,
        updatedAt: new Date(),
      };

      mockCollection.updateOne.mockResolvedValue(mockUpdateResult);
      mockCollection.findOne.mockResolvedValue(mockUpdatedBill);

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/credit-card-bills/bill-123',
        body: updateData,
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bill.isPaid).toBe(true);
      expect(data.message).toBe('Bill updated successfully');
    });

    it('should return 404 for non-existent bill', async () => {
      const updateData = { isPaid: true };

      mockCollection.updateOne.mockResolvedValue({
        matchedCount: 0,
        modifiedCount: 0,
      });

      const { req } = createMocks({
        method: 'PUT',
        url: '/api/credit-card-bills/non-existent',
        body: updateData,
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Bill not found');
    });
  });

  describe('DELETE /api/credit-card-bills/[id]', () => {
    it('should delete bill successfully', async () => {
      const mockDeleteResult = {
        deletedCount: 1,
      };

      mockCollection.deleteOne.mockResolvedValue(mockDeleteResult);

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/credit-card-bills/bill-123',
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Bill deleted successfully');
    });

    it('should return 404 for non-existent bill', async () => {
      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 0,
      });

      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/credit-card-bills/non-existent',
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Bill not found');
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      // Mock unauthenticated request
      jest.doMock('next-auth/next', () => ({
        getServerSession: jest.fn(() => null),
      }));

      const { req } = createMocks({
        method: 'GET',
        url: '/api/credit-card-bills',
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/credit-card-bills',
        body: 'invalid json',
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should handle unsupported HTTP methods', async () => {
      const { req } = createMocks({
        method: 'PATCH',
        url: '/api/credit-card-bills',
      });

      const response = await handler(req as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });
  });
}); 