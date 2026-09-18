import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a phone number to +233 format (Ghana country code)
 * Handles various input formats:
 * - 0XXXXXXXXX -> +233XXXXXXXXX
 * - +233XXXXXXXXX -> +233XXXXXXXXX (unchanged)
 * - 233XXXXXXXXX -> +233XXXXXXXXX
 * - XXXXXXXXX (9 digits) -> +233XXXXXXXXX
 */
export function normalizePhoneTo233(phone: string): string {
  if (!phone) return phone
  
  // Remove all spaces, dashes, parentheses, and other non-digit characters except +
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // If already in +233 format, return as is
  if (cleaned.startsWith('+233')) {
    return cleaned
  }
  
  // If starts with 0, replace with +233
  if (cleaned.startsWith('0')) {
    return '+233' + cleaned.slice(1)
  }
  
  // If starts with 233 (without +), add +
  if (cleaned.startsWith('233')) {
    return '+' + cleaned
  }
  
  // If it's 9 digits (local format), add +233
  if (/^\d{9}$/.test(cleaned)) {
    return '+233' + cleaned
  }
  
  // Otherwise, assume it needs +233 prefix (for edge cases)
  return '+233' + cleaned.replace(/^\+?/, '')
}
