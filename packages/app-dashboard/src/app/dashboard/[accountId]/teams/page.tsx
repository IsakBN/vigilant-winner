/**
 * Teams List Page
 *
 * Main page displaying all teams for an account.
 */

export default function TeamsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Teams</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your teams and collaborate with others.
                    </p>
                </div>
            </div>
            <p className="text-gray-600">
                Team management will appear here.
            </p>
        </div>
    )
}
