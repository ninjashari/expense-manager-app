'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useEditAccount } from '@/hooks/use-edit-account';
import { AccountForm, AccountFormValues } from '@/components/forms/account-form';
import { useGetAccount } from '@/hooks/use-get-account';
import { useEditAccountMutation } from '@/hooks/use-edit-account-mutation';
import { Loader2 } from 'lucide-react';

export const EditAccountSheet = () => {
  const { isOpen, onClose, id } = useEditAccount();
  
  const accountQuery = useGetAccount(id);
  const editMutation = useEditAccountMutation(id);

  const isPending = accountQuery.isLoading || editMutation.isPending;

  const handleSubmit = (values: AccountFormValues) => {
    editMutation.mutate(values, {
        onSuccess: () => onClose(),
    });
  };
  
  const defaultValues = accountQuery.data ? {
    name: accountQuery.data.name,
    type: accountQuery.data.type,
    currency: accountQuery.data.currency,
  } : undefined;

  return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4">
          <SheetHeader>
            <SheetTitle>Edit Account</SheetTitle>
            <SheetDescription>
              Edit an existing account.
            </SheetDescription>
          </SheetHeader>
          {isPending ? (
            <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AccountForm
                id={id}
                onSubmit={handleSubmit}
                disabled={isPending}
                defaultValues={defaultValues}
            />
          )}
        </SheetContent>
      </Sheet>
  );
}; 