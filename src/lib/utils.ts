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
export function getChapterUrl(key: string) {
  return `${env.NEXT_PUBLIC_R2_CDN}/${key}`;
}
export function getItemUrl(key: string) {
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
export function getChapterArchiveKey(
  workSlug: string,
  chapterSlug: string,
  chapterId: string
) {
  return `works/${workSlug}/chapters/${chapterSlug}-${chapterId}.md`;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric, non-space, non-dash
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with dash
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing dashes
}
export function fromZalgo(text: string): string {
  const zalgoRegex = /[\u0300-\u036F\u0489]/g;
  return text.replace(zalgoRegex, "");
}

export function toZalgo(text: string, noise: number = 1): string {
  const zalgoUp = [
    "\u030d",
    "\u030e",
    "\u0304",
    "\u0305",
    "\u033f",
    "\u0311",
    "\u0306",
    "\u0310",
    "\u0352",
    "\u0357",
    "\u0351",
    "\u0307",
    "\u0308",
    "\u030a",
    "\u0342",
    "\u0343",
    "\u0344",
    "\u034a",
    "\u034b",
    "\u034c",
    "\u0303",
    "\u0302",
    "\u030c",
    "\u0350",
    "\u0300",
    "\u0301",
    "\u030b",
    "\u030f",
    "\u0312",
    "\u0313",
    "\u0314",
    "\u033d",
    "\u0309",
    "\u0363",
    "\u0364",
    "\u0365",
    "\u0366",
    "\u0367",
    "\u0368",
    "\u0369",
    "\u036a",
    "\u036b",
    "\u036c",
    "\u036d",
    "\u036e",
    "\u036f",
    "\u033e",
    "\u035b",
    "\u0346",
    "\u031a",
  ];

  const zalgoDown = [
    "\u0316",
    "\u0317",
    "\u0318",
    "\u0319",
    "\u031c",
    "\u031d",
    "\u031e",
    "\u031f",
    "\u0320",
    "\u0324",
    "\u0325",
    "\u0326",
    "\u0329",
    "\u032a",
    "\u032b",
    "\u032c",
    "\u032d",
    "\u032e",
    "\u032f",
    "\u0330",
    "\u0331",
    "\u0332",
    "\u0333",
    "\u0339",
    "\u033a",
    "\u033b",
    "\u033c",
    "\u0345",
    "\u0347",
    "\u0348",
    "\u0349",
    "\u034d",
    "\u034e",
    "\u0353",
    "\u0354",
    "\u0355",
    "\u0356",
    "\u0359",
    "\u035a",
    "\u0323",
  ];

  const zalgoMid = [
    "\u0315",
    "\u031b",
    "\u0340",
    "\u0341",
    "\u0358",
    "\u0321",
    "\u0322",
    "\u0327",
    "\u0328",
    "\u0334",
    "\u0335",
    "\u0336",
    "\u034f",
    "\u035c",
    "\u035d",
    "\u035e",
    "\u035f",
    "\u0360",
    "\u0362",
    "\u0338",
    "\u0337",
    "\u0361",
    "\u0489",
  ];

  const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  return text
    .split("")
    .map((char) => {
      if (char === " ") return char;
      let result = char;
      const countUp = Math.floor(Math.random() * noise);
      const countMid = Math.floor(Math.random() * noise);
      const countDown = Math.floor(Math.random() * noise);

      for (let i = 0; i < countUp; i++) result += rand(zalgoUp);
      for (let i = 0; i < countMid; i++) result += rand(zalgoMid);
      for (let i = 0; i < countDown; i++) result += rand(zalgoDown);

      return result;
    })
    .join("");
}