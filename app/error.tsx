'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations('error');

  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isDev && (
            <pre className="text-muted-foreground bg-muted max-h-48 overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">
              {error.message}
              {error.digest ? `\n\ndigest: ${error.digest}` : null}
            </pre>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => reset()} variant="default">
              {t('retry')}
            </Button>
            <Button asChild variant="outline">
              <Link href="/">{t('home')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
