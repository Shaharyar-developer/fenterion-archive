import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
