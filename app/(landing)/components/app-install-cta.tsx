"use client"

import Image from "next/image"

export function AppInstallCTA() {
  return (
    <section className="relative w-full h-[250px] sm:h-[300px] lg:h-[350px] overflow-hidden">
      {/* Background Banner Image 2400x800 */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/app-install-banner.png"
          alt="Get Chabaqa App"
          fill
          className="object-cover object-center"
          priority={false}
        />
      </div>

      {/* Buttons - Bottom Left */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full ml-10">
        <div className="h-full flex items-end pb-6 sm:pb-8 lg:pb-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="bg-white hover:opacity-90 transition-opacity duration-300 rounded-lg overflow-hidden shadow-xl hover:scale-105 transform transition-transform">
              <Image
                src="/app store.png"
                alt="Download on App Store"
                width={370}
                height={111}
                className="w-auto h-12 sm:h-14"
              />
            </button>
            <button className="bg-white hover:opacity-90 transition-opacity duration-300 rounded-lg overflow-hidden shadow-xl hover:scale-105 transform transition-transform">
              <Image
                src="/play store.png"
                alt="Get it on Google Play"
                width={370}
                height={111}
                className="w-auto h-12 sm:h-14"
              />
            </button>
                        <button className="bg-white hover:opacity-90 transition-opacity duration-300 rounded-lg overflow-hidden shadow-xl hover:scale-105 transform transition-transform">
              <Image
                src="/app gallery.png"
                alt="Get it on app gallery"
                width={370}
                height={111}
                className="w-auto h-12 sm:h-14"
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
