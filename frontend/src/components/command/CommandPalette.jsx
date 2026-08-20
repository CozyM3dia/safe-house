import { useEffect, useRef, useState } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Star, MapPin, X, Sparkles } from 'lucide-react';
import axios from 'axios';

import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { Skeleton, SkeletonRows } from '../ui/skeleton';

const PHOTON = 'https://photon.komoot.io/api/';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

async function geocode(q) {
  if (!q || q.trim().length < 2) return [];
  
  // 1. Try Photon (extremely fast, doesn't block cloud or client IPs)
  try {
    // Photon hanya menerima lang de/en/fr/it. Mengirim lang=id membuat setiap
    // pencarian dibalas 400 lalu diam-diam jatuh ke Nominatim, jadi geocoder
    // cepat ini praktis tidak pernah terpakai. Parameternya dihapus: nama
    // tempat Indonesia memang dikembalikan apa adanya.
    const res = await axios.get(PHOTON, {
      params: { q: q.trim(), limit: 12 },
      timeout: 4000,
    });
    const features = res.data?.features || [];
    
    // Filter specifically to Indonesia to keep search local to the geophysics app's scope
    const indonesianFeatures = features.filter(
      (f) =>
        f.properties?.countrycode === 'ID' ||
        f.properties?.country === 'Indonesia' ||
        f.properties?.postcode?.length === 5
    );
    
    const targetFeatures = indonesianFeatures.length > 0 ? indonesianFeatures : features;
    
    if (targetFeatures.length > 0) {
      return targetFeatures.map((f) => {
        const p = f.properties;
        const labelParts = [];
        if (p.name) labelParts.push(p.name);
        if (p.street) labelParts.push(p.street);
        if (p.city && p.city !== p.name) labelParts.push(p.city);
        if (p.state) labelParts.push(p.state);
        if (p.country) labelParts.push(p.country);
        
        const label = labelParts.filter(Boolean).join(', ');
        return {
          label: label || p.name || 'Unknown Location',
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        };
      });
    }
  } catch (err) {
    console.warn("Photon geocoding failed, trying Nominatim...", err.message || err);
  }

  // 2. Fallback ke Nominatim.
  // User-Agent TIDAK diset di sini: itu forbidden header name di browser,
  // jadi permintaannya ditolak dan setiap pencarian meninggalkan error
  // "Refused to set unsafe header" di konsol. Browser sudah mengirim
  // User-Agent-nya sendiri; kewajiban UA pada kebijakan OSM berlaku untuk
  // klien sisi server.
  try {
    const res = await axios.get(NOMINATIM, {
      params: { q: q.trim(), format: 'json', limit: 7, addressdetails: 1, countrycodes: 'id' },
      headers: { 'Accept-Language': 'id' },
      timeout: 4000,
    });
    return res.data.map((r) => ({
      label: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch (err) {
    console.error("Nominatim geocoding failed:", err.message || err);
    return [];
  }
}

export function CommandPalette() {
  const open = useAppStore((s) => s.cmdPaletteOpen);
  const setOpen = useAppStore((s) => s.setCmdPalette);
  const recent = useAppStore((s) => s.recentSearches);
  const favorites = useAppStore((s) => s.favorites);
  const processLocation = useAppStore((s) => s.processLocation);
  const startOnboarding = useAppStore((s) => s.startOnboarding);
  const t = useT();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  const closePalette = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setSearching(false);
  };

  const handleQueryChange = (value) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
    } else {
      setSearching(true);
    }
  };

  // Debounced geocoding with abort on new keystroke
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) return;
    timerRef.current = setTimeout(async () => {
      const data = await geocode(query);
      setResults(data);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleSelect = (item) => {
    closePalette();
    // Small delay so the palette close animation plays before map moves
    setTimeout(() => processLocation(item.lat, item.lng), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[40] flex items-start justify-center bg-bg/60 backdrop-blur-sm pt-[13vh]"
          onClick={closePalette}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="glass-strong w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/*
              shouldFilter={false} — disable cmdk's built-in text filter.
              We handle filtering ourselves via Nominatim geocoding.
            */}
            <Command shouldFilter={false} label={t('cmd.label')}>
              {/* Search input row */}
              <div className="flex items-center gap-3 border-b border-white/8 px-4">
                <Search className="h-4 w-4 shrink-0 text-text-muted" />
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={handleQueryChange}
                  placeholder={t('cmd.searchPlaceholder')}
                  className="h-12 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                />
                {searching && <Skeleton className="h-4 w-4 shrink-0 rounded-full" />}
                {query && !searching && (
                  <button
                    type="button"
                    onClick={() => handleQueryChange('')}
                    aria-label={t('cmd.clear')}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-0.5 text-text-muted transition-colors hover:text-text-primary"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <kbd className="rounded border border-white/12 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[380px] overflow-y-auto p-2">
                {searching && query && (
                  <div role="status" aria-live="polite" className="py-1">
                    <span className="sr-only">{t('cmd.searching')}</span>
                    <SkeletonRows count={4} />
                  </div>
                )}

                {/* Empty state */}
                {!searching && query && results.length === 0 && (
                  <Command.Empty className="py-10 text-center text-xs text-text-muted">
                    {t('cmd.noResults')} &ldquo;{query}&rdquo;
                  </Command.Empty>
                )}
                {!query && favorites.length === 0 && recent.length === 0 && (
                  <Command.Empty className="py-10 text-center text-xs text-text-muted">
                    {t('cmd.startTyping')}
                  </Command.Empty>
                )}

                {/* Favorites — shown when no query */}
                {!query && favorites.length > 0 && (
                  <Command.Group heading={t('cmd.favorites')}>
                    {favorites.slice(0, 5).map((item, i) => (
                      <PaletteItem
                        key={`fav-${i}`}
                        value={`fav-${i}-${item.label}`}
                        item={item}
                        icon={<Star className="h-3.5 w-3.5 text-amber-400" />}
                        onSelect={() => handleSelect(item)}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Recent — shown when no query */}
                {!query && recent.length > 0 && (
                  <Command.Group heading={t('cmd.recent')}>
                    {recent.slice(0, 6).map((item, i) => (
                      <PaletteItem
                        key={`rec-${i}`}
                        value={`rec-${i}-${item.label}`}
                        item={item}
                        icon={<Clock className="h-3.5 w-3.5 text-text-muted" />}
                        onSelect={() => handleSelect(item)}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Actions — shown when no query */}
                {!query && (
                  <Command.Group heading={t('cmd.actions')}>
                    <Command.Item
                      value="restart-onboarding-tour"
                      onSelect={() => {
                        closePalette();
                        setTimeout(() => startOnboarding(), 150);
                      }}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary data-[selected=true]:bg-white/8 data-[selected=true]:text-text-primary transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span className="flex-1 truncate leading-snug">{t('cmd.restartTour')}</span>
                    </Command.Item>
                  </Command.Group>
                )}

                {/* Geocoding results */}
                {query && results.length > 0 && (
                  <Command.Group heading={`${t('cmd.results')} (${results.length})`}>
                    {results.map((item, i) => (
                      <PaletteItem
                        key={`res-${i}-${item.lat}`}
                        value={`res-${i}-${item.label}`}
                        item={item}
                        icon={<MapPin className="h-3.5 w-3.5 text-accent" />}
                        onSelect={() => handleSelect(item)}
                      />
                    ))}
                  </Command.Group>
                )}
              </Command.List>

              {/* Footer hints */}
              <div className="flex items-center justify-between gap-4 border-t border-white/8 px-4 py-2 text-[10px] text-text-muted">
                <div className="flex items-center gap-3">
                  <span><kbd className="rounded bg-white/5 px-1 py-0.5 font-mono">↑↓</kbd> {t('cmd.navigate')}</span>
                  <span><kbd className="rounded bg-white/5 px-1 py-0.5 font-mono">⏎</kbd> {t('cmd.select')}</span>
                  <span><kbd className="rounded bg-white/5 px-1 py-0.5 font-mono">Esc</kbd> {t('cmd.close')}</span>
                </div>
                <span className="font-mono tracking-widest opacity-50">S.A.F.E</span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PaletteItem({ value, item, icon, onSelect }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary data-[selected=true]:bg-white/8 data-[selected=true]:text-text-primary aria-selected:bg-white/8 aria-selected:text-text-primary transition-colors"
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 truncate leading-snug">{item.label}</span>
      {item.lat != null && (
        <span className="shrink-0 font-mono text-[10px] text-text-muted">
          {item.lat.toFixed(3)}, {item.lng.toFixed(3)}
        </span>
      )}
    </Command.Item>
  );
}
