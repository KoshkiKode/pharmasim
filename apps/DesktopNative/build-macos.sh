#!/bin/bash
set -e

echo "Building macOS App..."
cd macos
xcodebuild -workspace DesktopNative.xcworkspace -scheme DesktopNative-macOS -configuration Release -derivedDataPath build_release

APP_PATH="build_release/Build/Products/Release/DesktopNative.app"

echo "Ensuring macOS AppIcon is present..."
cp icon.icns "$APP_PATH/Contents/Resources/AppIcon.icns"

echo "Checking if create-dmg is installed..."
if ! command -v create-dmg &> /dev/null; then
    echo "create-dmg could not be found, installing via Homebrew..."
    brew install create-dmg
fi

echo "Packaging to DMG..."
mkdir -p dist
STAGING_DIR="dist/staging"
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
cp -R "$APP_PATH" "$STAGING_DIR/"

# Remove existing DMG if it exists to prevent create-dmg from failing
rm -f "dist/PharmaSim-macOS.dmg"

create-dmg \
  --skip-jenkins \
  --volname "PharmaSim" \
  --volicon "icon.icns" \
  --window-pos 200 120 \
  --window-size 800 400 \
  --icon-size 100 \
  --icon "DesktopNative.app" 200 190 \
  --hide-extension "DesktopNative.app" \
  --app-drop-link 600 185 \
  "dist/PharmaSim-macOS.dmg" \
  "$STAGING_DIR" || true

rm -rf "$STAGING_DIR"

echo "Done! DMG is located at dist/PharmaSim-macOS.dmg"
