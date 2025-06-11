import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { IBudget } from '@/models/budget.model';

export const useGetBudgets = (month: Date) => {
    const { data: session } = useSession();

    const { data, isLoading, error } = useQuery<IBudget[]>({
        queryKey: ['budgets', { month: month.toISOString().slice(0, 7) }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('month', month.toISOString());
            const response = await fetch(`/api/budgets?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch budgets');
            }
            return response.json();
        },
        enabled: !!session,
    });

    return { budgets: data, isLoading, error };
}; 