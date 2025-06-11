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
import { AccountForm } from '@/components/forms/account-form';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { IAccount } from '@/models/account.model';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

export const EditAccountSheet = ({ onAccountUpdated, onAccountDeleted }: { onAccountUpdated: () => void, onAccountDeleted: () => void }) => {
  const { isOpen, onClose, id } = useEditAccount();
  const [account, setAccount] = useState<IAccount | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/accounts/${id}`)
        .then(res => res.json())
        .then(data => setAccount(data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success('Account updated successfully.');
        onAccountUpdated();
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update account.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
        const response = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
        if (response.ok) {
            toast.success('Account deleted successfully.');
            onAccountDeleted();
            onClose();
        } else {
            const data = await response.json();
            toast.error(data.message || 'Failed to delete account.');
        }
    } catch (error) {
        toast.error('An unexpected error occurred.');
    } finally {
        setLoading(false);
    }
  };
  
  const defaultValues = account ? {
    name: account.name,
    type: account.type,
    balance: String(account.balance),
  } : {
    name: "",
    type: "",
    balance: "0",
  };

  return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4">
          <SheetHeader>
            <SheetTitle>Edit Account</SheetTitle>
            <SheetDescription>
              Edit an existing account.
            </SheetDescription>
          </SheetHeader>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
                <p>Loading...</p>
            </div>
          ) : (
            <AccountForm
              id={id}
              onSubmit={handleSubmit}
              disabled={loading}
              defaultValues={defaultValues}
            />
          )}
          {!!id && (
            <div className="pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Trash className="size-4 mr-2" />
                    Delete account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={loading} onClick={handleDelete}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </SheetContent>
      </Sheet>
  );
}; 