/**
 * Releases List Page
 *
 * Displays all releases for an app with filtering and search.
 */

export default function ReleasesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Releases</h2>
                    <p className="text-sm text-neutral-500">
                        Manage OTA releases for your app
                    </p>
                </div>
            </div>
            <p className="text-gray-600">
                Release management will appear here.
            </p>
        </div>
    )
}
