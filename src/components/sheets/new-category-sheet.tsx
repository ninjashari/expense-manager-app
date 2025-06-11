'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useNewCategory } from '@/hooks/use-new-category';
import { CategoryForm } from '@/components/forms/category-form';
import { toast } from 'sonner';

export const NewCategorySheet = ({ onCategoryCreated }: { onCategoryCreated: () => void }) => {
  const { isOpen, onClose } = useNewCategory();
  
  const handleSubmit = async (values: any) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success('Category created successfully.');
        onCategoryCreated();
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to create category.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>New Category</SheetTitle>
          <SheetDescription>
            Create a new category to organize your transactions.
          </SheetDescription>
        </SheetHeader>
        <CategoryForm 
          onSubmit={handleSubmit} 
          disabled={false}
          defaultValues={{
            name: '',
            type: 'Expense',
          }}
        />
      </SheetContent>
    </Sheet>
  );
}; 