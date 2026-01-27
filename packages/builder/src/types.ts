/**
 * Builder type definitions
 */

export interface BuildConfig {
  repo: string;
  commitSha: string;
  githubToken: string;
  bundleKey: string;
  releaseId: string;
  callbackUrl: string;
  buildFolder: string;
  r2: R2Config;
}

export interface R2Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export interface BuildResult {
  success: boolean;
  bundleSize: number;
  hermesCompiled: boolean;
  error?: string;
}

export interface HermesConfig {
  enabled: boolean;
  compilerPath: string | null;
}

export interface HermesResult {
  compiled: boolean;
  outputPath: string;
  originalSize: number;
  compiledSize: number;
}

export interface UploadOptions {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  key: string;
  body: Buffer | string;
  contentType: string;
}

export type Platform = 'ios' | 'android';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

/** Hermes bytecode magic bytes: c6 1f bc 03 */
export const HERMES_MAGIC = Buffer.from([0xc6, 0x1f, 0xbc, 0x03]);
