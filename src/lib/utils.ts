import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { oklch, formatHex } from "culori";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";
import { env } from "./env";

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

export function normalizeSlug(slug: string, userId: string): string {
  const parts = slug.split("-");
  if (parts.length > 1 && parts[parts.length - 1] === userId) {
    return parts.slice(0, -1).join("-");
  }
  return slug;
}

export function extractExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  const lastSep = Math.max(
    filename.lastIndexOf("/"),
    filename.lastIndexOf("\\")
  );

  if (
    lastDot <= lastSep ||
    lastDot === -1 ||
    lastDot === 0 ||
    lastDot === filename.length - 1
  ) {
    return "";
  }
  return filename.slice(lastDot + 1);
}

export function getCoverUrl(key: string) {
  return `${env.NEXT_PUBLIC_R2_CDN}/${key}`;
}

export function getCoverKey(
  cover: File,
  slug: string,
  id: string
): string | null {
  if (!cover) return null;
  return `covers/${slug}-${id}.${extractExtension(cover.name)}`;
}
