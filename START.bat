@echo off
REM LearnChart FX — double-click to start the site (Windows).
cd /d %~dp0
if not exist node_modules (
  echo Installing dependencies (first run only)...
  call npm install
)
call npm start
