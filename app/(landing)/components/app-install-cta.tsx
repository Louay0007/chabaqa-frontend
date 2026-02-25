"use client"

import Image from "next/image"

export function AppInstallCTA() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Container with border */}
        <div className="relative w-full border-4 border-gray-200 rounded-2xl overflow-hidden">
          <Image
            src="/app-install-banner.png"
            alt="Get Chabaqa App"
            width={1920}
            height={600}
            className="w-full h-auto"
            priority={false}
          />

          {/* Buttons - Bottom Left */}
          <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 lg:bottom-10 lg:left-10 z-10">
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="bg-white hover:opacity-90 rounded-lg overflow-hidden shadow-xl hover:scale-105 transition-all duration-300">
                <Image
                  src="/app store.png"
                  alt="Download on App Store"
                  width={370}
                  height={111}
                  className="w-auto h-10 sm:h-12 lg:h-14"
                />
              </button>
              <button className="bg-white hover:opacity-90 rounded-lg overflow-hidden shadow-xl hover:scale-105 transition-all duration-300">
                <Image
                  src="/play store.png"
                  alt="Get it on Google Play"
                  width={370}
                  height={111}
                  className="w-auto h-10 sm:h-12 lg:h-14"
                />
              </button>
              <button className="bg-white hover:opacity-90 rounded-lg overflow-hidden shadow-xl hover:scale-105 transition-all duration-300">
                <Image
                  src="/app gallery.png"
                  alt="Get it on App Gallery"
                  width={370}
                  height={111}
                  className="w-auto h-10 sm:h-12 lg:h-14"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
