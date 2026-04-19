# Privacy Policy

## Data handled by the app

Plan Nutricional Mobile stores and processes the following categories of information:

- profile and questionnaire data entered by the user
- meal planning preferences and nutritional goals
- local progress data such as completed meals and shopping checklist state
- optional PDF body assessment files attached by the user

## Storage

- local state is stored on device using AsyncStorage
- attached PDF files are read locally and sent only when the user explicitly requests AI generation

## Third-party processing

When the user requests AI generation or AI plan adjustment, the app sends the provided nutritional context to the backend configured in `EXPO_PUBLIC_API_BASE_URL`. That backend may use Gemini models to generate or revise plans.

## Sharing

The app can generate PDF exports and open the native share sheet. Shared files are handled by the operating system and selected destination apps.

## Security

The app does not require user account registration in its current version. Sensitive processing depends on the security posture of the configured backend deployment.

## Contact

Replace this section with your real support email and policy URL before store submission.
