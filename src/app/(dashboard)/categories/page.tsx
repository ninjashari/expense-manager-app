'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useGetCategories } from '@/hooks/use-get-categories';
import { columns } from './columns';
import { DataTable } from '@/components/shared/data-table';
import { useNewCategory } from '@/hooks/use-new-category';
import { NewCategorySheet } from '@/components/sheets/new-category-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ICategory } from '@/models/category.model';

const CategoriesPage = () => {
  const { onOpen } = useNewCategory();
  const { categories, isLoading } = useGetCategories();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      console.log("Attempting to delete categories with IDs:", ids);
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to delete categories. Server responded with:", error);
        throw new Error(error.message || 'Failed to delete categories');
      }
      console.log("Successfully deleted categories.");
    },
    onSuccess: () => {
      toast.success('Categories deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      console.error("An error occurred during category deletion:", error);
      toast.error(error.message || 'An unexpected error occurred.');
    },
  });

  const handleDelete = (rows: ICategory[]) => {
    const ids = rows.map((row) => row._id.toString());
    deleteMutation.mutate(ids);
  };

  if (isLoading) {
    console.log("Loading categories data...");
    return <div>Loading...</div>;
  }
  
  console.log("Categories data loaded:", categories);

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Categories
          </CardTitle>
          <Button onClick={onOpen} size="sm" disabled={deleteMutation.isPending}>
            <Plus className="size-4 mr-2" />
            Add new
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={categories}
            filterKey="name"
            onDelete={handleDelete}
            disabled={deleteMutation.isPending}
          />
        </CardContent>
      </Card>
      <NewCategorySheet />
    </div>
  );
};

export default CategoriesPage; 