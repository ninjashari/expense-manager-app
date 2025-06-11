'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useNewCategory } from '@/hooks/use-new-category';
import { CategoryForm, CategoryFormValues } from '@/components/forms/category-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const NewCategorySheet = () => {
  const { isOpen, onClose } = useNewCategory();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        return response.json();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create category.');
      }
    },
    onSuccess: () => {
      toast.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (values: CategoryFormValues) => {
    mutation.mutate(values);
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
          onSubmit={onSubmit}
          disabled={mutation.isPending}
          defaultValues={{
            name: '',
            type: 'Expense',
          }}
        />
      </SheetContent>
    </Sheet>
  );
}; 