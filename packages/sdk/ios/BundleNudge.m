/**
 * BundleNudge Objective-C Bridge
 *
 * Exposes Swift native module methods to React Native.
 * This file is required because React Native uses macros that only work in Objective-C.
 */

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BundleNudge, NSObject)

RCT_EXTERN_METHOD(getConfiguration:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getCurrentBundleInfo:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getBundlePath:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(notifyAppReady:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(restartApp:(BOOL)onlyIfUpdateIsPending
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearUpdates:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(saveBundleToStorage:(NSString *)version
                  bundleData:(NSString *)bundleData
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(hashFile:(NSString *)path
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
