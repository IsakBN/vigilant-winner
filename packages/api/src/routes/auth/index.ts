/**
 * Auth routes index
 *
 * Note: Better Auth routes are mounted directly in index.ts using app.on()
 * as recommended by the official Better Auth + Hono integration docs.
 * See: https://www.better-auth.com/docs/integrations/hono
 */

export { emailAuthRoutes } from './email'
export { githubLinkRoutes } from './github-link'
export { passwordResetRoutes } from './password-reset'
export { verifyEmailRoutes } from './verify-email'
