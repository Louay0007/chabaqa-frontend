import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  CalendarDays,
  Mail,
  Shield,
  Lock,
  Server,
  Eye,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Zap,
  Globe,
  Bell,
  Key,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Trust Center | Chabaqa",
  description:
    "Chabaqa's Trust Center — compliance certifications, security practices, infrastructure, incident response, and legal documents.",
  alternates: {
    canonical: "https://chabaqa.io/trust-center",
  },
  openGraph: {
    title: "Trust Center | Chabaqa",
    description:
      "Learn how Chabaqa protects your data with enterprise-grade security, compliance certifications, and transparent practices.",
    url: "https://chabaqa.io/trust-center",
    siteName: "Chabaqa",
    type: "website",
  },
  robots: { index: true, follow: true },
}

// ── Table of contents sections ───────────────────────────────
const SECTIONS = [
  { id: "compliance",       title: "Compliance & Certifications" },
  { id: "data-protection",  title: "Data Protection & Encryption" },
  { id: "access-control",   title: "Access Control & Authentication" },
  { id: "infrastructure",   title: "Infrastructure & Availability" },
  { id: "security-testing", title: "Security Testing & Monitoring" },
  { id: "incident-response","title": "Incident Response" },
  { id: "data-residency",   title: "Data Residency & Privacy" },
  { id: "legal-documents",  title: "Legal Documents" },
]

// ── Compliance data ───────────────────────────────────────────
const CERTIFICATIONS = [
  {
    name: "GDPR",
    description: "General Data Protection Regulation — EU data privacy compliance",
    status: "certified" as const,
    progress: 100,
    certifiedSince: "Jan 2025",
  },
  {
    name: "CCPA",
    description: "California Consumer Privacy Act — US consumer privacy rights",
    status: "certified" as const,
    progress: 100,
    certifiedSince: "Mar 2025",
  },
  {
    name: "PCI DSS",
    description: "Payment Card Industry Data Security Standard",
    status: "certified" as const,
    progress: 100,
    certifiedSince: "Feb 2025",
  },
  {
    name: "SOC 2 Type II",
    description: "Security, Availability, and Confidentiality controls audit",
    status: "in_progress" as const,
    progress: 75,
    certifiedSince: "Expected Q3 2026",
  },
]

// ── Security practices ────────────────────────────────────────
const SECURITY_PRACTICES = [
  { icon: Lock,    title: "Data at Rest",      desc: "256-bit AES encryption for all stored data, including backups and database volumes." },
  { icon: Shield,  title: "Data in Transit",   desc: "TLS 1.3 enforced on every connection. Strict-Transport-Security headers on all endpoints." },
  { icon: Key,     title: "Key Management",    desc: "Cryptographic keys are rotated quarterly and stored in a dedicated secrets manager." },
  { icon: Eye,     title: "Database Security", desc: "All database connections are encrypted, access-controlled, and audit-logged by default." },
]

// ── Infrastructure ────────────────────────────────────────────
const INFRA_ITEMS = [
  { icon: Globe,  title: "Multi-Region Deployment",  desc: "Data centers in EU, US, MEA, and APAC. Users may choose their preferred storage region." },
  { icon: Server, title: "High-Availability Architecture", desc: "Redundant clusters with automatic failover. 99.9% uptime SLA backed by real-time monitoring." },
  { icon: Shield, title: "Zero-Trust Network",        desc: "No implicit trust based on network location. Every request is authenticated and authorized individually." },
  { icon: Eye,    title: "Immutable Audit Logs",      desc: "All admin actions, data access, and auth events are logged, tamper-evident, and retained for 7 years." },
]

// ── Security testing ──────────────────────────────────────────
const TESTING_ITEMS = [
  "External penetration tests conducted annually by certified third-party security firms",
  "Automated SAST and DAST scanning on every code deployment via CI/CD pipeline",
  "Dependency vulnerability scanning with Dependabot and Snyk on all repositories",
  "Bug bounty program — responsible disclosure rewarded through security@chabaqa.com",
  "Internal red-team exercises twice per year covering authentication and data flows",
  "Infrastructure configuration reviewed against CIS benchmarks quarterly",
]

