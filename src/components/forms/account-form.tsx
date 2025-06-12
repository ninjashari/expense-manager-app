'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { currencies } from "@/lib/currencies";
import { useSession } from "next-auth/react";

const formSchema = z.object({
    name: z.string().min(1, { message: "Name is required." }),
    type: z.enum(["Checking", "Savings", "Credit Card", "Cash", "Investment"]),
    currency: z.string().min(2, { message: "Please select a currency." }),
    creditLimit: z.string().optional(),
}).refine((data) => {
    // If it's a credit card, credit limit should be provided and be a positive number
    if (data.type === "Credit Card") {
        if (!data.creditLimit || data.creditLimit.trim() === "") {
            return false;
        }
        const limit = parseFloat(data.creditLimit);
        return !isNaN(limit) && limit > 0;
    }
    return true;
}, {
    message: "Credit limit is required for credit card accounts and must be a positive number.",
    path: ["creditLimit"],
});

export type AccountFormValues = z.infer<typeof formSchema>;

interface AccountFormProps {
    id?: string;
    defaultValues?: AccountFormValues;
    onSubmit: (values: AccountFormValues) => void;
    disabled?: boolean;
}

export function AccountForm({
    id,
    defaultValues,
    onSubmit,
    disabled,
}: AccountFormProps) {
    const { data: session } = useSession();
    const userCurrency = session?.user?.currency || 'INR';
    
    const form = useForm<AccountFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues || {
            currency: userCurrency,
        },
    });

    // Update currency default when user's currency changes
    useEffect(() => {
        if (!defaultValues && !id && userCurrency) {
            form.setValue('currency', userCurrency);
        }
    }, [userCurrency, defaultValues, id, form]);

    const handleSubmit = (values: AccountFormValues) => {
        onSubmit(values);
    };

    const selectedCurrency = form.watch('currency');
    const selectedType = form.watch('type');
    const isDefaultCurrency = selectedCurrency === userCurrency;
    const isCreditCard = selectedType === 'Credit Card';

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Account Name</FormLabel>
                            <FormControl>
                                <Input
                                    disabled={disabled}
                                    placeholder="e.g. Savings Account"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={disabled}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an account type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Checking">Checking</SelectItem>
                                    <SelectItem value="Savings">Savings</SelectItem>
                                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Investment">Investment</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={disabled}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a currency" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {currencies.map((currency) => (
                                        <SelectItem key={currency.code} value={currency.code}>
                                            <div className="flex items-center justify-between w-full">
                                                <span>{currency.name} ({currency.code})</span>
                                                {currency.code === userCurrency && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-2">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!isDefaultCurrency && selectedCurrency && (
                                <div className="text-sm text-amber-600">
                                    ⚠️ This account uses {selectedCurrency}, different from your default currency ({userCurrency}). 
                                    Amounts will be converted for dashboard totals.
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {isCreditCard && (
                    <FormField
                        control={form.control}
                        name="creditLimit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Credit Limit</FormLabel>
                                <FormControl>
                                    <Input
                                        disabled={disabled}
                                        placeholder="e.g. 10000"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <Button className="w-full" disabled={disabled}>
                    {id ? "Save changes" : "Create account"}
                </Button>
            </form>
        </Form>
    );
} 