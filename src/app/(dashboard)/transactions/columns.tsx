"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { PopulatedTransaction } from "@/models/transaction.model"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Actions } from "./actions"
import { formatCurrency } from "@/lib/utils"

export const columns: ColumnDef<PopulatedTransaction>[] = [
    {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    {
        accessorKey: "date",
        header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
          },
        cell: ({ row }) => {
            const date = new Date(row.getValue("date"))
            return <span>{format(date, "PPP")}</span>
        }
    },
    {
        accessorKey: "payee",
        header: "Payee",
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"))
            const currency = row.original.account.currency

            return (
                <div className="font-medium">
                    {formatCurrency(amount / 100, currency)}
                </div>
            )
        }
    },
    {
        accessorKey: "account",
        header: "Account",
        cell: ({ row }) => {
            return <span>{row.original.account.name}</span>
        }
    },
    {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
            return <Badge variant={row.original.category ? 'default' : 'outline'}>{row.original.category?.name || 'Uncategorized'}</Badge>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => <Actions transaction={row.original} />,
    },
] 