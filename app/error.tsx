'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Une erreur est survenue</CardTitle>
          <CardDescription>
            Une erreur inattendue s&apos;est produite. Vous pouvez réessayer ou
            revenir à l&apos;accueil.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isDev && (
            <pre className="text-muted-foreground bg-muted max-h-48 overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">
              {error.message}
              {error.digest ? `\n\ndigest: ${error.digest}` : null}
            </pre>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => reset()}>Réessayer</Button>
            <Button asChild variant="outline">
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
