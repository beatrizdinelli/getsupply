/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#FAF5EA",
      "foreground": "#1F1B16",
      "border": "#DCCFB8",
      "card": "#FFFFFF",
      "cardForeground": "#1F1B16",
      "popover": "#FFFFFF",
      "popoverForeground": "#1F1B16",
      "primary": "#C1502E",
      "primaryForeground": "#FFFFFF",
      "secondary": "#F0E1CB",
      "secondaryForeground": "#4A3220",
      "muted": "#EDE6D5",
      "mutedForeground": "#8A7565",
      "accent": "#E8D9C0",
      "accentForeground": "#1F1B16",
      "destructive": "#B91C1C",
      "destructiveForeground": "#FFFFFF",
      "input": "#DCCFB8",
      "ring": "#C1502E",
      "chart1": "#D97706",
      "chart2": "#2563EB",
      "chart3": "#DC2626",
      "chart4": "#16A34A",
      "chart5": "#7C3AED",
      "sidebar": "#F5ECD9",
      "sidebarForeground": "#4A3220",
      "sidebarBorder": "#DCCFB8",
      "sidebarPrimary": "#C1502E",
      "sidebarPrimaryForeground": "#FFFFFF",
      "sidebarAccent": "#EDE6D5",
      "sidebarAccentForeground": "#1F1B16",
      "sidebarRing": "#C1502E"
    },
    "dark": {
      "background": "#1B1510",
      "foreground": "#EFE7D4",
      "border": "#3A2D1F",
      "card": "#231A13",
      "cardForeground": "#EFE7D4",
      "popover": "#231A13",
      "popoverForeground": "#EFE7D4",
      "primary": "#D46040",
      "primaryForeground": "#FFFFFF",
      "secondary": "#2C2017",
      "secondaryForeground": "#D4C4AC",
      "muted": "#2C2017",
      "mutedForeground": "#A08870",
      "accent": "#372A1D",
      "accentForeground": "#EFE7D4",
      "destructive": "#C0392B",
      "destructiveForeground": "#FFFFFF",
      "input": "#3A2D1F",
      "ring": "#D46040",
      "chart1": "#F59E0B",
      "chart2": "#60A5FA",
      "chart3": "#F87171",
      "chart4": "#4ADE80",
      "chart5": "#A78BFA",
      "sidebar": "#141009",
      "sidebarForeground": "#C8B898",
      "sidebarBorder": "#3A2D1F",
      "sidebarPrimary": "#D46040",
      "sidebarPrimaryForeground": "#FFFFFF",
      "sidebarAccent": "#2C2017",
      "sidebarAccentForeground": "#EFE7D4",
      "sidebarRing": "#D46040"
    }
  },
  "fontFamily": {
    "sans": [
      "Plus Jakarta Sans",
      "sans-serif"
    ],
    "serif": [
      "Lora",
      "serif"
    ],
    "mono": [
      "JetBrains Mono",
      "monospace"
    ]
  },
  "radius": "0.625rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
