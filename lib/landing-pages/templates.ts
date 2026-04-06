import type { PageBlock, PageTemplate, BlockType, BlockStyle, BlockContent } from './types'

// Helper to generate unique IDs
let idCounter = 0
function uid(): string {
  idCounter++
  return `tpl-block-${idCounter}-${Math.random().toString(36).slice(2, 9)}`
}

function makeBlock(
  type: BlockType,
  content: BlockContent,
  style: BlockStyle = {},
  overrides: Partial<PageBlock> = {}
): PageBlock {
  return {
    id: uid(),
    type,
    content,
    style: {
      padding: '48px 24px',
      textAlign: 'center',
      ...style,
    },
    visible: true,
    ...overrides,
  }
}

// ─── Course Sales Page Template ──────────────────────────────────────────────

const courseSalesBlocks: PageBlock[] = [
  makeBlock(
    'header',
    {
      logoUrl: '/images/logo.svg',
      navLinks: [
        { label: 'Features', url: '#features' },
        { label: 'Testimonials', url: '#testimonials' },
        { label: 'Pricing', url: '#pricing' },
        { label: 'FAQ', url: '#faq' },
      ],
    },
    {
      backgroundColor: '#ffffff',
      padding: '16px 24px',
      textColor: '#1a1a2e',
    }
  ),
  makeBlock(
    'hero',
    {
      headline: 'Master Digital Marketing in 8 Weeks',
      subheadline:
        'Join 12,000+ students who have transformed their careers with our comprehensive, hands-on digital marketing program. From SEO to paid ads, learn the skills that employers demand.',
      ctaText: 'Enroll Now — 40% Off',
      ctaUrl: '#pricing',
      ctaVariant: 'primary',
      backgroundImageUrl: '/images/templates/course-hero-bg.jpg',
    },
    {
      backgroundColor: '#1a1a2e',
      textColor: '#ffffff',
      padding: '96px 24px',
      backgroundGradient: 'linear-gradient(135deg, #1a1a2e 0%, #3a2d6e 50%, #8e78fb 100%)',
      textAlign: 'center',
    }
  ),
  makeBlock(
    'social-proof',
    {
      stats: [
        { id: uid(), value: '12,000+', label: 'Students Enrolled' },
        { id: uid(), value: '4.9/5', label: 'Average Rating' },
        { id: uid(), value: '94%', label: 'Completion Rate' },
        { id: uid(), value: '3x', label: 'Avg Salary Increase' },
      ],
    },
    {
      backgroundColor: '#f8f7ff',
      padding: '48px 24px',
      textColor: '#1a1a2e',
    }
  ),
  makeBlock(
    'video',
    {
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoThumbnail: '/images/templates/course-video-thumb.jpg',
      autoplay: false,
    },
    {
      backgroundColor: '#ffffff',
      padding: '64px 24px',
      maxWidth: '800px',
    }
  ),
  makeBlock(
    'features',
    {
      features: [
        {
          id: uid(),
          icon: 'search',
          title: 'SEO & Content Strategy',
          description:
            'Learn how to rank #1 on Google with proven SEO techniques, keyword research, and content marketing strategies that drive organic traffic.',
        },
        {
          id: uid(),
          icon: 'megaphone',
          title: 'Paid Advertising Mastery',
          description:
            'Master Facebook Ads, Google Ads, and TikTok Ads. Build campaigns that convert, optimize ad spend, and scale profitably.',
        },
        {
          id: uid(),
          icon: 'mail',
          title: 'Email Marketing Automation',
          description:
            'Build automated email funnels that nurture leads and drive sales 24/7. Learn segmentation, copywriting, and A/B testing.',
        },
        {
          id: uid(),
          icon: 'bar-chart',
          title: 'Analytics & Data',
          description:
            'Make data-driven decisions with Google Analytics, conversion tracking, and attribution modeling. Turn numbers into actionable insights.',
        },
        {
          id: uid(),
          icon: 'share-2',
          title: 'Social Media Growth',
          description:
            'Build engaged communities across Instagram, LinkedIn, Twitter, and TikTok. Learn algorithms, scheduling, and viral content creation.',
        },
        {
          id: uid(),
          icon: 'zap',
          title: 'Conversion Rate Optimization',
          description:
            'Turn visitors into customers with landing page best practices, A/B testing, heatmaps, and user behavior analysis.',
        },
      ],
      columns: 3,
    },
    {
      backgroundColor: '#ffffff',
      padding: '80px 24px',
      textColor: '#1a1a2e',
    }
  ),
  makeBlock(
    'testimonials',
    {
      testimonials: [
        {
          id: uid(),
          name: 'Sarah Mitchell',
          role: 'Marketing Manager at TechCorp',
          avatar: '/images/avatars/avatar-1.jpg',
          quote:
            'This course completely changed my career trajectory. Within 3 months of completing it, I landed a senior marketing role with a 60% salary increase. The hands-on projects were invaluable.',
          rating: 5,
        },
        {
          id: uid(),
          name: 'James Rodriguez',
          role: 'Founder, GrowthLab Agency',
          avatar: '/images/avatars/avatar-2.jpg',
          quote:
            'I started my own digital marketing agency after taking this course. The paid advertising module alone was worth 10x the investment. Now managing $500K+ in monthly ad spend.',
          rating: 5,
        },
        {
          id: uid(),
          name: 'Amira Hassan',
          role: 'E-commerce Entrepreneur',
          avatar: '/images/avatars/avatar-3.jpg',
          quote:
            'As someone who was completely new to marketing, this course made everything accessible and actionable. My online store revenue tripled in the first quarter after implementing what I learned.',
          rating: 5,
        },
      ],
    },
    {
      backgroundColor: '#f8f7ff',
      padding: '80px 24px',
      textColor: '#1a1a2e',
    }
  ),
  makeBlock(
    'pricing',
    {
      pricingPlans: [
        {
          id: uid(),
          name: 'Self-Paced',
          price: '$297',
          period: 'one-time',
          features: [
            'Full 8-week curriculum',
            '40+ video lessons',
            'Downloadable worksheets & templates',
            'Private community access',
            'Certificate of completion',
          ],
          ctaText: 'Get Started',
          ctaUrl: '/checkout/self-paced',
        },
        {
          id: uid(),
          name: 'Mentored',
          price: '$597',
          period: 'one-time',
          features: [
            'Everything in Self-Paced',
            'Weekly group coaching calls',
            'Personal feedback on assignments',
            'Priority support',
            '1-on-1 strategy session',
            'Job placement assistance',
          ],
          highlighted: true,
          ctaText: 'Enroll Now — Most Popular',
          ctaUrl: '/checkout/mentored',
        },
        {
          id: uid(),
          name: 'Enterprise',
          price: '$1,497',
          period: 'per team',
          features: [
            'Everything in Mentored',
            'Up to 10 team members',
            'Custom curriculum add-ons',
            'Dedicated account manager',
            'Quarterly strategy reviews',
            'White-label certificates',
          ],
          ctaText: 'Contact Sales',
          ctaUrl: '/contact',
        },
      ],
    },
    {
      backgroundColor: '#ffffff',
      padding: '80px 24px',
      textColor: '#1a1a2e',
    }
  ),
  makeBlock(
    'faq',
    {
      faqs: [
        {
          id: uid(),
          question: 'How long do I have access to the course?',
          answer:
            'You get lifetime access to all course materials, including future updates. Once enrolled, the content is yours forever.',
        },
        {
          id: uid(),
          question: 'Do I need any prior marketing experience?',
          answer:
            'Not at all! The course is designed for complete beginners through intermediate marketers. We start with the fundamentals and progressively build to advanced strategies.',
        },
        {
          id: uid(),
          question: 'Is there a money-back guarantee?',
          answer:
            'Yes! We offer a 30-day no-questions-asked money-back guarantee. If the course doesn\'t meet your expectations, we\'ll refund you in full.',
        },
        {
          id: uid(),
          question: 'How much time per week should I dedicate?',
          answer:
            'We recommend 5-7 hours per week for optimal results. However, since the course is self-paced, you can adjust based on your schedule.',
        },
        {
          id: uid(),
          question: 'Will I receive a certificate?',
          answer:
            'Yes! Upon completing all modules and assignments, you\'ll receive a verified digital certificate that you can share on LinkedIn and your resume.',
        },
      ],
    },
    {
      backgroundColor: '#f8f7ff',
      padding: '80px 24px',
      textColor: '#1a1a2e',
    }
  ),
  makeBlock(
    'cta',
    {
      buttonText: 'Start Learning Today — 40% Off',
      buttonUrl: '#pricing',
      buttonVariant: 'gradient',
      secondaryButtonText: 'Download Free Chapter',
      secondaryButtonUrl: '/free-chapter',
    },
    {
      backgroundGradient: 'linear-gradient(135deg, #8e78fb 0%, #f65887 100%)',
      textColor: '#ffffff',
      padding: '80px 24px',
      textAlign: 'center',
    }
  ),
  makeBlock(
    'footer',
    {
      logoUrl: '/images/logo-white.svg',
      navLinks: [
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Terms of Service', url: '/terms' },
        { label: 'Contact', url: '/contact' },
      ],
      socialLinks: [
        { platform: 'twitter', url: 'https://twitter.com' },
        { platform: 'linkedin', url: 'https://linkedin.com' },
        { platform: 'instagram', url: 'https://instagram.com' },
      ],
      copyrightText: '© 2025 Digital Marketing Academy. All rights reserved.',
    },
    {
      backgroundColor: '#1a1a2e',
      textColor: '#a0a0b8',
      padding: '48px 24px',
    }
  ),
]

