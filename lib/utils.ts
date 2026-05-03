import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateScore(statuses: Record<string, number>): number {
  const values = Object.values(statuses);
  if (values.length === 0) return 0;
  const applicable = values.filter(x => x !== 3);
  if (applicable.length === 0) return 0;
  const sum = applicable.reduce((total, x) => total + (x === 2 ? 1 : x === 1 ? 0.5 : 0), 0);
  return Math.round((sum / applicable.length) * 100);
}

export function getStatusColor(status: number): string {
  switch (status) {
    case 2: return 'text-green-500';
    case 1: return 'text-amber-500';
    case 0: return 'text-red-500';
    case 3: return 'text-gray-500';
    default: return 'text-gray-500';
  }
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
