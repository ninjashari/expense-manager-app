/**
 * @file app-sidebar.tsx
 * @description This component defines the main navigation sidebar for the expense management application.
 * It provides navigation links to all major sections: Dashboard, Accounts, Transactions, Categories, and Reports.
 */
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Building2,
  CreditCard,
  Home,
  Receipt,
  Settings,
  Tag,
  Wallet,
  CalendarDays,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

/**
 * Navigation items configuration
 * @description Defines the structure and properties of each navigation item
 */
const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    description: "Overview of your finances"
  },
  {
    title: "Accounts",
    url: "/accounts",
    icon: Wallet,
    description: "Manage your bank accounts and wallets"
  },
  {
    title: "Credit Cards",
    url: "/credit-cards",
    icon: CalendarDays,
    description: "Manage credit card bills and payments"
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: Receipt,
    description: "View and manage all transactions"
  },
  {
    title: "Categories",
    url: "/categories",
    icon: Tag,
    description: "Organize expenses by categories"
  },
  {
    title: "Payees",
    url: "/payees",
    icon: Building2,
    description: "Manage who you make payments to"
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    description: "Financial reports and analytics"
  },
]

/**
 * AppSidebar component
 * @description Renders the main navigation sidebar with all navigation items
 * @returns JSX element containing the sidebar navigation
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Expense Manager</span>
            <span className="truncate text-xs text-muted-foreground">
              Personal Finance
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.description}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
} 