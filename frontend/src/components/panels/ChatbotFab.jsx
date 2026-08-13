import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Sparkles, ChevronDown, Upload, FileText, X, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useTranslation';
import { callAI } from '../../services/engine';
import { SUGGESTED_PROMPTS_ID, SUGGESTED_PROMPTS_EN } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { SAFE_AI_SYSTEM_PROMPT } from '../../lib/aiPrompts';
import { queryRAG } from '../../lib/ragEngine';

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
    "Cek risiko likuifaksi area ini...",
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

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const expanded = useAppStore((s) => s.chatExpanded);
  const setExpanded = useAppStore((s) => s.setChatExpanded);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea();
  const messagesEndRef = useRef(null);

  const lang = useAppStore((s) => s.lang);
  const hasMessages = messages.length > 0;

  // Build base system prompt with site data + conversation context
  const sysPrompt = SAFE_AI_SYSTEM_PROMPT(propertyA, propertyB, mode, lang, messages);

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

    // ── RAG Step: Query main static knowledge base ──
    const { contextString, citations } = queryRAG(userMsg, [], 2);

    let finalPrompt = sysPrompt;
    if (contextString) {
      finalPrompt += `\n\n══ DOKUMEN PENDUKUNG (RAG CONTEXT) ══\nBerikut adalah kutipan dokumen geologi & rekayasa sipil yang relevan dengan pertanyaan user. Gunakan fakta di bawah ini untuk merumuskan jawaban audit & rekomendasi mitigasi yang akurat:\n\n${contextString}\n\nInstruksi RAG: Sebutkan rincian biaya atau standar teknis yang dikutip dari dokumen di atas jika relevan dengan keluhan/pertanyaan user. Jawab dengan menyakinkan.`;
    }

    try {
      const reply = await callAI(finalPrompt, userMsg);
      let cleanReply = reply;
      let followUps = [];
      const followUpIndex = reply.indexOf('[PERTANYAAN LANJUTAN]');
      if (followUpIndex !== -1) {
        cleanReply = reply.substring(0, followUpIndex).trim();
        const followUpText = reply.substring(followUpIndex + '[PERTANYAAN LANJUTAN]'.length).trim();
        followUps = followUpText
          .split('\n')
          .map(line => line.replace(/^\d+[\.\s]*/, '').trim())
          .filter(line => line.length > 0)
          .slice(0, 3);
      }
      setMessages((m) => [...m, { role: 'assistant', content: cleanReply, citations, followUps }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: lang === 'en' ? '❌ AI unavailable — please retry.' : '❌ Layanan AI tidak tersedia — silakan coba kembali.' }]);
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
        className="fixed bottom-5 right-5 z-[35] w-[340px]"
      >
        <div className="bezel-outer">
          <div className="bezel-inner relative overflow-hidden bg-bg-surface/90 backdrop-blur-xl border border-white/8 shadow-glass-lg rounded-2xl">
            {/* Glow */}
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent/8 blur-xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 h-16 w-16 rounded-full bg-accent/4 blur-xl pointer-events-none" />
            
            {/* Single-row layout: icon + input + send */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 relative z-10">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 hover:bg-accent/25 hover:scale-[1.03] transition-all cursor-pointer shadow-[0_0_8px_rgba(212,149,106,0.1)]"
                title="Buka Chatbot"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
              </button>

              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
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
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 cursor-pointer',
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
            onClick={() => setExpanded(true)}
            className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-bg shadow-[0_0_8px_rgba(212,149,106,0.6)] border border-[#0f0b08] cursor-pointer"
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
      className="glass-strong fixed bottom-4 right-4 top-[72px] z-[35] flex w-[380px] flex-col overflow-hidden rounded-3xl border border-white/8 bg-bg-surface/95 backdrop-blur-xl shadow-glass-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 bg-white/[0.015]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 border border-accent/35 shadow-[0_0_10px_rgba(212,149,106,0.1)]">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-bold bg-gradient-to-r from-accent via-[#f0e4cc] to-accent bg-clip-text text-transparent flex items-center gap-1.5 font-display tracking-tight">
              <span>Geo-AI Consult</span>
              <span className="bg-accent/10 border border-accent/25 rounded-md px-1.5 py-0.5 text-[8px] font-mono font-bold text-accent tracking-wider">RAG ACTIVE</span>
            </p>
            <p className="mt-1 text-[8px] font-mono tracking-widest text-text-muted">
              S.A.F.E HOUSE
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-white/8 hover:text-text-primary transition-colors cursor-pointer"
          title="Minimize"
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
              {lang === 'en' ? 'Retrieval-Augmented Chatbot (RAG)' : 'Chatbot Berbasis RAG Kebencanaan'}
            </h4>
            <p className="text-[11px] text-text-secondary leading-relaxed max-w-[280px] mx-auto relative z-10">
              {lang === 'en' 
                ? 'Ask about geological hazards (SNI, liquefaction, landslides, floods) or compare risks between two properties in Battle Mode!' 
                : 'Tanyakan risiko geologi (SNI, likuifaksi, longsor, banjir) properti yang sedang Anda lihat, atau bandingkan dua properti langsung di Mode Bandingkan!'}
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
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '120ms' }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '240ms' }} />
            </span>
            <span className="font-mono text-[9px] tracking-wider uppercase text-accent/80">
              {lang === 'en' ? "🔍 RAG: CITING GEOHAZARD DB..." : "🔍 RAG: MENSITASI DATABASE KEBENCANAAN..."}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts — show only if no messages yet */}
      {!hasMessages && (
        <div className="border-t border-white/8 px-5 py-3.5 bg-white/[0.01] space-y-2">
          <p className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
            {t('chat.suggestions')}
          </p>
          <div className="flex flex-wrap gap-2">
            {(lang === 'en' ? SUGGESTED_PROMPTS_EN : SUGGESTED_PROMPTS_ID).slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2 text-[10px] text-text-secondary hover:border-accent/40 hover:bg-accent/[0.03] hover:text-accent hover:scale-[1.01] transition-all duration-300 flex items-center gap-1.5 shadow-sm text-left leading-normal cursor-pointer"
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
              <span className="inline-flex items-center gap-1 rounded bg-accent/8 border border-accent/15 px-2 py-0.5 text-[8px] font-mono text-accent tracking-widest select-none">
                ● {mode === 'battle' ? (lang === 'en' ? 'BATTLE MODE' : 'MODE BANDINGKAN') : (lang === 'en' ? 'AUDIT MODE' : 'MODE AUDIT')}
              </span>

              <button
                type="button"
                onClick={() => send()}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 cursor-pointer',
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
                    <code className="rounded bg-black/35 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                      {children}
                    </code>
                  ),
                  ul: ({ children }) => <ul className="ml-3 list-disc my-1.5 space-y-1">{children}</ul>,
                  li: ({ children }) => <li className="mb-0.5">{children}</li>,
                }}
              >
                {content}
              </ReactMarkdown>

              {/* Citations list for RAG */}
              {citations && citations.length > 0 && (
                <div className="mt-3 border-t border-white/8 pt-2.5 flex flex-col gap-1.5">
                  <span className="text-[8px] font-bold text-accent tracking-[0.15em] uppercase select-none">
                    SITASI DOKUMEN RAG ({citations.length}):
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
          <p className="text-[8px] font-bold tracking-[0.15em] text-accent uppercase select-none">
            PERTANYAAN LANJUTAN:
          </p>
          <div className="flex flex-col gap-1.5">
            {followUps.map((q, idx) => (
              <button
                key={idx}
                onClick={() => !loading && onFollowUpClick(q)}
                disabled={loading}
                className="w-full text-left rounded-xl border border-white/6 bg-white/[0.01] px-3.5 py-2 text-[10px] text-text-secondary hover:border-accent/40 hover:bg-accent/[0.03] hover:text-accent hover:translate-x-0.5 transition-all duration-300 flex items-center justify-between shadow-sm cursor-pointer"
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
