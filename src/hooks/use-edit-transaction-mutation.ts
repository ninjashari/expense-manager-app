import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FormValues } from '@/components/forms/transaction-form';

export function useEditTransactionMutation(id?: string) {
    const queryClient = useQueryClient();

    const mutation = useMutation<unknown, Error, FormValues>({
        mutationFn: async (values) => {
            const res = await fetch(`/api/transactions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to update transaction');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success('Transaction updated successfully');
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['transactions', { id }] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update transaction');
        },
    });

    return mutation;
} 