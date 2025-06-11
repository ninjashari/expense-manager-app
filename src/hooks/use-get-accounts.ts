import { useQuery } from '@tanstack/react-query';
import { IAccount } from '@/models/account.model';

export const useGetAccounts = () => {
    const query = useQuery<IAccount[]>({
        queryKey: ['accounts'],
        queryFn: async () => {
            const response = await fetch('/api/accounts');
            if (!response.ok) {
                throw new Error('Failed to fetch accounts');
            }
            const data = await response.json();
            return data;
        }
    });
    return { accounts: query.data || [], isLoading: query.isLoading };
}; 