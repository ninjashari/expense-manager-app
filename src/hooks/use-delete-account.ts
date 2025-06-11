import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useDeleteAccount(id?: string) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/accounts/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to delete account');
            }
        },
        onSuccess: () => {
            toast.success('Account deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['accounts', { id }] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete account');
        },
    });

    return mutation;
} 