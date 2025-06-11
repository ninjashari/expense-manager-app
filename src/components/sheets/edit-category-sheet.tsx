'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useEditCategory } from '@/hooks/use-edit-category';
import { CategoryForm, CategoryFormValues } from '@/components/forms/category-form';
import { useGetCategory } from '@/hooks/use-get-category';
import { useEditCategoryMutation } from '@/hooks/use-edit-category-mutation';
import { Loader2 } from 'lucide-react';

export const EditCategorySheet = () => {
  const { isOpen, onClose, id } = useEditCategory();
  
  const categoryQuery = useGetCategory(id);
  const editMutation = useEditCategoryMutation(id);

  const isPending = categoryQuery.isLoading || editMutation.isPending;

  const handleSubmit = (values: CategoryFormValues) => {
    editMutation.mutate(values, {
        onSuccess: () => onClose(),
    });
  };
  
  const defaultValues = categoryQuery.data ? {
    name: categoryQuery.data.name,
    type: categoryQuery.data.type,
  } : undefined;

  return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4">
          <SheetHeader>
            <SheetTitle>Edit Category</SheetTitle>
            <SheetDescription>
              Edit an existing category.
            </SheetDescription>
          </SheetHeader>
          {isPending ? (
            <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CategoryForm
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