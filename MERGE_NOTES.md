# Merged Project — SriHomoeoCare (canonical)

Combined from:
- **SriHomoeoCare**: PostgreSQL (`pg`), Voroa docs, clean Vite (no Lovable), security hardening
- **New folder**: Android Gradle wrapper, ProGuard, root `.gitignore` / `.vscode`, pnpm-lock when available

## Stack
- Web: TanStack Start + Vite + PostgreSQL (Voroa free DB)
- Android: Jetpack Compose + full Gradle toolchain
- Windows: C# launcher → production HTTPS URL

## Deploy (Voroa)
See `VOROA_POSTGRES.md`.

## Build Android
```bash
cd Sri-App
./gradlew assembleRelease
```
