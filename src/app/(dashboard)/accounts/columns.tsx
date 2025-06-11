"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Edit } from "lucide-react"

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
import { useDeleteAccount } from "@/hooks/use-delete-account"
import { formatCurrency } from "@/lib/utils"

const AccountActions = ({ account }: { account: IAccount }) => {
  const { onOpen } = useEditAccount()
  const deleteMutation = useDeleteAccount(account._id.toString())
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this account? This will also delete all related transactions.')) {
      deleteMutation.mutate()
    }
  }
  
  return (
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
          onClick={() => navigator.clipboard.writeText(account._id.toString())}
        >
          Copy account ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onOpen(account._id.toString())}
        >
          <Edit className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-500" onClick={handleDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns: ColumnDef<IAccount>[] = [
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Current Balance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("balance"))
      const currency = row.original.currency
      
      return <div className="font-medium">{formatCurrency(amount / 100, currency)}</div>
    },
  },
  {
    accessorKey: "currency",
    header: "Currency",
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
    cell: ({ row }) => {
      const account = row.original

      return (
        <AccountActions account={account} />
      )
    },
  },
] 