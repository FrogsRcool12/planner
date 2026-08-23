import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

const FAVICON_COLORS: Record<string, { start: string; end: string }> = {
  summer: { start: "#65c7df", end: "#e8c98c" },
  fall: { start: "#c96a32", end: "#e1a83b" },
  spooky: { start: "#3a1d55", end: "#f07828" },
  winter: { start: "#4d91c9", end: "#d9eaf5" },
  spring: { start: "#5caf78", end: "#e9a6bd" },
};

function updateFavicon(season: string | null) {
  const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) return;

  if (!season || !FAVICON_COLORS[season]) {
    link.href = "/favicon.svg";
    return;
  }

  const { start, end } = FAVICON_COLORS[season];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><linearGradient id="g" x1="0" y1="0" x2="180" y2="180"><stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs><rect width="180" height="180" rx="36" fill="url(#g)"/><text x="90" y="126" text-anchor="middle" font-family="system-ui,sans-serif" font-size="72" font-weight="700" letter-spacing="-4" fill="white">SP</text></svg>`;
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function SeasonalThemeSync() {
  const { theme } = useTheme();

  React.useEffect(() => {
    const updateSeason = () => {
      if (theme !== "seasonal") {
        document.documentElement.removeAttribute("data-season");
        updateFavicon(null);
        return;
      }

      const month = new Date().getMonth() + 1;
      const season =
        month === 10
          ? "spooky"
          : month === 6 || month === 7 || month === 8
            ? "summer"
            : month === 9 || month === 11
              ? "fall"
              : month === 12 || month === 1 || month === 2
                ? "winter"
                : "spring";

      document.documentElement.setAttribute("data-season", season);
      updateFavicon(season);
    };

    updateSeason();
    const interval = window.setInterval(updateSeason, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [theme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      {...props}
      themes={["light", "dark", "system", "seasonal"]}
    >
      <SeasonalThemeSync />
      {children}
    </NextThemesProvider>
  )
}
