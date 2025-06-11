import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CategoryFormValues } from '@/components/forms/category-form';

export function useEditCategoryMutation(id?: string) {
    const queryClient = useQueryClient();

    const mutation = useMutation<unknown, Error, CategoryFormValues>({
        mutationFn: async (values) => {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to update category');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success('Category updated successfully');
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['categories', { id }] });
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update category');
        },
    });

    return mutation;
} 