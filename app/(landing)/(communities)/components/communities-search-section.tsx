import { CommunitiesSearchAndResultsClient } from "./communities-search-and-results-client"
import { Explore } from "@/lib/data-communities"

interface CommunitiesSearchSectionProps {
  communities: Explore[]
}

export function CommunitiesSearchSection({ communities }: CommunitiesSearchSectionProps) {
  return (
    <section id="communities-search" className="py-3 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <h2 className="text-2xl sm:text-1xl font-bold text-chabaqa-primary mb-2">Start Your Perfect Discovery!</h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto mb-3">
            Browse, filter, and connect with what excites you the most
          </p>
        </div>
        <CommunitiesSearchAndResultsClient communities={communities} />
      </div>
    </section>
  )
}
