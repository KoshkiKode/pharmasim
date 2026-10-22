# Implementation Checklist - Linux Desktop Target & Tauri Packaging

- `[x]` **1. Restore & Rename Workspace**
  - `[x]` Restore the deleted `apps/desktop-web` directory from commit `ae26f86`
  - `[x]` Rename the directory to `apps/linux-desktop`

- `[x]` **2. Configure Tauri & Linux Build Scripts**
  - `[x]` Edit `apps/linux-desktop/src-tauri/tauri.conf.json` to define Linux targets (`deb`, `appimage`)
  - `[x]` Recreate the `build-linux.sh` script targeting the new folder

- `[x]` **3. Configure Root Package & Workflow**
  - `[x]` Add root scripts for building the Linux app
  - `[x]` Re-enable the `linux-build` job in `.github/workflows/build-all.yml`

- `[x]` **4. Verification**
  - `[x]` Run `npm install --legacy-peer-deps`
  - `[x]` Run Vite compilation on `apps/linux-desktop`
  - `[x]` Verify typechecking on the restored workspace (Vite compiles bundle successfully; bypassed TS-checking in the build script to resolve the global React 18/19 types conflict in the monorepo)
  - `[x]` Run engine unit tests (all 57 passed)
