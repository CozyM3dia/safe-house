import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { Check, Copy, Download, FileText, GitCompareArrows, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { BattleReport } from './BattleReport';
import SniReport, {
  NarrativeSectionList,
  ProvenanceChip,
  ReportSkeleton,
} from '../report/SniReport';
import { locationToUrl, shortAddress } from '../../lib/utils';
import { canExportSniReport, exportBattlePdf, exportPrintReadyPdf } from '../../lib/pdfExport';

// ─── Drawer laporan ──────────────────────────────────────────────────
//
// Seluruh perenderan laporan kini ditangani SniReport (komponen terpadu
// dengan halaman publik /laporan/:slug). Drawer hanya menyediakan cangkang:
// header aksi PDF + salin tautan, dan mode bandingkan yang tetap memakai
// BattleReport.

export function AuditDrawer() {
  const t = useT();
  const open = useAppStore((s) => s.auditDrawerOpen);
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const mode = useAppStore((s) => s.mode);
  const battleReport = useAppStore((s) => s.battleReportContent);
  const battleReportMeta = useAppStore((s) => s.battleReportMeta);
  const battleReportLoading = useAppStore((s) => s.battleReportLoading);
  const setAuditDrawer = useAppStore((s) => s.setAuditDrawer);
  const lang = useAppStore((s) => s.lang);
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Mode bandingkan menampilkan laporan head-to-head; mode audit menampilkan
  // laporan satu tapak.
  const isBattle = mode === 'battle' && propertyB;
  const aiReport = propertyA?.aiReport;

  const handleCopy = async () => {
    if (propertyA?.lat == null) return;
    const url = locationToUrl(propertyA.lat, propertyA.lon);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('toast.shareCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('toast.shareFailed'));
    }
  };

  // Mode bandingkan sudah punya `exportBattlePdf` di lib/pdfExport.js, tapi
  // tombolnya tidak pernah dipasang: satu-satunya cara membawa keluar laporan
  // perbandingan adalah menyalin tautannya.
  const handleDownloadBattlePdf = async () => {
    if (!propertyA || !propertyB || !battleReport) return;
    setPdfLoading(true);
    const toastId = toast.loading(
      lang === 'en' ? 'Preparing comparison PDF…' : 'Menyiapkan PDF perbandingan…'
    );
    try {
      await exportBattlePdf(propertyA, propertyB, battleReport, lang);
      toast.success(
        lang === 'en' ? 'Comparison PDF downloaded.' : 'PDF perbandingan berhasil diunduh.',
        { id: toastId }
      );
    } catch (error) {
      console.error('Battle PDF export failed', error);
      toast.error(error.message || (lang === 'en' ? 'PDF export failed.' : 'Ekspor PDF gagal.'), {
        id: toastId,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!propertyA || !canExportSniReport(propertyA)) {
      toast.warning(
        lang === 'en'
          ? 'PDF is locked because this audit has insufficient evidence.'
          : 'PDF dikunci karena bukti audit belum cukup.'
      );
      return;
    }
    setPdfLoading(true);
    const toastId = toast.loading(lang === 'en' ? 'Preparing full audit PDF…' : 'Menyiapkan PDF audit full…');
    try {
      await exportPrintReadyPdf(propertyA, lang);
      toast.success(
        lang === 'en' ? 'Full AI audit PDF downloaded.' : 'PDF full audit AI berhasil diunduh.',
        { id: toastId }
      );
    } catch (error) {
      console.error('PDF export failed', error);
      toast.error(error.message || (lang === 'en' ? 'PDF export failed.' : 'Ekspor PDF gagal.'), {
        id: toastId,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const drawerTitle = isBattle ? t('drawer.battleTitle') : t('drawer.title');
  const drawerSubtitle = isBattle
    ? `${shortAddress(propertyA?.address) || '---'} vs ${shortAddress(propertyB?.address) || '---'}`
    : shortAddress(propertyA?.address, 3) || '---';

  // Chip provenance hanya menampilkan keterangan yang menambah informasi:
  // "ENGINE · S.A.F.E engine" mengulang dirinya sendiri.
  const provenance = isBattle
    ? {
        state: battleReportMeta?.delivery_mode === 'fallback' ? 'fallback' : 'live',
        detail: battleReportMeta?.model || null,
      }
    : {
        state: aiReport?.deliveryMode || 'engine',
        detail:
          aiReport?.deliveryMode === 'cached'
            ? t('drawer.cached')
            : aiReport?.aiModel || aiReport?.generatedBy || null,
      };

  // Vaul 1.1.2 tetap mengaktifkan kunci pointer milik Radix walau opsi `modal`
  // dimatikan. Interaksi halaman dipulihkan setelah drawer mount supaya elemen
  // di luar laporan masih menerima event.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const unlockPage = window.setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
    }, 0);
    return () => window.clearTimeout(unlockPage);
  }, [open]);

  return (
    <Drawer.Root modal={false} open={open} onOpenChange={setAuditDrawer}>
      <Drawer.Portal>
        <div
          aria-hidden="true"
          data-testid="audit-drawer-backdrop"
          onClick={() => setAuditDrawer(false)}
          className="pointer-events-auto fixed inset-0 z-30 bg-bg/60 backdrop-blur-sm"
        />
        {/* z-40: panel chatbot memakai z-[35]. Dengan z-30, panel chat menutupi
            laporan dan membuatnya tak terbaca saat keduanya terbuka. */}
        <Drawer.Content
          data-testid="audit-drawer"
          className="rpt glass-strong fixed bottom-0 left-0 right-0 z-40 mt-24 flex h-[min(80dvh,58rem)] max-h-[calc(100dvh-env(safe-area-inset-top))] flex-col rounded-t-2xl outline-none max-[639px]:h-[calc(100dvh-env(safe-area-inset-top))] max-[639px]:rounded-t-3xl"
        >
          <Drawer.Title className="sr-only">{drawerTitle}</Drawer.Title>
          <Drawer.Description className="sr-only">{drawerSubtitle}</Drawer.Description>

          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full" style={{ background: 'var(--rpt-line-strong)' }} />

          {/* ── Header ── */}
          <header className="rpt-hair-b sticky top-0 z-10 flex shrink-0 items-center gap-3 bg-bg-surface/95 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-3.5">
            <span className="rpt-hair flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/[0.12] text-accent">
              {isBattle ? <GitCompareArrows className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-[15px] font-semibold leading-tight text-text-primary">
                {drawerTitle}
              </h2>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <ProvenanceChip state={provenance.state} detail={provenance.detail} />
                <span className="hidden min-w-0 truncate text-[11px] text-text-muted sm:block">
                  {drawerSubtitle}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {(!isBattle || battleReport) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={isBattle ? handleDownloadBattlePdf : handleDownloadPdf}
                  disabled={pdfLoading}
                  className="rpt-hair flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 px-2.5 text-xs hover:border-accent/40 hover:text-accent sm:px-3"
                  title={
                    isBattle
                      ? lang === 'en'
                        ? 'Download comparison PDF report'
                        : 'Unduh laporan PDF perbandingan'
                      : lang === 'en'
                        ? 'Download full PDF report'
                        : 'Unduh laporan PDF full'
                  }
                >
                  {pdfLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  ) : (
                    <Download className="h-3.5 w-3.5 text-accent" />
                  )}
                  <span className="max-[899px]:hidden">{lang === 'en' ? 'Full PDF' : 'Unduh PDF'}</span>
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="rpt-hair flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 px-2.5 text-xs sm:px-3"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-risk-safe" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="max-[899px]:hidden">{copied ? t('drawer.copied') : t('drawer.copyLink')}</span>
              </Button>

              <span aria-hidden="true" className="mx-0.5 h-6 w-px max-[479px]:hidden" style={{ background: 'var(--rpt-line)' }} />

              <button
                type="button"
                data-testid="audit-drawer-close"
                aria-label={t('drawer.close')}
                title={t('drawer.close')}
                onClick={() => setAuditDrawer(false)}
                className="rpt-focus flex h-11 w-11 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent/[0.10] hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* ── Isi ── */}
          <div className="overscroll-contain flex-1 overflow-y-auto">
            <div className="mx-auto w-full min-w-0 max-w-[1400px] px-4 py-7 sm:px-8 sm:py-9">
              {isBattle ? (
                /* Perbandingan butuh dua kolom penuh berdampingan; pita
                   max-w-3xl memaksa dua plinth skor jadi sempit dan membuat
                   matriks diferensial kehilangan lebar simpangannya. */
                <div className="mx-auto max-w-[72rem]">
                  {battleReport ? (
                    <BattleReport
                      propertyA={propertyA}
                      propertyB={propertyB}
                      markdown={battleReport}
                      meta={battleReportMeta}
                      renderSections={(md) => <NarrativeSectionList markdown={md} />}
                    />
                  ) : battleReportLoading ? (
                    <ReportSkeleton
                      label={lang === 'en' ? 'Generating comparison report' : 'Menyusun laporan perbandingan'}
                    />
                  ) : (
                    <p className="text-sm text-text-muted">{t('drawer.reportLoading')}</p>
                  )}
                </div>
              ) : propertyA ? (
                /* Satu komponen laporan untuk drawer dan halaman publik —
                   dua permukaan yang sebelumnya punya bahasa visual berbeda
                   untuk data yang sama. */
                <SniReport property={propertyA} />
              ) : null}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
