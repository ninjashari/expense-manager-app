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
import { CategoryForm } from '@/components/forms/category-form';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { ICategory } from '@/models/category.model';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

export const EditCategorySheet = ({ onCategoryUpdated, onCategoryDeleted }: { onCategoryUpdated: () => void, onCategoryDeleted: () => void }) => {
  const { isOpen, onClose, id } = useEditCategory();
  const [category, setCategory] = useState<ICategory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/categories/${id}`)
        .then(res => res.json())
        .then(data => setCategory(data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success('Category updated successfully.');
        onCategoryUpdated();
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update category.');
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
        const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        if (response.ok) {
            toast.success('Category deleted successfully.');
            onCategoryDeleted();
            onClose();
        } else {
            const data = await response.json();
            toast.error(data.message || 'Failed to delete category.');
        }
    } catch (error) {
        toast.error('An unexpected error occurred.');
    } finally {
        setLoading(false);
    }
  };
  
  const defaultValues = category ? {
    name: category.name,
    type: category.type as 'Income' | 'Expense',
  } : {
    name: "",
    type: "Expense" as 'Income' | 'Expense',
  };

  return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4">
          <SheetHeader>
            <SheetTitle>Edit Category</SheetTitle>
            <SheetDescription>
              Edit an existing category.
            </SheetDescription>
          </SheetHeader>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
                <p>Loading...</p>
            </div>
          ) : (
            <>
              <CategoryForm
                id={id}
                onSubmit={handleSubmit}
                disabled={loading}
                defaultValues={defaultValues}
              />
              <div className="pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Trash className="size-4 mr-2" />
                      Delete category
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this category.
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
            </>
          )}
        </SheetContent>
      </Sheet>
  );
}; 