import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react"
import { siteData } from "@/lib/data"

const iconMap = {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
}

export function Footer() {
  return (
    <footer className="bg-gradient-to-t from-pink-100 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Brand & Social */}
          <div className="lg:col-span-1 text-center lg:text-left">
            <Link href="/" className="mb-4 block" aria-label={siteData.brand.name}>
              <Image
                src="/Logos/PNG/frensh1.png"
                alt="Chabaqa Logo"
                width={150}
                height={28}
                priority
                style={{ objectFit: "contain" }}
              />
            </Link>
            <p className="mt-1 text-gray-600 dark:text-gray-400 max-w-md mx-auto lg:mx-0">
              {siteData.footer.description}
            </p>
            <div className="mt-6 flex justify-center lg:justify-start space-x-4">
              {siteData.footer.social.map((social, index) => {
                const Icon = iconMap[social.icon as keyof typeof iconMap]
                return (
                  <Link
                    key={index}
                    href={social.href}
                    className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <Icon className="h-6 w-6" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Links Row (Features / Product / Company) */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-3 text-center lg:text-left">
              {/* Features */}
              <div>
                <h3 className="text-sm font-semibold">Features</h3>
                <ul className="mt-4 space-y-3" role="list">
                  {/* @ts-ignore */}
                  {siteData.footer.links.features && siteData.footer.links.features.map((link: any, index: number) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Product */}
              <div>
                <h3 className="text-sm font-semibold">Product</h3>
                <ul className="mt-4 space-y-3" role="list">
                  {siteData.footer.links.product.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="text-sm font-semibold">Company</h3>
                <ul className="mt-4 space-y-3" role="list">
                  {siteData.footer.links.company.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-base text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-12 border-t border-gray-900/10 dark:border-white/10 pt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} {siteData.brand.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