// ─── Lead Capture Template ───────────────────────────────────────────────────

const leadCaptureBlocks: PageBlock[] = [
  makeBlock(
    'header',
    {
      logoUrl: '/images/logo.svg',
      navLinks: [
        { label: 'Benefits', url: '#benefits' },
        { label: 'Get Your Guide', url: '#form' },
      ],
    },
    {
      backgroundColor: '#ffffff',
      padding: '16px 24px',
      textColor: '#1a1a2e',
    }
  ),
  makeBlock(
    'hero',
    {
      headline: 'The Ultimate Growth Playbook for 2025',
      subheadline:
        'Download our free 47-page guide packed with proven strategies to 10x your business growth. Used by 5,000+ founders and marketers worldwide.',
      ctaText: 'Get My Free Copy',
      ctaUrl: '#form',
      ctaVariant: 'primary',
    },
    {
      backgroundGradient: 'linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      textColor: '#ffffff',
      padding: '96px 24px',
      textAlign: 'center',
    }
  ),
  makeBlock(
    'social-proof',
    {
      stats: [
        { id: uid(), value: '5,000+', label: 'Downloads' },
        { id: uid(), value: '47', label: 'Pages of Insights' },
        { id: uid(), value: '23', label: 'Case Studies' },
        { id: uid(), value: '100%', label: 'Free' },
      ],
      logos: [
        { id: uid(), imageUrl: '/images/logos/company-1.svg', alt: 'TechCrunch' },
        { id: uid(), imageUrl: '/images/logos/company-2.svg', alt: 'Forbes' },
        { id: uid(), imageUrl: '/images/logos/company-3.svg', alt: 'Entrepreneur' },
        { id: uid(), imageUrl: '/images/logos/company-4.svg', alt: 'Inc Magazine' },
        { id: uid(), imageUrl: '/images/logos/company-5.svg', alt: 'Business Insider' },
      ],
    },
    {
      backgroundColor: '#f1f5f9',
      padding: '48px 24px',
      textColor: '#1e293b',
    }
  ),
  makeBlock(
    'features',
    {
      features: [
        {
          id: uid(),
          icon: 'trending-up',
          title: 'Revenue Growth Frameworks',
          description:
            'Step-by-step frameworks used by YC-backed startups to go from $0 to $1M ARR. Includes templates and worksheets.',
        },
        {
          id: uid(),
          icon: 'users',
          title: 'Customer Acquisition Playbooks',
          description:
            'Battle-tested acquisition channels with exact budgets, timelines, and expected results from real companies.',
        },
        {
          id: uid(),
          icon: 'repeat',
          title: 'Retention & LTV Strategies',
          description:
            'Learn how top companies achieve 95%+ retention rates. Includes churn prediction models and engagement frameworks.',
        },
      ],
      columns: 3,
    },
    {
      backgroundColor: '#ffffff',
      padding: '80px 24px',
      textColor: '#1e293b',
    }
  ),
  makeBlock(
    'text',
    {
      headline: 'What\'s Inside the Playbook',
      body: `**Chapter 1:** Market Analysis & Opportunity Sizing — Identify your highest-leverage growth levers\n\n**Chapter 2:** Acquisition Channel Deep-Dives — SEO, paid, partnerships, PLG, and cold outreach\n\n**Chapter 3:** Conversion Optimization — Turn more visitors into paying customers\n\n**Chapter 4:** Retention Engineering — Build systems that keep customers for life\n\n**Chapter 5:** Scaling Operations — When and how to hire, automate, and systematize\n\n**Chapter 6:** 23 Real Case Studies — From $0 to $10M+ with detailed breakdowns`,
    },
    {
      backgroundColor: '#f8f7ff',
      padding: '64px 24px',
      textColor: '#1e293b',
      textAlign: 'left',
      maxWidth: '720px',
    }
  ),
  makeBlock(
    'form',
    {
      headline: 'Get Your Free Growth Playbook',
      formFields: [
        {
          id: uid(),
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true,
        },
        {
          id: uid(),
          type: 'email',
          label: 'Work Email',
          placeholder: 'you@company.com',
          required: true,
        },
        {
          id: uid(),
          type: 'text',
          label: 'Company Name',
          placeholder: 'Your company',
          required: false,
        },
        {
          id: uid(),
          type: 'select',
          label: 'Company Size',
          placeholder: 'Select team size',
          required: false,
          options: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
        },
      ],
      formSubmitText: 'Download Free Playbook →',
      formSuccessMessage:
        'Check your email! Your Growth Playbook is on its way. (Check spam if you don\'t see it within 2 minutes.)',
    },
    {
      backgroundColor: '#ffffff',
      padding: '80px 24px',
      textColor: '#1e293b',
      maxWidth: '560px',
    }
  ),
  makeBlock(
    'testimonials',
    {
      testimonials: [
        {
          id: uid(),
          name: 'David Chen',
          role: 'CEO, ScaleUp Studio',
          avatar: '/images/avatars/avatar-4.jpg',
          quote:
            'This playbook gave us the exact framework we needed. We implemented Chapter 3 and saw a 42% increase in trial-to-paid conversion within 6 weeks.',
          rating: 5,
        },
        {
          id: uid(),
          name: 'Lisa Park',
          role: 'Head of Growth, DataFlow',
          avatar: '/images/avatars/avatar-5.jpg',
          quote:
            'Best free resource I\'ve ever downloaded. The case studies alone are worth more than most paid courses. Immediately actionable.',
          rating: 5,
        },
      ],
    },
    {
      backgroundColor: '#f1f5f9',
      padding: '64px 24px',
      textColor: '#1e293b',
    }
  ),
  makeBlock(
    'footer',
    {
      copyrightText: '© 2025 GrowthLab. All rights reserved.',
      navLinks: [
        { label: 'Privacy', url: '/privacy' },
        { label: 'Terms', url: '/terms' },
      ],
    },
    {
      backgroundColor: '#0f172a',
      textColor: '#94a3b8',
      padding: '32px 24px',
    }
  ),
]

