import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { PopulatedTransaction } from '@/models/transaction.model';

interface Summary {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    recentTransactions: PopulatedTransaction[];
}

export const useGetSummary = () => {
    const { data: session } = useSession();
    const queryClient = useQueryClient();

    // Invalidate summary when user currency changes
    useEffect(() => {
        if (session?.user?.currency) {
            queryClient.invalidateQueries({
                queryKey: ['summary']
            });
        }
    }, [session?.user?.currency, queryClient]);

    const { data: summary, isLoading, error } = useQuery<Summary>({
        queryKey: ['summary', session?.user?.currency],
        queryFn: async () => {
            const response = await fetch('/api/summary');
            if (!response.ok) {
                throw new Error('Failed to fetch summary');
            }
            return response.json();
        },
        enabled: !!session?.user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    return { 
        summary, 
        isLoading, 
        error,
        refresh: () => queryClient.invalidateQueries({ queryKey: ['summary'] })
    };
}; 