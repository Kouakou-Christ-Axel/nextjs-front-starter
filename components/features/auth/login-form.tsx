'use client';
import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  loginSchema,
  LoginSchemaType,
} from '@/features/auth/schemas/auth.schema';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { Link, useRouter } from '@/i18n/navigation';
import { useLogin } from '@/lib/auth';
import { useSearchParams } from 'next/navigation';
import { safeRedirectTarget } from '@/lib/safe-redirect';

function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const {
    mutate: loginMutation,
    isPending: loginMutationIsPending,
    isSuccess,
  } = useLogin();

  useEffect(() => {
    if (isSuccess) {
      router.push(safeRedirectTarget(returnTo, '/dashboard'));
    }
  }, [isSuccess, returnTo, router]);

  async function onSubmit(data: LoginSchemaType) {
    loginMutation(data);
  }

  const isLoading = form.formState.isSubmitting || loginMutationIsPending;

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{t('login.title')}</CardTitle>
          <CardDescription>{t('login.description')}</CardDescription>
          <CardAction>
            <Button variant="link" asChild>
              <Link href="/register">{t('login.signUp')}</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('emailLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="exemple@email.com"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('passwordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="animate-spin size-4" />
                ) : (
                  t('login.submit')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginForm;
