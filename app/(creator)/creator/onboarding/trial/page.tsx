'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PLANS,
  PLAN_TIERS,
  PLAN_ICONS,
  TIER_THEMES,
  formatLimit,
  getPlanPrice,
  type PlanTier,
} from "@/lib/plans/plan-config";
import {
  subscriptionApi,
} from "@/lib/api/subscription.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  PartyPopper,
  Users,
  BookOpen,
  Mail,
  Loader2,
  Shield,
} from "lucide-react";

// ── Step type ────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3;

// ── Page ─────────────────────────────────────────────────────────────────

export default function OnboardingTrialPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skippedPayment, setSkippedPayment] = useState(false);

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7);

  // ── Start trial handler ────────────────────────────────────────────

  const handleStartTrial = async (tier: PlanTier) => {
    setError(null);
    setIsStarting(true);
    setSelectedTier(tier);
    try {
      await subscriptionApi.startTrial();
      setStep(2);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to start trial. Please try again.";
      setError(message);
    } finally {
      setIsStarting(false);
    }
  };

  // ── Step indicators ────────────────────────────────────────────────

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`
              flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-300
              ${
                s === step
                  ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/25"
                  : s < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }
            `}
          >
            {s < step ? <Check className="h-4 w-4" /> : s}
          </div>
          {s < 3 && (
            <div
              className={`w-12 sm:w-20 h-0.5 rounded-full transition-colors duration-300 ${
                s < step ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // ── Step 1: Plan Selection ─────────────────────────────────────────

  const PlanSelectionStep = () => (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          7-day free trial · No credit card required
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Chabaqa
          </span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Choose the plan that fits your vision. Every plan includes a free 7-day trial
          so you can explore everything risk-free.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {PLAN_TIERS.map((tier) => {
          const plan = PLANS[tier];
          const theme = TIER_THEMES[tier];
          const TierIcon = PLAN_ICONS[tier];
          const isPopular = plan.highlight;
          const monthlyPrice = getPlanPrice(tier, "monthly");
          const yearlyPrice = getPlanPrice(tier, "yearly");

          return (
            <Card
              key={tier}
              className={`relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                isPopular ? `ring-2 ring-primary shadow-lg ${theme.border}` : "hover:shadow-md"
              }`}
            >
              {/* Popular ribbon */}
              {isPopular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-3 py-1 text-xs font-semibold">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2.5 rounded-xl ${theme.bg}`}>
                    <TierIcon className={`h-5 w-5 ${theme.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {plan.transactionFee}% transaction fee
                    </CardDescription>
                  </div>
                </div>

                {/* Price */}
                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">{monthlyPrice}</span>
                    <span className="text-muted-foreground text-sm">TND/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    or {yearlyPrice} TND/mo billed yearly ({plan.yearlyTotal} TND/yr)
                  </p>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Limits */}
                <ul className="space-y-2.5 text-sm flex-1 mb-6">
                  <FeatureRow>
                    {formatLimit(plan.limits.membersMax)} members
                  </FeatureRow>
                  <FeatureRow>{plan.limits.storageGB} GB storage</FeatureRow>
                  <FeatureRow>
                    {formatLimit(plan.limits.coursesActivationMax)} active courses
                  </FeatureRow>
                  <FeatureRow>{plan.limits.adminsMax} admin seat{plan.limits.adminsMax > 1 ? "s" : ""}</FeatureRow>
                  {plan.features.challenges && <FeatureRow>Challenges</FeatureRow>}
                  {plan.features.sessions && <FeatureRow>1:1 Sessions</FeatureRow>}
                  {plan.features.events && <FeatureRow>Events</FeatureRow>}
                  {plan.features.branding && <FeatureRow>Remove Chabaqa branding</FeatureRow>}
                  {plan.features.gamification && <FeatureRow>Gamification</FeatureRow>}
                </ul>

                {/* CTA */}
                <Button
                  className={`w-full font-semibold ${
                    isPopular
                      ? "bg-gradient-to-r " + theme.gradient + " hover:opacity-90 text-white"
                      : ""
                  }`}
                  size="lg"
                  variant={isPopular ? "default" : "outline"}
                  onClick={() => handleStartTrial(tier)}
                  disabled={isStarting}
                >
                  {isStarting && selectedTier === tier ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting trial…
                    </>
                  ) : (
                    <>
                      Start 7-day Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trust note */}
      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <Shield className="h-3.5 w-3.5" />
        No credit card required · Cancel anytime · Full access during trial
      </p>
    </div>
  );

  // ── Step 2: Payment Method (Optional) ──────────────────────────────

  const PaymentStep = () => (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold">
          Add Payment Method{" "}
          <span className="text-muted-foreground font-normal text-lg">(Optional)</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Add your card now to seamlessly continue after your trial. No charge until your trial ends.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">
              Your {selectedTier ? PLANS[selectedTier].name : ""} trial is active!
            </p>
            <p>
              Trial ends on{" "}
              <span className="font-semibold text-foreground">
                {trialEndDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full" asChild>
              <Link href="/creator/plan/billing/add-card">
                <CreditCard className="mr-2 h-4 w-4" />
                Add Card
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                setSkippedPayment(true);
                setStep(3);
              }}
            >
              Skip for now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ── Step 3: Success ────────────────────────────────────────────────

  const SuccessStep = () => {
    const planName = selectedTier ? PLANS[selectedTier].name : "Starter";

    const checklist = [
      { icon: Users, label: "Create your first community" },
      { icon: BookOpen, label: "Upload a course" },
      { icon: Mail, label: "Invite members" },
      ...(skippedPayment
        ? [{ icon: CreditCard, label: "Set up your payment method" }]
        : []),
    ];

    return (
      <div className="max-w-lg mx-auto space-y-8 text-center">
        {/* Celebration */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/25 mx-auto">
            <PartyPopper className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Your 7-day trial has started! 🎉
          </h2>
          <p className="text-muted-foreground">
            You&apos;re on the <span className="font-semibold text-foreground">{planName}</span> plan.
            Your trial ends on{" "}
            <span className="font-semibold text-foreground">
              {trialEndDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            .
          </p>
        </div>

        {/* Checklist Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-left">What to do next:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-left">
              {checklist.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                      <ItemIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-white font-semibold"
          onClick={() => router.push("/creator/dashboard")}
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  };

  // ── Main Render ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link href="/" className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Chabaqa
          </Link>
          {step > 1 && step < 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => (s - 1) as WizardStep)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
        <StepIndicator />

        {step === 1 && <PlanSelectionStep />}
        {step === 2 && <PaymentStep />}
        {step === 3 && <SuccessStep />}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        <p>
          By starting a trial you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}

// ── Tiny helper ──────────────────────────────────────────────────────────

function FeatureRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
      <span>{children}</span>
    </li>
  );
}
