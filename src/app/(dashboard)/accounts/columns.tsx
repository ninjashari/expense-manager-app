"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IAccount } from "@/models/account.model"
import { useEditAccount } from "@/hooks/use-edit-account"
import { useConfirm } from "@/hooks/use-confirm"
import { toast } from "sonner"

const Actions = ({ account, onDelete }: { account: IAccount, onDelete: () => void }) => {
    const { onOpen } = useEditAccount();
    const [ConfirmDialog, confirm] = useConfirm(
        "Are you sure?",
        "You are about to delete this account."
    );

    const handleDelete = async () => {
        const ok = await confirm();
        if (ok) {
            try {
                const response = await fetch(`/api/accounts/${account._id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    toast.success('Account deleted successfully.');
                    onDelete();
                } else {
                    const data = await response.json();
                    toast.error(data.message || 'Failed to delete account.');
                }
            } catch (error) {
                toast.error('An unexpected error occurred.');
            }
        }
    }

    return (
        <>
            <ConfirmDialog />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={() => onOpen(account._id as string)}
                >
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-500"
                >
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}

export const columns = (onDelete: () => void): ColumnDef<IAccount>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "balance",
    header: () => <div className="text-right">Balance</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("balance"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date Added",
    cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        const formatted = date.toLocaleDateString("en-US");
        return <div>{formatted}</div>;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions account={row.original} onDelete={onDelete} />
  },
] 