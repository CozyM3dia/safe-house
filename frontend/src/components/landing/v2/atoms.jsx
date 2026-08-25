import { BrandLogo } from '../../ui/BrandLogo';
import { SplitChars } from './motion';

/**
 * Atom bersama landing v2, dipakai semua section agar ritme konsisten.
 * Semua styling via class .lp-* (landing-v2.css); tidak ada warna hardcoded.
 */

/** Header section standar: eyebrow + judul serif + lead. */
export function SectionHeader({ eyebrow, title, titleId, lead, align = 'left', className = '', id }) {
  const alignCls = align === 'center' ? 'text-center items-center' : 'text-left items-start';
  return (
    <div className={`flex flex-col gap-4 ${alignCls} ${className}`} id={id}>
      {eyebrow ? <span className="lp-eyebrow">{eyebrow}</span> : null}
      {title ? (
        <h2
          id={titleId}
          className="lp-serif text-balance text-[clamp(1.9rem,4.2vw,3rem)] leading-[1.08] text-[color:var(--lp-mocha)]"
        >
          <SplitChars text={typeof title === 'string' ? title : ''} />
          {typeof title !== 'string' ? title : null}
        </h2>
      ) : null}
      {lead ? (
        <p className="max-w-[62ch] text-[0.98rem] leading-relaxed text-[color:var(--lp-clay)]">{lead}</p>
      ) : null}
    </div>
  );
}

/**
 * Jendela produk, bingkai gelap ganda (bezel) untuk bukti app ASLI.
 * Konten screenshot tidak pernah diwarnai ulang; integrasi visual lewat
 * frame, bar, dan caption di sekelilingnya.
 */
export function ProductWindow({ title, children, className = '', bar = true }) {
  return (
    <figure className={`lp-window ${className}`}>
      {bar ? (
        <div className="lp-window-bar" aria-hidden="true">
          <span className="lp-window-dot" />
          <span className="lp-window-dot" />
          <span className="lp-window-dot" />
          {title ? <span className="lp-window-title ml-1 truncate">{title}</span> : null}
        </div>
      ) : null}
      <div className="lp-window-inner">{children}</div>
    </figure>
  );
}

/** Logo brand adaptif tema, mengikuti store (dark: versi dark, light: versi light). */
export function LandingLogo({ className = 'h-9 w-auto' }) {
  return <BrandLogo variant="full" className={className} />;
}

/** Ikon logo gelap untuk footer. */
export function LandingLogoIcon({ className = 'h-6 w-auto' }) {
  return <BrandLogo variant="icon" forceTheme="dark" className={className} />;
}
