'use client'

/**
 * ReleaseInfoCard Component
 *
 * Card for version, channel, and description fields in release form.
 */

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    Label,
    Textarea,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    cn,
} from '@bundlenudge/shared-ui'
import type {
    ReleaseFormState,
    ReleaseFormErrors,
    ChannelOption,
} from './types'

interface ReleaseInfoCardProps {
    form: ReleaseFormState
    errors: ReleaseFormErrors
    channels: ChannelOption[]
    onUpdateField: <K extends keyof ReleaseFormState>(
        field: K,
        value: ReleaseFormState[K]
    ) => void
}

export function ReleaseInfoCard({
    form,
    errors,
    channels,
    onUpdateField,
}: ReleaseInfoCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Release Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="version">Version *</Label>
                        <Input
                            id="version"
                            placeholder="1.0.0"
                            value={form.version}
                            onChange={(e) => onUpdateField('version', e.target.value)}
                            className={cn(errors.version && 'border-red-300')}
                        />
                        {errors.version && (
                            <p className="text-sm text-red-600">{errors.version}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="channel">Channel *</Label>
                        <Select
                            value={form.channel}
                            onValueChange={(value) => onUpdateField('channel', value)}
                        >
                            <SelectTrigger className={cn(errors.channel && 'border-red-300')}>
                                <SelectValue placeholder="Select channel" />
                            </SelectTrigger>
                            <SelectContent>
                                {channels.map((channel) => (
                                    <SelectItem
                                        key={channel.id}
                                        value={channel.name.toLowerCase()}
                                    >
                                        {channel.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.channel && (
                            <p className="text-sm text-red-600">{errors.channel}</p>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="What's new in this release..."
                        value={form.description}
                        onChange={(e) => onUpdateField('description', e.target.value)}
                        rows={3}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
