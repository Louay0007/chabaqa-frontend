import type React from "react";

export const metadata = {
  title: "Start Your Free Trial – Chabaqa",
  description: "Activate your 7-day free trial and start building your community.",
};

export default function OnboardingTrialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {children}
    </div>
  );
}
