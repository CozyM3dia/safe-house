import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

/**
 * BrandLogo - Komponen logo resmi S.A.F.E House yang adaptif terhadap tema.
 *
 * Mendukung varian 'full' (logo lengkap beserta teks) dan 'icon' (hanya lambang perisai seismik).
 * Secara otomatis menggunakan aset Light Mode (warna gelap + terakota berbobot tinggi)
 * saat website berada dalam Light Mode agar logo terbaca tajam dan tidak tenggelam.
 */
export function BrandLogo({
  variant = 'full',
  forceTheme,
  className,
  alt = 'S.A.F.E House',
  ...props
}) {
  const storeTheme = useAppStore((s) => s.theme);
  const currentTheme = forceTheme || storeTheme || 'dark';
  const isLight = currentTheme === 'light';

  const src =
    variant === 'icon'
      ? isLight
        ? '/safe_icon_light.png'
        : '/safe_icon_dark.png'
      : isLight
        ? '/safe_house_logo_light.png'
        : '/safe_house_logo_dark.png';

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        'object-contain transition-all duration-300 select-none',
        isLight
          ? 'drop-shadow-[0_1px_4px_rgba(91,67,48,0.12)]'
          : 'drop-shadow-[0_0_12px_rgba(212,149,106,0.25)]',
        className
      )}
      {...props}
    />
  );
}

export default BrandLogo;
