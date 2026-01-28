import { Header } from "@/components/header"
import { Hero } from "@/app/(landing)/components/hero"
import { Features } from "@/app/(landing)/components/features"
import { HowItWorks } from "@/app/(landing)/components/how-it-works"
import { Pricing } from "@/app/(landing)/components/pricing"
import { Resources } from "@/app/(landing)/components/resources"
import { About } from "@/app/(landing)/components/about"
import { Footer } from "@/components/footer"
import { Team } from "@/app/(landing)/components/team"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <About/>
      <Features />
      <Pricing />
      {/* <Team /> */}
      {/* <Resources /> */}
      {/* <HowItWorks /> */}
      <Footer />
    </main>
  )
}
