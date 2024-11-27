import { format, parseISO, startOfDay } from 'date-fns';

export function normalizeDate(dateString: string): string {
  return format(parseISO(dateString), 'yyyy-MM-dd');
}

export function formatApiDate(dateString: string): string {
  return normalizeDate(dateString).replace(/-/g, '');
}

export function validateDate(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}