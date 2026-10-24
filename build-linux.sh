#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building shared engine..."
# apps/linux-desktop imports @pharmasim/engine's compiled dist/, which is
# git-ignored, so it must be built before Tauri bundles the frontend.
npm run build

echo "Building Linux packages via Tauri..."
cd apps/linux-desktop

echo "Running Tauri Build..."
# On Linux, this will generate .deb and .AppImage packages by default.
npx tauri build

echo "Done! Linux builds are located in apps/linux-desktop/src-tauri/target/release/bundle/"