// ─── Webinar Registration Template ───────────────────────────────────────────

const webinarBlocks: PageBlock[] = [
  makeBlock(
    'header',
    {
      logoUrl: '/images/logo.svg',
      navLinks: [
        { label: 'About', url: '#about' },
        { label: 'Speakers', url: '#speakers' },
        { label: 'Register Free', url: '#register' },
      ],
    },
    {
      backgroundColor: '#0d0d1a',
      padding: '16px 24px',
      textColor: '#ffffff',
    }
  ),
  makeBlock(
    'hero',
    {
      headline: 'Free Live Masterclass: AI-Powered Marketing in 2025',
      subheadline:
        'Join 3 industry experts for a 90-minute deep dive into how AI is transforming digital marketing. Learn practical tools, prompts, and workflows you can implement immediately.',
      ctaText: 'Reserve My Seat — It\'s Free',
      ctaUrl: '#register',
      ctaVariant: 'primary',
    },
    {
      backgroundGradient:
        'linear-gradient(135deg, #0d0d1a 0%, #1a0d3a 40%, #8e78fb 100%)',
      textColor: '#ffffff',
      padding: '80px 24px',
      textAlign: 'center',
    }
  ),
  makeBlock(
    'countdown',
    {
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      countdownLabel: 'Webinar Starts In',
      expiredMessage: 'The webinar has started! Join now before it\'s too late.',
    },
    {
      backgroundColor: '#1a0d3a',
      textColor: '#ffffff',
      padding: '48px 24px',
      textAlign: 'center',
    }
  ),
  makeBlock(
    'features',
    {
      features: [
        {
          id: uid(),
          icon: 'brain',
          title: 'AI Content at Scale',
          description:
            'Learn the exact prompts and workflows to create a month\'s worth of content in a single afternoon — with quality that rivals human-only teams.',
        },
        {
          id: uid(),
          icon: 'target',
          title: 'Hyper-Personalized Campaigns',
          description:
            'Discover how to use AI segmentation to deliver the right message to the right person at the right time, boosting conversions by 3-5x.',
        },
        {
          id: uid(),
          icon: 'line-chart',
          title: 'Predictive Analytics',
          description:
            'See how leading brands use AI to predict customer behavior, optimize ad spend, and identify opportunities before competitors.',
        },
        {
          id: uid(),
          icon: 'bot',
          title: 'Chatbot & Automation',
          description:
            'Build AI-powered chatbots and automation workflows that handle 80% of customer interactions while improving satisfaction.',
        },
      ],
      columns: 2,
    },
    {
      backgroundColor: '#0d0d1a',
      textColor: '#ffffff',
      padding: '80px 24px',
    }
  ),
  makeBlock(
    'testimonials',
    {
      testimonials: [
        {
          id: uid(),
          name: 'Karim Youssef',
          role: 'CMO, NovaBrand',
          avatar: '/images/avatars/avatar-6.jpg',
          quote:
            'I attended the last webinar and immediately implemented the AI ad copy framework. Our ROAS improved by 180% in the first month. These sessions are pure gold.',
          rating: 5,
        },
        {
          id: uid(),
          name: 'Emily Zhang',
          role: 'Freelance Marketer',
          avatar: '/images/avatars/avatar-7.jpg',
          quote:
            'The live demos blew my mind. I had no idea AI tools had become this powerful. Signed up 3 new clients after implementing what I learned.',
          rating: 5,
        },
        {
          id: uid(),
          name: 'Omar Bakr',
          role: 'E-commerce Director',
          avatar: '/images/avatars/avatar-8.jpg',
          quote:
            'Best webinar I\'ve attended all year. Practical, no-fluff, and the Q&A at the end was incredibly valuable. Already registered for the next one.',
          rating: 5,
        },
      ],
    },
    {
      backgroundColor: '#111127',
      textColor: '#ffffff',
      padding: '80px 24px',
    }
  ),
  makeBlock(
    'social-proof',
    {
      stats: [
        { id: uid(), value: '8,500+', label: 'Past Attendees' },
        { id: uid(), value: '4.8/5', label: 'Avg Rating' },
        { id: uid(), value: '92%', label: 'Would Recommend' },
      ],
    },
    {
      backgroundColor: '#0d0d1a',
      textColor: '#ffffff',
      padding: '48px 24px',
    }
  ),
  makeBlock(
    'form',
    {
      headline: 'Register for the Free Masterclass',
      formFields: [
        {
          id: uid(),
          type: 'text',
          label: 'First Name',
          placeholder: 'Your first name',
          required: true,
        },
        {
          id: uid(),
          type: 'email',
          label: 'Email Address',
          placeholder: 'you@example.com',
          required: true,
        },
        {
          id: uid(),
          type: 'phone',
          label: 'Phone (for SMS reminder)',
          placeholder: '+1 (555) 000-0000',
          required: false,
        },
      ],
      formSubmitText: 'Reserve My Free Seat →',
      formSuccessMessage:
        'You\'re registered! Check your email for the webinar link and calendar invite. We\'ll send a reminder 1 hour before we go live.',
    },
    {
      backgroundColor: '#1a0d3a',
      textColor: '#ffffff',
      padding: '80px 24px',
      maxWidth: '520px',
      borderRadius: '16px',
    }
  ),
  makeBlock(
    'footer',
    {
      copyrightText: '© 2025 AI Marketing Academy. All rights reserved.',
      navLinks: [
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Terms', url: '/terms' },
      ],
      socialLinks: [
        { platform: 'youtube', url: 'https://youtube.com' },
        { platform: 'twitter', url: 'https://twitter.com' },
        { platform: 'linkedin', url: 'https://linkedin.com' },
      ],
    },
    {
      backgroundColor: '#0a0a14',
      textColor: '#6b7280',
      padding: '32px 24px',
    }
  ),
]

