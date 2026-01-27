/**
 * Build execution logic for iOS builds
 *
 * Handles the actual build phases: clone, install, build, export, upload.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from './exec.js';
import { setupSigning, cleanupSigning } from './signing.js';
import type { ApiClient } from './api.js';
import type {
  Build,
  BuildCredentials,
  TestDevice,
  LogEntry,
  SigningInfo,
} from './types.js';

/**
 * Execute a complete build through all phases
 */
export async function executeBuild(
  api: ApiClient,
  build: Build,
  credentials: BuildCredentials | null,
  devices: TestDevice[],
  workDir: string
): Promise<void> {
  const buildDir = path.join(workDir, build.id);
  await fs.mkdir(buildDir, { recursive: true });

  await phaseClone(api, build, buildDir);
  const iosDir = await phaseInstall(api, build.id, buildDir);

  if (!credentials) {
    throw new Error('No signing credentials provided');
  }

  await api.updateStatus(build.id, { status: 'signing' });
  const signingInfo = await setupSigning({
    credentials,
    devices,
    buildDir: iosDir,
    bundleId: build.bundleIdentifier || 'com.example.app',
    exportMethod: build.exportMethod,
  });

  try {
    const ipaPath = await phaseBuild(api, build, iosDir, signingInfo);
    await phaseUpload(api, build, ipaPath);
  } finally {
    await cleanupSigning(signingInfo);
  }
}

/**
 * Phase 1: Clone repository
 */
async function phaseClone(api: ApiClient, build: Build, buildDir: string): Promise<void> {
  await log(api, build.id, 'info', 'Cloning repository...', 'clone');
  await api.updateStatus(build.id, { status: 'preparing' });

  const cloneCmd = `git clone --depth 1 --branch ${build.gitBranch} ${build.gitUrl} .`;
  const cloneResult = await exec(cloneCmd, { cwd: buildDir });

  if (!cloneResult.success) {
    throw new Error(`Git clone failed: ${cloneResult.stderr}`);
  }

  const commitResult = await exec('git rev-parse HEAD', { cwd: buildDir });
  const commitMsgResult = await exec('git log -1 --format=%s', { cwd: buildDir });

  await api.updateStatus(build.id, {
    status: 'preparing',
    gitCommit: commitResult.stdout.trim(),
    gitCommitMessage: commitMsgResult.stdout.trim(),
  });
}

/**
 * Phase 2: Install dependencies
 */
async function phaseInstall(api: ApiClient, buildId: string, buildDir: string): Promise<string> {
  await log(api, buildId, 'info', 'Installing dependencies...', 'install');

  const iosDir = path.join(buildDir, 'ios');
  const iosExists = await fs.stat(iosDir).catch(() => null);
  if (!iosExists) {
    throw new Error('No ios directory found');
  }

  const hasYarnLock = await fs.stat(path.join(buildDir, 'yarn.lock')).catch(() => null);
  const installCmd = hasYarnLock ? 'yarn install --frozen-lockfile' : 'npm ci';

  const installResult = await exec(installCmd, { cwd: buildDir });
  if (!installResult.success) {
    throw new Error(`Install failed: ${installResult.stderr}`);
  }

  await log(api, buildId, 'info', 'Installing CocoaPods...', 'install');
  const podResult = await exec('pod install', { cwd: iosDir });

  if (!podResult.success) {
    await exec('pod repo update', { cwd: iosDir });
    const retryResult = await exec('pod install', { cwd: iosDir });
    if (!retryResult.success) {
      throw new Error(`Pod install failed: ${retryResult.stderr}`);
    }
  }

  return iosDir;
}

/**
 * Phase 4 & 5: Build archive and export IPA
 */
async function phaseBuild(
  api: ApiClient,
  build: Build,
  iosDir: string,
  signingInfo: SigningInfo
): Promise<string> {
  await log(api, build.id, 'info', 'Building archive...', 'build');
  await api.updateStatus(build.id, { status: 'building' });

  const buildDir = path.dirname(iosDir);
  const workspace = await findXcodeProject(iosDir);
  const archivePath = path.join(buildDir, 'build', 'App.xcarchive');

  const buildCmd = buildArchiveCommand(workspace, build, archivePath, signingInfo);
  const buildResult = await exec(buildCmd, { cwd: iosDir, timeout: 30 * 60 * 1000 });

  if (!buildResult.success) {
    throw new Error(`Build failed: ${extractBuildError(buildResult.stderr)}`);
  }

  return exportIpa(api, build, iosDir, archivePath, signingInfo);
}

