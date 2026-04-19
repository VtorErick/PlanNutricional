# Release Checklist

## Pre-release

1. Confirmar `.env` con `EXPO_PUBLIC_API_BASE_URL` apuntando al backend productivo.
2. Ejecutar:
   - `npm ci`
   - `npm run typecheck`
   - `npm test`
   - `npm run export:android`
3. Verificar flujo manual:
   - cuestionario IA
   - ajuste/regeneracion IA
   - edicion de comidas
   - lista de compras persistente
   - exportacion PDF
   - dark mode

## Assets

1. Revisar `assets/images/icon.png`
2. Revisar `assets/images/adaptive-icon.png`
3. Revisar `assets/images/splash-icon.png`
4. Confirmar screenshots reales para store listing

## Android

1. Ejecutar `npm run build:android:production`
2. Ejecutar `eas submit --platform android --profile production`
3. Subir primero a internal testing
4. Validar Data Safety, Privacy Policy y content rating en Play Console

## iOS

1. Ejecutar `eas build --platform ios --profile production`
2. Ejecutar `eas submit --platform ios --profile production`
3. Confirmar `bundleIdentifier`, `appleTeamId`, `ascAppId`
4. Validar screenshots, privacy policy y review notes en App Store Connect