// ─── Arabic Course Template (RTL-friendly) ───────────────────────────────────

const arabicCourseBlocks: PageBlock[] = [
  makeBlock(
    'header',
    {
      logoUrl: '/images/logo-ar.svg',
      navLinks: [
        { label: 'المحتوى', url: '#content' },
        { label: 'آراء الطلاب', url: '#testimonials' },
        { label: 'الأسعار', url: '#pricing' },
        { label: 'سجّل الآن', url: '#register' },
      ],
    },
    {
      backgroundColor: '#ffffff',
      padding: '16px 24px',
      textColor: '#1a1a2e',
      fontFamily: 'Tajawal, Cairo, sans-serif',
    }
  ),
  makeBlock(
    'hero',
    {
      headline: 'أتقن صناعة المحتوى الرقمي واربح من شغفك',
      subheadline:
        'دورة شاملة من ١٢ أسبوع تأخذك من الصفر إلى الاحتراف في صناعة المحتوى الرقمي. تعلّم التصوير، المونتاج، الكتابة الإبداعية، وبناء جمهورك على جميع المنصات.',
      ctaText: 'سجّل الآن — خصم ٤٠٪',
      ctaUrl: '#pricing',
      ctaVariant: 'primary',
    },
    {
      backgroundGradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 50%, #8e78fb 100%)',
      textColor: '#ffffff',
      padding: '96px 24px',
      textAlign: 'center',
      fontFamily: 'Tajawal, Cairo, sans-serif',
    }
  ),
  makeBlock(
    'video',
    {
      videoUrl: 'https://www.youtube.com/watch?v=example',
      videoThumbnail: '/images/templates/arabic-course-thumb.jpg',
      autoplay: false,
    },
    {
      backgroundColor: '#f8f7ff',
      padding: '64px 24px',
      maxWidth: '800px',
    }
  ),
  makeBlock(
    'social-proof',
    {
      stats: [
        { id: uid(), value: '+٨٬٠٠٠', label: 'طالب مسجّل' },
        { id: uid(), value: '٤.٩/٥', label: 'تقييم الطلاب' },
        { id: uid(), value: '٩٦٪', label: 'نسبة الإنجاز' },
        { id: uid(), value: '١٢', label: 'أسبوع تدريبي' },
      ],
    },
    {
      backgroundColor: '#ffffff',
      padding: '48px 24px',
      textColor: '#1a1a2e',
      fontFamily: 'Tajawal, Cairo, sans-serif',
    }
  ),
  makeBlock(
    'features',
    {
      features: [
        {
          id: uid(),
          icon: 'video',
          title: 'التصوير والمونتاج الاحترافي',
          description:
            'تعلّم أساسيات التصوير بالهاتف والكاميرا، وأتقن أدوات المونتاج مثل Premiere Pro وCapCut لإنتاج محتوى بجودة عالية.',
        },
        {
          id: uid(),
          icon: 'pen-tool',
          title: 'الكتابة الإبداعية والسكريبت',
          description:
            'اكتشف أسرار كتابة سكريبتات جذابة، عناوين تشد الانتباه، ونصوص تُحوّل المتابعين إلى عملاء.',
        },
        {
          id: uid(),
          icon: 'users',
          title: 'بناء الجمهور والمجتمع',
          description:
            'استراتيجيات مجرّبة لبناء جمهور وفيّ على يوتيوب، إنستغرام، تيك توك، وتويتر. تعلّم خوارزميات كل منصة.',
        },
        {
          id: uid(),
          icon: 'dollar-sign',
          title: 'تحقيق الدخل والشراكات',
          description:
            'من الإعلانات إلى الرعاية والمنتجات الرقمية — تعلّم كيف تحوّل محتواك إلى مصدر دخل مستدام.',
        },
        {
          id: uid(),
          icon: 'trending-up',
          title: 'التسويق الرقمي للمحتوى',
          description:
            'تعلّم إعلانات الفيسبوك وإنستغرام، تحسين محركات البحث (SEO)، والتسويق عبر البريد الإلكتروني لتوسيع وصولك.',
        },
        {
          id: uid(),
          icon: 'shield',
          title: 'العلامة الشخصية والتميّز',
          description:
            'ابنِ هويتك الرقمية الفريدة التي تميّزك عن الآلاف. تعلّم أصول البراندنج الشخصي واستراتيجيات التموضع.',
        },
      ],
      columns: 3,
    },
    {
      backgroundColor: '#f8f7ff',
      padding: '80px 24px',
      textColor: '#1a1a2e',
      fontFamily: 'Tajawal, Cairo, sans-serif',
    }
  ),
  makeBlock(
    'testimonials',
    {
      testimonials: [
        {
          id: uid(),
          name: 'نورة الشمري',
          role: 'صانعة محتوى — ٢٠٠ ألف متابع',
          avatar: '/images/avatars/avatar-ar-1.jpg',
          quote:
            'قبل الدورة كنت أنشر بشكل عشوائي بدون نتائج. الآن عندي استراتيجية واضحة ومحتواي يحقق تفاعل أعلى بـ ١٠ أضعاف. أنصح فيها بشدة!',
          rating: 5,
        },
        {
          id: uid(),
          name: 'أحمد الحربي',
          role: 'مؤسس وكالة تسويق رقمي',
          avatar: '/images/avatars/avatar-ar-2.jpg',
          quote:
            'الدورة الأفضل باللغة العربية بلا منافس. المحتوى عملي ١٠٠٪ ومبني على تجارب حقيقية. بدأت وكالتي بعد التخرج مباشرة.',
          rating: 5,
        },
        {
          id: uid(),
          name: 'سارة المنصور',
          role: 'مدوّنة ورائدة أعمال',
          avatar: '/images/avatars/avatar-ar-3.jpg',
          quote:
            'أخيراً دورة عربية بمستوى عالمي! المدربين رائعين والمجتمع داعم جداً. حققت أول دخل من المحتوى خلال شهرين من التسجيل.',
          rating: 5,
        },
      ],
    },
    {
      backgroundColor: '#ffffff',
      padding: '80px 24px',
      textColor: '#1a1a2e',
      fontFamily: 'Tajawal, Cairo, sans-serif',
    }
  ),
  makeBlock(
    'pricing',
    {
      pricingPlans: [
        {
          id: uid(),
          name: 'الباقة الأساسية',
          price: '٩٩٧ ر.س',
          period: 'دفعة واحدة',
          features: [
            'جميع الدروس المسجّلة (٦٠+ درس)',
            'قوالب وأدوات جاهزة للاستخدام',
            'وصول للمجتمع الخاص',
            'شهادة إتمام معتمدة',
            'وصول مدى الحياة',
          ],
          ctaText: 'ابدأ الآن',
          ctaUrl: '/checkout/basic',
        },
        {
          id: uid(),
          name: 'الباقة المميّزة',
          price: '١٬٩٩٧ ر.س',
          period: 'دفعة واحدة',
          features: [
            'كل مميزات الباقة الأساسية',
            'جلسات كوتشنق أسبوعية مباشرة',
            'مراجعة شخصية لمحتواك',
            'دعم أولوية عبر واتساب',
            'جلسة استراتيجية فردية',
            'مساعدة في تحقيق أول شراكة',
          ],
          highlighted: true,
          ctaText: 'الأكثر طلباً — سجّل الآن',
          ctaUrl: '/checkout/premium',
        },
      ],
    },
    {
      backgroundColor: '#f8f7ff',
      padding: '80px 24px',
      textColor: '#1a1a2e',
      fontFamily: 'Tajawal, Cairo, sans-serif',
    }
  ),
  makeBlock(
    'cta',
    {
      buttonText: 'سجّل الآن وابدأ رحلتك — خصم ٤٠٪',
      buttonUrl: '#pricing',
      buttonVariant: 'gradient',
      secondaryButtonText: 'حمّل الدليل المجاني',
      secondaryButtonUrl: '/free-guide-ar',
    },
    {
      backgroundGradient: 'linear-gradient(135deg, #8e78fb 0%, #f65887 100%)',
      textColor: '#ffffff',
      padding: '80px 24px',
      textAlign: 'center',
      fontFamily: 'Tajawal, Cairo, sans-serif',
    }
  ),
  makeBlock(
    'footer',
    {
      logoUrl: '/images/logo-ar-white.svg',
      navLinks: [
        { label: 'سياسة الخصوصية', url: '/privacy' },
        { label: 'الشروط والأحكام', url: '/terms' },
        { label: 'تواصل معنا', url: '/contact' },
      ],
      socialLinks: [
        { platform: 'twitter', url: 'https://twitter.com' },
        { platform: 'instagram', url: 'https://instagram.com' },
        { platform: 'youtube', url: 'https://youtube.com' },
        { platform: 'tiktok', url: 'https://tiktok.com' },
      ],
      copyrightText: '© ٢٠٢٥ أكاديمية المحتوى الرقمي. جميع الحقوق محفوظة.',
    },
    {
      backgroundColor: '#1a1a2e',
      textColor: '#a0a0b8',
      padding: '48px 24px',
      fontFamily: 'Tajawal, Cairo, sans-serif',
    }
  ),
]

