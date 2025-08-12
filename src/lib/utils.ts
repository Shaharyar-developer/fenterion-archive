import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { oklch, formatHex } from "culori";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getComputedStyleVariable(variable: string): string {
  const rootStyles = getComputedStyle(document.documentElement);
  return rootStyles.getPropertyValue(variable).trim();
}

export function getColorValues(variable: string): {
  oklch: string;
  hex: string;
} {
  const oklchValue = getComputedStyleVariable(variable);
  const color = oklch(oklchValue);
  const hexValue = formatHex(color);
  if (!oklchValue || !hexValue) {
    throw new Error(`Invalid color value for variable: ${variable}`);
  }
  return { oklch: oklchValue, hex: hexValue };
}

export function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
}
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function transformSlug(slug: string, userId: string): string {
  return `${slug}-${userId}`;
}