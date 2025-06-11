'use client';

import { ColumnDef } from '@tanstack/react-table';
import { IBudget } from '@/models/budget.model';
import { formatCurrency } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Edit, Trash } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BudgetWithSpending extends IBudget {
    spent: number;
}

export const columns: ColumnDef<BudgetWithSpending>[] = [
    {
        accessorKey: 'category',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Category <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <span>{row.original.categoryId.name}</span>,
    },
    {
        accessorKey: 'amount',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Budgeted <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const { data: session } = useSession();
            return <span>{formatCurrency(row.original.amount / 100, session?.user?.currency || 'INR')}</span>;
        },
    },
    {
        accessorKey: 'spent',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                Spent <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const { data: session } = useSession();
            return <span>{formatCurrency(row.original.spent / 100, session?.user?.currency || 'INR')}</span>;
        },
    },
    {
        accessorKey: 'progress',
        header: 'Progress',
        cell: ({ row }) => {
            const percentage = (row.original.spent / row.original.amount) * 100;
            return (
                <div className="flex items-center">
                    <span className="w-16">{percentage.toFixed(0)}%</span>
                    <Progress value={percentage} className="w-full" />
                </div>
            );
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500">
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
]; 