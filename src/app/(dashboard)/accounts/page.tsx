'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useGetAccounts } from '@/hooks/use-get-accounts';
import { columns } from './columns';
import { DataTable } from '@/components/shared/data-table';
import { useNewAccount } from '@/hooks/use-new-account';
import { NewAccountSheet } from '@/components/sheets/new-account-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const AccountsPage = () => {
  const { onOpen } = useNewAccount();
  const { accounts, isLoading } = useGetAccounts();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      console.log("Attempting to delete accounts with IDs:", ids);
      const response = await fetch('/api/accounts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to delete accounts. Server responded with:", error);
        throw new Error(error.message || 'Failed to delete accounts');
      }
      console.log("Successfully deleted accounts.");
    },
    onSuccess: () => {
      toast.success('Accounts deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: Error) => {
      console.error("An error occurred during account deletion:", error);
      toast.error(error.message || 'An unexpected error occurred.');
    },
  });

  const handleDelete = (rows: any[]) => {
    const ids = rows.map((row) => row._id);
    deleteMutation.mutate(ids);
  };

  if (isLoading) {
    console.log("Loading accounts data...");
    return <div>Loading...</div>;
  }
  
  console.log("Accounts data loaded:", accounts);

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Accounts
          </CardTitle>
          <Button onClick={onOpen} size="sm" disabled={deleteMutation.isPending}>
            <Plus className="size-4 mr-2" />
            Add new
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={accounts}
            filterKey="name"
            onDelete={handleDelete}
            disabled={deleteMutation.isPending}
          />
        </CardContent>
      </Card>
      <NewAccountSheet />
    </div>
  );
};

export default AccountsPage; 