'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { IAccount } from '@/models/account.model';
import { ICategory } from '@/models/category.model';

const formSchema = z.object({
  date: z.coerce.date(),
  accountId: z.string(),
  categoryId: z.string().optional(),
  payee: z.string(),
  amount: z.string(),
  notes: z.string().optional(),
});

type FormValues = z.input<typeof formSchema>;

type Props = {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onDelete?: () => void;
  disabled: boolean;
  accountOptions: { label: string; value: string }[];
  categoryOptions: { label: string; value: string }[];
};

export const TransactionForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  accountOptions,
  categoryOptions,
}: Props) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  const handleDelete = () => {
    onDelete?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
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
                                    className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
                                disabled={disabled}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an account" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {accountOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormItem>
            )}
        />
        <FormField
            name="categoryId"
            control={form.control}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {categoryOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
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
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                        <Input type="number" disabled={disabled} placeholder="0.00" {...field} />
                    </FormControl>
                </FormItem>
            )}
        />
        <FormField
            name="notes"
            control={form.control}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                        <Input disabled={disabled} placeholder="Optional notes..." {...field} />
                    </FormControl>
                </FormItem>
            )}
        />
        <Button className="w-full" disabled={disabled}>
          {id ? 'Save changes' : 'Create transaction'}
        </Button>
        {!!id && (
          <Button
            type="button"
            disabled={disabled}
            onClick={handleDelete}
            className="w-full"
            variant="outline"
          >
            <Trash className="size-4 mr-2" />
            Delete transaction
          </Button>
        )}
      </form>
    </Form>
  );
}; 