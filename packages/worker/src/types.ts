/**
 * Type definitions for @bundlenudge/worker
 *
 * This file contains all type definitions for the build worker package.
 */

// =============================================================================
// Worker Configuration
// =============================================================================

/**
 * Configuration for the build worker
 */
export interface WorkerConfig {
  /** URL of the BundleNudge API */
  apiUrl: string;
  /** Authentication token for worker API calls */
  workerToken: string;
  /** Unique identifier for this worker instance */
  workerId: string;
  /** Node pool this worker belongs to (e.g., 'default', 'ios', 'android') */
  nodePool: string;
  /** Interval in ms between polling for new jobs */
  pollInterval: number;
  /** Interval in ms between heartbeat updates */
  heartbeatInterval: number;
  /** Directory for build artifacts and temporary files */
  workDir: string;
}

// =============================================================================
// Build Types
// =============================================================================

/**
 * Build job from the queue
 */
export interface Build {
  /** Unique build identifier */
  id: string;
  /** App this build belongs to */
  appId: string;
  /** Current build status */
  status: string;
  /** Build priority (higher = more urgent) */
  priority: number;
  /** Required node pool for this build */
  nodePool: string;
  /** Maximum time allowed for build in minutes */
  timeoutMinutes: number;
  /** Git repository URL */
  gitUrl: string;
  /** Git branch to build */
  gitBranch: string;
  /** Xcode scheme name */
  scheme: string;
  /** Build configuration */
  configuration: 'Debug' | 'Release';
  /** IPA export method */
  exportMethod: 'ad-hoc' | 'development' | 'app-store' | 'enterprise';
  /** iOS bundle identifier */
  bundleIdentifier?: string;
  /** Credential set ID for signing */
  credentialId?: string;
  /** Build number override */
  buildNumber?: number;
  /** Version string override */
  versionString?: string;
  /** Git commit SHA (set after clone) */
  gitCommit?: string;
}

/**
 * Apple Developer credentials for code signing
 */
export interface BuildCredentials {
  /** App Store Connect API Issuer ID */
  issuerId: string;
  /** App Store Connect API Key ID */
  keyId: string;
  /** Private key in PEM format */
  privateKey: string;
  /** Apple Developer Team ID */
  teamId: string;
}

/**
 * Test device registered for ad-hoc builds
 */
export interface TestDevice {
  /** Device UDID */
  udid: string;
  /** Device display name */
  name: string;
}

// =============================================================================
// API Types
// =============================================================================

/**
 * Result from claiming a build job
 */
export interface ClaimResult {
  /** The claimed build, or null if none available */
  build: Build | null;
  /** Signing credentials, or null if not needed */
  credentials: BuildCredentials | null;
  /** Test devices for ad-hoc provisioning */
  devices: TestDevice[];
}

/**
 * Build status update payload
 */
export interface StatusUpdate {
  /** New build status */
  status?: string;
  /** Git commit SHA */
  gitCommit?: string;
  /** Git commit message */
  gitCommitMessage?: string;
  /** R2 key for the build artifact */
  artifactKey?: string;
  /** Size of artifact in bytes */
  artifactSize?: number;
  /** R2 key for the manifest file */
  manifestKey?: string;
  /** Error message if build failed */
  errorMessage?: string;
  /** Error code for categorization */
  errorCode?: string;
}

/**
 * Log entry for build output
 */
export interface LogEntry {
  /** Log severity level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log message content */
  message: string;
  /** Build phase (clone, install, sign, build, upload, complete) */
  phase?: string;
}

/**
 * Worker heartbeat data
 */
export interface HeartbeatData {
  /** CPU usage percentage (0-100) */
  cpuUsage?: number;
  /** Memory usage percentage (0-100) */
  memoryUsage?: number;
  /** Disk usage percentage (0-100) */
  diskUsage?: number;
  /** System load average (1 minute) */
  loadAverage?: number;
  /** Worker status */
  status?: 'online' | 'busy';
  /** ID of build currently being processed */
  currentBuildId?: string;
}

// =============================================================================
// Execution Types
// =============================================================================

/**
 * Options for command execution
 */
export interface ExecOptions {
  /** Working directory for command execution */
  cwd?: string;
  /** Timeout in milliseconds (default: 10 minutes) */
  timeout?: number;
  /** Additional environment variables */
  env?: Record<string, string>;
}

/**
 * Result of command execution
 */
export interface ExecResult {
  /** Whether the command succeeded (exit code 0) */
  success: boolean;
  /** Standard output captured from the command */
  stdout: string;
  /** Standard error captured from the command */
  stderr: string;
  /** Exit code (null if process was killed or errored) */
  exitCode: number | null;
}

/**
 * Result of executing a sequence of commands
 */
export interface ExecSequenceResult {
  /** Whether all commands succeeded */
  success: boolean;
  /** Results for each command executed */
  results: ExecResult[];
}

// =============================================================================
// Code Signing Types
// =============================================================================

/**
 * Configuration for setting up code signing
 */
export interface SigningConfig {
  /** Apple Developer credentials */
  credentials: BuildCredentials;
  /** Test devices to include in provisioning profile */
  devices: TestDevice[];
  /** iOS project directory */
  buildDir: string;
  /** Bundle identifier for the app */
  bundleId: string;
  /** Export method determines signing requirements */
  exportMethod: 'ad-hoc' | 'development' | 'app-store' | 'enterprise';
}

/**
 * Information about configured code signing
 */
export interface SigningInfo {
  /** Path to the temporary keychain */
  keychainPath: string;
  /** Password for the temporary keychain */
  keychainPassword: string;
  /** Path to the provisioning profile */
  profilePath: string;
  /** Path to the signing certificate */
  certificatePath: string;
  /** Apple Developer Team ID */
  teamId: string;
  /** Xcodebuild settings string for signing */
  buildSettings: string;
  /** Content for ExportOptions.plist */
  exportOptionsPlist: string;
}
