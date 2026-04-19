# Plan Nutricional Mobile

Base Expo/React Native para la migracion de `PlanNutricional` hacia Android e iOS, manteniendo el backend serverless en Vercel.

## Estado actual

- Navegacion con Expo Router.
- Persistencia local con AsyncStorage.
- Tabs principales: plan, equivalencias, calorias, compras, resumen y suplementos.
- Generacion de plan con IA en dos modos:
  - Backend: `EXPO_PUBLIC_API_BASE_URL/api/generate-plan`
  - Directo mobile: `EXPO_PUBLIC_GEMINI_API_KEY`
- Ajuste y regeneracion de plan con IA desde la app.
- Exportacion PDF con `expo-print` + `expo-sharing`.
- Lista de compras persistente por dispositivo.
- Testing base con Jest y smoke E2E con Maestro.

## Requisitos

- Node.js 20 LTS
- Android Studio + SDK 35
- JDK 17
- Expo CLI / EAS CLI

## Desarrollo

```bash
npm install
cp .env.example .env
npm run start
```

## Variables de entorno

```env
EXPO_PUBLIC_API_BASE_URL=https://tu-dominio.vercel.app
EXPO_PUBLIC_GEMINI_API_KEY=tu_api_key_directa
```

## Verificacion

```bash
npm run typecheck
npm test
npm run doctor
npm run lint
npm run verify:release
npm run export:android
npx expo start --android
```

## Build

```bash
npm run build:android:preview
npm run build:android:production
eas submit --platform android --profile production
```

## Release docs

- `docs/release-checklist.md`
- `docs/store-listing-template.md`
- `docs/privacy-policy.md`
- `docs/support.md`
- `docs/eas-auth.md`

## Pendientes

- Completar cuestionario movil avanzado con todos los campos del web.
- Mejorar fidelidad visual de las vistas complejas frente al proyecto web.
- Ampliar suite E2E nativa.
- Sustituir assets de tienda por versiones finales de branding.
