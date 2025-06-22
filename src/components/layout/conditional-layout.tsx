/**
 * @file conditional-layout.tsx
 * @description This component conditionally renders the sidebar layout based on authentication status.
 * It shows the full sidebar layout for authenticated users and a simple layout for unauthenticated users.
 */
'use client'

import { useAuth } from '@/components/auth/auth-provider'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { UserMenu } from '@/components/auth/user-menu'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

/**
 * ConditionalLayout component
 * @description Renders different layouts based on user authentication status
 * @param children - The page content to be rendered
 * @returns JSX element with appropriate layout
 */
export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated, show simple layout
  if (!user) {
    return <>{children}</>
  }

  // If user is authenticated, show sidebar layout
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-sidebar-border" />
          </div>
          <div className="flex-1" />
          <div className="px-4">
            <UserMenu />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 