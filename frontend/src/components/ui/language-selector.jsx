import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { ChevronDown, Check } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
];

export function LanguageSelector() {
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover="hover"
        whileTap={{ scale: 0.95 }}
        aria-label="Select language"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full border px-2 py-2 text-xs font-medium transition-all duration-200 sm:min-h-8 sm:min-w-0 sm:justify-start sm:px-3.5",
          open 
            ? "border-accent/45 bg-white/10 text-text-primary shadow-[0_0_0_3px_rgba(212,149,106,0.08)]"
            : "border-white/10 bg-bg-elevated/80 text-text-secondary hover:border-accent/35 hover:bg-white/10 hover:text-text-primary"
        )}
      >
        <span aria-hidden="true" className="text-sm leading-none">{selected.flag}</span>
        <span className="hidden sm:inline">{selected.label}</span>
        <ChevronDown 
          size={14}
          aria-hidden="true"
          className={cn("text-text-muted transition-transform duration-200", open && "rotate-180")}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="menu"
            aria-label="Language options"
            className={cn(
              "absolute right-0 mt-2 z-50 w-48 overflow-hidden rounded-xl border border-white/10",
              "bg-bg-elevated/95 shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            )}
          >
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                role="menuitemradio"
                aria-checked={selected.code === item.code}
                onClick={() => {
                  setLang(item.code);
                  setOpen(false);
                }}
                className={cn(
                  "flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-left text-xs transition-colors duration-200",
                  selected.code === item.code
                    ? "bg-accent/10 font-semibold text-accent"
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                )}
              >
                <span aria-hidden="true" className="text-sm leading-none">{item.flag}</span>
                <span className="flex-1">{item.label}</span>
                {selected.code === item.code && (
                  <Check size={14} aria-hidden="true" className="text-accent" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
