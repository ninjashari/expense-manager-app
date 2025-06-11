'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserCircle, AlignJustify } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
  } from "@/components/ui/sheet"

const routes = [
  { href: '/', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/categories', label: 'Categories' },
  { href: '/transactions', label: 'Transactions'}
];

const Header = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="bg-gradient-to-b from-blue-700 to-blue-500 px-4 py-8 lg:px-14 pb-36">
      <div className="max-w-screen-2xl mx-auto">
        <div className="w-full flex items-center justify-between mb-14">
            <div className="flex items-center lg:gap-x-16">
                <Link href="/" className="text-white text-2xl font-bold">
                    ExpenseManager
                </Link>
                <nav className="hidden lg:flex items-center gap-x-2">
                    {routes.map((route) => (
                        <Button
                            key={route.href}
                            asChild
                            variant={route.href === pathname ? "secondary" : "outline"}
                            className="w-full lg:w-auto justify-between"
                        >
                            <Link href={route.href}>{route.label}</Link>
                        </Button>
                    ))}
                </nav>
            </div>
            <div className="flex items-center">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="lg:hidden mr-4">
                            <AlignJustify className="size-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="px-2">
                        <nav className="flex flex-col gap-y-2 pt-6">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                asChild
                                variant={route.href === pathname ? "secondary" : "outline"}
                                className="w-full justify-start"
                            >
                                <Link href={route.href}>{route.label}</Link>
                            </Button>
                        ))}
                        </nav>
                    </SheetContent>
                </Sheet>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <UserCircle className="h-9 w-9 text-white" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {session?.user?.email}
                        </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/sign-in' })}>
                        Log out
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <div>
            <h2 className="text-2xl lg:text-4xl text-white font-bold">
                Welcome Back, {session?.user?.name?.split(" ")[0]}
            </h2>
        </div>
      </div>
    </header>
  );
};

export default Header; 