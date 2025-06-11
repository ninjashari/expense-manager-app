'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currencies } from "@/lib/currencies";

const formSchema = z.object({
    name: z.string().min(1, { message: "Name is required." }),
    currency: z.string().min(2, { message: "Please select a currency." }),
});

export type UserSettingsFormValues = z.infer<typeof formSchema>;

interface UserSettingsFormProps {
    defaultValues?: Partial<UserSettingsFormValues>;
}

export function UserSettingsForm({ defaultValues }: UserSettingsFormProps) {
    const { data: session, update } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<UserSettingsFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: defaultValues?.name || session?.user?.name || '',
            currency: defaultValues?.currency || session?.user?.currency || 'INR',
        },
    });

    const handleSubmit = async (values: UserSettingsFormValues) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update settings');
            }

            const updatedUser = await response.json();
            
            // Update the session with new user data
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: updatedUser.name,
                    currency: updatedUser.currency,
                },
            });

            toast.success('Settings updated successfully!');
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update settings');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            disabled={isLoading}
                                            placeholder="Your name"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Default Currency</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select your default currency" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {currencies.map((currency) => (
                                                <SelectItem key={currency.code} value={currency.code}>
                                                    {currency.name} ({currency.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col gap-2">
                            <div className="text-sm text-muted-foreground">
                                <strong>Email:</strong> {session?.user?.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Email cannot be changed from this interface.
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
} 