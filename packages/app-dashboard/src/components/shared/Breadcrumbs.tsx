'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-text-light mb-4">
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-text-dark transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-text-dark font-medium">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
