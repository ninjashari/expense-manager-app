'use client';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useNewBudget } from '@/hooks/use-new-budget';
import { BudgetForm, FormValues } from '@/components/forms/budget-form';
import { useCreateBudget } from '@/hooks/use-create-budget';
import { useGetCategories } from '@/hooks/use-get-categories';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function NewBudgetSheet() {
    const { isOpen, onClose } = useNewBudget();
    const { data: session } = useSession();

    const createMutation = useCreateBudget();
    const { categories, isLoading: isLoadingCategories } = useGetCategories();

    const isPending = createMutation.isPending || isLoadingCategories;

    const onSubmit = (values: FormValues) => {
        createMutation.mutate(values, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="space-y-4">
                <SheetHeader>
                    <SheetTitle>New Budget</SheetTitle>
                    <SheetDescription>
                        Create a new budget for a category.
                    </SheetDescription>
                </SheetHeader>
                {isPending ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <BudgetForm
                        onSubmit={onSubmit}
                        disabled={isPending}
                        categoryOptions={
                            categories?.map(c => ({ label: c.name, value: c._id.toString() })) || []
                        }
                        defaultValues={{
                            month: new Date(),
                            currency: session?.user?.currency || 'INR',
                            amount: 0,
                            categoryId: '',
                        }}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
} 