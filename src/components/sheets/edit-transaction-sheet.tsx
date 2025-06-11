'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useEditTransaction } from '@/hooks/use-edit-transaction';
import { TransactionForm, FormValues } from '@/components/forms/transaction-form';
import { useGetTransaction } from '@/hooks/use-get-transaction';
import { useEditTransactionMutation } from '@/hooks/use-edit-transaction-mutation';
import { useDeleteTransaction } from '@/hooks/use-delete-transaction';
import { useGetAccounts } from '@/hooks/use-get-accounts';
import { useGetCategories } from '@/hooks/use-get-categories';
import { Loader2 } from 'lucide-react';

export function EditTransactionSheet() {
  const { isOpen, onClose, id } = useEditTransaction();

  const transactionQuery = useGetTransaction(id);
  const editMutation = useEditTransactionMutation(id);
  const deleteMutation = useDeleteTransaction(id);
  
  const { categories, isLoading: isLoadingCategories } = useGetCategories();
  const { accounts, isLoading: isLoadingAccounts } = useGetAccounts();

  const isPending = editMutation.isPending || deleteMutation.isPending || transactionQuery.isLoading || isLoadingCategories || isLoadingAccounts;

  const onSubmit = (values: FormValues) => {
    const { accountId, categoryId, amount, ...rest } = values;
    const amountInCents = Math.round(parseFloat(amount) * 100);
    editMutation.mutate({ 
      ...rest, 
      account: accountId,
      category: categoryId || undefined,
      amount: amountInCents.toString()
    }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const onDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const defaultValues = transactionQuery.data ? {
    date: new Date(transactionQuery.data.date),
    type: transactionQuery.data.type as "Income" | "Expense",
    accountId: transactionQuery.data.account._id.toString(),
    categoryId: transactionQuery.data.category?._id.toString(),
    payee: transactionQuery.data.payee,
    amount: (transactionQuery.data.amount / 100).toString(),
    notes: transactionQuery.data.notes || "",
  } : undefined;

  const isTransfer = transactionQuery.data?.type === "Transfer";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>Edit Transaction</SheetTitle>
          <SheetDescription>
            Edit an existing transaction. Transfers cannot be edited.
          </SheetDescription>
        </SheetHeader>
        {isPending ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {isTransfer ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p>Editing of transfers is not supported.</p>
              </div>
            ) : (
              <TransactionForm
                id={id}
                onSubmit={onSubmit}
                onDelete={onDelete}
                disabled={isPending}
                accounts={accounts || []}
                categories={categories || []}
                defaultValues={defaultValues}
              />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
