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
    question: "What makes Chabaqa different from other community platforms?", 
    answer: "Chabaqa is an all-in-one community platform built for creators, coaches, and educators who want to grow and monetize their audience in one place. It gives you the tools to create and sell online courses, run interactive challenges, offer one-on-one coaching, host virtual events, and deliver digital products — all from a single, integrated system. Unlike fragmented solutions, Chabaqa removes the need for multiple subscriptions or complicated integrations, so you can focus on building a strong, engaged community.", 
    category: "General"
  }, 
  { 
    question: "How do I create a community on Chabaqa?", 
    answer: "After signing up at chabaqa.io, click the 'Create New Community' button, add your community name and description, customize colors, banners, and logo, and select features for your landing page (sales page). Generate an 'Invite Link' to share anywhere; anyone who clicks can join instantly. It's simple, fast, and fully branded from day one.", 
    category: "Getting Started"
  }, 
  { 
    question: "Is Chabaqa only for creating online courses?", 
    answer: "No, Chabaqa is a complete all-in-one community platform that lets you build interactive spaces where you engage directly with your students and audience. Beyond courses (with quizzes, certificates, and progress tracking), you can run paid challenges with leaderboards, sell digital products like templates and ebooks, offer 1:1 coaching sessions with calendar booking, and host live events with ticketing—all within the same community dashboard.", 
    category: "Features"
  }, 
  { 
    question: "How will Chabaqa help me interact more with my students and community members?", 
    answer: "Chabaqa gives you powerful built-in tools to stay connected beyond just courses. Use one dashboard with automated email sequences, WhatsApp messages, direct messages (DMs), and community feeds to nurture relationships effortlessly. Post updates that spark discussions, send targeted WhatsApp reminders for live events and challenges, trigger personalized emails (e.g., 'Complete Lesson 2!'), and chat 1:1 via member profiles. Live Q&A sessions, member questions for deeper insights, activity feeds showing who's active, plus push notifications keep engagement high—all automated to attract and retain students without extra apps. Analytics track opens, clicks, and responses so you can focus on teaching, not chasing.",     
    category: "Engagement"
  }, 
  { 
    question: "How can users book a 1:1 coaching session on Chabaqa?", 
    answer: "Users simply navigate to the '1:1 Sessions' section in your community where they'll see your pre-set availability calendar with open slots you've already configured (e.g., Tue/Thu 2-5 PM). They select a date and time, complete booking by answering any custom questions, and if priced, make secure payment. Once booked, that slot auto-blocks on your calendar, and the user instantly receives a confirmation plus a direct meeting link (Zoom/Jitsi/Google Meet) via DM in the platform or email. You get notified too, with easy reschedule and cancel options. No extra tools needed—seamless from your dashboard.", 
    category: "Coaching"
  }, 
  { 
    question: "What is the difference between Courses and Challenges on Chabaqa?", 
    answer: "Courses are long-term learning resources that remain permanently available inside the community for all members, whether new or existing. They are designed for flexible, self-paced learning. Challenges, on the other hand, are intensive and highly-structured learning experiences built to maximize engagement and results within a specific timeframe. For example, a 7-day PHP challenge includes daily checkpoints where participants complete lessons through videos, files, or live sessions. By the end of the challenge, students are expected to fully understand the topic. Challenges are time-limited, have restricted enrollment, may include leaderboards and rewards, and require consistent progress to stay active.", 
    category: "Features"
  }, 
  { 
    question: "How can I create and manage events on Chabaqa?", 
    answer: "Chabaqa's Events feature lets you sell tickets for online or offline events directly in your community. For online events, buyers get an instant meeting link (Zoom/Jitsi); for offline events, they see full details on the event sales page including venue, date, ticket types (like VIP or normal), seat numbers, and multiple price options. After purchase, creators can track sales, RSVPs, and attendance seamlessly with name, email, phone, and ID confirmation.", 
    category: "Events"
  },
  { 
    question: "How much does Chabaqa cost? What are the pricing plans?", 
    answer: "Chabaqa offers flexible pricing plans to suit creators at every stage. We have a free plan to get started, plus premium plans with advanced features like unlimited courses, custom branding, priority support, and lower transaction fees. Visit our pricing page to see detailed plan comparisons and choose the best option for your community size and goals.", 
    category: "Pricing"
  },
  { 
    question: "Can I use Chabaqa if I'm based in Tunisia or the MENA region?", 
    answer: "Absolutely! Chabaqa was built with creators in Tunisia and the MENA region in mind. We support multiple languages including English, Arabic, and French. Our payment processing works with local payment methods, and we understand the unique needs of creators in the region. Whether you're in Tunis, Sfax, or anywhere in the Arab world, Chabaqa is designed to help you succeed.", 
    category: "Regional"
  },
  { 
    question: "How do I monetize my community on Chabaqa?", 
    answer: "Chabaqa provides multiple monetization options: sell online courses with one-time or subscription pricing, offer paid challenges with enrollment fees, charge for 1:1 coaching sessions, sell event tickets for virtual or in-person events, and sell digital products like ebooks, templates, or resources. You can also create membership tiers with different access levels and pricing. All payments are processed securely, and you receive payouts directly to your account.", 
    category: "Monetization"
  },
  { 
    question: "Is Chabaqa suitable for coaches, educators, and fitness trainers?", 
    answer: "Yes! Chabaqa is perfect for coaches, educators, fitness trainers, consultants, and any creator who wants to build and monetize a community. Whether you're teaching yoga, offering business coaching, running a fitness challenge, or teaching programming, Chabaqa provides all the tools you need: course creation, live sessions, challenges with progress tracking, 1:1 booking, and community engagement features.", 
    category: "Use Cases"
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <>
      <div id="faq" className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to know about Chabaqa - the all-in-one community platform for creators, coaches, and educators. Learn about features, pricing, and how to build and monetize your community.
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
