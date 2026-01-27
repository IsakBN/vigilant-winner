/**
 * Apple Code Signing utilities
 *
 * Handles keychain management and signing configuration for iOS builds.
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from './exec.js';
import type { SigningConfig, SigningInfo } from './types.js';

/**
 * Set up code signing for a build
 */
export async function setupSigning(config: SigningConfig): Promise<SigningInfo> {
  const { credentials, buildDir, bundleId, exportMethod } = config;

  // Create a temporary keychain for this build
  const keychainPassword = crypto.randomBytes(16).toString('hex');
  const keychainPath = path.join(buildDir, 'build.keychain-db');

  // Create and configure keychain
  await exec(`security create-keychain -p "${keychainPassword}" "${keychainPath}"`);
  await exec(`security set-keychain-settings -lut 21600 "${keychainPath}"`);
  await exec(`security unlock-keychain -p "${keychainPassword}" "${keychainPath}"`);

  // Add to search list
  const searchList = await exec('security list-keychains -d user');
  const existingKeychains = searchList.stdout.trim();
  await exec(
    `security list-keychains -d user -s "${keychainPath}" ${existingKeychains}`
  );

  // Paths for signing artifacts
  const profilePath = path.join(buildDir, 'build.mobileprovision');
  const certificatePath = path.join(buildDir, 'certificate.p12');

  // Generate export options plist
  const exportOptionsPlist = generateExportOptions({
    teamId: credentials.teamId,
    bundleId,
    exportMethod,
  });

  // Build settings for xcodebuild
  const buildSettings = [
    `DEVELOPMENT_TEAM=${credentials.teamId}`,
    `PRODUCT_BUNDLE_IDENTIFIER=${bundleId}`,
  ].join(' ');

  return {
    keychainPath,
    keychainPassword,
    profilePath,
    certificatePath,
    teamId: credentials.teamId,
    buildSettings,
    exportOptionsPlist,
  };
}

/**
 * Clean up signing resources
 */
export async function cleanupSigning(info: SigningInfo): Promise<void> {
  try {
    await exec(`security delete-keychain "${info.keychainPath}"`);
  } catch (error) {
    console.warn('Failed to delete keychain:', error);
  }

  // Clean up files (ignore errors)
  try {
    await fs.unlink(info.profilePath).catch((): void => undefined);
    await fs.unlink(info.certificatePath).catch((): void => undefined);
  } catch {
    // Ignore file deletion errors
  }
}

/**
 * Generate ExportOptions.plist content
 */
export function generateExportOptions(config: {
  teamId: string;
  bundleId: string;
  exportMethod: string;
}): string {
  const { teamId, exportMethod } = config;

  // Map export method names to Apple's
  const methodMap: Record<string, string> = {
    'ad-hoc': 'ad-hoc',
    'development': 'development',
    'app-store': 'app-store',
    'enterprise': 'enterprise',
  };

  const method = methodMap[exportMethod] || 'ad-hoc';

  // Determine signing style (automatic for app-store, manual for others)
  const signingStyle = exportMethod === 'app-store' ? 'automatic' : 'manual';

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>${method}</string>
    <key>teamID</key>
    <string>${teamId}</string>
    <key>signingStyle</key>
    <string>${signingStyle}</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>`;
}
