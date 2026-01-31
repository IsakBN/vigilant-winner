import type { Metadata } from 'next'
import { SITE_URL } from './constants'

type PageSEO = {
  title: string
  description: string
  path?: string
  noIndex?: boolean
}

export function generatePageMetadata({ title, description, path = '', noIndex }: PageSEO): Metadata {
  const url = `${SITE_URL}${path}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'BundleNudge',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'BundleNudge - OTA Updates for React Native',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
    alternates: {
      canonical: url,
    },
  }
}

type OrganizationSchema = {
  '@context': string
  '@type': string
  name: string
  url: string
  logo: string
  description: string
}

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BundleNudge',
    url: SITE_URL,
    logo: `${SITE_URL}/logo-icon.svg`,
    description: 'OTA updates for React Native apps. Push JavaScript changes directly to users without App Store review.',
  }
}

type SoftwareSchema = {
  '@context': string
  '@type': string
  name: string
  applicationCategory: string
  operatingSystem: string
  offers: {
    '@type': string
    price: string
    priceCurrency: string
  }
  description: string
}

export function generateSoftwareSchema(): SoftwareSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BundleNudge',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'OTA update service for React Native apps. Push JavaScript updates instantly without App Store review.',
  }
}

type FAQItem = { question: string; answer: string }

type FAQSchema = {
  '@context': string
  '@type': string
  mainEntity: {
    '@type': string
    name: string
    acceptedAnswer: {
      '@type': string
      text: string
    }
  }[]
}

export function generateFAQSchema(items: FAQItem[]): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
