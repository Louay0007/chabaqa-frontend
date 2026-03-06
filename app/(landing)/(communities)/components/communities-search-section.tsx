import { CommunitiesSearchAndResultsClient } from "./communities-search-and-results-client"
import { Explore } from "@/lib/data-communities"
import { useTranslations } from "next-intl"

interface CommunitiesSearchSectionProps {
  communities: Explore[]
}

export function CommunitiesSearchSection({ communities }: CommunitiesSearchSectionProps) {
  const t = useTranslations("landing.explore")

  return (
    <section id="communities-search" className="py-3 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <h2 className="text-2xl sm:text-1xl font-bold text-chabaqa-primary mb-2">{t("searchSectionTitle")}</h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto mb-3">
            {t("searchSectionSubtitle")}
          </p>
        </div>
        <CommunitiesSearchAndResultsClient communities={communities} />
      </div>
    </section>
  )
}
