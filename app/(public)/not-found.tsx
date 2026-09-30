import React from 'react';
import Link from 'next/link';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

function NotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>404 - Page introuvable</EmptyTitle>
        <EmptyDescription>
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export default NotFound;
