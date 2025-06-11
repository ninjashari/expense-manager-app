"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEditTransaction } from "@/hooks/use-edit-transaction"
import { useDeleteTransaction } from "@/hooks/use-delete-transaction"
import { PopulatedTransaction } from "@/models/transaction.model"
import { MoreHorizontal } from "lucide-react"

export const Actions = ({ transaction }: { transaction: PopulatedTransaction }) => {
    const { onOpen } = useEditTransaction();
    const deleteMutation = useDeleteTransaction(transaction._id.toString());

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            deleteMutation.mutate();
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpen(transaction._id.toString())}>
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 