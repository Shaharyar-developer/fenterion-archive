import { cache } from "react";

// Type definitions for Google Fonts API response
export interface WebFontFiles {
  [variant: string]: string;
}

export interface WebFontItem {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: WebFontFiles;
  category: string;
  kind: string;
  menu: string;
}

export interface WebFontListResponse {
  kind: string;
  items: WebFontItem[];
}

const GOOGLE_FONTS_API =
  "https://www.googleapis.com/webfonts/v1/webfonts?key=%20AIzaSyDgbqKConeyaWEQwmQ4OjzgOp0rRfyafeo";

const fetchFontData = cache(async (): Promise<WebFontListResponse> => {
  const response = await fetch(GOOGLE_FONTS_API);
  if (!response.ok) {
    throw new Error("Failed to fetch fonts");
  }
  return response.json();
});

export const fetchFonts = async (): Promise<string[]> => {
  try {
    const data = await fetchFontData();
    return data.items
      .map((font) => font.family)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  } catch (error) {
    console.error("Error fetching fonts:", error);
    return [];
  }
};

export const fetchFontFiles = async (
  family: string
): Promise<WebFontFiles | null> => {
  try {
    const data = await fetchFontData();
    const fontItem = data.items.find((font) => font.family === family);
    return fontItem ? fontItem.files : null;
  } catch (error) {
    console.error("Error fetching font files:", error);
    return null;
  }
};
