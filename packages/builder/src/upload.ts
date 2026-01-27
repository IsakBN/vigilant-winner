/**
 * R2 Upload Utility
 *
 * Uploads files to Cloudflare R2 using S3-compatible API.
 */

import type { UploadOptions } from './types.js';

/**
 * Upload a file to Cloudflare R2
 *
 * Uses the S3-compatible PUT API directly to avoid
 * the heavyweight AWS SDK dependency.
 */
export async function uploadToR2(options: UploadOptions): Promise<void> {
  const { endpoint, accessKey, secretKey, bucket, key, body, contentType } = options;

  const url = `${endpoint}/${bucket}/${key}`;
  const date = new Date().toUTCString();
  const contentLength = typeof body === 'string' ? Buffer.byteLength(body) : body.length;

  // Simple signature for R2 (AWS Signature v4 would be more robust)
  // For production, consider using @aws-sdk/client-s3
  const authorization = createBasicAuth(accessKey, secretKey);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(contentLength),
      'Date': date,
      'Authorization': authorization,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`R2 upload failed: ${String(response.status)} ${text}`);
  }
}

function createBasicAuth(accessKey: string, secretKey: string): string {
  const credentials = Buffer.from(`${accessKey}:${secretKey}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Get the content type for a bundle file
 */
export function getBundleContentType(isHermes: boolean): string {
  return isHermes ? 'application/octet-stream' : 'application/javascript';
}
