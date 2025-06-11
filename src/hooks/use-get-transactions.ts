import { useQuery } from '@tanstack/react-query';
import { ITransaction } from '@/models/transaction.model';

export const useGetTransactions = () => {
    const query = useQuery<ITransaction[]>({
        queryKey: ['transactions'],
        queryFn: async () => {
            const response = await fetch('/api/transactions');
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            const data = await response.json();
            return data;
        }
    });
    return { transactions: query.data || [], isLoading: query.isLoading, refetch: query.refetch };
}; 