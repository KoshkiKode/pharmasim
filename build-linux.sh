#!/bin/bash
set -e

echo "Building Linux packages via Tauri..."
cd apps/linux-desktop

echo "Ensuring dependencies are installed..."
npm install --legacy-peer-deps

echo "Running Tauri Build..."
# On Linux, this will generate .deb and .AppImage packages by default.
npx tauri build

echo "Done! Linux builds are located in apps/linux-desktop/src-tauri/target/release/bundle/"