// ─── Business Consulting Template ────────────────────────────────────────────

const businessConsultingBlocks: PageBlock[] = [
  makeBlock(
    'header',
    {
      logoUrl: '/images/logo-consulting.svg',
      navLinks: [
        { label: 'Services', url: '#services' },
        { label: 'Results', url: '#results' },
        { label: 'Testimonials', url: '#testimonials' },
        { label: 'Book a Call', url: '#cta' },
      ],
    },
    {
      backgroundColor: '#ffffff',
      padding: '16px 24px',
      textColor: '#111827',
    }
  ),
  makeBlock(
    'hero',
    {
      headline: 'Scale Your Business to 7 Figures — Without the Guesswork',
      subheadline:
        'We help ambitious entrepreneurs and growing companies implement proven systems for predictable revenue growth. Trusted by 200+ businesses across 14 industries.',
      ctaText: 'Book Your Free Strategy Call',
      ctaUrl: '#cta',
      ctaVariant: 'primary',
    },
    {
      backgroundGradient: 'linear-gradient(135deg, #111827 0%, #1f2937 60%, #374151 100%)',
      textColor: '#ffffff',
      padding: '96px 24px',
      textAlign: 'center',
    }
  ),
  makeBlock(
    'social-proof',
    {
      stats: [
        { id: uid(), value: '$47M+', label: 'Revenue Generated for Clients' },
        { id: uid(), value: '200+', label: 'Businesses Served' },
        { id: uid(), value: '14', label: 'Industries' },
        { id: uid(), value: '3.2x', label: 'Avg Revenue Increase' },
      ],
      logos: [
        { id: uid(), imageUrl: '/images/logos/client-1.svg', alt: 'Acme Corp' },
        { id: uid(), imageUrl: '/images/logos/client-2.svg', alt: 'NovaTech' },
        { id: uid(), imageUrl: '/images/logos/client-3.svg', alt: 'BlueSky' },
        { id: uid(), imageUrl: '/images/logos/client-4.svg', alt: 'GreenLeaf' },
        { id: uid(), imageUrl: '/images/logos/client-5.svg', alt: 'Zenith' },
        { id: uid(), imageUrl: '/images/logos/client-6.svg', alt: 'Pinnacle' },
      ],
    },
    {
      backgroundColor: '#f9fafb',
      padding: '56px 24px',
      textColor: '#111827',
    }
  ),
  makeBlock(
    'features',
    {
      features: [
        {
          id: uid(),
          icon: 'compass',
          title: 'Strategic Planning',
          description:
            'Crystal-clear roadmaps tailored to your business. We analyze your market, competitors, and operations to build a growth plan that actually works.',
        },
        {
          id: uid(),
          icon: 'bar-chart-2',
          title: 'Revenue Optimization',
          description:
            'Identify revenue leaks and unlock hidden profit. Our pricing, packaging, and sales process optimization typically adds 30-50% to the bottom line.',
        },
        {
          id: uid(),
          icon: 'settings',
          title: 'Operations & Systems',
          description:
            'Stop being the bottleneck. We help you build systems, SOPs, and automated workflows so your business runs without you in the day-to-day.',
        },
        {
          id: uid(),
          icon: 'users',
          title: 'Team Building & Leadership',
          description:
            'Hire A-players, build high-performing teams, and develop the leadership skills to scale. Culture frameworks that attract and retain top talent.',
        },
        {
          id: uid(),
          icon: 'trending-up',
          title: 'Marketing & Sales',
          description:
            'Build predictable lead generation engines and high-converting sales processes. From brand positioning to pipeline management.',
        },
        {
          id: uid(),
          icon: 'shield',
          title: 'Financial Strategy',
          description:
            'Optimize cash flow, model scenarios, and make capital decisions with confidence. CFO-level thinking without the CFO price tag.',
        },
      ],
      columns: 3,
    },
    {
      backgroundColor: '#ffffff',
      padding: '80px 24px',
      textColor: '#111827',
    }
  ),
  makeBlock(
    'text',
    {
      headline: 'Our Proven 3-Phase Framework',
      body: `**Phase 1 — Diagnose (Weeks 1-2)**\nComprehensive business audit covering revenue model, operations, team structure, marketing, and financials. We identify the highest-impact opportunities.\n\n**Phase 2 — Design (Weeks 3-4)**\nCustom growth strategy and implementation roadmap. Clear KPIs, milestones, and accountability structures.\n\n**Phase 3 — Deploy & Scale (Ongoing)**\nHands-on implementation support with weekly check-ins, real-time dashboards, and strategic pivots as needed. We stay with you until results are delivered.`,
    },
    {
      backgroundColor: '#f9fafb',
      padding: '80px 24px',
      textColor: '#111827',
      textAlign: 'left',
      maxWidth: '760px',
    }
  ),
  makeBlock(
    'testimonials',
    {
      testimonials: [
        {
          id: uid(),
          name: 'Michael Torres',
          role: 'CEO, Apex Solutions',
          avatar: '/images/avatars/avatar-9.jpg',
          quote:
            'Working with this team was the best investment I\'ve made in my business. In 8 months we went from $1.2M to $3.4M in revenue. Their strategic clarity and execution support is unmatched.',
          rating: 5,
        },
        {
          id: uid(),
          name: 'Priya Sharma',
          role: 'Founder, Bloom Health',
          avatar: '/images/avatars/avatar-10.jpg',
          quote:
            'They didn\'t just give us advice — they rolled up their sleeves and helped us implement. Our customer acquisition cost dropped 60% while revenue grew 4x. Incredible ROI.',
          rating: 5,
        },
        {
          id: uid(),
          name: 'Robert Kim',
          role: 'Managing Director, KimGroup',
          avatar: '/images/avatars/avatar-11.jpg',
          quote:
            'The operations framework they built for us freed up 15 hours of my week and eliminated our biggest bottleneck. We\'re now scaling confidently into new markets.',
          rating: 5,
        },
        {
          id: uid(),
          name: 'Fatima Al-Rashid',
          role: 'Co-founder, Luxe Brands',
          avatar: '/images/avatars/avatar-12.jpg',
          quote:
            'Their pricing optimization alone added $800K in annual revenue. I only wish we had found them sooner. They understand business at a deep, fundamental level.',
          rating: 5,
        },
      ],
    },
    {
      backgroundColor: '#ffffff',
      padding: '80px 24px',
      textColor: '#111827',
    }
  ),
  makeBlock(
    'divider',
    {},
    {
      backgroundColor: 'transparent',
      padding: '0 24px',
    }
  ),
  makeBlock(
    'cta',
    {
      headline: 'Ready to Scale? Let\'s Talk.',
      body: 'Book a free 30-minute strategy call. We\'ll analyze your business, identify your biggest growth levers, and map out a clear path to your revenue goals — no strings attached.',
      buttonText: 'Book My Free Strategy Call',
      buttonUrl: 'https://calendly.com/example',
      buttonVariant: 'primary',
      secondaryButtonText: 'Download Our Case Studies',
      secondaryButtonUrl: '/case-studies',
    },
    {
      backgroundGradient: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
      textColor: '#ffffff',
      padding: '96px 24px',
      textAlign: 'center',
    }
  ),
  makeBlock(
    'footer',
    {
      logoUrl: '/images/logo-consulting-white.svg',
      navLinks: [
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Terms of Service', url: '/terms' },
        { label: 'Contact Us', url: '/contact' },
        { label: 'Blog', url: '/blog' },
      ],
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com' },
        { platform: 'twitter', url: 'https://twitter.com' },
        { platform: 'youtube', url: 'https://youtube.com' },
      ],
      copyrightText: '© 2025 Elevate Consulting Group. All rights reserved.',
    },
    {
      backgroundColor: '#0a0a14',
      textColor: '#6b7280',
      padding: '48px 24px',
    }
  ),
]

