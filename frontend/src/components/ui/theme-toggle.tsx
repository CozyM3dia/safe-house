"use client"

import { Moon, Sun } from "lucide-react"
import { cn } from "../../lib/utils"
import { useAppStore } from "../../store/useAppStore"
import { useT } from "../../hooks/useTranslation"

interface ThemeToggleProps {
  className?: string
}

/**
 * Global light/dark switch. Styled with precision pill dimensions
 * to align perfectly in height and appearance with LanguageSelector.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)
  const t = useT()
  const isDark = theme !== "light"

  const toggleTheme = () => setTheme(isDark ? "light" : "dark")

  return (
    <button
      type="button"
      className={cn(
        "relative flex h-8 w-[58px] min-w-[58px] shrink-0 cursor-pointer items-center rounded-full p-0.5 border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        isDark
          ? "border-accent/30 bg-[#1a1208] hover:border-accent/50"
          : "border-accent/30 bg-accent/10 hover:border-accent/50",
        className,
      )}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      title={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
    >
      <span className="flex w-full items-center justify-between">
        <span
          className={cn(
            "flex h-[26px] w-[26px] items-center justify-center rounded-full transition-transform duration-300",
            isDark
              ? "translate-x-0 bg-accent text-bg shadow-[0_0_10px_rgba(212,149,106,0.28)]"
              : "translate-x-[26px] bg-accent text-bg shadow-[0_0_10px_rgba(212,149,106,0.22)]",
          )}
        >
          {isDark ? (
            <Moon className="h-3.5 w-3.5 text-bg" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-bg" strokeWidth={1.75} aria-hidden="true" />
          )}
        </span>
        <span
          className={cn(
            "flex h-[26px] w-[26px] items-center justify-center rounded-full transition-transform duration-300",
            isDark ? "bg-transparent text-accent/70" : "-translate-x-[26px] text-accent/80",
          )}
        >
          {isDark ? (
            <Sun className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Moon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          )}
        </span>
      </span>
    </button>
  )
}

