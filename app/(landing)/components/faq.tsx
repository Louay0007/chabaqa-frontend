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
    question: "What is Chabaqa and how does it help creators?",
    answer: "Chabaqa is an all-in-one community platform designed specifically for creators, coaches, and educators. It empowers you to build, manage, and monetize your community through integrated tools including online courses, interactive challenges, one-on-one coaching sessions, virtual events, and digital product sales. Unlike other platforms, Chabaqa provides everything you need in one place, eliminating the need for multiple subscriptions and complex integrations.",
    category: "Platform"
  },
  {
    question: "How can I monetize my content and community on Chabaqa?",
    answer: "Chabaqa offers multiple revenue streams to maximize your earning potential: sell premium online courses with video lessons and certificates, offer paid challenges with progress tracking, provide one-on-one coaching sessions at your own rates, host paid virtual events and workshops, sell digital products like ebooks and templates, and create membership tiers with recurring revenue. You set your own pricing and keep the majority of your earnings with transparent, creator-friendly fees.",
    category: "Monetization"
  },
  {
    question: "What features does Chabaqa offer for building and managing communities?",
    answer: "Chabaqa provides comprehensive community management tools including dedicated community spaces for discussions and networking, member management with roles and permissions, content creation tools for posts and updates, real-time analytics dashboard to track engagement and growth, integrated payment processing with multiple currencies, automated email notifications and reminders, mobile-responsive design for access anywhere, and engagement features like challenges, leaderboards, and badges to keep members active.",
    category: "Features"
  },
  {
    question: "Is Chabaqa suitable for beginners with no technical experience?",
    answer: "Absolutely! Chabaqa is designed with user-friendliness as a priority. Our intuitive interface requires no coding or technical skills. Whether you're launching your first online course or building your first community, our step-by-step onboarding process, comprehensive documentation, video tutorials, and responsive customer support team will guide you every step of the way. You can have your community up and running in minutes, not days.",
    category: "Getting Started"
  },
  {
    question: "How do I create and sell online courses on Chabaqa?",
    answer: "Creating courses on Chabaqa is straightforward: upload video lessons, PDFs, and other materials; organize content into logical modules and lessons; add quizzes and assignments to reinforce learning; set pricing (one-time payment or subscription); track student progress with built-in analytics; engage with students through comments and discussions; issue certificates upon completion; and offer course bundles for increased value. Our course builder is intuitive and supports various content formats.",
    category: "Courses"
  },
  {
    question: "What are Chabaqa Challenges and how do they increase engagement?",
    answer: "Challenges are time-bound, goal-oriented activities that drive community engagement and help members achieve results. Create fitness challenges with daily check-ins, learning sprints with progress milestones, creative contests with submissions, habit-building challenges with streak tracking, or team competitions with leaderboards. Challenges include progress tracking, social sharing features, automated reminders, achievement badges, and community support forums. They're proven to increase member retention and satisfaction.",
    category: "Challenges"
  },
  {
    question: "Can I schedule and manage one-on-one coaching sessions through Chabaqa?",
    answer: "Yes! Our integrated coaching feature allows you to offer personalized sessions seamlessly. Set your availability with calendar integration, define session types and durations, set individual pricing for different services, allow members to book directly through the platform, receive automated booking confirmations and reminders, conduct sessions via integrated video calls or external tools, take session notes for continuity, and collect payments automatically. It's a complete coaching management system.",
    category: "Coaching"
  },
  {
    question: "How does payment processing work and when do I get paid?",
    answer: "Chabaqa handles all payment processing securely through industry-leading payment gateways. We support major credit cards, debit cards, and digital wallets; process payments in multiple currencies; provide automatic invoicing and receipts; offer flexible payout schedules (weekly, bi-weekly, or monthly); give detailed transaction reports and analytics; handle refunds and disputes; and ensure PCI-DSS compliance for security. You'll receive payouts directly to your bank account on your chosen schedule.",
    category: "Payments"
  },
  {
    question: "Can I host live virtual events, webinars, and workshops on Chabaqa?",
    answer: "Yes! Chabaqa's event management system lets you create and promote events, manage registrations and ticket sales, send automated reminders to attendees, host live or pre-recorded sessions, enable Q&A and polls during events, create breakout rooms for networking, share resources and materials, record sessions for replay, and collect feedback post-event. Perfect for webinars, workshops, masterclasses, networking events, and community meetups.",
    category: "Events"
  },
  {
    question: "What analytics and insights does Chabaqa provide to grow my business?",
    answer: "Our comprehensive analytics dashboard gives you actionable insights: member growth and retention metrics, revenue tracking and forecasting, content performance analytics, engagement rates and patterns, course completion rates, challenge participation statistics, session booking trends, traffic sources and conversion rates, and member demographics and behavior. Use these insights to make data-driven decisions, optimize your content, and grow your community strategically.",
    category: "Analytics"
  },
  {
    question: "Is Chabaqa accessible on mobile devices and tablets?",
    answer: "Yes! Chabaqa is fully responsive and optimized for all devices. Members can access your community, courses, challenges, and content from any smartphone, tablet, or desktop browser. The mobile experience includes full functionality with touch-optimized navigation, fast loading times, offline content access for courses, push notifications for updates, mobile-friendly video playback, and easy payment processing. No separate app download required - it works seamlessly in any modern browser.",
    category: "Accessibility"
  },
  {
    question: "How do I get started with Chabaqa and what are the pricing plans?",
    answer: "Getting started is simple: sign up for a free account at chabaqa.com, complete your creator profile with bio and branding, create your first community space, add your first course, challenge, or content, invite your initial members, and start growing! We offer flexible pricing plans including a free tier to get started, creator plans with advanced features, pro plans for established creators, and enterprise solutions for large organizations. All plans include core features with transparent pricing and no hidden fees.",
    category: "Getting Started"
  }
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
