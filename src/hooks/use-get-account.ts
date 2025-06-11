import { useQuery } from '@tanstack/react-query';
import { IAccount } from '@/models/account.model';

export function useGetAccount(id?: string) {
    const query = useQuery<IAccount>({
        enabled: !!id,
        queryKey: ['accounts', { id }],
        queryFn: async () => {
            const res = await fetch(`/api/accounts/${id}`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to fetch account');
            }
            return res.json();
        },
    });

    return query;
} 