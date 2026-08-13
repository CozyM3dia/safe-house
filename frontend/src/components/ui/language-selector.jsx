import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { ChevronDown, Check, Languages } from "lucide-react";
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover="hover"
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase transition-all duration-300",
          open 
            ? "border-accent/40 bg-white/10 text-text-primary" 
            : "border-white/10 bg-white/5 text-text-secondary hover:text-text-primary hover:border-accent/40 hover:bg-white/10"
        )}
      >
        <motion.span
          variants={{
            hover: { rotate: 20 }
          }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="flex items-center"
        >
          <Languages size={12} className="text-accent" />
        </motion.span>
        <span>{selected.flag}</span>
        <span className="hidden sm:inline">{selected.label}</span>
        <ChevronDown 
          size={12} 
          className={cn("transition-transform duration-200 opacity-60", open && "rotate-180")} 
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
            className={cn(
              "absolute right-0 mt-2 w-48 rounded-xl overflow-hidden z-50 max-h-[300px] overflow-y-auto scrollbar-none",
              "glass-strong animate-fade-in-dropdown"
            )}
          >
            {languages.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setLang(item.code);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-left transition-colors duration-200 font-mono",
                  selected.code === item.code
                    ? "text-accent font-semibold bg-accent/10"
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                )}
              >
                <span>{item.flag}</span>
                <span className="flex-1">{item.label}</span>
                {selected.code === item.code && (
                  <Check size={12} className="text-accent" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
