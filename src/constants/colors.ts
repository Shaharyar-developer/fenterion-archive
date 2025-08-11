export type ThemeColorKey =
  | "background"
  | "foreground"
  | "card"
  | "cardForeground"
  | "popover"
  | "popoverForeground"
  | "primary"
  | "primaryForeground"
  | "secondary"
  | "secondaryForeground"
  | "muted"
  | "mutedForeground"
  | "accent"
  | "accentForeground"
  | "destructive"
  | "destructiveForeground"
  | "border"
  | "input"
  | "ring"
  | "chart1"
  | "chart2"
  | "chart3"
  | "chart4"
  | "chart5"
  | "sidebar"
  | "sidebarForeground"
  | "sidebarPrimary"
  | "sidebarPrimaryForeground"
  | "sidebarAccent"
  | "sidebarAccentForeground"
  | "sidebarBorder"
  | "sidebarRing";

export type ThemeColors = Record<ThemeColorKey, string>;

export type Colors = {
  light: ThemeColors;
  dark: ThemeColors;
};

export const COLORS: Colors = {
  light: {
    background: "#ffffff",
    foreground: "#444444",
    card: "#ffffff",
    cardForeground: "#444444",
    popover: "#ffffff",
    popoverForeground: "#444444",
    primary: "#c4b642",
    primaryForeground: "#000000",
    secondary: "#f6f6f7",
    secondaryForeground: "#696c7d",
    muted: "#fafafa",
    mutedForeground: "#848694",
    accent: "#f9fbf2",
    accentForeground: "#8b7355",
    destructive: "#dc2626",
    destructiveForeground: "#ffffff",
    border: "#e8e9ec",
    input: "#e8e9ec",
    ring: "#c4b642",
    chart1: "#c4b642",
    chart2: "#9ca635",
    chart3: "#7d8a2e",
    chart4: "#8b7355",
    chart5: "#6d5d48",
    sidebar: "#fafafa",
    sidebarForeground: "#444444",
    sidebarPrimary: "#c4b642",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#f9fbf2",
    sidebarAccentForeground: "#8b7355",
    sidebarBorder: "#e8e9ec",
    sidebarRing: "#c4b642",
  },
  dark: {
    background: "#232323",
    foreground: "#ebebeb",
    card: "#343434",
    cardForeground: "#ebebeb",
    popover: "#444444",
    popoverForeground: "#ebebeb",
    primary: "#d9c441",
    primaryForeground: "#000000",
    secondary: "#444444",
    secondaryForeground: "#ebebeb",
    muted: "#444444",
    mutedForeground: "#b6b6b6",
    accent: "#c4b642",
    accentForeground: "#f2f5ea",
    destructive: "#dc2626",
    destructiveForeground: "#ffffff",
    border: "#5e5e5e",
    input: "#5e5e5e",
    ring: "#c4b642",
    chart1: "#e2d147",
    chart2: "#9ca635",
    chart3: "#8b7355",
    chart4: "#7d8a2e",
    chart5: "#8b7355",
    sidebar: "#2b2b2b",
    sidebarForeground: "#ebebeb",
    sidebarPrimary: "#c4b642",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#c4b642",
    sidebarAccentForeground: "#f2f5ea",
    sidebarBorder: "#5e5e5e",
    sidebarRing: "#c4b642",
  },
};
