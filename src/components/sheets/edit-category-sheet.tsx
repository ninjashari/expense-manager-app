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
import { useEditCategory } from '@/hooks/use-edit-category';
import { CategoryForm, CategoryFormValues } from '@/components/forms/category-form';
import { useGetCategory } from '@/hooks/use-get-category';
import { useEditCategoryMutation } from '@/hooks/use-edit-category-mutation';
import { useDeleteCategory } from '@/hooks/use-delete-category';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

export const EditCategorySheet = () => {
  const { isOpen, onClose, id } = useEditCategory();
  
  const categoryQuery = useGetCategory(id);
  const editMutation = useEditCategoryMutation(id);
  const deleteMutation = useDeleteCategory(id);

  const isPending = categoryQuery.isLoading || editMutation.isPending || deleteMutation.isPending;

  const handleSubmit = (values: CategoryFormValues) => {
    editMutation.mutate(values, {
        onSuccess: () => onClose(),
    });
  };

  const handleDelete = async () => {
    deleteMutation.mutate(undefined, {
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
            <>
                <CategoryForm
                    id={id}
                    onSubmit={handleSubmit}
                    disabled={isPending}
                    defaultValues={defaultValues}
                />
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full" disabled={isPending}>
                        <Trash className="size-4 mr-2" />
                        Delete category
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this category and all related transactions.
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