param (
    [string]$Configuration = "Release",
    [string]$Platform = "x64"
)

Write-Host "Building Windows App..."
cd windows

# Ensure MSBuild is in PATH (typically run from Developer Command Prompt or GitHub Actions)
# msbuild DesktopNative.sln /p:Configuration=$Configuration /p:Platform=$Platform /p:UapAppxPackageBuildMode=StoreUpload /p:AppxBundle=Always

# Using React Native Windows CLI for a production bundle
npx react-native build-windows --release --arch $Platform --logging

Write-Host "Done! MSIX bundle is located in windows/AppPackages/"
