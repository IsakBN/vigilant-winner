'use client'

/**
 * DevicesInfoCard Component
 *
 * Information card explaining keyless authentication for devices.
 */

import { Card, CardContent } from '@bundlenudge/shared-ui'

export function DevicesInfoCard() {
    return (
        <Card className="bg-neutral-50 border-neutral-200">
            <CardContent className="py-4">
                <h3 className="font-medium text-neutral-900 mb-2">
                    About Keyless Authentication
                </h3>
                <p className="text-sm text-neutral-600">
                    Devices using keyless SDK authentication automatically register on
                    first app launch. Each device receives a unique token that allows it
                    to check for and download updates without embedding API keys in your
                    app. You can revoke access for any device if needed.
                </p>
            </CardContent>
        </Card>
    )
}
