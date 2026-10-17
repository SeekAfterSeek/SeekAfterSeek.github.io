@echo off
title Portfolio - Local Preview
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0preview.ps1"
if errorlevel 1 (
  echo.
  echo  Failed to start. You can also open index.html directly.
  pause
)
