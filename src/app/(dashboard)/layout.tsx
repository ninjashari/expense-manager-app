import Header from "@/components/shared/header";
import { Toaster } from "@/components/ui/sonner";

type Props = {
  children: React.ReactNode;
};

const DashboardLayout = ({ children }: Props) => {
  return (
    <>
      <Header />
      <main className="px-3 lg:px-14 -mt-24">
        {children}
      </main>
      <Toaster />
    </>
  );
};

export default DashboardLayout; 