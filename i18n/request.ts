import {getRequestConfig} from 'next-intl/server';
import {routing} from '../navigation';

function deepMerge(base: Record<string, any>, override: Record<string, any>): Record<string, any> {
  const result = {...base};

  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const defaultMessages = (await import(`../messages/${routing.defaultLocale}.json`)).default;
  const localeMessages =
    locale === routing.defaultLocale
      ? defaultMessages
      : (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages: locale === routing.defaultLocale ? defaultMessages : deepMerge(defaultMessages, localeMessages)
  };
});
