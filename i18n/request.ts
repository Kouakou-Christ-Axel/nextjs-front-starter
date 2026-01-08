import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import fs from 'fs/promises';
import path from 'path';

async function loadAllMessages() {
  const baseDir = path.join(process.cwd(), `i18n`, `messages`);
  const locales = await fs.readdir(baseDir);
  const result: Record<string, Record<string, object>> = {};

  for (const locale of locales) {
    const localeDir = path.join(baseDir, locale);
    const stat = await fs.stat(localeDir);

    if (stat.isDirectory()) {
      const files = await fs.readdir(localeDir);
      result[locale] = {};

      for (const file of files) {
        if (file.endsWith(`.json`)) {
          const key = file.replace(/\.json$/, ``);
          const content = await fs.readFile(path.join(localeDir, file), `utf8`);
          result[locale][key] = JSON.parse(content);
        }
      }
    }
  }

  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const allMessages = await loadAllMessages();

  const messages = allMessages[locale] || {};

  return {
    locale,
    messages,
  };
});
