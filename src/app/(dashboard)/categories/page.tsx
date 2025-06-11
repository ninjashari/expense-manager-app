'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { ICategory } from "@/models/category.model";
import { columns } from "./columns";
import { DataTable } from "@/components/shared/data-table";
import { useNewCategory } from "@/hooks/use-new-category";
import { NewCategorySheet } from "@/components/sheets/new-category-sheet";
import { EditCategorySheet } from "@/components/sheets/edit-category-sheet";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { onOpen } = useNewCategory();

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data);
      } else {
        console.error('Failed to fetch categories:', data.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full bg-gray-200 rounded-md animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10">
       <NewCategorySheet onCategoryCreated={fetchCategories} />
       <EditCategorySheet onCategoryUpdated={fetchCategories} onCategoryDeleted={fetchCategories} />
       <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Categories
          </CardTitle>
          <Button onClick={onOpen} size="sm">
            <Plus className="size-4 mr-2" />
            Add new
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns(fetchCategories)} 
            data={categories} 
            filterKey="name"
          />
        </CardContent>
      </Card>
    </div>
  );
} 