'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useEditAccount } from '@/hooks/use-edit-account';
import { AccountForm, AccountFormValues } from '@/components/forms/account-form';
import { useGetAccount } from '@/hooks/use-get-account';
import { useEditAccountMutation } from '@/hooks/use-edit-account-mutation';
import { useDeleteAccount } from '@/hooks/use-delete-account';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

export const EditAccountSheet = () => {
  const { isOpen, onClose, id } = useEditAccount();
  
  const accountQuery = useGetAccount(id);
  const editMutation = useEditAccountMutation(id);
  const deleteMutation = useDeleteAccount(id);

  const isPending = accountQuery.isLoading || editMutation.isPending || deleteMutation.isPending;

  const handleSubmit = (values: AccountFormValues) => {
    editMutation.mutate(values, {
        onSuccess: () => onClose(),
    });
  };

  const handleDelete = async () => {
    deleteMutation.mutate(undefined, {
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
            <>
                <AccountForm
                    id={id}
                    onSubmit={handleSubmit}
                    onDelete={handleDelete}
                    disabled={isPending}
                    defaultValues={defaultValues}
                />
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full" disabled={isPending}>
                        <Trash className="size-4 mr-2" />
                        Delete account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account and all related transactions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction disabled={isPending} onClick={handleDelete}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
            </>
          )}
        </SheetContent>
      </Sheet>
  );
}; 