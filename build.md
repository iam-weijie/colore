# Instructions to build

## Android build

1. Run `eas prebuild` to generate the build files, if they are not already present.
2. Go into `gradle.properties` and add this line under `android.useAndroidX=true`:

```
android.useAndroidX=true
android.enableJetifier=true
```

3. Open Android Studio and run this command from inside the `android` folder.

```
 ./gradlew assembleRelease
```

4. Go into `android/app/outputs/apk/release` to find the `app-release.apk` file. This can be installed on any Android device.

## Signing

Before publishing to the Google Play Store, apps need to be signed. Instructions here:
https://developer.android.com/studio/publish/app-signing

### Known issues

- The emulator does not load the app, instead it gets stuck on the initial splashscreen.
- The `eas build` command doesn't work (i.e. cannot build on Expo servers), as certain Java dependencies are not available. For now we will have to deal with building locally.
- Ensure that the app is using `react-native-clipboard/clipboard` and not `react-native-community/clipboard` (inside of `package.json`). The latter will cause an error when loading dependencies.
