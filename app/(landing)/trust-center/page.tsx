import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Lock,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Server,
  Eye,
  Users,
  Mail,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Trust Center — Chabaqa",
  description:
    "Learn about Chabaqa's security practices, compliance certifications, and how we protect your data.",
}

const complianceItems = [
  {
    name: "SOC 2 Type II",
    status: "in_progress" as const,
    description: "Security, Availability, and Confidentiality controls audit",
    progress: 75,
  },
  {
    name: "GDPR",
    status: "certified" as const,
    description: "General Data Protection Regulation — EU data privacy compliance",
    progress: 100,
  },
  {
    name: "PCI DSS",
    status: "certified" as const,
    description: "Payment Card Industry Data Security Standard",
    progress: 100,
  },
  {
    name: "CCPA",
    status: "certified" as const,
    description: "California Consumer Privacy Act compliance",
    progress: 100,
  },
]

const securityPractices = [
  { icon: Lock, text: "256-bit AES encryption for data at rest" },
  { icon: Lock, text: "TLS 1.3 for all data in transit" },
  { icon: Shield, text: "Multi-factor authentication (MFA)" },
  { icon: Eye, text: "Regular penetration testing" },
  { icon: AlertCircle, text: "Incident response plan" },
  { icon: Users, text: "Employee background checks" },
  { icon: Shield, text: "Security awareness training" },
  { icon: CheckCircle, text: "Annual third-party audits" },
]

const infrastructureItems = [
  {
    icon: Server,
    title: "Multi-Region Infrastructure",
    description:
      "Data stored across EU, US, MEA, and APAC regions with user-controlled residency preferences.",
  },
  {
    icon: Shield,
    title: "Zero-Trust Architecture",
    description:
      "Every request is authenticated and authorized. No implicit trust based on network location.",
  },
  {
    icon: Eye,
    title: "Audit Logging",
    description:
      "All admin actions, data access, and authentication events are logged and retained for compliance.",
  },
  {
    icon: Clock,
    title: "99.9% Uptime SLA",
    description:
      "High-availability infrastructure with automatic failover and real-time monitoring.",
  },
]

export default function TrustCenterPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-5xl mx-auto px-4 py-12 space-y-16">

        {/* ── Hero ── */}
        <section className="text-center space-y-5">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-950/40 mx-auto">
            <Shield className="h-10 w-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Trust Center</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Learn about Chabaqa&apos;s security practices, compliance certifications, and
            how we protect your data.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1.5 text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="h-3.5 w-3.5" />
              GDPR Compliant
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="h-3.5 w-3.5" />
              CCPA Compliant
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-yellow-700 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
              <Clock className="h-3.5 w-3.5" />
              SOC 2 In Progress
            </Badge>
          </div>
        </section>

        {/* ── Compliance Certifications ── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Compliance Certifications</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {complianceItems.map((item) => (
              <Card key={item.name} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-base">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    {item.status === "certified" ? (
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          item.status === "certified"
                            ? "bg-green-500"
                            : "bg-yellow-400"
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.progress}% complete &mdash;{" "}
                      {item.status === "certified" ? "Certified" : "In progress"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Security Practices ── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Security Practices</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {securityPractices.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border"
              >
                <Icon className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-sm leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Infrastructure ── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Infrastructure & Architecture</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {infrastructureItems.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5 text-purple-600" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Documents ── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Legal Documents</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                title: "Privacy Policy",
                subtitle: "Last updated: Jan 2026",
                href: "/privacy-policy",
              },
              {
                title: "Terms of Service",
                subtitle: "Last updated: Jan 2026",
                href: "/terms-of-service",
              },
              {
                title: "Data Processing Agreement",
                subtitle: "For enterprise customers",
                href: "/legal/dpa",
              },
            ].map((doc) => (
              <Link key={doc.title} href={doc.href}>
                <Card className="h-full cursor-pointer hover:shadow-md hover:border-purple-300 transition-all duration-200">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{doc.subtitle}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Contact ── */}
        <section className="rounded-2xl bg-muted/40 border p-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-950/40 mx-auto">
            <Mail className="h-7 w-7 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold">Questions about security?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Contact our security team for vulnerability reports, compliance questions,
            or enterprise security inquiries.
          </p>
          <a href="mailto:security@chabaqa.com">
            <Button size="lg" className="mt-2">
              Contact Security Team
            </Button>
          </a>
        </section>

      </main>

      <Footer />
    </div>
  )
}
