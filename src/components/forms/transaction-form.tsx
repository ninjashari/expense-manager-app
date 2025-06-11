'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';

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
    accounts.find(a => a._id === (defaultValues?.accountId as any))
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const handleSubmit = (values: FormValues) => {
    const amount = parseFloat(values.amount);
    const amountInCents = Math.round(amount * 100);

    onSubmit({
      ...values,
      amount: amountInCents.toString(),
    });
  };

  const handleDelete = () => {
    onDelete?.();
  };

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find(a => a._id.toString() === accountId);
    setSelectedAccount(account);
    form.setValue('accountId', accountId);
  }

  const userCurrency = session?.user?.currency || 'INR';
  const selectedAccountCurrency = selectedAccount?.currency || userCurrency;
  const isMultiCurrency = selectedAccountCurrency !== userCurrency;

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
                        <span className="text-xs text-muted-foreground ml-2">
                          {account.currency}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAccount && (
                <div className="text-sm text-muted-foreground">
                  Balance: {formatCurrency(selectedAccount.balance / 100, selectedAccount.currency)}
                  {isMultiCurrency && (
                    <span className="text-xs text-orange-600 ml-2">
                      (Different from your default currency: {userCurrency})
                    </span>
                  )}
                </div>
              )}
            </FormItem>
          )}
        />
        <FormField
          name="categoryId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((option) => (
                    <SelectItem key={option._id.toString()} value={option._id.toString()}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                        <Input disabled={disabled} placeholder="e.g. Amazon, Salary" {...field} />
                    </FormControl>
                </FormItem>
            )}
        />
        <FormField
            name="amount"
            control={form.control}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>
                      Amount {selectedAccount && `(${selectedAccountCurrency})`}
                    </FormLabel>
                    <FormControl>
                        <Input 
                          disabled={disabled} 
                          placeholder={`e.g. 100.00`}
                          type="number" 
                          step="0.01"
                          {...field} 
                        />
                    </FormControl>
                    {selectedAccount && field.value && !isNaN(parseFloat(field.value)) && (
                      <div className="text-sm text-muted-foreground">
                        Preview: {formatCurrency(parseFloat(field.value), selectedAccountCurrency)}
                      </div>
                    )}
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
                        <Input disabled={disabled} placeholder="Additional notes..." {...field} />
                    </FormControl>
                </FormItem>
            )}
        />
        <Button disabled={disabled} className="w-full">
            {id ? "Update" : "Create"} Transaction
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
      </form>
    </Form>
  );
}; 