import { format, parseISO } from 'date-fns';

export function normalizeDate(dateString: string): string {
  return format(parseISO(dateString), 'yyyy-MM-dd');
}

export function formatApiDate(dateString: string): string {
  return format(parseISO(dateString), 'yyyyMMdd');
}

export function validateDate(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}