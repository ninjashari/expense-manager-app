'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, TrendingUp, Info, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getExchangeRate } from '@/lib/currency-converter';

import { IAccount } from '@/models/account.model';
import { ICategory } from '@/models/category.model';
import { useSession } from 'next-auth/react';

export const formSchema = z.object({
  date: z.coerce.date(),
  accountId: z.string().min(1, 'Please select an account.'),
  categoryId: z.string().optional(),
  payee: z.string().min(1, 'Please enter a payee.'),
  amount: z.string().min(1, 'Please enter an amount.'),
  notes: z.string().optional(),
  type: z.enum(['Income', 'Expense']),
});

export type FormValues = z.input<typeof formSchema>;

interface ExchangeRateInfo {
  rate: number;
  fromCurrency: string;
  toCurrency: string;
  isLoading: boolean;
  error?: string;
  lastUpdated?: Date;
}

type Props = {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onDelete?: () => void;
  disabled: boolean;
  accounts: IAccount[];
  categories: ICategory[];
};

export const TransactionForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  accounts,
  categories,
}: Props) => {
  const { data: session } = useSession();
  const [selectedAccount, setSelectedAccount] = useState<IAccount | undefined>(
    accounts.find(a => a._id.toString() === defaultValues?.accountId)
  );
  const [exchangeRateInfo, setExchangeRateInfo] = useState<ExchangeRateInfo | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const userCurrency = session?.user?.currency || 'INR';
  const selectedAccountCurrency = selectedAccount?.currency || userCurrency;
  const isMultiCurrency = selectedAccountCurrency !== userCurrency;
  const watchedAmount = form.watch('amount');

  // Fetch exchange rate when account changes or form loads
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!isMultiCurrency || !selectedAccount) {
        setExchangeRateInfo(null);
        return;
      }

      setExchangeRateInfo({
        rate: 1,
        fromCurrency: selectedAccountCurrency,
        toCurrency: userCurrency,
        isLoading: true,
      });

      try {
        const rate = await getExchangeRate(selectedAccountCurrency, userCurrency);
        setExchangeRateInfo({
          rate,
          fromCurrency: selectedAccountCurrency,
          toCurrency: userCurrency,
          isLoading: false,
          lastUpdated: new Date(),
        });
             } catch {
        setExchangeRateInfo({
          rate: 1,
          fromCurrency: selectedAccountCurrency,
          toCurrency: userCurrency,
          isLoading: false,
          error: 'Failed to fetch exchange rate',
          lastUpdated: new Date(),
        });
      }
    };

    fetchExchangeRate();
  }, [selectedAccount, selectedAccountCurrency, userCurrency, isMultiCurrency]);

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  const handleDelete = () => {
    onDelete?.();
  };

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find(a => a._id.toString() === accountId);
    setSelectedAccount(account);
    form.setValue('accountId', accountId);
  };

  // Calculate converted amount
  const getConvertedAmount = () => {
    if (!watchedAmount || !exchangeRateInfo || !isMultiCurrency) return null;
    
    const amount = parseFloat(watchedAmount);
    if (isNaN(amount)) return null;
    
    return amount * exchangeRateInfo.rate;
  };

  const convertedAmount = getConvertedAmount();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
        <FormField
            name="type"
            control={form.control}
            render={({ field }) => (
                <FormItem>
                <FormLabel>Transaction Type</FormLabel>
                <Select
                    disabled={disabled}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                >
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
          )}
        />
        
        <FormField
          name="date"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={disabled}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          name="accountId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <Select
                onValueChange={handleAccountChange}
                defaultValue={field.value}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account._id.toString()} value={account._id.toString()}>
                      <div className="flex justify-between items-center w-full">
                        <span>{account.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {account.currency}
                          </Badge>
                          {account.currency === userCurrency && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedAccount && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Account Balance:</span>
                    <span className="font-medium">
                      {formatCurrency(selectedAccount.balance / 100, selectedAccount.currency)}
                    </span>
                  </div>
                  
                  {isMultiCurrency && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <Info className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <div className="space-y-1">
                          <p>This account uses <strong>{selectedAccountCurrency}</strong> while your default currency is <strong>{userCurrency}</strong>.</p>
                          {exchangeRateInfo?.isLoading && (
                            <p className="text-xs">Loading exchange rate...</p>
                          )}
                          {exchangeRateInfo?.error && (
                            <p className="text-xs text-red-600">⚠️ {exchangeRateInfo.error}</p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Exchange Rate Information Card */}
        {isMultiCurrency && exchangeRateInfo && !exchangeRateInfo.isLoading && (
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Exchange Rate Information</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Current Rate:</span>
                <span className="font-mono font-medium">
                  1 {exchangeRateInfo.fromCurrency} = {exchangeRateInfo.rate.toFixed(4)} {exchangeRateInfo.toCurrency}
                </span>
              </div>
              
              {exchangeRateInfo.lastUpdated && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Updated:</span>
                  <span className="text-blue-600">
                    {format(exchangeRateInfo.lastUpdated, 'HH:mm:ss')}
                  </span>
                </div>
              )}
              
              {exchangeRateInfo.error && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-xs">{exchangeRateInfo.error}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <FormField
          name="categoryId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category (optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((option) => (
                    <SelectItem key={option._id.toString()} value={option._id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{option.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {option.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            name="payee"
            control={form.control}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Payee</FormLabel>
                    <FormControl>
                        <Input disabled={disabled} placeholder="e.g. Amazon, Salary, Restaurant" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <FormField
            name="amount"
            control={form.control}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Amount
                      {selectedAccount && (
                        <Badge variant="outline" className="text-xs">
                          {selectedAccountCurrency}
                        </Badge>
                      )}
                    </FormLabel>
                    <FormControl>
                        <Input
                          disabled={disabled} 
                          placeholder={`Enter amount in ${selectedAccountCurrency || 'currency'}`}
                            type="number"
                          step="0.01"
                          min="0"
                            {...field}
                        />
                    </FormControl>
                    
                    {/* Amount Preview and Conversion */}
                    {field.value && !isNaN(parseFloat(field.value)) && (
                      <div className="space-y-2">
                        {/* Original Amount Preview */}
                        <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <span className="text-muted-foreground">Amount in Account Currency:</span>
                          <span className="font-medium">
                            {formatCurrency(parseFloat(field.value), selectedAccountCurrency)}
                          </span>
                        </div>
                        
                        {/* Converted Amount */}
                        {isMultiCurrency && convertedAmount !== null && exchangeRateInfo && !exchangeRateInfo.isLoading && (
                          <div className="flex items-center justify-between text-sm bg-blue-50 p-2 rounded border border-blue-200">
                            <span className="text-blue-700">Equivalent in Your Currency:</span>
                            <span className="font-medium text-blue-900">
                              {formatCurrency(convertedAmount, userCurrency)}
                            </span>
                          </div>
                        )}
                        
                        {isMultiCurrency && exchangeRateInfo?.isLoading && (
                          <div className="flex items-center justify-center text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                            <TrendingUp className="h-3 w-3 mr-1 animate-spin" />
                            Calculating conversion...
                          </div>
                        )}
                    </div>
                    )}
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <FormField
            name="notes"
            control={form.control}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                        <Input disabled={disabled} placeholder="Additional notes or description..." {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        {/* Submit Button */}
        <div className="space-y-2 pt-4">
          <Button disabled={disabled || (isMultiCurrency && exchangeRateInfo?.isLoading)} className="w-full">
            {disabled ? "Processing..." : `${id ? "Update" : "Create"} Transaction`}
        </Button>
          
          {!!id && (
            <Button
                type="button"
                disabled={disabled}
                onClick={handleDelete}
                className="w-full"
                variant="outline"
            >
                Delete transaction
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}; 