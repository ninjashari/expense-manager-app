import Header from "@/components/shared/header";
import { NewAccountSheet } from "@/components/sheets/new-account-sheet";
import { EditAccountSheet } from "@/components/sheets/edit-account-sheet";
import { NewCategorySheet } from "@/components/sheets/new-category-sheet";
import { EditCategorySheet } from "@/components/sheets/edit-category-sheet";
import { NewTransactionSheet } from "@/components/sheets/new-transaction-sheet";
import { EditTransactionSheet } from "@/components/sheets/edit-transaction-sheet";
import { NewBudgetSheet } from "@/components/sheets/new-budget-sheet";
import { Toaster } from "@/components/ui/sonner";

type Props = {
  children: React.ReactNode;
};

const DashboardLayout = ({ children }: Props) => {
  return (
    <>
      <Toaster />
      <NewAccountSheet />
      <EditAccountSheet />
      <NewCategorySheet />
      <EditCategorySheet />
      <NewTransactionSheet />
      <EditTransactionSheet />
      <NewBudgetSheet />
      <Header />
      <main className="px-3 lg:px-14 pt-28">
        {children}
      </main>
    </>
  );
};

export default DashboardLayout; 