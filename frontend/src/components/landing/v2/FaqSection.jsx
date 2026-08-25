import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useLpInView } from '../../../hooks/useLpMotion';
import { SectionHeader } from './atoms';

/**
 * FAQ, treatment minimal ala Figma (tanpa kartu kaca besar).
 * Accordion custom ringan (height auto-animate via framer), keyboard
 * accessible (button + aria-expanded + aria-controls), target sentuh >=44px.
 */
export default function FaqSection({ t }) {
  const { rootRef, inView } = useLpInView({ threshold: 0.15 });
  const [open, setOpen] = useState(0);

  const items = [1, 2, 3, 4, 5, 6];

  return (
    <section id="faq" ref={rootRef} className="lp-section relative pb-16 md:pb-24" aria-labelledby="faq-title">
      <div className="lp-container grid gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] md:gap-16">
        <div className="md:sticky md:top-28 md:self-start">
          <SectionHeader
            eyebrow={t('faqEyebrow')}
            title={t('faqTitle')} titleId="faq-title"
            lead={t('faqLead')}
          />
        </div>

        <div className="flex flex-col">
          {items.map((n, i) => {
            const isOpen = open === i;
            return (
              <div
                key={n}
                className={`lp-faq-item ${inView ? 'lp-in' : 'lp-reveal'}`}
                style={{ '--lp-delay': `${i * 70}ms` }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${n}`}
                  id={`faq-button-${n}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex min-h-[56px] w-full items-center justify-between gap-4 py-4 text-left"
                >
                  <span className={`text-[1rem] font-semibold leading-snug transition-colors duration-300 ${isOpen ? 'text-[color:var(--lp-mocha)]' : 'text-[color:var(--lp-umber)]'}`}>
                    {t(`faqQ${n}`)}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                      isOpen
                        ? 'border-[color:var(--lp-copper-deep)] bg-[color:var(--lp-well)] text-[color:var(--lp-copper-deep)]'
                        : 'border-[color:var(--lp-line)] text-[color:var(--lp-clay)]'
                    }`}
                    aria-hidden="true"
                  >
                    <Plus size={14} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="content"
                      id={`faq-panel-${n}`}
                      role="region"
                      aria-labelledby={`faq-button-${n}`}
                      initial={{ height: 0, opacity: 0, y: 8 }}
                      animate={{ height: 'auto', opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: 8 }}
                      transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[68ch] pb-6 pr-8 text-[0.92rem] leading-[1.8] text-[color:var(--lp-clay)]">
                        {t(`faqA${n}`)}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
