import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bot,
  ChevronDown,
  FileText,
  MapPin,
  RotateCcw,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { chatWithAudit } from '../../services/api';
import { SUGGESTED_PROMPTS_ID, SUGGESTED_PROMPTS_EN } from '../../lib/constants';
import { cn, shortAddress } from '../../lib/utils';
import { getViewportHeight, subscribeToViewport } from '../../lib/responsive';
import { SkeletonText } from '../ui/skeleton';
import { BrandLogo } from '../ui/BrandLogo';

// ─── Auto-resize textarea hook ──────────────────────────────────────
const MIN_HEIGHT = 44;
const MAX_HEIGHT = 140;

function useAutoResizeTextarea() {
  const textareaRef = useRef(null);

  const adjustHeight = useCallback((reset) => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (reset) {
      ta.style.height = `${MIN_HEIGHT}px`;
      return;
    }
    ta.style.height = `${MIN_HEIGHT}px`;
    ta.style.height = `${Math.min(Math.max(MIN_HEIGHT, ta.scrollHeight), MAX_HEIGHT)}px`;
  }, []);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${MIN_HEIGHT}px`;
  }, []);

  return { textareaRef, adjustHeight };
}

function getLocationLabel(property, fallback) {
  if (!property) return fallback;

  const address = shortAddress(property.address || property.location?.address, 2);
  if (address) return address;

  const longitude = property.lon ?? property.lng;
  if (Number.isFinite(property.lat) && Number.isFinite(longitude)) {
    return `${property.lat.toFixed(3)}, ${longitude.toFixed(3)}`;
  }

  return fallback;
}

function StatusDot({ className }) {
  return <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full bg-risk-safe', className)} />;
}

function ModeLabel({ mode, lang }) {
  return mode === 'battle'
    ? (lang === 'en' ? 'COMPARISON MODE' : 'MODE BANDINGKAN')
    : (lang === 'en' ? 'AUDIT MODE' : 'MODE AUDIT');
}

function ContextLabel({ propertyA, lang }) {
  const fallback = lang === 'en' ? 'No audited location' : 'Belum ada lokasi diaudit';
  const label = getLocationLabel(propertyA, fallback);

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-[10px] text-text-muted">
      <MapPin className="h-3 w-3 shrink-0 text-accent/80" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function collectCitations(messages) {
  const seen = new Set();
  const sources = [];

  messages.forEach((message) => {
    if (!Array.isArray(message.citations)) return;

    message.citations.forEach((citation) => {
      const key = citation.id || `${citation.title || 'source'}-${citation.category || 'unknown'}`;
      if (seen.has(key)) return;
      seen.add(key);
      sources.push(citation);
    });
  });

  return sources;
}

function getDockState({ input, loading }) {
  if (loading) return 'working';
  if (input.trim()) return 'composing';
  return 'idle';
}

// ─── Main Component ─────────────────────────────────────────────────
export function ChatbotFab() {
  const t = useT();
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const mode = useAppStore((s) => s.mode);
  const leftPanelOpen = useAppStore((s) => s.leftPanelOpen);
  const mapLayersOpen = useAppStore((s) => s.mapLayersOpen);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const expanded = useAppStore((s) => s.chatExpanded);
  const setExpanded = useAppStore((s) => s.setChatExpanded);
  const chatDockDismissed = useAppStore((s) => s.chatDockDismissed);
  const setChatDockDismissed = useAppStore((s) => s.setChatDockDismissed);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea();
  const messagesEndRef = useRef(null);

  const lang = useAppStore((s) => s.lang);
  const hasMessages = messages.length > 0;
  const [panelTab, setPanelTab] = useState('audit');
  const dockState = getDockState({ input, loading });
  const citations = collectCitations(messages);
  const modeLabel = <ModeLabel mode={mode} lang={lang} />;

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  useEffect(() => {
    if (!expanded) return undefined;
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, [expanded, textareaRef]);

  useEffect(() => {
    if (!expanded) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setExpanded(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [expanded, setExpanded]);

  useEffect(() => {
    if (!expanded) return undefined;
    return subscribeToViewport(({ height }) => setViewportHeight(height || getViewportHeight()));
  }, [expanded]);

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    setInput('');
    adjustHeight(true);

    setMessages((current) => [...current, { role: 'user', content: userMsg }]);
    setExpanded(true);
    setLoading(true);
    scrollToBottom();

    try {
      const result = await chatWithAudit({
        message: userMsg,
        history: messages,
        audit: propertyA,
        comparison: propertyB,
        mode,
        lang,
      });
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: result.answer,
          citations: result.citations,
          followUps: result.followUps,
        },
      ]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'assistant',
        content: error.message || (lang === 'en'
          ? 'The AI service is unavailable. Please try again.'
          : 'Layanan AI tidak tersedia. Silakan coba kembali.'),
      }]);
    }
    setLoading(false);
    scrollToBottom();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const clearConversation = () => {
    if (loading) return;
    setMessages([]);
    setInput('');
    setPanelTab('audit');
    adjustHeight(true);
  };

  const dockStatus = dockState === 'working'
    ? (lang === 'en' ? 'CHECKING AUDIT DATA' : 'MEMERIKSA DATA AUDIT')
    : dockState === 'composing'
      ? (lang === 'en' ? 'COMPOSING' : 'MENYUSUN PESAN')
      : null;

  // ─── Collapsed: compact Agent Dock over the map ──────────────────
  if (!expanded && mapLayersOpen) return null;

  return (
    <AnimatePresence initial={false}>
      {!expanded && chatDockDismissed && (
        <motion.button
          key="chatbot-fab-launcher"
          data-tour="chatbot-fab"
          data-chat-dock-state={dockState}
          initial={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 20, scale: 0.96, filter: 'blur(4px)' }}
          transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 1 }}
          type="button"
          onClick={() => {
            setChatDockDismissed(false);
            setExpanded(true);
          }}
          aria-label={t('chat.open')}
          title={t('chat.open')}
          data-chat-dock-mark="safehouse"
          className="safe-fixed-bottom fixed bottom-6 right-4 z-[35] flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/40 bg-bg-surface/95 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.36),0_0_15px_rgba(212,149,106,0.18)] backdrop-blur-xl transition-all hover:scale-105 hover:border-accent/70 hover:bg-accent/15 hover:shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_24px_rgba(212,149,106,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
        >
          <img src="/safe-icon.png" alt="" aria-hidden="true" className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
          {hasMessages && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-bg shadow-glow">
              {messages.filter((message) => message.role === 'assistant').length}
            </span>
          )}
        </motion.button>
      )}

      {!expanded && !chatDockDismissed && (
        <motion.div
          key="chatbot-fab-dock"
          data-tour="chatbot-fab"
          data-chat-dock-state={dockState}
          initial={{ opacity: 0, y: 32, scale: 0.96, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(4px)' }}
          transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 1 }}
          onClick={() => setExpanded(true)}
          role="button"
          tabIndex={0}
          aria-label={t('chat.open')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded(true);
            }
          }}
          className={cn(
            'safe-fixed-bottom group fixed left-3 right-3 z-[35] cursor-pointer select-none sm:left-auto sm:right-5 sm:w-[440px]',
            leftPanelOpen && 'max-[639px]:left-auto max-[639px]:right-4 max-[639px]:w-14'
          )}
        >
          <div className="bezel-outer">
            <div className="bezel-inner overflow-hidden rounded-2xl border border-white/10 bg-bg-surface/95 shadow-[0_16px_40px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-colors group-hover:border-accent/40">
              <div className={cn(
                'flex flex-col gap-3 p-3 sm:p-4',
                leftPanelOpen && 'max-[639px]:items-center max-[639px]:gap-0 max-[639px]:p-1.5'
              )}>
                <div className={cn(
                  'flex w-full min-w-0 items-center gap-3',
                  leftPanelOpen && 'max-[639px]:justify-center'
                )}>
                  <div
                    data-chat-dock-mark="safehouse"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 transition-all duration-200 group-hover:border-accent/55 group-hover:bg-accent/20 group-hover:shadow-[0_0_12px_rgba(212,149,106,0.25)]"
                  >
                    <img src="/safe-icon.png" alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
                  </div>

                  <div className={cn(
                    'min-w-0 flex-1',
                    leftPanelOpen && 'max-[639px]:hidden'
                  )}>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-display text-sm font-bold tracking-tight text-text-primary group-hover:text-accent transition-colors">
                        S.A.F.E AI
                      </span>
                      {dockStatus && (
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[8px] font-semibold tracking-[0.14em]',
                          dockState === 'working'
                            ? 'border-accent/25 bg-accent/8 text-accent'
                            : 'border-risk-moderate/25 bg-risk-moderate/8 text-risk-moderate'
                        )}>
                          <StatusDot className={dockState === 'working' ? 'bg-accent' : 'bg-risk-moderate'} />
                          {dockStatus}
                        </span>
                      )}
                    </div>
                    <ContextLabel propertyA={propertyA} lang={lang} />
                  </div>

                  <div className={cn(
                    'flex items-center gap-1.5',
                    leftPanelOpen && 'max-[639px]:hidden'
                  )}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatDockDismissed(true);
                      }}
                      aria-label={t('chat.close')}
                      title={t('chat.close')}
                      className="flex h-9 w-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-text-muted transition-all hover:border-white/20 hover:bg-white/10 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className={cn(
                  'flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-accent/20 bg-bg/40 px-3.5 py-2.5 shadow-inner transition-all duration-200 group-hover:border-accent/45 group-hover:bg-bg/60',
                  leftPanelOpen && 'max-[639px]:hidden'
                )}>
                  <span className="min-w-0 flex-1 truncate text-xs text-text-muted">
                    {input.trim() || (lang === 'en' ? 'Ask what this location signal means…' : 'Tanyakan arti sinyal lokasi ini…')}
                  </span>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent transition-all duration-200 group-hover:bg-accent group-hover:text-bg">
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hasMessages && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              aria-label={t('chat.open')}
              className="absolute -left-2 -top-2 flex min-h-7 min-w-7 items-center justify-center rounded-full border border-bg bg-accent px-1 text-[9px] font-bold text-bg shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {messages.filter((message) => message.role === 'assistant').length}
            </motion.button>
          )}
        </motion.div>
      )}

      {expanded && (
        <motion.aside
          key="chatbot-expanded-panel"
          data-testid="chatbot-expanded"
          initial={{ opacity: 0, y: 32, scale: 0.96, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(4px)' }}
          transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 1 }}
          aria-labelledby="safe-ai-chat-title"
          style={{
            ...(viewportHeight ? { '--safe-chat-height': `${viewportHeight}px` } : {}),
            transformOrigin: 'bottom right',
          }}
          className="glass-strong fixed bottom-4 left-3 right-3 top-[72px] z-[35] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-surface/95 shadow-[0_24px_64px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:left-auto sm:right-4 sm:w-[392px] max-[639px]:bottom-auto max-[639px]:left-0 max-[639px]:right-0 max-[639px]:top-[calc(4.5rem+env(safe-area-inset-top))] max-[639px]:h-[calc(var(--safe-chat-height,100dvh)-5.25rem)] max-[639px]:max-h-[calc(100dvh-5.25rem)] max-[639px]:rounded-b-none max-[639px]:rounded-t-3xl"
        >
      <header className="border-b border-white/8 bg-white/[0.02] px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 p-1.5 text-accent">
              <BrandLogo variant="icon" alt="" aria-hidden="true" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="safe-ai-chat-title" className="font-display text-sm font-bold tracking-tight text-text-primary">
                  S.A.F.E AI
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/25 bg-accent/8 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-[0.14em] text-accent">
                  <StatusDot className="bg-accent" /> AUDIT-GROUNDED
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">
                <Activity className="h-3 w-3 text-accent/80" aria-hidden="true" />
                {lang === 'en' ? 'Risk intelligence layer' : 'Lapisan intelijen risiko'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label={t('chat.minimize')}
              title={t('chat.minimize')}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/8 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setChatDockDismissed(true);
              }}
              aria-label={t('chat.close')}
              title={t('chat.close')}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/8 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex min-w-0 items-center justify-between gap-3 border-t border-white/6 pt-3">
          <ContextLabel propertyA={propertyA} lang={lang} />
          <span className="shrink-0 font-mono text-[9px] font-semibold tracking-[0.12em] text-accent/80">
            {modeLabel}
          </span>
        </div>

        <div
          className="mt-3 flex items-center gap-1 rounded-lg border border-white/8 bg-bg/25 p-1"
          role="tablist"
          aria-label={lang === 'en' ? 'Chat views' : 'Tampilan chatbot'}
        >
          <button
            type="button"
            role="tab"
            data-chat-tab="audit"
            aria-selected={panelTab === 'audit'}
            onClick={() => setPanelTab('audit')}
            className={cn(
              'min-h-11 flex-1 rounded-md px-3 font-mono text-[9px] font-bold tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70',
              panelTab === 'audit'
                ? 'bg-accent/12 text-accent'
                : 'text-text-muted hover:bg-white/[0.04] hover:text-text-primary'
            )}
          >
            {lang === 'en' ? 'AUDIT' : 'AUDIT'}
          </button>
          <button
            type="button"
            role="tab"
            data-chat-tab="sources"
            aria-selected={panelTab === 'sources'}
            onClick={() => setPanelTab('sources')}
            className={cn(
              'min-h-11 flex-1 rounded-md px-3 font-mono text-[9px] font-bold tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70',
              panelTab === 'sources'
                ? 'bg-accent/12 text-accent'
                : 'text-text-muted hover:bg-white/[0.04] hover:text-text-primary'
            )}
          >
            {lang === 'en' ? 'SOURCES' : 'SUMBER'}
          </button>
          <button
            type="button"
            onClick={clearConversation}
            disabled={!hasMessages || loading}
            aria-label={lang === 'en' ? 'Clear conversation' : 'Hapus percakapan'}
            title={lang === 'en' ? 'Clear conversation' : 'Hapus percakapan'}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-white/[0.04] hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        className="overscroll-contain flex-1 min-h-0 space-y-5 overflow-y-auto px-4 py-4 scrollbar-none"
        role="log"
        aria-live="polite"
        aria-busy={loading}
        aria-label={lang === 'en' ? 'S.A.F.E AI conversation' : 'Percakapan S.A.F.E AI'}
      >
        {panelTab === 'audit' ? (
          <>
        {messages.length === 0 && (
          <div className="relative px-2 py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-accent/25 bg-accent/8 text-accent shadow-[0_0_0_8px_rgba(212,149,106,0.035)]">
              <Activity className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className="mt-5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-accent/80">
              {lang === 'en' ? 'AUDIT INTELLIGENCE' : 'INTELIJEN AUDIT'}
            </p>
            <h3 className="mt-2 font-display text-base font-semibold tracking-tight text-text-primary">
              {lang === 'en' ? 'Understand the signal.' : 'Pahami sinyal risikonya.'}
            </h3>
            <p className="mx-auto mt-2 max-w-[31ch] text-[11px] leading-relaxed text-text-secondary">
              {lang === 'en'
                ? 'Ask what the evidence means for the location being audited.'
                : 'Tanyakan arti bukti dan angka untuk lokasi yang sedang diaudit.'}
            </p>
            <div className="mt-4 flex justify-center">
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/8 bg-white/[0.025] px-2.5 py-1.5 text-left text-[10px] text-text-muted">
                <MapPin className="h-3 w-3 shrink-0 text-accent/80" aria-hidden="true" />
                <span className="truncate">{getLocationLabel(propertyA, lang === 'en' ? 'Select a point on the map' : 'Pilih titik di peta')}</span>
              </span>
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const isLatest = index === messages.length - 1 && message.role === 'assistant';
          return (
            <MessageBubble
              key={`${message.role}-${index}`}
              role={message.role}
              content={message.content}
              citations={message.citations}
              followUps={isLatest ? message.followUps : null}
              onFollowUpClick={(question) => send(question)}
              loading={loading}
            />
          );
        })}

        {loading && (
          <div
            className="flex max-w-[92%] gap-2.5"
            role="status"
            aria-live="polite"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/8 text-accent">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent/80">
                {lang === 'en' ? 'CHECKING AUDIT DATA' : 'MEMERIKSA DATA AUDIT'}
              </span>
              <SkeletonText lines={2} className="mt-3" lineClassName="rounded" />
            </div>
          </div>
        )}

          </>
        ) : (
          <SourcesPanel citations={citations} lang={lang} />
        )}

        {panelTab === 'audit' && <div ref={messagesEndRef} />}
      </div>

      {panelTab === 'audit' && !hasMessages && (
        <section className="border-t border-white/8 px-4 py-3" aria-label={t('chat.suggestions')}>
          <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
            {t('chat.suggestions')}
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {(lang === 'en' ? SUGGESTED_PROMPTS_EN : SUGGESTED_PROMPTS_ID).slice(0, 4).map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() => send(suggestion)}
                className="group flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.018] px-3 py-2 text-left text-[10px] leading-snug text-text-secondary transition-colors hover:border-accent/35 hover:bg-accent/[0.05] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <span>{suggestion}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-accent/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="shrink-0 border-t border-white/8 bg-white/[0.018] p-3.5 max-[639px]:pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
        <div className="overflow-hidden rounded-xl border border-accent/18 bg-bg/35 shadow-inner">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => { setInput(event.target.value); adjustHeight(); }}
            onKeyDown={handleKeyDown}
            aria-label={t('chat.placeholder')}
            placeholder={lang === 'en' ? 'Ask about the audited evidence…' : 'Tanyakan tentang bukti audit…'}
            className="block w-full resize-none border-none bg-transparent px-3.5 py-3 text-base leading-[1.5] text-text-primary outline-none placeholder:text-text-muted focus-visible:ring-0 sm:text-xs"
            rows={1}
          />
          <div className="flex min-h-[48px] items-center justify-between gap-3 border-t border-white/7 px-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/18 bg-accent/6 px-2 py-1 font-mono text-[8px] font-semibold tracking-[0.13em] text-accent">
              <StatusDot className={dockState === 'working' ? 'bg-accent' : dockState === 'composing' ? 'bg-risk-moderate' : 'bg-accent'} />
              {dockState === 'idle' ? modeLabel : dockStatus}
            </span>
            <button
              type="button"
              onClick={() => send()}
              aria-label={t('chat.send')}
              disabled={!input.trim() || loading}
              className={cn(
                'flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70',
                input.trim()
                  ? 'bg-accent text-bg hover:bg-accent-hover'
                  : 'bg-white/[0.04] text-text-muted'
              )}
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-center font-mono text-[8px] tracking-[0.08em] text-text-muted">
          {lang === 'en' ? 'ENTER TO SEND · SHIFT+ENTER FOR NEW LINE' : 'ENTER UNTUK KIRIM · SHIFT+ENTER UNTUK BARIS BARU'}
        </p>
      </div>
    </motion.aside>
    )}
  </AnimatePresence>
  );
}

function SourcesPanel({ citations, lang }) {
  if (citations.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/8 bg-white/[0.025] text-text-muted">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
          {lang === 'en' ? 'SOURCE LEDGER' : 'DAFTAR SUMBER'}
        </p>
        <p className="mt-2 max-w-[28ch] text-[11px] leading-relaxed text-text-secondary">
          {lang === 'en'
            ? 'Sources will appear here after S.A.F.E AI answers from the audit knowledge base.'
            : 'Sumber akan muncul di sini setelah S.A.F.E AI menjawab dari basis pengetahuan audit.'}
        </p>
      </div>
    );
  }

  return (
    <section data-chat-sources="true" className="space-y-3" aria-label={lang === 'en' ? 'Data sources' : 'Sumber data'}>
      <div className="flex items-end justify-between gap-3 border-b border-white/8 pb-3">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-accent/80">
            {lang === 'en' ? 'SOURCE LEDGER' : 'DAFTAR SUMBER'}
          </p>
          <p className="mt-1 text-[11px] text-text-secondary">
            {lang === 'en' ? 'Evidence attached to this conversation.' : 'Bukti yang terhubung ke percakapan ini.'}
          </p>
        </div>
        <span className="font-mono text-[10px] font-bold text-accent">{citations.length}</span>
      </div>

      <div className="space-y-2">
        {citations.map((citation, index) => (
          <article
            key={`${citation.id || citation.title || 'source'}-${index}`}
            className="rounded-xl border border-white/8 bg-white/[0.018] px-3 py-3"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent/18 bg-accent/8 text-accent">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[11px] font-semibold leading-snug text-text-primary">{citation.title}</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-text-muted">{citation.category}</p>
                {citation.isUserUploaded && (
                  <span className="mt-2 inline-flex rounded-md border border-accent/18 bg-accent/6 px-1.5 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-accent">
                    {lang === 'en' ? 'USER UPLOAD' : 'UNGGAHAN USER'}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function sentenceParts(text) {
  return (text.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) || [text])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function stripMarkdownNode(props) {
  const { node, ...rest } = props;
  void node;
  return rest;
}

function normalizeAssistantMarkdown(content, lang) {
  const text = String(content || '').replace(/\r\n/g, '\n').trim();
  if (!text) return text;

  // The backend appends a deterministic evidence appendix after the model's
  // prose. Keep that appendix intact while restructuring only the prose.
  const evidenceMatch = text.match(/\n+### (?:Dasar data|Verified )[^\n]*/);
  const evidenceIndex = evidenceMatch?.index ?? -1;
  const bodyText = evidenceIndex >= 0 ? text.slice(0, evidenceIndex).trim() : text;
  const evidenceBlock = evidenceIndex >= 0 ? text.slice(evidenceIndex).trim() : '';

  if (bodyText.length < 280) return text;

  // Preserve answers that already have intentional Markdown structure.
  const firstMeaningfulLine = bodyText.split('\n').find((line) => line.trim())?.trim() || '';
  if (/^(#{1,6}\s|[-*]\s|\d+[.)]\s)/.test(firstMeaningfulLine)) return text;

  const followUpLabel = lang === 'en' ? '[FOLLOW-UP QUESTIONS]' : '[PERTANYAAN LANJUTAN]';
  const followUpIndex = bodyText.indexOf(followUpLabel);
  const body = followUpIndex >= 0 ? bodyText.slice(0, followUpIndex).trim() : bodyText;
  const followUpBlock = followUpIndex >= 0 ? bodyText.slice(followUpIndex).trim() : '';
  const sentences = sentenceParts(body);

  if (sentences.length < 4) {
    const formattedBody = sentences.length > 1 ? sentences.join('\n\n') : body;
    return [formattedBody, followUpBlock, evidenceBlock].filter(Boolean).join('\n\n');
  }

  const actionPattern = lang === 'en'
    ? /recommend|should|must|ensure|design|install|test|verify|follow|use|maintain|provide/i
    : /mitigasi|disarankan|wajib|pastikan|rancang|gunakan|uji|verifikasi|ikuti|sediakan|pertahankan/i;
  const signalPattern = lang === 'en'
    ? /risk|hazard|flood|earthquake|seismic|fault|soil|liquefaction|pga|vs30|exposure|moderate|high/i
    : /risiko|bahaya|banjir|gempa|seismik|sesar|tanah|likuefaksi|pga|vs30|terpapar|sedang|tinggi|rawan/i;

  const summary = sentences[0];
  const signals = [];
  const actions = [];
  sentences.slice(1).forEach((sentence) => {
    if (actionPattern.test(sentence)) actions.push(sentence);
    else if (signalPattern.test(sentence)) signals.push(sentence);
    else signals.length <= actions.length ? signals.push(sentence) : actions.push(sentence);
  });

  if (actions.length === 0 && signals.length > 1) actions.push(signals.pop());

  const sections = [
    `## ${lang === 'en' ? 'Summary' : 'Ringkasan'}`,
    summary,
    '',
    `## ${lang === 'en' ? 'Key signals' : 'Sinyal utama'}`,
    signals.map((sentence) => `- ${sentence}`).join('\n'),
    '',
    `## ${lang === 'en' ? 'Next steps' : 'Langkah berikutnya'}`,
    actions.map((sentence) => `- ${sentence}`).join('\n'),
  ];

  if (followUpBlock) sections.push('', followUpBlock);
  if (evidenceBlock) sections.push('', evidenceBlock);
  return sections.join('\n');
}

