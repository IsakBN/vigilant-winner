/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },

  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        '../../../TestApp/ios/build/Build/Products/Debug-iphonesimulator/TestApp.app',
      build:
        'cd ../../../TestApp/ios && xcodebuild -workspace TestApp.xcworkspace -scheme TestApp -configuration Debug -sdk iphonesimulator -derivedDataPath build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath:
        '../../../TestApp/ios/build/Build/Products/Release-iphonesimulator/TestApp.app',
      build:
        'cd ../../../TestApp/ios && xcodebuild -workspace TestApp.xcworkspace -scheme TestApp -configuration Release -sdk iphonesimulator -derivedDataPath build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: '../../../TestApp/android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd ../../../TestApp/android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      testBinaryPath:
        '../../../TestApp/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: '../../../TestApp/android/app/build/outputs/apk/release/app-release.apk',
      build:
        'cd ../../../TestApp/android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
      testBinaryPath:
        '../../../TestApp/android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
    },
  },

  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15',
      },
    },
    'simulator.pro': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_5_API_34',
      },
    },
    'emulator.pixel7': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_34',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*',
      },
    },
  },

  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'ios.sim.pro.release': {
      device: 'simulator.pro',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release',
    },
  },

  artifacts: {
    rootDir: './artifacts',
    pathBuilder: './helpers/artifact-path-builder.js',
    plugins: {
      screenshot: {
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
        takeWhen: {
          testStart: false,
          testDone: true,
        },
      },
      video: {
        android: {
          bitRate: 4000000,
        },
        simulator: {
          codec: 'hevc',
        },
      },
      log: {
        enabled: true,
      },
      uiHierarchy: 'enabled',
    },
  },

  behavior: {
    init: {
      exposeGlobals: true,
    },
    launchApp: 'auto',
    cleanup: {
      shutdownDevice: false,
    },
  },
}
