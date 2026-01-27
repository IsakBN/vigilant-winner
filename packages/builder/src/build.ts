/**
 * BundleNudge Builder
 *
 * Builds React Native bundles with optional Hermes bytecode compilation.
 *
 * Environment variables:
 *   REPO          - GitHub repo (owner/repo)
 *   COMMIT_SHA    - Git commit to build
 *   GITHUB_TOKEN  - Token for cloning private repos
 *   BUNDLE_KEY    - R2 key for uploading bundle
 *   RELEASE_ID    - Release ID for callback
 *   CALLBACK_URL  - API URL to call when done
 *   BUILD_FOLDER  - Subdirectory for monorepos
 *   ENABLE_HERMES - Set to 'true' to enable Hermes compilation
 */

import { spawn, type ChildProcess } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { detectHermesCompiler, compileToHermes } from './hermes.js';
import { uploadToR2, getBundleContentType } from './upload.js';
import type { BuildConfig, BuildResult, PackageManager } from './types.js';

const WORK_DIR = '/tmp/build';
const BUILD_TIMEOUT_MS = 5 * 60 * 1000;
const startTime = Date.now();

function loadConfig(): BuildConfig {
  return {
    repo: process.env.REPO ?? '',
    commitSha: process.env.COMMIT_SHA ?? '',
    githubToken: process.env.GITHUB_TOKEN ?? '',
    bundleKey: process.env.BUNDLE_KEY ?? '',
    releaseId: process.env.RELEASE_ID ?? '',
    callbackUrl: process.env.CALLBACK_URL ?? '',
    buildFolder: process.env.BUILD_FOLDER ?? '',
    r2: {
      endpoint: process.env.R2_ENDPOINT ?? '',
      accessKey: process.env.R2_ACCESS_KEY ?? '',
      secretKey: process.env.R2_SECRET_KEY ?? '',
      bucket: process.env.R2_BUCKET ?? '',
    },
  };
}

export async function build(): Promise<BuildResult> {
  const config = loadConfig();
  const appDir = config.buildFolder ? join(WORK_DIR, config.buildFolder) : WORK_DIR;
  const bundleOutput = join(appDir, 'bundle.js');

  console.log('BundleNudge Builder starting...');
  console.log(`   Repo: ${config.repo}`);
  console.log(`   Commit: ${config.commitSha}`);
  console.log(`   Release: ${config.releaseId}`);

  try {
    validateConfig(config);
    await cloneRepo(config);
    await installDependencies(appDir);
    await buildBundle(appDir, bundleOutput);

    // Hermes compilation
    const hermesEnabled = process.env.ENABLE_HERMES === 'true';
    const hermesConfig = hermesEnabled ? detectHermesCompiler(appDir) : { enabled: false, compilerPath: null };
    const hermesResult = await compileToHermes(bundleOutput, hermesConfig);

    const bundleSize = await uploadBundle(config, bundleOutput, hermesResult.compiled);
    await notifySuccess(config, bundleSize, hermesResult.compiled);

    console.log('Build complete!');
    return { success: true, bundleSize, hermesCompiled: hermesResult.compiled };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Build failed:', message);
    await notifyFailure(config, message);
    return { success: false, bundleSize: 0, hermesCompiled: false, error: message };
  }
}

function validateConfig(config: BuildConfig): void {
  const required: (keyof BuildConfig)[] = ['repo', 'commitSha', 'githubToken', 'bundleKey', 'releaseId', 'callbackUrl'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(', ')}`);
  }
}

async function cloneRepo(config: BuildConfig): Promise<void> {
  console.log('Cloning repository...');
  const repoUrl = `https://x-access-token:${config.githubToken}@github.com/${config.repo}.git`;
  await execSilent('git', ['clone', '--depth', '1', repoUrl, WORK_DIR]);
  await exec('git', ['-C', WORK_DIR, 'fetch', '--depth', '1', 'origin', config.commitSha]);
  await exec('git', ['-C', WORK_DIR, 'checkout', config.commitSha]);
  console.log('   Repository cloned');
}

async function installDependencies(appDir: string): Promise<void> {
  console.log('Installing dependencies...');
  const pm = detectPackageManager(appDir);
  const [cmd, args] = getInstallCommand(pm);
  const installDir = hasRootLockfile() ? WORK_DIR : appDir;
  await exec(cmd, args, { cwd: installDir });
  console.log('   Dependencies installed');
}

