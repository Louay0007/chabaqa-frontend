"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface FAQItem {
  question: string
  answer: string
  category?: string
}

const faqData: FAQItem[] = [
  { 
    question: "What makes Chabaqa different?", 
    answer: "Chabaqa is an all-in-one community platform built for creators, coaches, and educators who want to grow and monetize their audience in one place. It gives you the tools to create and sell online courses, run interactive challenges, offer one-on-one coaching, host virtual events, and deliver digital products — all from a single, integrated system. Unlike fragmented solutions, Chabaqa removes the need for multiple subscriptions or complicated integrations, so you can focus on building a strong, engaged community.", 
  }, 
  { 
    question: "How do I create community in Chabaqa?", 
    answer: "After signing up at chabaqa.io, hit 'Create New Community' button—add name, description, customize colors/banners/logo, and select features for your landing page (sales page). Generate 'Invite Link' button to share anywhere; anyone clicks to join instantly. Simple, fast, fully branded from day one", 
  }, 
  { 
    question: "Is Chabaqa only for creating online courses?", 
    answer: "No, Chabaqa is a complete all-in-one community platform that lets you build interactive spaces where you engage directly with your students and audience. Beyond courses (with quizzes, certificates, and progress tracking), you can run paid challenges with leaderboards, sell digital products like templates/ebooks/templates, offer 1:1 coaching sessions with calendar booking, and host live events with ticketing all within the same community dashboard..", 
  }, 
  { 
    question: "How will Chabaqa help me interact more with my students?", 
    answer: "Chabaqa gives you powerful built-in tools to stay connected beyond just courses one dashboard with automated email sequences, WhatsApp messages, direct messages (DMs), and community feeds to nurture relationships effortlessly.Post updates that spark discussions, send targeted WhatsApp reminders for live events/challenges, trigger personalized emails (e.g., 'Complete Lesson 2!'), and chat 1:1 via member profiles. Live Q&A sessions, member request questions for deeper insights, activity feeds showing who's active, plus push notifications keep engagement high all automated to attract/retain students without extra apps. Analytics track opens/clicks/responses so you focus on teaching, not chasing.",     
  }, 
  { 
    question: "How can users book a 1:1 session on Chabaqa?", 
    answer: "Users simply navigate to the '1:1 Sessions' section in your community they'll see your pre-set availability calendar with open slots you've already configured (e.g., Tue/Thu 2-5 PM). They select a date/time, complete booking (answer any custom questions), and if priced, make secure payment.Once booked, that slot auto-blocks on your calendar, and the user instantly receives a confirmation plus a direct meeting link (Zoom/Jitsi/Google Meet) via DM in the platform or email. You get notified too, with easy reschedule/cancel options. No extra tools needed seamless from your dashboard", 
  }, 
  { 
    question: "What is the difference between Courses and Challenges?", 
    answer: "Courses are long-term learning resources that remain permanently available inside the community for all members, whether new or existing. They are designed for flexible, self-paced learning.Challenges, on the other hand, are intensive and highlystructured learning experiences built to maximize engagement and results within a specific timeframe. For example, a 7-day PHP challenge includes daily checkpoints where participants complete lessons through videos, files, or live sessions. By the end of the challenge, students are expected to fully understand the topic. Challenges are timelimited, have restricted enrollment, may include leaderboards and rewards, and require consistent progress to stay active.", 
  }, 
  { 
    question: "How can I create an event in Chabaqa?", 
    answer: "Chabaqa's Events feature lets you sell tickets for online or offline events directly in your community. For online events, buyers get an instant meeting link (Zoom/Jitsi); for offline, they see full details on the event sales page (venue, date, ticket types like VIP/normal, seat numbers, multiple prices) after that Creator can track sales, RSVPs, and attendance seamlessly (name/email/phone/ID confirmation) .", 
  }, 
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <>
      <div id="faq" className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions About Chabaqa
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about Chabaqa's community platform, features, pricing, and how to build and monetize your creator business
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
            <p className="text-gray-600 mb-4">Still have questions about Chabaqa?</p>
            <a
              href="mailto:contactchabaqa@gmail.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-chabaqa-primary text-white font-semibold rounded-lg hover:bg-chabaqa-primary/90 transition-colors duration-200"
            >
              Contact Our Support Team
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
