import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

import { Section } from "@/components/layout/Section"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "How does the audit process work?",
    answer:
      "Convertly crawls your website starting from your homepage to map out your key conversion funnels. We analyze metadata, semantic elements, layouts, and CTAs. For modern JavaScript-heavy frameworks (React, Next.js, Vue), our headless rendering bot executes the JavaScript and waits for full DOM hydration to ensure accurate analysis.",
  },
  {
    question: "What makes the V4 scoring engine different?",
    answer:
      "The V4 scoring engine uses advanced heuristics to classify the specific intent of each page (e.g., Transactional, Information, Lead Gen) and applies target rule packs. It calculates multi-dimensional score pillars (Conversion, Trust, UX, Mobile, Quality) with smart mitigations like family repeating deductions and penalty clustering to give you a realistic growth potential index.",
  },
  {
    question: "Can I download and share audit reports?",
    answer:
      "Yes, absolutely. Every completed audit report comes with an export engine. You can instantly generate and download print-ready, high-fidelity PDF summaries of your score explainers, opportunities, and action checklists to share with your design and engineering teams.",
  },
  {
    question: "Can I customize the auditing rules?",
    answer:
      "Yes. In our Enterprise package, growth teams can define custom compliance rules, adjust category weighting, ignore specific selectors, and write tailor-made audits targeting company branding guidelines.",
  },
  {
    question: "Is crawling my site safe for performance?",
    answer:
      "Yes. Convertly runs lightweight, asynchronous crawls that respect standard crawl rate limits. The bot does not submit forms, execute actions, or create garbage data, guaranteeing zero performance impact on your live production traffic.",
  },
]

function FaqItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[color-mix(in_srgb,var(--border)_55%,transparent)] py-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left font-medium text-foreground/90 transition-colors hover:text-foreground focus:outline-none"
      >
        <span className="text-sm sm:text-base">{question}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-foreground/50 transition-transform duration-300",
            isOpen && "rotate-180 text-[var(--accent)]"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-2 text-sm leading-6 text-foreground/70 max-w-[70ch]">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <Section aria-labelledby="faq-title" containerClassName="marketing-container">
      <div className="marketing-section-stack">
        <SectionHeader
          eyebrow="FAQ"
          title="Frequently asked questions"
          titleId="faq-title"
          description="Everything you need to know about Convertly crawls, scoring logic, and funnels."
        />

        <div className="mx-auto w-full max-w-3xl mt-4 bg-[color-mix(in_srgb,var(--surface)_50%,transparent)] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] rounded-[var(--radius-lg)] p-5 sm:p-8 shadow-[var(--shadow-soft)]">
          {faqs.map((faq, index) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </Section>
  )
}

export { FaqSection }
