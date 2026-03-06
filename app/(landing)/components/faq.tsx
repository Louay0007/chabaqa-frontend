"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useTranslations } from "next-intl"

interface FAQItem {
  question: string
  answer: string
  category?: string
}

export function FAQ() {
  const t = useTranslations("landing.faq")
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const faqData = t.raw("items") as FAQItem[]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <>
      <div id="faq" className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t("title")}
            </h1>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-3xl mx-auto">
              {t("subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md"
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-chabaqa-primary focus:ring-offset-2 rounded-xl"
                  aria-expanded={openIndex === index}
                >
                  <span className="text-base md:text-lg font-semibold text-gray-900 pr-4" itemProp="name">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-chabaqa-primary flex-shrink-0 transition-transform duration-200 ${
                      openIndex === index ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === index ? "max-h-[500px]" : "max-h-0"
                  }`}
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <div className="px-6 pb-5 pt-3 text-sm md:text-base text-gray-600 leading-relaxed" itemProp="text">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">{t("stillHaveQuestions")}</p>
            <a
              href="mailto:contactchabaqa@gmail.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-chabaqa-primary text-white font-semibold rounded-lg hover:bg-chabaqa-primary/90 transition-colors duration-200"
            >
              {t("contactSupport")}
            </a>
          </div>
        </div>
      </div>

      {/* JSON-LD Structured Data for FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })
        }}
      />
    </>
  )
}