// ─── Exported Template Catalog ───────────────────────────────────────────────

export const pageTemplates: PageTemplate[] = [
  {
    id: 'tpl-course-sales',
    name: 'Course Sales Page',
    description:
      'High-converting sales page for online courses with social proof, feature highlights, pricing tiers, FAQ, and compelling CTAs. Perfect for course creators and educators.',
    category: 'course',
    thumbnail: '/images/templates/thumbnails/course-sales.jpg',
    blocks: courseSalesBlocks,
    popularity: 98,
    rating: 4.9,
    usageCount: 4520,
  },
  {
    id: 'tpl-lead-capture',
    name: 'Lead Capture & Free Resource',
    description:
      'Optimized lead generation page with compelling copy, trust indicators, and a streamlined form to capture emails. Ideal for ebooks, guides, checklists, and free downloads.',
    category: 'lead-capture',
    thumbnail: '/images/templates/thumbnails/lead-capture.jpg',
    blocks: leadCaptureBlocks,
    popularity: 95,
    rating: 4.8,
    usageCount: 3870,
  },
  {
    id: 'tpl-webinar-registration',
    name: 'Webinar Registration',
    description:
      'Drive webinar sign-ups with countdown urgency, speaker credibility, and past attendee testimonials. Includes automated reminder opt-in.',
    category: 'webinar',
    thumbnail: '/images/templates/thumbnails/webinar-reg.jpg',
    blocks: webinarBlocks,
    popularity: 92,
    rating: 4.8,
    usageCount: 2910,
  },
  {
    id: 'tpl-arabic-course',
    name: 'Arabic Course (RTL)',
    description:
      'دورة تدريبية احترافية — صفحة مبيعات مصمّمة بالعربية مع دعم كامل لاتجاه RTL. مثالية للمدربين وصنّاع المحتوى في العالم العربي.',
    category: 'arabic',
    thumbnail: '/images/templates/thumbnails/arabic-course.jpg',
    blocks: arabicCourseBlocks,
    popularity: 89,
    rating: 4.9,
    usageCount: 1650,
  },
  {
    id: 'tpl-business-consulting',
    name: 'Business Consulting',
    description:
      'Professional consulting page with authority positioning, case studies, a proven framework section, and strategic CTA for booking calls. Built for consultants, agencies, and service businesses.',
    category: 'business',
    thumbnail: '/images/templates/thumbnails/business-consulting.jpg',
    blocks: businessConsultingBlocks,
    popularity: 90,
    rating: 4.7,
    usageCount: 2340,
  },
]

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): PageTemplate | undefined {
  return pageTemplates.find(t => t.id === id)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: PageTemplate['category']
): PageTemplate[] {
  return pageTemplates.filter(t => t.category === category)
}

/**
 * Clone template blocks with fresh IDs for use in a new page
 */
export function cloneTemplateBlocks(templateId: string): PageBlock[] {
  const template = getTemplateById(templateId)
  if (!template) return []

  return template.blocks.map(block => ({
    ...JSON.parse(JSON.stringify(block)),
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  }))
}

/**
 * Get all unique template categories
 */
export function getTemplateCategories(): Array<{
  value: PageTemplate['category']
  label: string
}> {
  return [
    { value: 'sales', label: 'Sales Pages' },
    { value: 'lead-capture', label: 'Lead Capture' },
    { value: 'events', label: 'Events' },
    { value: 'arabic', label: 'Arabic (RTL)' },
    { value: 'business', label: 'Business' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'course', label: 'Courses' },
  ]
}
