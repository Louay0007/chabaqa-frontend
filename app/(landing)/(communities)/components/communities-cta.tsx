import { Card, CardContent } from "@/components/ui/card"
import { LayoutGrid, Zap, BadgeDollarSign } from "lucide-react"
import { CommunitiesCTAClient } from "./communities-cta-client"

export function CommunitiesCTA() {
  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl mx-auto rounded-3xl bg-white p-6 sm:p-10 shadow-2xl shadow-purple-200/40 border border-gray-100">
          <div className="relative z-10 flex flex-col items-center text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">Ready to Start Your Own Community?</h2>
            <p className="max-w-2xl text-base sm:text-lg text-gray-600 mb-8">
              Join thousands of creators building thriving communities and generating meaningful income with Chabaqa.
            </p>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-100 mb-3 text-purple-600">
                  <LayoutGrid className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Build</h3>
                <p className="text-sm text-gray-500">Invite members</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-pink-100 mb-3 text-pink-600">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Engage</h3>
                <p className="text-sm text-gray-500">Share & host</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-3 text-indigo-600">
                  <BadgeDollarSign className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Monetize</h3>
                <p className="text-sm text-gray-500">Earn revenue</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button className="w-full sm:w-auto bg-gradient-to-br from-purple-600 to-pink-500 text-white font-semibold px-7 py-2.5 rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-xl hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5">
                Create Your Community
              </button>
              <button className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 font-semibold px-7 py-2.5 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300 ease-in-out">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
