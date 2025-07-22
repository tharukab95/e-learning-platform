'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';

function SessionSyncer() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session) {
      localStorage.setItem('nextauth.session', JSON.stringify(session));
    }
  }, [session]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <SessionSyncer />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
