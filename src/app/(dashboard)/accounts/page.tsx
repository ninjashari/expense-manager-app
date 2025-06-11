'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { IAccount } from "@/models/account.model";
import { columns } from "./columns";
import { DataTable } from "@/components/shared/data-table";
import { useNewAccount } from "@/hooks/use-new-account";
import { NewAccountSheet } from "@/components/sheets/new-account-sheet";
import { EditAccountSheet } from "@/components/sheets/edit-account-sheet";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { onOpen } = useNewAccount();

  const fetchAccounts = async () => {
    // No setLoading(true) here to avoid flicker on re-fetch
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      if (response.ok) {
        setAccounts(data);
      } else {
        console.error('Failed to fetch accounts:', data.message);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false); // Only set loading false on initial load
    }
  };

  useEffect(() => {
    fetchAccounts();
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
       <NewAccountSheet onAccountCreated={fetchAccounts} />
       <EditAccountSheet onAccountUpdated={fetchAccounts} onAccountDeleted={fetchAccounts} />
       <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Accounts
          </CardTitle>
          <Button onClick={onOpen} size="sm">
            <Plus className="size-4 mr-2" />
            Add new
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns(fetchAccounts)} 
            data={accounts} 
            filterKey="name"
          />
        </CardContent>
      </Card>
    </div>
  );
} 