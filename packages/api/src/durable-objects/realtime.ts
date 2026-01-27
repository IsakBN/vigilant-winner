/**
 * Realtime Durable Object
 *
 * Manages WebSocket connections for real-time updates.
 * Clients connect via WebSocket to receive live status updates for:
 * - Build progress
 * - Upload progress
 * - Release rollout changes
 *
 * @agent websocket-realtime
 * @created 2026-01-27
 */

import type { Env } from '../types/env'

// =============================================================================
// Types
// =============================================================================

interface SessionInfo {
  userId: string
  subscriptions: Set<string>
  connectedAt: number
}

interface SubscribeMessage {
  type: 'subscribe'
  resource: string
  id: string
}

interface UnsubscribeMessage {
  type: 'unsubscribe'
  resource: string
  id: string
}

interface PingMessage {
  type: 'ping'
}

type ClientMessage = SubscribeMessage | UnsubscribeMessage | PingMessage

export interface BroadcastUpdate {
  type: 'build_status' | 'upload_progress' | 'release_rollout'
  resource: string
  id: string
  data: unknown
}

// =============================================================================
// Durable Object
// =============================================================================

export class RealtimeDO implements DurableObject {
  private sessions: Map<WebSocket, SessionInfo>
  private state: DurableObjectState

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state
    this.sessions = new Map()

    // Restore any WebSocket connections from hibernation
    this.state.getWebSockets().forEach((ws) => {
      const attachment = ws.deserializeAttachment() as SessionInfo | null
      if (attachment) {
        this.sessions.set(ws, {
          ...attachment,
          subscriptions: new Set(attachment.subscriptions),
        })
      }
    })
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Handle WebSocket upgrade
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader === 'websocket') {
      return this.handleWebSocketUpgrade(request)
    }

    // Handle broadcast messages from API
    if (request.method === 'POST' && url.pathname === '/broadcast') {
      return this.handleBroadcast(request)
    }

    // Handle session count request
    if (request.method === 'GET' && url.pathname === '/sessions') {
      return Response.json({ count: this.sessions.size })
    }

    return new Response('Expected WebSocket or POST /broadcast', { status: 400 })
  }

  /**
   * Handle WebSocket upgrade request
   */
  private handleWebSocketUpgrade(request: Request): Response {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return new Response('Missing userId parameter', { status: 400 })
    }

    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]

    const sessionInfo: SessionInfo = {
      userId,
      subscriptions: new Set(),
      connectedAt: Date.now(),
    }

    // Accept the WebSocket with hibernation support
    this.state.acceptWebSocket(server)

    // Serialize attachment for hibernation recovery
    server.serializeAttachment({
      userId: sessionInfo.userId,
      subscriptions: Array.from(sessionInfo.subscriptions),
      connectedAt: sessionInfo.connectedAt,
    })

    this.sessions.set(server, sessionInfo)

    // Send welcome message
    server.send(JSON.stringify({
      type: 'connected',
      sessionId: crypto.randomUUID(),
      timestamp: Date.now(),
    }))

    return new Response(null, { status: 101, webSocket: client })
  }

  /**
   * Handle incoming WebSocket messages
   */
  webSocketMessage(ws: WebSocket, message: ArrayBuffer | string): void {
    const session = this.sessions.get(ws)
    if (!session) {
      ws.close(1011, 'Session not found')
      return
    }

    try {
      const data = JSON.parse(
        typeof message === 'string' ? message : new TextDecoder().decode(message)
      ) as ClientMessage

      this.handleClientMessage(ws, session, data)
    } catch {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
      }))
    }
  }

  /**
   * Handle WebSocket close
   */
  webSocketClose(ws: WebSocket, _code: number, _reason: string): void {
    this.sessions.delete(ws)
  }

  /**
   * Handle WebSocket error
   */
  webSocketError(ws: WebSocket, _error: unknown): void {
    this.sessions.delete(ws)
    ws.close(1011, 'WebSocket error')
  }

  /**
   * Process client messages
   */
  private handleClientMessage(
    ws: WebSocket,
    session: SessionInfo,
    data: ClientMessage
  ): void {
    switch (data.type) {
      case 'subscribe':
        this.handleSubscribe(ws, session, data)
        break
      case 'unsubscribe':
        this.handleUnsubscribe(ws, session, data)
        break
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
        break
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type',
        }))
    }
  }

  /**
   * Subscribe to resource updates
   */
  private handleSubscribe(
    ws: WebSocket,
    session: SessionInfo,
    data: SubscribeMessage
  ): void {
    const resourceKey = `${data.resource}:${data.id}`
    session.subscriptions.add(resourceKey)

    // Update serialized attachment for hibernation
    ws.serializeAttachment({
      userId: session.userId,
      subscriptions: Array.from(session.subscriptions),
      connectedAt: session.connectedAt,
    })

    ws.send(JSON.stringify({
      type: 'subscribed',
      resource: data.resource,
      id: data.id,
    }))
  }

  /**
   * Unsubscribe from resource updates
   */
  private handleUnsubscribe(
    ws: WebSocket,
    session: SessionInfo,
    data: UnsubscribeMessage
  ): void {
    const resourceKey = `${data.resource}:${data.id}`
    session.subscriptions.delete(resourceKey)

    // Update serialized attachment for hibernation
    ws.serializeAttachment({
      userId: session.userId,
      subscriptions: Array.from(session.subscriptions),
      connectedAt: session.connectedAt,
    })

    ws.send(JSON.stringify({
      type: 'unsubscribed',
      resource: data.resource,
      id: data.id,
    }))
  }

  /**
   * Handle broadcast request from API
   */
  private async handleBroadcast(request: Request): Promise<Response> {
    try {
      const update = (await request.json()) as BroadcastUpdate
      const resourceKey = `${update.resource}:${update.id}`
      let sentCount = 0

      for (const [ws, session] of this.sessions) {
        if (session.subscriptions.has(resourceKey)) {
          try {
            ws.send(JSON.stringify({
              messageType: 'update',
              updateType: update.type,
              resource: update.resource,
              id: update.id,
              data: update.data,
              timestamp: Date.now(),
            }))
            sentCount++
          } catch {
            // WebSocket might be closed, clean up
            this.sessions.delete(ws)
          }
        }
      }

      return Response.json({ sent: sentCount })
    } catch {
      return Response.json({ error: 'Invalid broadcast payload' }, { status: 400 })
    }
  }
}
