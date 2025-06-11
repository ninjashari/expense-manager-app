'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useEditCategory } from '@/hooks/use-edit-category';
import { CategoryForm } from '@/components/forms/category-form';
import { toast } from 'sonner';
import { useConfirm } from '@/hooks/use-confirm';
import { useState, useEffect } from 'react';
import { ICategory } from '@/models/category.model';

export const EditCategorySheet = ({ onCategoryUpdated, onCategoryDeleted }: { onCategoryUpdated: () => void; onCategoryDeleted: () => void; }) => {
  const { isOpen, onClose, id } = useEditCategory();
  const [categoryData, setCategoryData] = useState<ICategory | null>(null);
  const [loading, setLoading] = useState(false);

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this category."
  );

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/categories/${id}`)
        .then(res => res.json())
        .then(data => setCategoryData(data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (values: any) => {
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
    }
  };

  const handleDelete = async () => {
    const ok = await confirm();
    if (ok) {
      try {
        const response = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
        });
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
      }
    }
  };

  const defaultValues = categoryData ? {
    name: categoryData.name,
    type: categoryData.type,
  } : {
    name: "",
    type: "Expense" as "Expense" | "Income",
  }

  return (
    <>
      <ConfirmDialog />
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
            <CategoryForm 
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