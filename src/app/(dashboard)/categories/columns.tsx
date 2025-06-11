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
import { ICategory } from "@/models/category.model"
import { useEditCategory } from "@/hooks/use-edit-category"
import { useConfirm } from "@/hooks/use-confirm"
import { toast } from "sonner"

const Actions = ({ category, onDelete }: { category: ICategory, onDelete: () => void }) => {
    const { onOpen } = useEditCategory();
    const [ConfirmDialog, confirm] = useConfirm(
        "Are you sure?",
        "You are about to delete this category."
    );

    const handleDelete = async () => {
        const ok = await confirm();
        if (ok) {
            try {
                const response = await fetch(`/api/categories/${category._id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    toast.success('Category deleted successfully.');
                    onDelete();
                } else {
                    const data = await response.json();
                    toast.error(data.message || 'Failed to delete category.');
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
                    onClick={() => onOpen(category._id as string)}
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

export const columns = (onDelete: () => void): ColumnDef<ICategory>[] => [
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
    cell: ({ row }) => <Actions category={row.original} onDelete={onDelete} />
  },
] 