'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold">
          Welcome, {session?.user?.name || 'Guest'}!
        </h1>

        <p className="mt-3 text-lg">
          You are successfully logged in. This is your main dashboard.
        </p>

        {session && (
          <Button onClick={() => signOut({ callbackUrl: '/sign-in' })} className="mt-8">
            Sign Out
          </Button>
        )}
      </main>
    </div>
  );
}