// ── Incident response ─────────────────────────────────────────
const INCIDENT_STEPS = [
  { step: "01", title: "Detection",      desc: "Automated alerting via real-time anomaly detection, SIEM, and 24/7 on-call rotation." },
  { step: "02", title: "Containment",    desc: "Affected systems are isolated within minutes. Traffic rerouted to healthy regions automatically." },
  { step: "03", title: "Investigation",  desc: "Root-cause analysis within 4 hours. Forensic logging preserved for review." },
  { step: "04", title: "Notification",   desc: "Affected users notified within 72 hours of confirmed breach — fully GDPR-compliant." },
  { step: "05", title: "Remediation",    desc: "Patch, deploy, and validate fix. Post-mortem published internally within 7 days." },
  { step: "06", title: "Review",         desc: "Process improvement applied. Security controls updated to prevent recurrence." },
]

// ── Legal documents ───────────────────────────────────────────
const LEGAL_DOCS = [
  { title: "Privacy Policy",               updated: "January 2026",  href: "/privacy-policy",    desc: "How we collect, use, and protect your personal information." },
  { title: "Terms of Service",             updated: "January 2026",  href: "/terms-of-service",  desc: "Rules and responsibilities governing platform use." },
  { title: "Data Processing Agreement",    updated: "January 2026",  href: "/legal/dpa",          desc: "GDPR-compliant DPA for enterprise customers." },
  { title: "Cookie Policy",               updated: "January 2026",  href: "/privacy-policy#cookies", desc: "How we use cookies and tracking technologies." },
]

