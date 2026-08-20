import { motion } from "framer-motion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem } from "../ui/accordion";

export default function FAQSection({ t }) {
  const faqItems = [
    {
      id: "faq-1",
      question: t("faqQ1", "Apa itu S.A.F.E House?"),
      answer: t(
        "faqA1",
        "S.A.F.E House (Seismic Analysis for Foundation Evaluation) adalah platform audit geospasial berbasis AI untuk menganalisis risiko kebencanaan properti secara cepat dan akurat di Indonesia."
      ),
    },
    {
      id: "faq-2",
      question: t("faqQ2", "Dari mana asal data kerawanan bencana di sistem ini?"),
      answer: t(
        "faqA2",
        "Kami menarik data mikro geospasial secara real-time dari institusi resmi Indonesia dan dunia, termasuk data InaRISK BNPB (banjir/kebencanaan), PVMBG (zonasi sesar aktif & KRB gunung api), BMKG (PGA & parameter seismik), serta katalog gempa USGS."
      ),
    },
    {
      id: "faq-3",
      question: t("faqQ3", "Apakah laporan audit AI ini 100% akurat?"),
      answer: t(
        "faqA3",
        "Analisis awal ini merupakan penaksiran cepat berbasis data spasial publik. Hasil analisis ini tidak menggantikan uji tanah laboratorium (sondir/SPT) atau survei langsung insinyur geoteknik di lapangan."
      ),
    },
    {
      id: "faq-4",
      question: t("faqQ4", "Bagaimana cara kerja simulasi PGA dan gempa di peta?"),
      answer: t(
        "faqA4",
        "Pengguna dapat memilih titik koordinat apa saja di Indonesia. Sistem akan menghitung percepatan tanah (PGA) berdasarkan model redaman gempa, memperkirakan respon seismik lokal (Vs30), dan menganalisis potensi likuefaksi asinkron secara langsung."
      ),
    },
    {
      id: "faq-5",
      question: t("faqQ5", "Apakah riwayat pencarian lokasi saya aman?"),
      answer: t(
        "faqA5",
        "Ya. Semua koordinat dan histori pencarian properti disimpan secara lokal di dalam local storage peramban Anda. Kami tidak menyimpan histori pencarian Anda di server kami untuk menjamin kerahasiaan kepemilikan aset properti Anda."
      ),
    },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] },
    },
  };

  return (
    <section className="relative w-full py-16 px-4 md:px-12 lg:px-20 bg-background border-t border-border overflow-hidden select-none landing-grid-decor sm:py-20 md:py-24">
      {/* Background rotating lines for tectonic compass */}
      <div className="absolute right-[-80px] bottom-[-80px] w-80 h-80 opacity-[0.02] pointer-events-none animate-slow-rotate z-0">
        <svg className="w-full h-full text-accent" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="50" cy="50" r="40" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Title */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="mb-10 text-center sm:mb-16"
        >
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-accent uppercase font-body mb-4 block">
            FAQ
          </span>
          <h2 className="font-display text-3xl md:text-4xl text-foreground font-light leading-snug">
            {t("faqHeading", "Pertanyaan yang Sering Diajukan")}
          </h2>
          <p className="mt-4 text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed font-body">
            {t(
              "faqSub",
              "Temukan jawaban cepat atas pertanyaan seputar audit geologi, data spasial, dan batasan analisis risiko S.A.F.E House."
            )}
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="w-full"
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item) => (
              <AccordionItem
                value={item.id}
                key={item.id}
                className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-1 shadow-[0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all duration-300 hover:border-accent/15 hover:bg-white/[0.04] sm:px-6"
              >
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger className="flex min-h-[52px] flex-1 items-center justify-between gap-3 py-4 text-left text-[14px] font-semibold leading-6 text-text-primary transition-all duration-200 hover:text-accent sm:text-[15px] [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 [&[data-state=open]>svg]:rotate-180">
                    {item.question}
                    <Plus
                      size={16}
                      strokeWidth={2}
                      className="shrink-0 opacity-60 text-accent transition-transform duration-200"
                      aria-hidden="true"
                    />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionContent className="pb-4 pt-1 text-xs md:text-sm text-text-secondary leading-relaxed font-body">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
