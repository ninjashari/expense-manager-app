'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useEditAccount } from '@/hooks/use-edit-account';
import { AccountForm } from '@/components/forms/account-form';
import { toast } from 'sonner';
import { useConfirm } from '@/hooks/use-confirm';
import { useState, useEffect } from 'react';
import { IAccount } from '@/models/account.model';

export const EditAccountSheet = ({ onAccountUpdated, onAccountDeleted }: { onAccountUpdated: () => void; onAccountDeleted: () => void; }) => {
  const { isOpen, onClose, id } = useEditAccount();
  const [accountData, setAccountData] = useState<IAccount | null>(null);
  const [loading, setLoading] = useState(false);

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this account."
  );

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/accounts/${id}`)
        .then(res => res.json())
        .then(data => setAccountData(data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (values: any) => {
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
    }
  };

  const handleDelete = async () => {
    const ok = await confirm();
    if (ok) {
      try {
        const response = await fetch(`/api/accounts/${id}`, {
          method: 'DELETE',
        });
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
      }
    }
  };

  const defaultValues = accountData ? {
    name: accountData.name,
    type: accountData.type,
    balance: String(accountData.balance),
  } : {
    name: "",
    type: "",
    balance: "0",
  }

  return (
    <>
      <ConfirmDialog />
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
              onDelete={handleDelete}
              disabled={loading}
              defaultValues={defaultValues}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}; 