export default function TrustCenterPage() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* ── Gradient Hero Banner ── */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-white">
        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
          <div className="rounded-3xl border border-white/50 bg-gradient-to-br from-chabaqa-primary via-chabaqa-secondary2 to-chabaqa-secondary1 p-8 text-white shadow-2xl shadow-cyan-200/40 backdrop-blur-sm sm:p-10">
            <p className="inline-flex items-center rounded-full border border-white/35 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              Security
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">
              Trust Center
            </h1>
            <p className="mt-5 max-w-3xl text-base text-white/90 sm:text-lg">
              Chabaqa is built on a foundation of security, transparency, and respect for your data.
              This page documents our compliance certifications, security controls, and practices so you
              can make informed decisions about trusting us with your community.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2">
                <CalendarDays className="h-4 w-4" />
                Effective: January 2025
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2">
                <CalendarDays className="h-4 w-4" />
                Updated: January 2026
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2">
                <Mail className="h-4 w-4" />
                security@chabaqa.com
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two-column body ── */}
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-8 lg:px-8 lg:pb-24 lg:pt-10">
        <div className="grid gap-8 lg:grid-cols-[290px_1fr]">

          {/* ── Sticky Sidebar ── */}
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
              On This Page
            </h2>
            <nav className="mt-4 space-y-2">
              {SECTIONS.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-lg border border-transparent px-3 py-2 text-sm text-gray-600 transition-all hover:border-chabaqa-primary/25 hover:bg-chabaqa-primary/5 hover:text-chabaqa-primary"
                >
                  {index + 1}. {section.title}
                </a>
              ))}
            </nav>

            {/* Related Documents card */}
            <div className="mt-6 rounded-xl border border-chabaqa-primary/20 bg-chabaqa-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-chabaqa-primary">
                Related Documents
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Read our Privacy Policy for details on how personal data is collected and handled.
              </p>
              <Link
                href="/privacy-policy"
                className="mt-3 inline-flex text-sm font-semibold text-chabaqa-primary hover:text-chabaqa-primary/80"
              >
                View Privacy Policy →
              </Link>
            </div>

            {/* Quick contact */}
            <div className="mt-4 rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Security Contact
              </p>
              <a
                href="mailto:security@chabaqa.com"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-chabaqa-primary"
              >
                <Mail className="h-3.5 w-3.5" />
                security@chabaqa.com
              </a>
            </div>
          </aside>

          {/* ── Main Article ── */}
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="space-y-6">

              {/* ── 1. Compliance & Certifications ── */}
              <section
                id="compliance"
                className="scroll-mt-28 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-sm sm:p-7"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  1. Compliance &amp; Certifications
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Chabaqa maintains active compliance with globally recognised data-protection and
                  security standards. Certifications are verified annually by accredited third-party
                  auditors.
                </p>

                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {CERTIFICATIONS.map((cert) => (
                    <div
                      key={cert.name}
                      className="rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{cert.name}</p>
                          <p className="mt-0.5 text-sm text-gray-500">{cert.description}</p>
                        </div>
                        {cert.status === "certified" ? (
                          <CheckCircle className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 shrink-0 text-yellow-500 mt-0.5" />
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-1.5 rounded-full ${
                              cert.status === "certified"
                                ? "bg-green-500"
                                : "bg-yellow-400"
                            }`}
                            style={{ width: `${cert.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>
                            {cert.status === "certified" ? "Certified" : "In progress"} &mdash; {cert.progress}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {cert.certifiedSince}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── 2. Data Protection & Encryption ── */}
              <section
                id="data-protection"
                className="scroll-mt-28 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-sm sm:p-7"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  2. Data Protection &amp; Encryption
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  All data on Chabaqa — at rest and in transit — is protected using industry-standard
                  cryptographic controls. There is no plaintext storage of sensitive credentials or
                  payment details anywhere in our systems.
                </p>

                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {SECURITY_PRACTICES.map(({ icon: Icon, title, desc }) => (
                    <div
                      key={title}
                      className="flex items-start gap-4 rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-chabaqa-primary/8 border border-chabaqa-primary/15">
                        <Icon className="h-5 w-5 text-chabaqa-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-gray-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <ul className="mt-6 space-y-3">
                  {[
                    "Passwords are hashed using bcrypt with a work factor of 12 — never stored in plain text.",
                    "API keys are stored as SHA-256 hashes only; the raw key is shown once at creation and never persisted.",
                    "Payment card data is never stored on Chabaqa servers — all processing is delegated to PCI DSS-certified gateways.",
                    "Database backups are encrypted at rest and stored in a geographically separate region from live data.",
                  ].map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-gray-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-chabaqa-primary" />
                      <span className="text-base leading-7">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* ── 3. Access Control & Authentication ── */}
              <section
                id="access-control"
                className="scroll-mt-28 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-sm sm:p-7"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  3. Access Control &amp; Authentication
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Chabaqa enforces strict access controls across user accounts, internal systems, and API
                  integrations. We follow the principle of least privilege — access is granted only to
                  what is necessary and is reviewed regularly.
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    "Two-factor authentication (email OTP) is available to all users and mandatory for administrator accounts.",
                    "Single Sign-On (SAML 2.0 and OIDC) is supported for enterprise and white-label deployments.",
                    "Role-based access control (RBAC) governs what every staff member and community moderator can view or modify.",
                    "All internal production access requires MFA, is logged, and is time-limited to a 4-hour session maximum.",
                    "API keys are scoped to specific permissions and communities. Rate-limited to 1,000 requests per hour by default.",
                    "Revoked tokens are maintained in a deny-list and checked on every authenticated request.",
                    "Active login sessions are visible in user settings; any session can be revoked remotely at any time.",
                  ].map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-gray-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-chabaqa-primary" />
                      <span className="text-base leading-7">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* ── 4. Infrastructure & Availability ── */}
              <section
                id="infrastructure"
                className="scroll-mt-28 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-sm sm:p-7"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  4. Infrastructure &amp; Availability
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Our infrastructure is designed for resilience, performance, and security by default.
                  All services run in hardened environments with automated health checks and failover.
                </p>

                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {INFRA_ITEMS.map(({ icon: Icon, title, desc }) => (
                    <div
                      key={title}
                      className="rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chabaqa-primary/8 border border-chabaqa-primary/15">
                          <Icon className="h-4.5 w-4.5 text-chabaqa-primary" />
                        </div>
                        <p className="font-semibold text-gray-900">{title}</p>
                      </div>
                      <p className="text-sm leading-6 text-gray-500">{desc}</p>
                    </div>
                  ))}
                </div>

                <ul className="mt-6 space-y-3">
                  {[
                    "Containerised workloads with resource isolation prevent noisy-neighbour effects between tenants.",
                    "Static assets and media are served via a global CDN to reduce latency for users in all regions.",
                    "Database replicas in each region provide read scalability and rapid recovery in case of primary failure.",
                  ].map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-gray-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-chabaqa-primary" />
                      <span className="text-base leading-7">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* ── 5. Security Testing & Monitoring ── */}
              <section
                id="security-testing"
                className="scroll-mt-28 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-sm sm:p-7"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  5. Security Testing &amp; Monitoring
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Security is validated continuously — not just at deployment. We maintain an active
                  testing and monitoring programme that covers both code and infrastructure.
                </p>

                <ul className="mt-6 space-y-3">
                  {TESTING_ITEMS.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-gray-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-chabaqa-primary" />
                      <span className="text-base leading-7">{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-xl border border-chabaqa-primary/20 bg-chabaqa-primary/5 p-5">
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-chabaqa-primary" />
                    Responsible Disclosure
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    If you have discovered a potential security vulnerability in Chabaqa, please disclose
                    it responsibly by emailing{" "}
                    <a
                      href="mailto:security@chabaqa.com"
                      className="font-medium text-chabaqa-primary hover:underline"
                    >
                      security@chabaqa.com
                    </a>
                    . We aim to acknowledge every valid report within 48 hours and provide a fix timeline
                    within 7 business days.
                  </p>
                </div>
              </section>

              {/* ── 6. Incident Response ── */}
              <section
                id="incident-response"
                className="scroll-mt-28 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-sm sm:p-7"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  6. Incident Response
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Chabaqa maintains a documented and tested incident response plan. Our security team
                  is on-call 24/7 and follows a structured six-stage process for every security event.
                </p>

                <div className="mt-6 space-y-4">
                  {INCIDENT_STEPS.map(({ step, title, desc }) => (
                    <div key={step} className="flex items-start gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-chabaqa-primary/25 bg-chabaqa-primary/8 text-sm font-bold text-chabaqa-primary">
                        {step}
                      </div>
                      <div className="pt-1">
                        <p className="font-semibold text-gray-900">{title}</p>
                        <p className="mt-0.5 text-sm leading-6 text-gray-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <ul className="mt-6 space-y-3">
                  {[
                    "Personal data breaches are reported to relevant supervisory authorities within 72 hours where required by GDPR.",
                    "Post-mortems are blameless and focused on systemic improvements, not individual fault.",
                    "Major incidents result in a public status update at our status page within 2 hours of confirmation.",
                  ].map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-gray-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-chabaqa-primary" />
                      <span className="text-base leading-7">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* ── 7. Data Residency & Privacy ── */}
              <section
                id="data-residency"
                className="scroll-mt-28 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-sm sm:p-7"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  7. Data Residency &amp; Privacy
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  Chabaqa gives users and enterprise customers control over where their data is stored.
                  We never sell personal data to third parties and limit sub-processor access to what is
                  strictly required to operate the service.
                </p>

                <ul className="mt-4 space-y-3">
                  {[
                    "Users may choose their preferred data storage region: United States, European Union, Middle East & Africa, or Asia Pacific.",
                    "Enterprise customers may enforce a specific region for all community data via contract.",
                    "Data migration between regions is executed asynchronously with zero downtime and full encryption in transit.",
                    "All sub-processors are listed in our Data Processing Agreement and are bound by GDPR-equivalent obligations.",
                    "Chabaqa does not use personal data for advertising or sell it to data brokers under any circumstances.",
                    "California residents may exercise Do Not Sell rights via the Privacy & Security settings page.",
                    "Users may request a full export of their personal data or account deletion at any time — processed within 30 days.",
                  ].map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-gray-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-chabaqa-primary" />
                      <span className="text-base leading-7">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* ── 8. Legal Documents ── */}
              <section
                id="legal-documents"
                className="scroll-mt-28 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-sm sm:p-7"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  8. Legal Documents
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-600">
                  The following documents govern how Chabaqa collects and handles your data, the rules
                  for platform use, and the contractual basis for enterprise data processing.
                </p>

                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {LEGAL_DOCS.map((doc) => (
                    <Link
                      key={doc.title}
                      href={doc.href}
                      className="flex items-start gap-4 rounded-xl border border-gray-200 p-5 transition-all hover:border-chabaqa-primary/30 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-chabaqa-primary/8 border border-chabaqa-primary/15">
                        <FileText className="h-5 w-5 text-chabaqa-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{doc.title}</p>
                        <p className="mt-0.5 text-sm text-gray-500">{doc.desc}</p>
                        <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Updated {doc.updated}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Contact CTA */}
                <div className="mt-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-chabaqa-primary/5 via-white to-chabaqa-secondary2/5 p-6 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-chabaqa-primary/10 border border-chabaqa-primary/15 mb-3">
                    <Mail className="h-6 w-6 text-chabaqa-primary" />
                  </div>
                  <p className="font-semibold text-gray-900">Questions about security or compliance?</p>
                  <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                    Our security team handles vulnerability reports, compliance inquiries, DPA requests,
                    and enterprise security questions.
                  </p>
                  <a
                    href="mailto:security@chabaqa.com"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-chabaqa-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    <Mail className="h-4 w-4" />
                    Contact Security Team
                  </a>
                </div>
              </section>

            </div>
          </article>
        </div>
      </section>

      <Footer />
    </main>
  )
}
