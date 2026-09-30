'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/lib/auth';
import { safeRedirectTarget } from '@/lib/safe-redirect';

function LoginForm() {
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

  const { mutate: loginMutation, isPending: loginMutationIsPending } =
    useLogin();

  function onSubmit(data: LoginSchemaType) {
    loginMutation(data, {
      onSuccess: () => {
        router.push(safeRedirectTarget(returnTo, '/dashboard'));
      },
    });
  }

  const isLoading = form.formState.isSubmitting || loginMutationIsPending;

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Connectez-vous à votre compte</CardTitle>
          <CardDescription>
            Entrez vos informations de connexion pour accéder à votre compte.
          </CardDescription>
          <CardAction>
            <Button variant="link" asChild>
              <Link href="/register">S&apos;inscrire</Link>
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
                    <FormLabel>Adresse e-mail</FormLabel>
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
                    <FormLabel>Mot de passe</FormLabel>
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
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Se connecter'
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
