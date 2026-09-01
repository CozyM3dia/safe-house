import { useAppStore } from '../../store/useAppStore';
import { BrandLogo } from '../ui/BrandLogo';

/**
 * BrandSplash - loading screen layar penuh berlogo S.A.F.E House.
 *
 * Pengganti fallback skeleton untuk route lazy: alih-alih balok shimmer abu,
 * pengguna melihat logo brand yang "berdenyut" seperti rekaman seismik —
 * cincin gelombang merambat keluar dari logo, disusul titik pemuatan kecil.
 * Tema mengikuti data-theme yang sudah dipasang script inline index.html,
 * jadi logo selalu kontras dengan latar di frame pertama.
 */
export function BrandSplash({ label = 'Memuat S.A.F.E House' }) {
  const storeTheme = useAppStore((s) => s.theme);
  const theme = storeTheme || document.documentElement.dataset.theme || 'dark';

  return (
    <div
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-bg"
      role="status"
      aria-live="polite"
    >
      {/* Cincin seismik yang merambat keluar dari balik logo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <span className="splash-ring" />
        <span className="splash-ring splash-ring-delay-1" />
        <span className="splash-ring splash-ring-delay-2" />
      </div>

      <div className="relative flex flex-col items-center gap-7 px-6">
        <span className="sr-only">{label}</span>
        <div className="splash-logo">
          <BrandLogo forceTheme={theme === 'light' ? 'light' : 'dark'} className="h-24 w-auto sm:h-28" />
        </div>
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="splash-dot" />
          <span className="splash-dot" />
          <span className="splash-dot" />
        </div>
      </div>
    </div>
  );
}

export default BrandSplash;
