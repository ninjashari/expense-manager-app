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
import { useDeleteCategory } from "@/hooks/use-delete-category"

const CategoryActions = ({ category }: { category: ICategory }) => {
  const { onOpen } = useEditCategory()
  const deleteMutation = useDeleteCategory(category._id.toString())
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this category? This will also delete all related transactions.')) {
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
          onClick={() => navigator.clipboard.writeText(category._id.toString())}
        >
          Copy category ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onOpen(category._id.toString())}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-500" onClick={handleDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns: ColumnDef<ICategory>[] = [
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
    cell: ({ row }) => {
      const category = row.original
 
      return (
        <CategoryActions category={category} />
      )
    },
  },
] 