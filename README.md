# Coach Inventory - Android Build Instructions

This project is configured to automatically build an Android APK using **GitHub Actions**.

## How to get your APK:

1.  **Export to GitHub**: Use the "Export to GitHub" option in the AI Studio settings.
2.  **Wait for Build**: Once the code is on GitHub, go to the **"Actions"** tab in your repository.
3.  **Download**: Look for the latest run named **"Build Android APK"**. Once it finishes (takes about 5-8 minutes), scroll down to the **"Artifacts"** section and download the `coach-inventory-apk`.

## Manual Build (on your computer):

If you want to build it locally:

1.  **Install Node.js 22+** and **Java 21 (JDK)**.
2.  `npm install`
3.  `npm run build`
4.  `npx cap add android` (first time only)
5.  `npx cap sync android`
6.  `npx cap open android` (opens Android Studio to generate the APK)

---
*Developed for Kakinada Coaching Depot, Indian Railways.*
