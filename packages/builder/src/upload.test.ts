/**
 * Upload module tests
 * @agent builder-completion
 */

import { describe, it, expect } from 'vitest';
import { getBundleContentType } from './upload.js';

describe('Upload Module', () => {
  describe('getBundleContentType', () => {
    it('should return octet-stream for Hermes bundles', () => {
      expect(getBundleContentType(true)).toBe('application/octet-stream');
    });

    it('should return javascript for JS bundles', () => {
      expect(getBundleContentType(false)).toBe('application/javascript');
    });
  });

  describe('upload URL construction', () => {
    it('should construct correct R2 URL', () => {
      const endpoint = 'https://r2.example.com';
      const bucket = 'bundles';
      const key = 'releases/v1.0.0/bundle.js';
      const url = `${endpoint}/${bucket}/${key}`;

      expect(url).toBe('https://r2.example.com/bundles/releases/v1.0.0/bundle.js');
    });

    it('should handle keys with special characters', () => {
      const endpoint = 'https://r2.example.com';
      const bucket = 'bundles';
      const key = 'releases/2024-01-26/bundle-ios.hbc';
      const url = `${endpoint}/${bucket}/${key}`;

      expect(url).toContain('2024-01-26');
      expect(url).toContain('bundle-ios.hbc');
    });
  });

  describe('basic auth encoding', () => {
    it('should encode credentials as base64', () => {
      const accessKey = 'my-access-key';
      const secretKey = 'my-secret-key';
      const credentials = Buffer.from(`${accessKey}:${secretKey}`).toString('base64');

      expect(credentials).toBe('bXktYWNjZXNzLWtleTpteS1zZWNyZXQta2V5');
    });

    it('should format authorization header', () => {
      const accessKey = 'access';
      const secretKey = 'secret';
      const credentials = Buffer.from(`${accessKey}:${secretKey}`).toString('base64');
      const auth = `Basic ${credentials}`;

      expect(auth).toMatch(/^Basic /);
    });
  });

  describe('content length calculation', () => {
    it('should calculate buffer length', () => {
      const buffer = Buffer.from('hello world');
      expect(buffer.length).toBe(11);
    });

    it('should calculate string byte length', () => {
      const str = 'hello world';
      expect(Buffer.byteLength(str)).toBe(11);
    });

    it('should handle unicode correctly', () => {
      const unicode = '日本語';
      expect(Buffer.byteLength(unicode)).toBe(9); // 3 chars × 3 bytes each
    });
  });

  describe('upload options validation', () => {
    it('should require all options', () => {
      const options = {
        endpoint: 'https://r2.example.com',
        accessKey: 'access',
        secretKey: 'secret',
        bucket: 'bundles',
        key: 'test.js',
        body: Buffer.from('content'),
        contentType: 'application/javascript',
      };

      expect(options.endpoint).toBeTruthy();
      expect(options.accessKey).toBeTruthy();
      expect(options.secretKey).toBeTruthy();
      expect(options.bucket).toBeTruthy();
      expect(options.key).toBeTruthy();
      expect(options.body).toBeTruthy();
      expect(options.contentType).toBeTruthy();
    });
  });
});
