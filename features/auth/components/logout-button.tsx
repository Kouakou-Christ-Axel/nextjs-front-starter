'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import type { VariantProps } from 'class-variance-authority';
import { Button, buttonVariants } from '@/components/ui/button';
import { useLogout } from '@/lib/auth';

type LogoutButtonProps = {
  className?: string;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
  children?: React.ReactNode;
};

export function LogoutButton({
  className,
  variant = 'outline',
  size,
  children,
}: LogoutButtonProps) {
  const t = useTranslations('auth');
  const logout = useLogout();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={logout.isPending}
      onClick={() => logout.mutate()}
    >
      {children ?? t('logout.button')}
    </Button>
  );
}
