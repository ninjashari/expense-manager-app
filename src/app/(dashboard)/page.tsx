'use client';

import { useGetSummary } from '@/hooks/use-get-summary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { PopulatedTransaction } from '@/models/transaction.model';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';
import { Loader2, RefreshCw, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';

const DashboardPage = () => {
    const { data: session, status } = useSession();
    const { summary, isLoading, error, refresh } = useGetSummary();
    const currency = session?.user?.currency || 'INR';
    const [showConversionDetails, setShowConversionDetails] = useState(false);

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

    // Check if there are multiple currencies
    const hasMultipleCurrencies = summary.accounts?.some(account => account.currency !== currency);
    const conversionFailed = summary.conversionStatus && !summary.conversionStatus.success;

    return (
        <TooltipProvider>
            <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-white/80 text-sm">
                            All amounts in {currency}
                        </span>
                        {hasMultipleCurrencies && (
                            <Button
                                onClick={() => setShowConversionDetails(!showConversionDetails)}
                                variant="outline"
                                size="sm"
                                className="text-white border-white/20 hover:bg-white/10"
                            >
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Rates
                            </Button>
                        )}
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

                {/* Conversion Status Alert */}
                {conversionFailed && (
                    <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                            <strong>Currency Conversion Warning:</strong> Failed to convert some currencies ({summary.conversionStatus.failedCurrencies.join(', ')}). 
                            Original amounts are shown instead. Check your internet connection and try refreshing.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Exchange Rates Card */}
                {showConversionDetails && hasMultipleCurrencies && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Current Exchange Rates
                                <Badge variant="secondary" className="text-xs">
                                    Updated: {summary.lastUpdated ? format(new Date(summary.lastUpdated), 'HH:mm') : 'N/A'}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(summary.exchangeRates || {}).map(([currencyPair, rate]) => {
                                    const [from, to] = currencyPair.split('-');
                                    return (
                                        <div key={currencyPair} className="text-center p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-medium">{from} → {to}</p>
                                            <p className="text-lg font-bold text-blue-600">
                                                {rate === 1 ? '1.00' : rate.toFixed(4)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Total Balance</span>
                                <div className="flex items-center gap-2">
                                    {hasMultipleCurrencies && (
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="max-w-xs">
                                                    <p className="font-semibold mb-2">Account Breakdown:</p>
                                                    {summary.accounts?.map(account => (
                                                        <div key={account._id} className="text-sm mb-1">
                                                            <span className="font-medium">{account.name}:</span> {formatCurrency(account.balance / 100, account.currency)}
                                                            {account.currency !== currency && (
                                                                <span className="text-muted-foreground">
                                                                    {' '}→ {formatCurrency(account.convertedBalance / 100, currency)} (Rate: {account.exchangeRate.toFixed(4)})
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                        {hasMultipleCurrencies ? 'Converted' : 'Native'}
                                    </Badge>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{formatCurrency(summary.totalBalance / 100, currency)}</p>
                            {hasMultipleCurrencies && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    From {summary.accounts?.length || 0} accounts in {new Set(summary.accounts?.map(a => a.currency)).size} currencies
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Income (Last 30 Days)</span>
                                <Badge variant="outline" className="text-xs text-green-600">
                                    {hasMultipleCurrencies ? 'Converted' : currency}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-green-500">{formatCurrency(summary.totalIncome / 100, currency)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Expenses (Last 30 Days)</span>
                                <Badge variant="outline" className="text-xs text-red-600">
                                    {hasMultipleCurrencies ? 'Converted' : currency}
                                </Badge>
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
                                    {summary.recentTransactions.map((t: PopulatedTransaction) => {
                                        const needsConversion = t.account.currency !== currency;
                                        const exchangeRate = summary.exchangeRates?.[`${t.account.currency}-${currency}`] || 1;
                                        const convertedAmount = t.amount * exchangeRate;
                                        
                                        return (
                                            <li key={t._id.toString()} className="flex justify-between items-center py-3 border-b last:border-b-0 hover:bg-gray-50/50 rounded-lg px-2 transition-colors">
                                                <div className='flex items-center gap-x-3'>
                                                    <div className={`p-2 rounded-md ${t.type === 'Income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <p className={`font-semibold ${t.type === 'Income' ? 'text-green-500' : 'text-red-500'}`}>
                                                                    {formatCurrency(t.amount / 100, t.account.currency)}
                                                                </p>
                                                            </TooltipTrigger>
                                                            {needsConversion && (
                                                                <TooltipContent>
                                                                    <div>
                                                                        <p>Original: {formatCurrency(t.amount / 100, t.account.currency)}</p>
                                                                        <p>Converted: {formatCurrency(convertedAmount / 100, currency)}</p>
                                                                        <p>Rate: 1 {t.account.currency} = {exchangeRate.toFixed(4)} {currency}</p>
                                                                    </div>
                                                                </TooltipContent>
                                                            )}
                                                        </Tooltip>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{t.payee}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm text-gray-500">{t.account.name}</p>
                                                            {needsConversion && (
                                                                <div className="flex items-center gap-1">
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {t.account.currency}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ≈ {formatCurrency(convertedAmount / 100, currency)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {t.category && (
                                                            <p className="text-xs text-muted-foreground">{t.category.name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className='text-sm text-gray-500'>{format(new Date(t.date), 'PPP')}</p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default DashboardPage;
