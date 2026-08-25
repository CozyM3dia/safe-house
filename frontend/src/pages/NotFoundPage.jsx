import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ShieldCheck } from 'lucide-react';

const LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/app', label: 'Audit peta' },
  { to: '/validasi', label: 'Validasi historis' },
  { to: '/bandingkan', label: 'Bandingkan lokasi' },
  { to: '/pbg', label: 'Checklist PBG' },
];

/**
 * 404 eksplisit — jangan jatuhkan URL tak dikenal ke landing diam-diam.
 */
export default function NotFoundPage() {
  return (
    <div className="document-scroll min-h-[100dvh] bg-bg px-5 py-16 text-text-primary">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <ShieldCheck className="mb-4 h-8 w-8 text-accent" />
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          404
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          URL ini bukan rute produk S.A.F.E House. Kami tidak mengalihkan diam-diam
          ke beranda supaya tautan rusak tetap terlihat.
        </p>
        <ul className="mt-8 flex w-full flex-col gap-2 text-left">
          {LINKS.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="btn-press flex min-h-[44px] items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-text-primary hover:border-accent/40"
              >
                <span className="inline-flex items-center gap-2">
                  <Compass className="h-4 w-4 text-accent" />
                  {link.label}
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
