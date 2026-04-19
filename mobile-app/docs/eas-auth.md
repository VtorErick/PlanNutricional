# EAS Authentication

## Local interactive

```bash
npx eas-cli login
```

After login, you can run:

```bash
npm run build:android:preview
npm run build:android:production
npm run build:ios:preview
npm run build:ios:production
```

## CI / non-interactive

Set `EXPO_TOKEN` before running EAS:

```bash
set EXPO_TOKEN=tu_token
npx eas-cli build --platform android --profile production --non-interactive
```

## Current blocker observed in this workspace

EAS commands reach the CLI correctly but stop at authentication because no Expo session or `EXPO_TOKEN` is configured.
