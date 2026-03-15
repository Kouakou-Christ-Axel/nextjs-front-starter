import Link from 'next/link';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from '@/components/animate-ui/icons/arrow-right';
import { HexagonBackground } from '@/components/animate-ui/components/backgrounds/hexagon';

export default async function HomePage() {
  const t = await getTranslations('home');
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
      <HexagonBackground className="absolute inset-0 flex items-center justify-center rounded-xl" />
      <div className="relative z-10 max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
          {t('welcomeMessage')}
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          {t('description')}
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button variant="link" asChild>
            <Link href={'login'}>{t('login')}</Link>
          </Button>
          <Button asChild>
            <Link href={'register'}>
              {t('register')} <ArrowRight animateOnHover className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
