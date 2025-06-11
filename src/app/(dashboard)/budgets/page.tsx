'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';
import { useGetBudgets } from '@/hooks/use-get-budgets';
import { useState } from 'react';
import { MonthPicker } from '@/components/month-picker';
import { useNewBudget } from '@/hooks/use-new-budget';

const BudgetsPage = () => {
    const [month, setMonth] = useState(new Date());
    const { onOpen } = useNewBudget();
    const { budgets, isLoading } = useGetBudgets(month);

    return (
        <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
            <Card className="border-none drop-shadow-sm">
                <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle className="text-xl line-clamp-1">
                        Budgets
                    </CardTitle>
                    <div className="flex items-center gap-x-2">
                        <MonthPicker
                            date={month}
                            onDateChange={setMonth}
                        />
                        <Button onClick={onOpen} size="sm">
                            <Plus className="size-4 mr-2" />
                            Add new
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={budgets || []}
                        filterKey="category"
                        placeholder="Filter by category..."
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default BudgetsPage; 