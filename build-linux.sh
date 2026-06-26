#!/bin/bash
set -e

echo "Building Linux AppImage via Tauri..."
cd apps/desktop-web

echo "Ensuring dependencies are installed..."
npm install

echo "Running Tauri Build..."
# Note: On a Linux host, this defaults to producing .AppImage and .deb
npx tauri build

echo "Done! Linux builds are located in apps/desktop-web/src-tauri/target/release/bundle/"
