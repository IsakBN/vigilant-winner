/**
 * Hermes Bytecode Compilation
 *
 * Compiles JavaScript bundles to Hermes bytecode (.hbc) for faster
 * startup times on mobile devices.
 */

import { spawn, type ChildProcess } from 'child_process';
import { existsSync, statSync, unlinkSync, renameSync } from 'fs';
import { join } from 'path';
import type { HermesConfig, HermesResult, Platform } from './types.js';

const HERMES_PATHS = {
  ios: 'ios/Pods/hermes-engine/destroot/bin/hermesc',
  android: {
    osx: 'node_modules/react-native/sdks/hermesc/osx-bin/hermesc',
    linux: 'node_modules/react-native/sdks/hermesc/linux64-bin/hermesc',
    win: 'node_modules/react-native/sdks/hermesc/win64-bin/hermesc',
  },
} as const;

/**
 * Detect Hermes compiler location in the project
 */
export function detectHermesCompiler(
  projectDir: string,
  platform: Platform = 'ios'
): HermesConfig {
  // Try iOS path first
  const iosPath = join(projectDir, HERMES_PATHS.ios);
  if (existsSync(iosPath)) {
    return { enabled: true, compilerPath: iosPath };
  }

  // Try Android paths based on OS
  const osType = process.platform;
  const androidPath = getAndroidHermesPath(projectDir, osType);
  if (androidPath && existsSync(androidPath)) {
    return { enabled: true, compilerPath: androidPath };
  }

  // Hermes not found
  console.log(`   Hermes compiler not found for platform: ${platform}`);
  return { enabled: false, compilerPath: null };
}

function getAndroidHermesPath(
  projectDir: string,
  osType: NodeJS.Platform
): string | null {
  const paths = HERMES_PATHS.android;
  switch (osType) {
    case 'darwin':
      return join(projectDir, paths.osx);
    case 'linux':
      return join(projectDir, paths.linux);
    case 'win32':
      return join(projectDir, paths.win);
    default:
      return null;
  }
}

/**
 * Compile a JavaScript bundle to Hermes bytecode
 */
export async function compileToHermes(
  bundlePath: string,
  hermesConfig: HermesConfig
): Promise<HermesResult> {
  if (!hermesConfig.enabled || !hermesConfig.compilerPath) {
    return createSkippedResult(bundlePath);
  }

  if (!existsSync(bundlePath)) {
    throw new Error(`Bundle file not found: ${bundlePath}`);
  }

  const originalSize = statSync(bundlePath).size;
  const outputPath = bundlePath.replace(/\.js$/, '.hbc');

  console.log('   Compiling bundle with Hermes...');
  console.log(`   Input: ${bundlePath}`);
  console.log(`   Output: ${outputPath}`);

  await runHermesc(hermesConfig.compilerPath, bundlePath, outputPath);

  if (!existsSync(outputPath)) {
    throw new Error('Hermes compilation failed: output file not created');
  }

  const compiledSize = statSync(outputPath).size;

  // Remove original .js file and rename .hbc to .js
  // This ensures consistent bundle naming for the SDK
  unlinkSync(bundlePath);
  renameSync(outputPath, bundlePath);

  console.log(`   Hermes compilation complete`);
  console.log(`   Size: ${formatBytes(originalSize)} -> ${formatBytes(compiledSize)}`);

  return {
    compiled: true,
    outputPath: bundlePath,
    originalSize,
    compiledSize,
  };
}

function createSkippedResult(bundlePath: string): HermesResult {
  const size = existsSync(bundlePath) ? statSync(bundlePath).size : 0;
  return {
    compiled: false,
    outputPath: bundlePath,
    originalSize: size,
    compiledSize: size,
  };
}

function runHermesc(
  compilerPath: string,
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['-emit-binary', '-out', outputPath, inputPath];
    console.log(`   $ ${compilerPath} ${args.join(' ')}`);

    const child: ChildProcess = spawn(compilerPath, args, {
      stdio: 'inherit',
      shell: false,
    });

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Hermes compilation timed out (60s)'));
    }, 60000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Hermes compilation failed with exit code ${String(code ?? 'unknown')}`));
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/**
 * Check if a buffer contains Hermes bytecode
 */
export function isHermesBytecode(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  // Hermes magic bytes: c6 1f bc 03
  return (
    buffer[0] === 0xc6 &&
    buffer[1] === 0x1f &&
    buffer[2] === 0xbc &&
    buffer[3] === 0x03
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
