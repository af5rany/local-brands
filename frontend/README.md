# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Testing

### Unit tests

```bash
npm test           # watch mode
npm run test:ci    # single run + coverage (≥50% line threshold enforced)
```

94 tests across 21 suites covering screens, hooks, and contexts. Uses `@testing-library/react-native` with `global.fetch` mocks per-test.

### Maestro E2E (device / simulator)

Install Maestro CLI (macOS/Linux):

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Boot a simulator, start the Expo dev server, then run all flows:

```bash
# iOS
xcrun simctl boot "iPhone 15"
npm run ios

# Android
emulator -avd <your-avd-name>
npm run android

# In a separate terminal — runs all 10 .yaml flows in .maestro/
npm run test:e2e
```

Flows cover: login, add-to-cart, checkout, guest-checkout, wishlist, brand-owner publish product, and social sign-in (Apple, Facebook, Google, guest).
