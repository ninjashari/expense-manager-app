'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { ITransaction } from "@/models/transaction.model";
// import { columns } from "./columns";
// import { DataTable } from "@/components/shared/data-table";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/transactions');
        const data = await response.json();
        if (response.ok) {
          setTransactions(data);
        } else {
          console.error('Failed to fetch transactions:', data.message);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10">
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
       <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Transaction History
          </CardTitle>
          <Button size="sm">
            <Plus className="size-4 mr-2" />
            Add new
          </Button>
        </CardHeader>
        <CardContent>
            <p>Transaction data will be displayed here.</p>
            <pre>{JSON.stringify(transactions, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
} 