// ─── Message Bubble ─────────────────────────────────────────────────
function MessageBubble({ role, content, citations, followUps, onFollowUpClick, loading }) {
  const t = useT();
  const isUser = role === 'user';
  const lang = useAppStore((s) => s.lang);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}
    >
      {isUser ? (
        <div className="max-w-[88%] rounded-2xl rounded-tr-sm border border-accent/25 bg-accent/10 px-3.5 py-3 text-xs font-medium leading-relaxed text-text-primary">
          {content}
        </div>
      ) : (
        <div className="flex max-w-[94%] gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/8 p-1 text-accent">
            <BrandLogo variant="icon" alt="" aria-hidden="true" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent/90">S.A.F.E AI</span>
              <span className="text-[9px] text-text-muted">{t('chat.sources').toLowerCase()}</span>
            </div>
            <div className="chat-assistant-message text-xs leading-[1.65] text-text-secondary">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  h1: ({ children }) => <h3 className="mt-5 mb-2.5 border-b border-accent/20 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent first:mt-0">{children}</h3>,
                  h2: ({ children }) => <h3 className="mt-5 mb-2.5 border-b border-accent/20 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent first:mt-0">{children}</h3>,
                  h3: ({ children }) => <h4 className="mt-4 mb-1.5 text-xs font-semibold text-text-primary first:mt-0">{children}</h4>,
                  strong: ({ children }) => <strong className="font-bold text-text-primary">{children}</strong>,
                  code: ({ children }) => <code className="rounded bg-bg/45 px-1.5 py-0.5 font-mono text-[10px] text-accent">{children}</code>,
                  ul: ({ children }) => <ul className="my-2.5 ml-4 list-disc space-y-2 marker:text-accent">{children}</ul>,
                  ol: ({ children }) => <ol className="my-2.5 ml-5 list-decimal space-y-2 marker:font-mono marker:text-accent">{children}</ol>,
                  li: ({ children }) => <li className="pl-1">{children}</li>,
                  hr: () => <hr className="my-4 border-0 border-t border-accent/15" />,
                  a: ({ children, href }) => <a className="text-accent underline decoration-accent/40 underline-offset-2 hover:text-text-primary" href={href}>{children}</a>,
                  table: ({ children, ...props }) => (
                    <div className="table-scroll max-w-full overscroll-contain">
                      <table {...stripMarkdownNode(props)}>{children}</table>
                    </div>
                  ),
                }}
              >
                {normalizeAssistantMarkdown(content, lang)}
              </ReactMarkdown>

              {citations && citations.length > 0 && (
                <div className="mt-3 border-t border-white/8 pt-2.5">
                  <div className="mb-2 flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-accent/80" aria-hidden="true" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent/90">
                      {t('chat.sources')} ({citations.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {citations.map((citation, index) => (
                      <span
                        key={`${citation.id || citation.title || 'source'}-${index}`}
                        title={`${citation.title} (${citation.category})`}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.025] px-2 py-1 font-mono text-[8.5px] text-text-muted"
                      >
                        <span className="max-w-[150px] truncate">{citation.title}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isUser && followUps && followUps.length > 0 && (
        <div className="ml-9 flex max-w-[88%] flex-col gap-1.5">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-text-muted">
            {t('chat.followUps')}
          </p>
          <div className="flex flex-col gap-1">
            {followUps.map((question, index) => (
              <button
                type="button"
                key={`${question}-${index}`}
                onClick={() => !loading && onFollowUpClick(question)}
                disabled={loading}
                aria-label={question}
                className="group flex min-h-[40px] items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.018] px-3 py-2 text-left text-[10px] text-text-secondary transition-colors hover:border-accent/35 hover:bg-accent/[0.05] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <span className="min-w-0 flex-1">{question}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-accent/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.article>
  );
}
