import { type ClassValue, clsx } from 'clsx';

// Utility function for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format date to readable string
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format datetime to readable string
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Get status badge color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'submitted':
      return 'bg-green-500';
    case 'draft':
      return 'bg-gray-500';
    case 'graded':
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
}

// Get difficulty color
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'N5':
      return 'bg-green-100 text-green-800';
    case 'N4':
      return 'bg-blue-100 text-blue-800';
    case 'N3':
      return 'bg-yellow-100 text-yellow-800';
    case 'N2':
      return 'bg-orange-100 text-orange-800';
    case 'N1':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Parse JSON safely
export function parseJSON<T>(jsonString: string | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}
