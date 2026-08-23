import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

function SeasonalThemeSync() {
  const { theme } = useTheme();

  React.useEffect(() => {
    const updateSeason = () => {
      if (theme !== "seasonal") {
        document.documentElement.removeAttribute("data-season");
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
    <NextThemesProvider {...props}>
      <SeasonalThemeSync />
      {children}
    </NextThemesProvider>
  )
}
