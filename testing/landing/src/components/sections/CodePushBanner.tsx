import Link from 'next/link'
import { AlertTriangleIcon, ArrowRightIcon } from '../icons'

export function CodePushBanner() {
  return (
    <section className="container-main my-6">
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6 md:p-8 shadow-lg transform -rotate-1 hover:rotate-0 transition-transform">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangleIcon className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-dark">
                CodePush Shut Down March 31, 2025
              </h3>
              <p className="text-text-light">
                Microsoft deprecated CodePush. 100,000+ developers need a new home.
              </p>
            </div>
          </div>

          <div className="flex-1 lg:text-right">
            <Link
              href="/compare/codepush"
              className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 hover:shadow-lg transition-all"
            >
              Migration Guide
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
