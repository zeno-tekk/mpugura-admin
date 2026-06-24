import type { MultiLang } from '@/lib/types';

export function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AD'
  );
}

export function formatDate(value?: string | null): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

export function formatMoney(amount: number, currency: string): string {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
}

export function cloneMultiLang(value?: MultiLang): MultiLang {
  return { en: value?.en ?? '', fr: value?.fr ?? '', rw: value?.rw ?? '' };
}

export const EMPTY_MULTILANG: MultiLang = { en: '', fr: '', rw: '' };
