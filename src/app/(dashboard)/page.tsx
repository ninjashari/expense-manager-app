'use client';

import { useGetSummary } from '@/hooks/use-get-summary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { PopulatedTransaction } from '@/models/transaction.model';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

const DashboardPage = () => {
    const { data: session, status } = useSession();
    const { summary, isLoading, error, refresh } = useGetSummary();
    const currency = session?.user?.currency || 'INR';

    // Refresh data when session is updated (e.g., after currency change)
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.currency) {
            // Small delay to ensure session is fully updated
            const timer = setTimeout(() => {
                refresh();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [session?.user?.currency, status, refresh]);

    if (status === 'loading' || isLoading) {
        return (
            <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
                <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card><CardHeader><div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse" /></CardHeader><CardContent><div className="h-8 w-full bg-gray-200 rounded-md animate-pulse" /></CardContent></Card>
                    <Card><CardHeader><div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse" /></CardHeader><CardContent><div className="h-8 w-full bg-gray-200 rounded-md animate-pulse" /></CardContent></Card>
                    <Card><CardHeader><div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse" /></CardHeader><CardContent><div className="h-8 w-full bg-gray-200 rounded-md animate-pulse" /></CardContent></Card>
                </div>
                <div className="mt-8">
                    <Card>
                        <CardHeader>
                            <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-40 w-full bg-gray-200 rounded-md animate-pulse" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">Failed to load dashboard data. Please try again.</span>
                    <Button 
                        onClick={refresh}
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    if (!summary) {
        return <div>No summary data available.</div>
    }

    return (
        <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <span className="text-white/80 text-sm">
                        All amounts in {currency}
                    </span>
                    <Button 
                        onClick={refresh}
                        variant="outline" 
                        size="sm"
                        className="text-white border-white/20 hover:bg-white/10"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Total Balance
                            <span className="text-xs text-muted-foreground font-normal">
                                Converted to {currency}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{formatCurrency(summary.totalBalance / 100, currency)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Income (Last 30 Days)
                            <span className="text-xs text-muted-foreground font-normal">
                                in {currency}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-500">{formatCurrency(summary.totalIncome / 100, currency)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Expenses (Last 30 Days)
                            <span className="text-xs text-muted-foreground font-normal">
                                in {currency}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-500">{formatCurrency(summary.totalExpense / 100, currency)}</p>
                    </CardContent>
                </Card>
            </div>
            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {summary.recentTransactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No transactions yet.</p>
                                <p className="text-sm">Create your first account and add some transactions!</p>
                            </div>
                        ) : (
                            <ul>
                                {summary.recentTransactions.map((t: PopulatedTransaction) => (
                                    <li key={t._id.toString()} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                        <div className='flex items-center gap-x-3'>
                                            <div className={`p-2 rounded-md ${t.type === 'Income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                <p className={`font-semibold ${t.type === 'Income' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {formatCurrency(t.amount / 100, t.account.currency)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-semibold">{t.payee}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-gray-500">{t.account.name}</p>
                                                    {t.account.currency !== currency && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                            {t.account.currency}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <p className='text-sm text-gray-500'>{format(new Date(t.date), 'PPP')}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
