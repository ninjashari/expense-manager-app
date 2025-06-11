'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div>
        <p className="mt-3 text-lg">
          This is your main dashboard. View your summary here.
        </p>
    </div>
  );
}
