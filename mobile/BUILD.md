# Building & Running the Mobile App

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | 10+ | Comes with Node.js |
| Java JDK | 17 | Required for Android builds (`brew install --cask temurin@17` on macOS) |
| Android SDK | API 35 | Install via [Android Studio](https://developer.android.com/studio) or `sdkmanager` |
| Expo CLI | (local) | Installed as a project dependency, no global install needed |

## Install Dependencies

```bash
cd mobile
npm ci
```

## Running in Development

Start the Expo dev server:

```bash
npx expo start
```

This opens the Expo CLI. From there:
- Press **a** to open on an Android emulator
- Press **i** to open on an iOS simulator (macOS only)
- Scan the QR code with **Expo Go** on a physical device

In development, the app automatically connects to a local backend at `http://<your-machine-ip>:3000`. Make sure the backend is running locally (`cd backend && npm run dev`).

## Running Tests

```bash
npm test
```

Run a single test file:

```bash
npx jest src/__tests__/LoginScreen.test.tsx
```

Run with coverage:

```bash
npx jest --coverage
```

## Building the APK Locally

### 1. Prebuild the Android project

```bash
npx expo prebuild --platform android --no-install
```

This generates the `android/` directory from the Expo managed project.

### 2. Build with Gradle

```bash
cd android
./gradlew assembleRelease
```

The APK will be at:

```
android/app/build/outputs/apk/release/app-release.apk
```

### 3. Clean rebuild (if needed)

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

## Installing the APK on a Device

### Via ADB (USB debugging enabled)

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Via file transfer

Copy the APK file to your Android device and open it. You may need to enable "Install from unknown sources" in your device settings.

## CI/CD (GitHub Actions)

The workflow at `.github/workflows/mobile-ci.yml` automatically:

1. **Runs tests** on every push to `main` that changes files in `mobile/`
2. **Builds an APK** if tests pass
3. **Uploads the APK** as a GitHub Actions artifact (downloadable for 90 days)
4. **Attaches the APK to the GitHub Release** when triggered by a release

### Downloading the APK from CI

1. Go to the repository's **Actions** tab
2. Select the latest **Mobile CI** run
3. Scroll to **Artifacts** and download `app-release`

### Triggering a build manually

The workflow also supports `workflow_dispatch` — go to Actions > Mobile CI > "Run workflow" to trigger manually.

## Environment Configuration

| Environment | API Base URL | How it works |
|-------------|-------------|--------------|
| Development | `http://<local-ip>:3000` | Auto-detected from Expo dev server |
| Production | `https://urchin-app-w5w4g.ondigitalocean.app` | Hardcoded in `src/api/client.ts` |

The app uses the `__DEV__` flag (set by React Native) to determine which URL to use. In development builds (Expo Go, `expo start`), it resolves the local backend automatically. In production builds (APK), it uses the deployed backend URL.
