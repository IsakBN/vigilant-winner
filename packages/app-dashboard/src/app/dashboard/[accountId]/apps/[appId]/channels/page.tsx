/**
 * Channels List Page
 *
 * Displays all channels for an app with the ability to create new ones.
 */

export default function ChannelsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-neutral-900">Channels</h1>
                    <p className="text-sm text-neutral-500">
                        Manage release channels for different environments
                    </p>
                </div>
            </div>
            <p className="text-gray-600">
                Channel management will appear here.
            </p>
        </div>
    )
}
