import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Sparkles, ChevronDown, FileText, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { chatWithAudit } from '../../services/api';
import { SUGGESTED_PROMPTS_ID, SUGGESTED_PROMPTS_EN } from '../../lib/constants';
import { cn } from '../../lib/utils';

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

// ─── Animated placeholder ───────────────────────────────────────────
function AnimatedPlaceholder() {
  const lang = useAppStore((s) => s.lang);
  const [index, setIndex] = useState(0);

  const placeholders = lang === 'en' ? [
    "Ask S.A.F.E AI anything...",
    "Check liquefaction risk here...",
    "What is the S.A.F.E score?",
    "Is this location flood-prone?",
    "Analyze soil stability..."
  ] : [
    "Tanya S.A.F.E AI...",
    "Cek risiko likuefaksi area ini...",
    "Berapa skor S.A.F.E properti ini?",
    "Apakah lokasi ini rawan banjir?",
    "Analisis stabilitas tanahnya..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [placeholders.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 5, filter: 'blur(2px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -5, filter: 'blur(2px)' }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="pointer-events-none whitespace-nowrap overflow-hidden text-ellipsis text-xs text-text-muted"
        style={{ display: 'block', maxWidth: '100%' }}
      >
        {placeholders[index]}
      </motion.p>
    </AnimatePresence>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export function ChatbotFab() {
  const t = useT();
  const propertyA = useAppStore((s) => s.propertyA);
  const propertyB = useAppStore((s) => s.propertyB);
  const mode = useAppStore((s) => s.mode);
  const leftPanelOpen = useAppStore((s) => s.leftPanelOpen);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const expanded = useAppStore((s) => s.chatExpanded);
  const setExpanded = useAppStore((s) => s.setChatExpanded);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea();
  const messagesEndRef = useRef(null);

  const lang = useAppStore((s) => s.lang);
  const hasMessages = messages.length > 0;

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    setInput('');
    adjustHeight(true);
    
    // Add user message to UI
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
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
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: result.answer,
          citations: result.citations,
          followUps: result.followUps,
        },
      ]);
    } catch (error) {
      setMessages((m) => [...m, {
        role: 'assistant',
        content: error.message || (lang === 'en'
          ? '❌ AI unavailable — please retry.'
          : '❌ Layanan AI tidak tersedia — silakan coba kembali.'),
      }]);
    }
    setLoading(false);
    scrollToBottom();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ─── Collapsed: just the floating input ─────────────────────────
  if (!expanded) {
    return (
      <motion.div
        data-tour="chatbot-fab"
        initial={{ y: 30, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', damping: 22, stiffness: 200 }}
        className={cn(
          'fixed bottom-5 left-3 right-3 z-[35] sm:left-auto sm:right-5 sm:w-[340px]',
          leftPanelOpen && 'max-[639px]:left-auto max-[639px]:right-4 max-[639px]:w-14'
        )}
      >
        <div className="bezel-outer">
          <div className="bezel-inner relative overflow-hidden bg-bg-surface/90 backdrop-blur-xl border border-white/8 shadow-glass-lg rounded-2xl">
            {/* Glow */}
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent/8 blur-xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 h-16 w-16 rounded-full bg-accent/4 blur-xl pointer-events-none" />
            
            {/* Single-row layout: icon + input + send */}
            <div className={cn(
              'relative z-10 flex items-center gap-2.5 px-3.5 py-3',
              leftPanelOpen && 'max-[639px]:justify-center max-[639px]:gap-0 max-[639px]:px-1.5'
            )}>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                aria-label={t('chat.open')}
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/15 shadow-[0_0_8px_rgba(212,149,106,0.1)] transition-all hover:scale-[1.03] hover:bg-accent/25"
                title={t('chat.open')}
              >
                <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
              </button>

              <div className={cn(
                'relative min-w-0 flex-1',
                leftPanelOpen && 'max-[639px]:hidden'
              )}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label={t('chat.placeholder')}
                  onFocus={() => setExpanded(true)}
                  className="w-full border-none bg-transparent text-xs text-text-primary focus:outline-none relative z-10"
                />
                {!input && (
                  <div className="pointer-events-none absolute inset-0 z-0 flex items-center overflow-hidden">
                    <AnimatedPlaceholder />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => send()}
                aria-label={t('chat.send')}
                disabled={!input.trim() || loading}
                className={cn(
                  'flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full transition-all duration-300',
                  leftPanelOpen && 'max-[639px]:hidden',
                  input.trim()
                    ? 'bg-accent text-[#0f0b08] hover:scale-105 shadow-[0_0_8px_rgba(212,149,106,0.4)]'
                    : 'bg-white/[0.04] text-text-muted cursor-not-allowed'
                )}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Show badge if there are prior messages */}
        {hasMessages && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            type="button"
            onClick={() => setExpanded(true)}
            aria-label={t('chat.open')}
            className="absolute -left-2 -top-2 flex min-h-7 min-w-7 items-center justify-center rounded-full border border-[#0f0b08] bg-accent text-[9px] font-bold text-bg shadow-[0_0_8px_rgba(212,149,106,0.6)]"
          >
            {messages.filter((m) => m.role === 'assistant').length}
          </motion.button>
        )}
      </motion.div>
    );
  }

  // ─── Expanded: sidebar panel ────────────────────────────────────
  return (
    <motion.div
      initial={{ x: 420, opacity: 0, scale: 0.98 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 420, opacity: 0, scale: 0.98 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="glass-strong fixed bottom-4 left-3 right-3 top-[72px] z-[35] flex flex-col overflow-hidden rounded-3xl border border-white/8 bg-bg-surface/95 backdrop-blur-xl shadow-glass-xl sm:left-auto sm:right-4 sm:w-[380px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 bg-white/[0.015]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 border border-accent/35 shadow-[0_0_10px_rgba(212,149,106,0.1)]">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div className="leading-none">
            <p className="flex items-center gap-1.5 text-sm font-bold text-text-primary font-display tracking-tight">
              <span>S.A.F.E AI</span>
              <span className="bg-accent/10 border border-accent/25 rounded-md px-1.5 py-0.5 text-[8px] font-mono font-bold text-accent tracking-wider">AUDIT-GROUNDED</span>
            </p>
            <p className="mt-1 text-[10px] font-mono tracking-widest text-text-muted">
              ASISTEN AUDIT GEOTEKNIK
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label={t('chat.minimize')}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/8 hover:text-text-primary"
          title={t('chat.minimize')}
        >
          <ChevronDown className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-none">
        {/* Help prompt if empty */}
        {messages.length === 0 && (
          <div className="text-center py-10 px-4 space-y-3.5 relative">
            {/* Decorative planetary background glow */}
            <div className="absolute left-1/2 top-12 -translate-x-1/2 h-24 w-24 rounded-full bg-accent/8 blur-2xl pointer-events-none animate-pulse" />
            <div className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 text-accent mb-1 border border-accent/30 shadow-[0_0_15px_rgba(212,149,106,0.15)]">
              <BookOpen className="h-5.5 w-5.5" />
            </div>
            <h4 className="text-xs font-bold text-text-primary tracking-wider uppercase relative z-10">
              {lang === 'en' ? 'Audit-Grounded Risk Assistant' : 'Asisten Berbasis Data Audit'}
            </h4>
            <p className="text-[11px] text-text-secondary leading-relaxed max-w-[280px] mx-auto relative z-10">
              {lang === 'en' 
                ? 'Ask what the score, FS, Vs30, PGA, or flood hazard mean for the location being audited.'
                : 'Tanyakan arti skor, FS, Vs30, PGA, banjir, atau keterbatasan data pada lokasi yang sedang diaudit.'}
            </p>
          </div>
        )}

        {messages.map((m, i) => {
          const isLatest = i === messages.length - 1 && m.role === 'assistant';
          return (
            <MessageBubble
              key={i}
              role={m.role}
              content={m.content}
              citations={m.citations}
              followUps={isLatest ? m.followUps : null}
              onFollowUpClick={(q) => send(q)}
              loading={loading}
            />
          );
        })}

        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-text-muted py-1 pl-1">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: '120ms' }} />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" style={{ animationDelay: '240ms' }} />
            </span>
            <span className="font-mono text-[10px] tracking-wider uppercase text-accent/80">
              {lang === 'en' ? 'CHECKING AUDIT DATA...' : 'MEMERIKSA DATA AUDIT...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts — show only if no messages yet */}
      {!hasMessages && (
        <div className="border-t border-white/8 px-5 py-3.5 bg-white/[0.01] space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            {t('chat.suggestions')}
          </p>
          <div className="flex flex-wrap gap-2">
            {(lang === 'en' ? SUGGESTED_PROMPTS_EN : SUGGESTED_PROMPTS_ID).slice(0, 4).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => send(s)}
                className="min-h-[44px] rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2 text-left text-[10px] leading-normal text-text-secondary shadow-sm transition-all duration-300 hover:scale-[1.01] hover:border-accent/40 hover:bg-accent/[0.03] hover:text-accent"
              >
                <span className="text-accent/60 select-none text-[8px]">✦</span>
                <span>{s}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-white/8 p-4 bg-white/[0.015]">
        <div className="rounded-[16px] border border-white/8 p-0.5 bg-bg/40 shadow-inner">
          <div className="relative flex flex-col rounded-[13px] border border-white/6 bg-white/[0.02]">
            <div className="overflow-y-auto" style={{ maxHeight: `${MAX_HEIGHT}px` }}>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); adjustHeight(); }}
                  onKeyDown={handleKeyDown}
                  aria-label={t('chat.placeholder')}
                  className="w-full resize-none rounded-[13px] rounded-b-none border-none bg-transparent px-4 py-3.5 text-xs leading-[1.4] text-text-primary placeholder:text-transparent focus:outline-none"
                  rows={1}
                />
                {!input && (
                  <div className="pointer-events-none absolute inset-x-4 top-3.5 overflow-hidden">
                    <AnimatedPlaceholder />
                  </div>
                )}
              </div>
            </div>

            <div className="flex h-9.5 items-center justify-between rounded-b-[13px] bg-white/[0.02] border-t border-white/4 px-3.5">
              <span className="inline-flex items-center gap-1 rounded bg-accent/8 border border-accent/15 px-2 py-0.5 text-[9px] font-mono text-accent tracking-widest select-none">
                ● {mode === 'battle' ? (lang === 'en' ? 'BATTLE MODE' : 'MODE BANDINGKAN') : (lang === 'en' ? 'AUDIT MODE' : 'MODE AUDIT')}
              </span>

              <button
                type="button"
                onClick={() => send()}
                aria-label={t('chat.send')}
                disabled={!input.trim() || loading}
                className={cn(
                  'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-all duration-300',
                  input.trim()
                    ? 'bg-accent text-[#0f0b08] hover:scale-105 shadow-[0_0_10px_rgba(212,149,106,0.5)]'
                    : 'bg-white/[0.04] text-text-muted cursor-not-allowed'
                )}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────
function MessageBubble({ role, content, citations, followUps, onFollowUpClick, loading }) {
  const t = useT();
  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed relative overflow-hidden shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-accent/15 to-accent/[0.03] text-text-primary font-medium border border-accent/25 rounded-tr-sm'
            : 'border border-white/8 bg-white/[0.015] text-text-secondary rounded-tl-sm'
        )}
      >
        {!isUser && (
          /* Decorative micro-grid for geophysics theme */
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: 'radial-gradient(rgba(212,149,106,0.15) 1px, transparent 1px)',
            backgroundSize: '12px 12px'
          }} />
        )}
        
        <div className="relative z-10">
          {isUser ? (
            content
          ) : (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => (
                    <strong className="text-text-primary font-bold">{children}</strong>
                  ),
                  code: ({ children }) => (
                    <code className="rounded bg-bg/35 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                      {children}
                    </code>
                  ),
                  ul: ({ children }) => <ul className="ml-3 list-disc my-1.5 space-y-1">{children}</ul>,
                  li: ({ children }) => <li className="mb-0.5">{children}</li>,
                }}
              >
                {content}
              </ReactMarkdown>

              {/* Sources actually available in the current audit */}
              {citations && citations.length > 0 && (
                <div className="mt-3 border-t border-white/8 pt-2.5 flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-accent tracking-[0.15em] uppercase select-none">
                    {t('chat.sources')} ({citations.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {citations.map((c, idx) => (
                      <span
                        key={idx}
                        title={`${c.title} (${c.category})`}
                        className="inline-flex items-center gap-1.5 bg-accent/8 border border-accent/20 rounded-lg px-2 py-0.5 text-[8.5px] text-accent font-mono hover:bg-accent/15 transition-all shadow-sm"
                      >
                        <FileText className="h-2.5 w-2.5 shrink-0 text-accent/80" />
                        <span className="max-w-[140px] truncate">{c.title}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dynamic Follow-up Questions */}
      {!isUser && followUps && followUps.length > 0 && (
        <div className="max-w-[85%] flex flex-col gap-1.5 mt-1.5 pl-1">
          <p className="text-[9px] font-bold tracking-[0.15em] text-accent uppercase select-none">
            {t('chat.followUps')}:
          </p>
          <div className="flex flex-col gap-1.5">
            {followUps.map((q, idx) => (
              <button
                key={idx}
                onClick={() => !loading && onFollowUpClick(q)}
                disabled={loading}
                aria-label={q}
                className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-white/6 bg-white/[0.01] px-3.5 py-2 text-left text-[10px] text-text-secondary shadow-sm transition-all duration-300 hover:translate-x-0.5 hover:border-accent/40 hover:bg-accent/[0.03] hover:text-accent cursor-pointer"
              >
                <span className="flex-1 pr-2">{q}</span>
                <span className="text-accent text-xs font-bold leading-none select-none">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
