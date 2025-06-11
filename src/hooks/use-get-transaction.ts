import { useQuery } from '@tanstack/react-query';
import { PopulatedTransaction } from '@/models/transaction.model';

export function useGetTransaction(id?: string) {
    const query = useQuery<PopulatedTransaction>({
        enabled: !!id,
        queryKey: ['transactions', { id }],
        queryFn: async () => {
            const res = await fetch(`/api/transactions/${id}`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to fetch transaction');
            }
            return res.json();
        },
    });

    return query;
} 