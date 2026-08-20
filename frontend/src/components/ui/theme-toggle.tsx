"use client"

import { Moon, Sun } from "lucide-react"
import { cn } from "../../lib/utils"
import { useAppStore } from "../../store/useAppStore"
import { useT } from "../../hooks/useTranslation"

interface ThemeToggleProps {
  className?: string
}

/**
 * Global light/dark switch. The visual track follows the supplied shadcn
 * pattern, while the state is shared with the rest of S.A.F.E House.
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
        "flex min-h-11 min-w-16 items-center rounded-full p-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        isDark
          ? "border border-accent/30 bg-[#1a1208] hover:border-accent/50"
          : "border border-accent/30 bg-accent/10 hover:border-accent/50",
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
            "flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-300",
            isDark
              ? "translate-x-0 bg-accent shadow-[0_0_12px_rgba(212,149,106,0.28)]"
              : "translate-x-7 bg-accent shadow-[0_0_12px_rgba(212,149,106,0.22)]",
          )}
        >
          {isDark ? (
            <Moon className="h-4 w-4 text-bg" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Sun className="h-4 w-4 text-bg" strokeWidth={1.5} aria-hidden="true" />
          )}
        </span>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-300",
            isDark ? "bg-transparent" : "-translate-x-7",
          )}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-accent/70" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 text-accent/80" strokeWidth={1.5} aria-hidden="true" />
          )}
        </span>
      </span>
    </button>
  )
}
