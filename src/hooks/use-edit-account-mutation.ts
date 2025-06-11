import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AccountFormValues } from '@/components/forms/account-form';

export function useEditAccountMutation(id?: string) {
    const queryClient = useQueryClient();

    const mutation = useMutation<unknown, Error, AccountFormValues>({
        mutationFn: async (values) => {
            const res = await fetch(`/api/accounts/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to update account');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success('Account updated successfully');
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['accounts', { id }] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update account');
        },
    });

    return mutation;
} 