/**
 * Find workspace or project file
 */
async function findXcodeProject(iosDir: string): Promise<string> {
  const files = await fs.readdir(iosDir);
  const workspace = files.find((f) => f.endsWith('.xcworkspace'));
  const project = files.find((f) => f.endsWith('.xcodeproj'));

  if (!workspace && !project) {
    throw new Error('No Xcode workspace or project found');
  }

  return workspace || project || '';
}

/**
 * Build the xcodebuild archive command
 */
function buildArchiveCommand(
  projectFile: string,
  build: Build,
  archivePath: string,
  signingInfo: SigningInfo
): string {
  const isWorkspace = projectFile.endsWith('.xcworkspace');
  const projectFlag = isWorkspace ? '-workspace' : '-project';

  return [
    'xcodebuild',
    projectFlag, projectFile,
    '-scheme', build.scheme,
    '-configuration', build.configuration,
    '-archivePath', archivePath,
    'archive',
    'CODE_SIGN_STYLE=Manual',
    signingInfo.buildSettings,
  ].join(' ');
}

/**
 * Extract meaningful error from xcodebuild output
 */
function extractBuildError(stderr: string): string {
  const errorLines = stderr
    .split('\n')
    .filter((line) => line.includes('error:'))
    .slice(0, 5);

  return errorLines.join('\n') || stderr.slice(-500);
}

/**
 * Export archive to IPA
 */
async function exportIpa(
  api: ApiClient,
  build: Build,
  iosDir: string,
  archivePath: string,
  signingInfo: SigningInfo
): Promise<string> {
  await log(api, build.id, 'info', 'Exporting IPA...', 'build');

  const buildDir = path.dirname(iosDir);
  const exportPath = path.join(buildDir, 'build', 'export');
  const exportOptionsPath = path.join(buildDir, 'build', 'ExportOptions.plist');

  await fs.writeFile(exportOptionsPath, signingInfo.exportOptionsPlist);

  const exportCmd = [
    'xcodebuild -exportArchive',
    `-archivePath ${archivePath}`,
    `-exportPath ${exportPath}`,
    `-exportOptionsPlist ${exportOptionsPath}`,
  ].join(' ');

  const exportResult = await exec(exportCmd, { cwd: iosDir });
  if (!exportResult.success) {
    throw new Error(`Export failed: ${exportResult.stderr}`);
  }

  const exportFiles = await fs.readdir(exportPath);
  const ipaFile = exportFiles.find((f) => f.endsWith('.ipa'));

  if (!ipaFile) {
    throw new Error('No IPA file found after export');
  }

  return path.join(exportPath, ipaFile);
}

/**
 * Phase 6: Upload artifact
 */
async function phaseUpload(api: ApiClient, build: Build, ipaPath: string): Promise<void> {
  await log(api, build.id, 'info', 'Uploading artifact...', 'upload');
  await api.updateStatus(build.id, { status: 'uploading' });

  const ipaStat = await fs.stat(ipaPath);
  const ipaData = await fs.readFile(ipaPath);
  const artifactKey = `builds/${build.appId}/${build.id}/app.ipa`;

  await api.uploadArtifact(artifactKey, ipaData);

  await api.updateStatus(build.id, {
    status: 'success',
    artifactKey,
    artifactSize: ipaStat.size,
  });

  await log(api, build.id, 'info', 'Build completed successfully!', 'complete');
}

/**
 * Log a message to console and API
 */
async function log(
  api: ApiClient,
  buildId: string,
  level: LogEntry['level'],
  message: string,
  phase?: string
): Promise<void> {
  console.log(`[${level.toUpperCase()}] ${message}`);

  try {
    await api.appendLog(buildId, [{ level, message, phase }]);
  } catch {
    // Ignore log send errors
  }
}
