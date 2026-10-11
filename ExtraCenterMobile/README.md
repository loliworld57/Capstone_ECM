# Education Center Management — Mobile

The React Native application currently provides authentication, admin account management, and teacher center, course, student, and profile workflows. It does not yet include every feature available on the web.

See [the project README](../README.md) for the backend setup and technology stack.

Configure `src/api/axiosClient.ts` for your device: Android emulators use `http://10.0.2.2:8080/api`; physical devices use the backend computer's LAN address. Update the current iOS LAN address for your environment.

From this directory:

```sh
npm install
npm start
```

In another terminal, run `npm run android`. Android requires an SDK and emulator or device. For iOS, use macOS with Xcode and CocoaPods, run `pod install` in `ios/`, then `npm run ios` from this directory.

Use `npm run lint` and `npm test` for the available checks.

The display name is Education Center Management. The `ExtraCenterMobile` directory, React Native registration name, native targets, and package identifiers retain their existing technical names.