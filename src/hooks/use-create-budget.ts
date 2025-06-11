import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FormValues } from '@/components/forms/budget-form';

export function useCreateBudget() {
    const queryClient = useQueryClient();

    const mutation = useMutation<any, Error, FormValues>({
        mutationFn: async (values) => {
            const res = await fetch('/api/budgets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to create budget');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success('Budget created successfully');
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to create budget');
        },
    });

    return mutation;
} 