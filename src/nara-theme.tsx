import type { ReactNode } from "react";
import { defineTheme, Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
export const naraTheme = defineTheme({
  name: "nara",
  extends: neutralTheme,
  radius: { base: 4, multiplier: 0 },
  tokens: {
    "--font-family-body": "var(--nara-font-body)",
    "--font-family-heading": "var(--nara-font-display)",
    "--color-background-body": "var(--color-background)",
    "--color-background-surface": "var(--color-background)",
    "--color-background-popover": "var(--color-background)",
    "--color-text-primary": "var(--color-foreground)",
    "--color-accent": "var(--color-foreground)",
    "--color-on-accent": "var(--color-background)",
    "--color-border": "var(--nara-line)",
    "--color-border-emphasized": "var(--color-foreground)",
    "--focus-outline-color": "var(--nara-green)",
    "--shadow-low": "none",
    "--shadow-med": "0 4px 16px #0000000a",
    "--shadow-high": "0 8px 24px #00000014",
    "--size-element-md": "44px",
    "--size-element-lg": "48px",
  },
  components: {
    selector: {
      base: {
        fontFamily: "var(--nara-font-body)",
        ":hover": { borderColor: "var(--color-foreground)" },
      },
    },
    "number-input": {
      base: {
        fontFamily: "var(--nara-font-body)",
        ":hover": { borderColor: "var(--color-foreground)" },
      },
    },
  },
});
export function NaraTheme({
  children,
  strings = {},
}: {
  children: ReactNode;
  strings?: Record<string, string>;
}) {
  const locale = document.documentElement.lang || "en";
  const overrides = Object.fromEntries(
    [
      ["@astryx.lightbox.close", "close"],
      ["@astryx.lightbox.zoom", "zoom"],
      ["@astryx.lightbox.mediaViewer", "gallery"],
      ["@astryx.lightbox.previous", "previous"],
      ["@astryx.lightbox.next", "next"],
      ["@astryx.numberInput.incrementLabel", "increment"],
      ["@astryx.numberInput.decrementLabel", "decrement"],
    ]
      .filter(([, key]) => strings[key])
      .map(([key, value]) => [key, strings[value]]),
  );
  return (
    <Theme theme={naraTheme} mode="light">
      <InternationalizationProvider
        locale={locale}
        overrides={{ [locale]: overrides }}
      >
        {children}
      </InternationalizationProvider>
    </Theme>
  );
}
