'use client'

/**
 * EmptyAppState Component
 *
 * Displayed when no apps exist or when filters return no results.
 */

import { Button } from '@bundlenudge/shared-ui'
import { PhoneIcon } from '@/components/icons'

interface EmptyAppStateProps {
    type: 'no-apps' | 'no-results'
    onCreateApp?: () => void
    onClearFilters?: () => void
}

function NoAppsState({ onCreateApp }: { onCreateApp?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            {/* Icon Container */}
            <div className="w-20 h-20 rounded-2xl bg-soft-yellow/50 flex items-center justify-center mb-6">
                <PhoneIcon className="w-10 h-10 text-text-dark" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-text-dark mb-2">
                Create your first app
            </h3>

            {/* Description */}
            <p className="text-text-light text-center max-w-md mb-6">
                Get started by creating an app. Once created, you can push OTA
                updates directly to your React Native users.
            </p>

            {/* CTA Button */}
            {onCreateApp && (
                <Button onClick={onCreateApp} size="lg">
                    Create App
                </Button>
            )}
        </div>
    )
}

function NoResultsState({ onClearFilters }: { onClearFilters?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            {/* Icon Container */}
            <div className="w-20 h-20 rounded-2xl bg-neutral-100 flex items-center justify-center mb-6">
                <svg
                    className="w-10 h-10 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-text-dark mb-2">
                No apps found
            </h3>

            {/* Description */}
            <p className="text-text-light text-center max-w-md mb-6">
                No apps match your current filters. Try adjusting your search or
                platform filter.
            </p>

            {/* Clear Filters Button */}
            {onClearFilters && (
                <Button variant="outline" onClick={onClearFilters}>
                    Clear filters
                </Button>
            )}
        </div>
    )
}

export function EmptyAppState({
    type,
    onCreateApp,
    onClearFilters,
}: EmptyAppStateProps) {
    if (type === 'no-results') {
        return <NoResultsState onClearFilters={onClearFilters} />
    }

    return <NoAppsState onCreateApp={onCreateApp} />
}