function detectPackageManager(appDir: string): PackageManager {
  if (existsSync(join(appDir, 'pnpm-lock.yaml')) || existsSync(join(WORK_DIR, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(appDir, 'yarn.lock')) || existsSync(join(WORK_DIR, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

function getInstallCommand(pm: PackageManager): [string, string[]] {
  const commands: Record<PackageManager, [string, string[]]> = {
    npm: ['npm', ['install', '--legacy-peer-deps']],
    yarn: ['yarn', ['install', '--frozen-lockfile']],
    pnpm: ['pnpm', ['install', '--frozen-lockfile']],
  };
  return commands[pm];
}

function hasRootLockfile(): boolean {
  return existsSync(join(WORK_DIR, 'pnpm-lock.yaml')) ||
    existsSync(join(WORK_DIR, 'yarn.lock')) ||
    existsSync(join(WORK_DIR, 'package-lock.json'));
}

async function buildBundle(appDir: string, bundleOutput: string): Promise<void> {
  console.log('Building bundle...');
  const rnCli = findReactNativeCli(appDir);
  const entryFile = findEntryFile(appDir);
  const bundleArgs = ['bundle', '--platform', 'ios', '--dev', 'false', '--entry-file', entryFile, '--bundle-output', bundleOutput, '--minify', 'true'];

  if (rnCli) {
    await exec(rnCli, bundleArgs, { cwd: appDir });
  } else {
    await exec('npx', ['react-native', ...bundleArgs], { cwd: appDir });
  }

  if (!existsSync(bundleOutput)) {
    throw new Error('Bundle file was not created');
  }
  console.log(`   Bundle created (${formatBytes(statSync(bundleOutput).size)})`);
}

function findReactNativeCli(appDir: string): string | null {
  const paths = [join(appDir, 'node_modules', '.bin', 'react-native'), join(WORK_DIR, 'node_modules', '.bin', 'react-native')];
  return paths.find(existsSync) ?? null;
}

function findEntryFile(appDir: string): string {
  const candidates = ['index.js', 'index.tsx', 'src/index.js', 'src/index.tsx'];
  return candidates.find((f) => existsSync(join(appDir, f))) ?? 'index.js';
}

async function uploadBundle(config: BuildConfig, bundlePath: string, isHermes: boolean): Promise<number> {
  console.log('Uploading to R2...');
  const content = readFileSync(bundlePath);
  await uploadToR2({
    endpoint: config.r2.endpoint,
    accessKey: config.r2.accessKey,
    secretKey: config.r2.secretKey,
    bucket: config.r2.bucket,
    key: config.bundleKey,
    body: content,
    contentType: getBundleContentType(isHermes),
  });
  console.log(`   Uploaded (${formatBytes(content.length)})`);
  return content.length;
}

async function notifySuccess(config: BuildConfig, bundleSize: number, hermesCompiled: boolean): Promise<void> {
  console.log('Notifying API...');
  const response = await fetch(config.callbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ releaseId: config.releaseId, success: true, bundleSize, hermesCompiled }),
  });
  if (!response.ok) console.warn(`   Callback failed: ${String(response.status)}`);
  else console.log('   API notified');
}

async function notifyFailure(config: BuildConfig, error: string): Promise<void> {
  try {
    await fetch(config.callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ releaseId: config.releaseId, success: false, error }),
    });
  } catch {
    console.error('   Failed to notify API of failure');
  }
}

function checkTimeout(): void {
  const elapsed = Date.now() - startTime;
  if (elapsed > BUILD_TIMEOUT_MS) {
    throw new Error(`Build timeout exceeded (${String(Math.round(elapsed / 1000))}s)`);
  }
}

function execSilent(cmd: string, args: string[], options?: { cwd?: string }): Promise<void> {
  return execInternal(cmd, args, { ...options, silent: true });
}

function exec(cmd: string, args: string[], options?: { cwd?: string }): Promise<void> {
  return execInternal(cmd, args, { ...options, silent: false });
}

function execInternal(cmd: string, args: string[], options?: { cwd?: string; silent?: boolean }): Promise<void> {
  return new Promise((resolve, reject) => {
    checkTimeout();
    if (!options?.silent) console.log(`   $ ${cmd} ${args.join(' ')}`);

    const child: ChildProcess = spawn(cmd, args, { cwd: options?.cwd, stdio: 'inherit', shell: false });
    const remainingTime = BUILD_TIMEOUT_MS - (Date.now() - startTime);
    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000);
      reject(new Error(`Command timed out`));
    }, remainingTime);

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${String(code ?? 'unknown')}`));
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Run if executed directly
if (import.meta.url.endsWith(process.argv[1]?.replace(/^file:\/\//, '') ?? '')) {
  void build().then((result) => process.exit(result.success ? 0 : 1));
}
