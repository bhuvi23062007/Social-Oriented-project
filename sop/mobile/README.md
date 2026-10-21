# CleanCity Mobile (React Native)

This is the React Native companion to the existing CleanCity React website. It uses the same NestJS REST API and database; it does not create a separate backend or mobile database.

## Implemented mobile screens

- Welcome, login, and registration
- **Citizen:** dashboard, create waste report, GPS/map location selection, take/select report photo, my reports, rewards redemption, credits, notifications, learning videos
- **Cleaning staff:** dashboard, my tasks, nearby/open requests, accept/release task, live location sync, take an after-cleaning photo, complete task, messages, credits, learning videos
- **Admin:** overview, verify/reject completed reports, all reports, assign cleaning teams, manage teams and members, users, messages, notifications, learning videos

The screens call the existing backend paths such as `/auth/login`, `/reports`, `/storage/upload`, `/rewards/mine`, `/messages`, and `/notifications/mine`.

## Requirements

- Node.js 22.13 or newer for the selected Expo SDK 57 toolchain
- npm
- Expo Go compatible with this SDK, Android Studio emulator, or a physical Android phone
- The existing NestJS backend and its PostgreSQL/Redis/RabbitMQ/MinIO dependencies running separately

## 1. Install dependencies

From this directory:

```powershell
npm install
```

If Expo reports that a native package version is incompatible, run:

```powershell
npx expo install --fix
```

## 2. Point the app at NestJS

Create a `.env` file in this directory by copying `.env.example` and set `EXPO_PUBLIC_API_URL`.

**Android emulator:**

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

**iOS simulator:**

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Physical phone:** connect the phone and laptop to the same Wi-Fi, find the laptop's LAN IPv4 address, then use it, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
```

The IP above is only an example. Use your laptop's actual LAN IP. Allow Node.js through the Windows firewall for private networks if prompted. Restart Expo after changing `.env`.

Do not point a physical phone at `localhost` or `10.0.2.2`: `localhost` refers to the phone itself, and `10.0.2.2` is for the Android emulator.

## 3. Make uploaded images reachable from the phone

The backend currently builds MinIO image URLs using `MINIO_PUBLIC_URL` (default `http://localhost:9000`). This URL is opened by the mobile app, so it must be reachable from the target device. Set it in the **backend** `.env` based on where you are testing:

- Android emulator: `MINIO_PUBLIC_URL=http://10.0.2.2:9000`
- iOS simulator: `MINIO_PUBLIC_URL=http://localhost:9000`
- Physical phone: `MINIO_PUBLIC_URL=http://<your-laptop-LAN-IP>:9000`

Use your actual laptop IP for a physical phone. The backend's own `MINIO_ENDPOINT=localhost` can remain `localhost` while the backend runs directly on the laptop. The backend and MinIO must be reachable on the local network. Keep database and service credentials in the backend environment only; never put them in the mobile `.env`.

## 4. Map setup for a standalone APK

The map works in a compatible Expo Go build during development. A standalone Android APK using `react-native-maps` needs a Google Maps Android SDK API key, with Maps SDK for Android enabled in Google Cloud. In `app.json`, replace the plain `"react-native-maps"` plugin entry with:

```json
[
  "react-native-maps",
  { "androidGoogleMapsApiKey": "YOUR_RESTRICTED_API_KEY" }
]
```

Restrict that key to this app's Android package (`com.cleancity.mobile`) and the appropriate signing certificate. Rebuild the APK after adding the key. See the [react-native-maps installation guidance](https://github.com/react-native-maps/react-native-maps/blob/master/docs/installation.md).

## 5. Start the existing backend

In the backend directory, make sure its `.env` has valid `DATABASE_URL`, `JWT_SECRET`, MinIO settings, and any service URLs. Start its Docker dependencies and NestJS API using your existing project commands, for example:

```powershell
docker compose up -d
npm run start:dev
```

The NestJS API should answer at `http://localhost:3000/health` from the laptop.

## 6. Start the mobile app

From this directory:

```powershell
npx expo start
```

Scan the QR code with a compatible Expo Go app, or press `a` to open an Android emulator. If Metro reports a package-version mismatch, run `npx expo install --fix`, then restart with `npx expo start -c`.

## 7. Create an installable Android APK

Install / sign in to Expo Application Services (EAS), then run:

```powershell
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

The `preview` profile in `eas.json` creates an APK for testing and direct installation. For Google Play distribution, use the production profile, which creates an Android App Bundle (AAB):

```powershell
npx eas-cli build --platform android --profile production
```

A cloud build needs an Expo account and network access. Make sure the production API URL is HTTPS before publishing to real users.

## Important notes

- Mobile passwords are sent only to the NestJS login/register endpoints over the configured API connection; passwords are not stored in the app. The access token is persisted with Expo SecureStore.
- The phone uses REST/JSON to communicate with NestJS. Only NestJS connects to PostgreSQL, Redis, and RabbitMQ.
- The source code is adapted from the website's existing API calls and role workflows. React Native requires different layout components from React DOM, so the UI is recreated for a mobile viewport.
