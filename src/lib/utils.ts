import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculatePrice(sessions: number): number {
  // Implement your price calculation logic here
  return sessions * 100; // Example: $100 per session
}
