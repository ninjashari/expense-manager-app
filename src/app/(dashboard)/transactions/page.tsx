'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useGetTransactions } from '@/hooks/use-get-transactions';
import { DataTable } from '@/components/shared/data-table';
import { useNewTransaction } from '@/hooks/use-new-transaction';
import { NewTransactionSheet } from '@/components/sheets/new-transaction-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EditTransactionSheet } from '@/components/sheets/edit-transaction-sheet';
import { columns } from './columns';
import { ColumnDef } from '@tanstack/react-table';

const TransactionsPage = () => {
  const { onOpen } = useNewTransaction();
  const { transactions, isLoading } = useGetTransactions();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete transactions');
      }
    },
    onSuccess: () => {
      toast.success('Transactions deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'An unexpected error occurred.');
    },
  });

  const handleDelete = (rows: unknown[]) => {
    const ids = rows.map((row) => String((row as { _id: unknown })._id));
    deleteMutation.mutate(ids);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Transaction History
          </CardTitle>
          <Button onClick={onOpen} size="sm" disabled={deleteMutation.isPending}>
            <Plus className="size-4 mr-2" />
            Add new
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns as ColumnDef<unknown>[]} 
            data={transactions} 
            filterKey="payee"
            onDelete={handleDelete}
            disabled={deleteMutation.isPending}
          />
        </CardContent>
      </Card>
      <NewTransactionSheet />
      <EditTransactionSheet />
    </div>
  );
};

export default TransactionsPage; 