import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useDeleteTransaction(id?: string) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to delete transaction');
            }
        },
        onSuccess: () => {
            toast.success('Transaction deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['transactions', { id }] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete transaction');
        },
    });

    return mutation;
} 