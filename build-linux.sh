#!/bin/bash
set -e

# Dependencies are expected to be installed from the repository root
# (`npm ci`); the workspace lockfile is the single source of truth.
# The Linux desktop client imports the compiled @pharmasim/engine output,
# so build it before invoking Tauri.
echo "Building shared engine..."
npm run build -w packages/engine

echo "Building Linux packages via Tauri..."
# On Linux, this will generate .deb and .AppImage packages by default.
npm run tauri:build -w apps/linux-desktop

echo "Done! Linux builds are located in apps/linux-desktop/src-tauri/target/release/bundle/"
