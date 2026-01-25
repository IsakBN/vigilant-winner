/**
 * BundleNudge Native Module Header
 *
 * This header exposes the BundleNudge class to Objective-C code.
 * Import this in your AppDelegate to access BundleNudge.bundleURL()
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * BundleNudge Native Module
 *
 * Provides OTA update functionality for React Native apps.
 */
@interface BundleNudge : NSObject

/**
 * Get the JS bundle URL to load on app start.
 *
 * Returns the downloaded BundleNudge bundle if available,
 * otherwise returns nil (use embedded bundle).
 *
 * Usage in AppDelegate:
 * ```objc
 * - (NSURL *)bundleURL {
 *     NSURL *bundleNudgeURL = [BundleNudge bundleURL];
 *     return bundleNudgeURL ?: [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
 * }
 * ```
 */
+ (NSURL * _Nullable)bundleURL;

/**
 * Get the path to the BundleNudge directory in Documents.
 */
+ (NSString *)bundleNudgePath;

@end

NS_ASSUME_NONNULL_END
