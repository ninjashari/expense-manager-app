import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { PopulatedTransaction } from '@/models/transaction.model';

interface AccountWithConversion {
    _id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    convertedBalance: number;
    exchangeRate: number;
    creditLimit?: number; // Optional field for credit card accounts
}

interface Summary {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    recentTransactions: PopulatedTransaction[];
    userCurrency: string;
    accounts: AccountWithConversion[];
    exchangeRates: Record<string, number>;
    lastUpdated: string;
    conversionStatus: {
        success: boolean;
        failedCurrencies: string[];
        errors: string[];
    };
}

export const useGetSummary = () => {
    const { data: session, status } = useSession();
    const queryClient = useQueryClient();
    const prevCurrencyRef = useRef<string | undefined>(undefined);

    // Invalidate summary when user currency changes
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.currency) {
            // Check if currency actually changed
            if (prevCurrencyRef.current && prevCurrencyRef.current !== session.user.currency) {
                // Currency changed - invalidate all related queries
                queryClient.invalidateQueries({
                    queryKey: ['summary']
                });
                
                // Also invalidate accounts and transactions queries if they exist
                queryClient.invalidateQueries({
                    queryKey: ['accounts']
                });
                
                queryClient.invalidateQueries({
                    queryKey: ['transactions']
                });
            }
            
            // Update the ref with current currency
            prevCurrencyRef.current = session.user.currency;
        }
    }, [session?.user?.currency, status, queryClient]);

    const { data: summary, isLoading, error } = useQuery<Summary>({
        queryKey: ['summary', session?.user?.currency, session?.user?.id],
        queryFn: async () => {
            const response = await fetch('/api/summary');
            if (!response.ok) {
                throw new Error('Failed to fetch summary');
            }
            return response.json();
        },
        enabled: !!session?.user?.id && status === 'authenticated',
        staleTime: 2 * 60 * 1000, // 2 minutes (reduced from 5)
        gcTime: 5 * 60 * 1000, // 5 minutes (reduced from 10)
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    });

    return { 
        summary, 
        isLoading, 
        error,
        refresh: () => queryClient.invalidateQueries({ queryKey: ['summary'] })
    };
}; 