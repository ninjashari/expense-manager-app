'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useNewAccount } from '@/hooks/use-new-account';
import { AccountForm } from '@/components/forms/account-form';
import { toast } from 'sonner';

export const NewAccountSheet = ({ onAccountCreated }: { onAccountCreated: () => void }) => {
  const { isOpen, onClose } = useNewAccount();
  
  const handleSubmit = async (values: any) => {
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success('Account created successfully.');
        onAccountCreated(); // Refreshes the data on the page
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to create account.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>New Account</SheetTitle>
          <SheetDescription>
            Create a new account to track your transactions.
          </SheetDescription>
        </SheetHeader>
        <AccountForm 
          onSubmit={handleSubmit} 
          disabled={false} // Will handle loading state later
          defaultValues={{
            name: '',
            type: '',
            balance: '0',
          }}
        />
      </SheetContent>
    </Sheet>
  );
}; 