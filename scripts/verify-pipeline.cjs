const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Color helpers
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

function logStep(msg) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${msg} ===${colors.reset}`);
}

function logSuccess(msg) {
  console.log(`${colors.green}✓ ${msg}${colors.reset}`);
}

function logError(msg) {
  console.error(`${colors.red}✗ ${msg}${colors.reset}`);
}

// Invariants defined in src/data/types.ts
const VALID_CATEGORIES = new Set([
  'pharmaceutical',
  'research-chemical',
  'chemical',
  'plant-herb',
  'recreational',
  'supplement'
]);

const VALID_BODY_SYSTEMS = new Set([
  'CNS',
  'Cardiovascular',
  'Respiratory',
  'GI',
  'Hepatic',
  'Renal',
  'Endocrine',
  'Metabolic',
  'Musculoskeletal',
  'Hematologic',
  'Immune',
  'Integumentary',
  'Genitourinary'
]);

const VALID_ROUTES = new Set([
  'oral',
  'sublingual',
  'intranasal',
  'inhaled',
  'rectal',
  'transdermal',
  'IV',
  'IM',
  'SC',
  'subcutaneous'
]);

const VALID_TAGS = new Set([
  'serotonergic',
  'maoi',
  'cns-depressant',
  'respiratory-depressant',
  'opioid',
  'benzodiazepine',
  'qt-prolonging',
  'anticoagulant',
  'antiplatelet',
  'nsaid',
  'sympathomimetic',
  'serotonin-releaser',
  'stimulant',
  'anticholinergic',
  'hepatotoxic',
  'nephrotoxic',
  'gaba-ergic',
  'dopaminergic',
  'alcohol'
]);

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: 'inherit', shell: true });
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command "${command} ${args.join(' ')}" exited with code ${code}`));
      }
    });
  });
}

async function run() {
  let hasFailed = false;

  // 1. Database integrity
  logStep('Checking Database Integrity');
  try {
    const substancesPath = path.resolve(__dirname, '../src/data/substances.ts');
    if (!fs.existsSync(substancesPath)) {
      throw new Error(`Substances file not found at ${substancesPath}`);
    }
    const content = fs.readFileSync(substancesPath, 'utf8');
    const arrayStr = content.slice(content.indexOf('['), content.lastIndexOf('];') + 1);
    if (!arrayStr) {
      throw new Error('Could not find substance array block in substances.ts');
    }
    const substances = eval(arrayStr);

    console.log(`Loaded ${substances.length} substances from substances.ts.`);

    if (substances.length < 880) {
      throw new Error(`Substance count is too low: expected >= 880, found ${substances.length}`);
    }

    const seenIds = new Set();
    const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

    for (const s of substances) {
      const prefix = `Substance [${s.id || 'missing-id'}]:`;
      if (!s.id) throw new Error(`${prefix} Missing required id`);
      if (!ID_PATTERN.test(s.id)) {
        throw new Error(`${prefix} id must be lowercase alphanumeric with hyphens`);
      }
      if (seenIds.has(s.id)) {
        throw new Error(`${prefix} Duplicate substance id found`);
      }
      seenIds.add(s.id);

      if (!s.name || !s.name.trim()) throw new Error(`${prefix} Empty name`);
      if (!s.drugClass || !s.drugClass.trim()) throw new Error(`${prefix} Empty drugClass`);
      if (!s.mechanism || !s.mechanism.trim()) throw new Error(`${prefix} Empty mechanism`);

      if (!VALID_CATEGORIES.has(s.category)) {
        throw new Error(`${prefix} Invalid category "${s.category}"`);
      }

      if (!(s.halfLifeHours > 0)) {
        throw new Error(`${prefix} halfLifeHours must be > 0 (got ${s.halfLifeHours})`);
      }

      if (s.doseRangeMg) {
        const [lo, hi] = s.doseRangeMg;
        if (lo < 0 || hi < 0) throw new Error(`${prefix} doseRangeMg values must be >= 0`);
        if (lo > hi) throw new Error(`${prefix} doseRangeMg is inverted ([${lo}, ${hi}])`);
        if (s.typicalDoseMg !== undefined && (s.typicalDoseMg < lo || s.typicalDoseMg > hi)) {
          throw new Error(`${prefix} typicalDoseMg ${s.typicalDoseMg} outside doseRangeMg [${lo}, ${hi}]`);
        }
      }

      if (s.typicalDoseMg !== undefined && s.typicalDoseMg < 0) {
        throw new Error(`${prefix} typicalDoseMg must be >= 0 (got ${s.typicalDoseMg})`);
      }

      if (!s.routes || s.routes.length === 0) {
        throw new Error(`${prefix} Must have at least one route`);
      }
      for (const r of s.routes) {
        if (!VALID_ROUTES.has(r)) {
          throw new Error(`${prefix} Invalid route "${r}"`);
        }
      }

      if (!s.bodySystems || s.bodySystems.length === 0) {
        throw new Error(`${prefix} Must have at least one body system`);
      }
      for (const b of s.bodySystems) {
        if (!VALID_BODY_SYSTEMS.has(b)) {
          throw new Error(`${prefix} Invalid body system "${b}"`);
        }
      }

      if (s.tags) {
        for (const t of s.tags) {
          if (!VALID_TAGS.has(t)) {
            throw new Error(`${prefix} Invalid tag "${t}"`);
          }
        }
      }
    }

    logSuccess(`Database passes all integrity and range validation checks. (${substances.length} substances verified)`);
  } catch (err) {
    logError(`Database integrity check failed: ${err.message}`);
    hasFailed = true;
  }

  // 2. Tauri Assets Verification
  logStep('Verifying Tauri Cross-Platform Assets');
  try {
    const requiredAssets = [
      'src-tauri/icons/icon.icns',
      'src-tauri/icons/icon.ico',
      'src-tauri/icons/icon.png',
      'src-tauri/icons/32x32.png',
      'src-tauri/icons/64x64.png',
      'src-tauri/icons/128x128.png',
      'src-tauri/icons/128x128@2x.png',
      'src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png',
      'src-tauri/icons/ios/AppIcon-60x60@2x.png'
    ];

    for (const asset of requiredAssets) {
      const assetPath = path.resolve(__dirname, '../', asset);
      if (!fs.existsSync(assetPath)) {
        throw new Error(`Required Tauri icon asset is missing: ${asset}`);
      }
      const stats = fs.statSync(assetPath);
      if (stats.size === 0) {
        throw new Error(`Required Tauri icon asset is empty (0 bytes): ${asset}`);
      }
    }
    logSuccess('All cross-platform Tauri desktop and mobile assets exist and are valid.');
  } catch (err) {
    logError(`Tauri asset verification failed: ${err.message}`);
    hasFailed = true;
  }

  // 3. Type Safety
  logStep('Checking Type Safety (tsc)');
  try {
    await runCommand('npm', ['run', 'typecheck']);
    logSuccess('TypeScript compilation check passed with 0 errors.');
  } catch (err) {
    logError(`Type check failed: ${err.message}`);
    hasFailed = true;
  }

  // 4. Unit Tests
  logStep('Running Unit Tests (Vitest)');
  try {
    await runCommand('npm', ['run', 'test']);
    logSuccess('All unit tests passed successfully.');
  } catch (err) {
    logError(`Unit tests failed: ${err.message}`);
    hasFailed = true;
  }

  if (hasFailed) {
    console.log(`\n${colors.bold}${colors.red}Verification failed. Please fix the errors above before committing.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.bold}${colors.green}Verification successful! All pipeline checks passed.${colors.reset}\n`);
    process.exit(0);
  }
}

run();
