/**
 * Metrics Tracker - Queue-based metrics tracking with automatic batching.
 */
import type { MetricEvent, MetricEventType, VariantInfo, MetricsConfig } from './types'
import { DEFAULT_FLUSH_INTERVAL_MS, DEFAULT_MAX_QUEUE_SIZE } from './types'

export class MetricsTracker {
  private config: MetricsConfig
  private queue: MetricEvent[] = []
  private variant: VariantInfo | null = null
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private isDestroyed = false

  constructor(config: MetricsConfig) {
    this.config = config
    this.startFlushTimer()
  }

  setVariant(variant: VariantInfo): void { this.variant = variant }
  getVariant(): VariantInfo | null { return this.variant }
  isControlGroup(): boolean { return this.variant?.isControl ?? false }

  trackEvent(name: string, value?: number, metadata?: Record<string, unknown>): void {
    this.addToQueue('custom', name, value, metadata)
  }

  trackPerformance(name: string, durationMs: number): void {
    this.addToQueue('performance', name, durationMs)
  }

  async trackCrash(error: Error, metadata?: Record<string, unknown>): Promise<void> {
    const payload = {
      appId: this.config.appId,
      deviceId: this.config.deviceId,
      error: error.message,
      stack: error.stack ?? '',
      metadata: { ...metadata, variantId: this.variant?.id, variantName: this.variant?.name },
      timestamp: new Date().toISOString(),
    }
    await this.sendRequest('/v1/metrics/crash', payload)
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return
    const events = [...this.queue]
    this.queue = []

    const payload = {
      appId: this.config.appId,
      deviceId: this.config.deviceId,
      events,
      variantId: this.variant?.id,
    }

    const success = await this.sendRequest('/v1/metrics/report', payload)
    if (!success) {
      this.queue = [...events, ...this.queue]
      const maxSize = this.config.maxQueueSize ?? DEFAULT_MAX_QUEUE_SIZE
      if (this.queue.length > maxSize * 2) this.queue = this.queue.slice(-maxSize)
    }
  }

  destroy(): void {
    this.isDestroyed = true
    this.stopFlushTimer()
    this.queue = []
    this.variant = null
  }

  private addToQueue(
    type: MetricEventType, name: string, value?: number, metadata?: Record<string, unknown>
  ): void {
    if (this.isDestroyed) return
    this.queue.push({ type, name, value, metadata, timestamp: new Date().toISOString() })
    const maxSize = this.config.maxQueueSize ?? DEFAULT_MAX_QUEUE_SIZE
    if (this.queue.length >= maxSize) void this.flush()
  }

  private startFlushTimer(): void {
    const interval = this.config.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS
    this.flushTimer = setInterval(() => void this.flush(), interval)
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  private async sendRequest(path: string, payload: unknown): Promise<boolean> {
    try {
      const token = this.config.getAccessToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const response = await fetch(`${this.config.apiUrl}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      return response.ok
    } catch (err) {
      if (this.config.debug && typeof console !== 'undefined') {
        console.warn('[BundleNudge] Metrics send failed:', err)
      }
      return false
    }
  }
}
