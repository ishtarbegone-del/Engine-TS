@echo off
setlocal
set VR_SINGLEPLAYER=true
set VR_BIND=127.0.0.1
set VR_BRIDGE_PORT=43595
cd /d "%~dp0"
if exist "src\app.ts" (
  bun run tools/vr/StartVr.ts
) else if exist "dist\world.exe" (
  dist\world.exe
) else (
  echo Could not find src\app.ts or dist\world.exe
  exit /b 1
)
