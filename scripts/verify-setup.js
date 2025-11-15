#!/usr/bin/env node

/**
 * Verification script to check if Gritful is properly configured
 * Run with: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Gritful Setup...\n');

let hasErrors = false;
let warnings = [];

// Check 1: Node version
console.log('1️⃣  Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 20) {
  console.log(`   ✅ Node.js ${nodeVersion} (>= 20 required)\n`);
} else {
  console.log(`   ❌ Node.js ${nodeVersion} is too old. Please upgrade to Node 20+\n`);
  hasErrors = true;
}

// Check 2: package.json
console.log('2️⃣  Checking package.json...');
try {
  const packageJson = require('../package.json');
  console.log(`   ✅ Package: ${packageJson.name} v${packageJson.version}\n`);
} catch (err) {
  console.log('   ❌ package.json not found or invalid\n');
  hasErrors = true;
}

// Check 3: node_modules
console.log('3️⃣  Checking dependencies...');
if (fs.existsSync(path.join(__dirname, '../node_modules'))) {
  console.log('   ✅ node_modules exists\n');
} else {
  console.log('   ❌ node_modules not found. Run: npm install\n');
  hasErrors = true;
}

// Check 4: .env.local file
console.log('4️⃣  Checking environment variables...');
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');

  // Check for required variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];

  const missingVars = [];
  const placeholderVars = [];

  requiredVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    } else {
      // Check if it's still a placeholder
      const regex = new RegExp(`${varName}=(.+)`);
      const match = envContent.match(regex);
      if (match) {
        const value = match[1].trim();
        if (value.includes('your-') || value === '' || value.length < 10) {
          placeholderVars.push(varName);
        }
      }
    }
  });

  if (missingVars.length > 0) {
    console.log('   ❌ Missing environment variables:');
    missingVars.forEach(v => console.log(`      - ${v}`));
    console.log('');
    hasErrors = true;
  } else if (placeholderVars.length > 0) {
    console.log('   ⚠️  Environment variables have placeholder values:');
    placeholderVars.forEach(v => console.log(`      - ${v}`));
    console.log('   Update these in .env.local with your Supabase credentials\n');
    warnings.push('Update .env.local with real Supabase credentials');
  } else {
    console.log('   ✅ All environment variables configured\n');
  }
} else {
  console.log('   ❌ .env.local not found');
  console.log('   Run: cp .env.local.example .env.local\n');
  hasErrors = true;
}

// Check 5: Supabase migrations
console.log('5️⃣  Checking database migrations...');
const migrationsPath = path.join(__dirname, '../supabase/migrations');
if (fs.existsSync(migrationsPath)) {
  const migrations = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql'));
  if (migrations.length >= 2) {
    console.log(`   ✅ Found ${migrations.length} migration files:`);
    migrations.forEach(m => console.log(`      - ${m}`));
    console.log('   Remember to run these in Supabase SQL Editor!\n');
  } else {
    console.log('   ❌ Expected at least 2 migration files\n');
    hasErrors = true;
  }
} else {
  console.log('   ❌ supabase/migrations directory not found\n');
  hasErrors = true;
}

// Check 6: TypeScript configuration
console.log('6️⃣  Checking TypeScript configuration...');
if (fs.existsSync(path.join(__dirname, '../tsconfig.json'))) {
  console.log('   ✅ tsconfig.json exists\n');
} else {
  console.log('   ❌ tsconfig.json not found\n');
  hasErrors = true;
}

// Check 7: Key directories
console.log('7️⃣  Checking project structure...');
const requiredDirs = [
  'app',
  'components',
  'lib',
  'supabase',
  'public'
];

const missingDirs = requiredDirs.filter(
  dir => !fs.existsSync(path.join(__dirname, '..', dir))
);

if (missingDirs.length === 0) {
  console.log('   ✅ All required directories exist\n');
} else {
  console.log('   ❌ Missing directories:');
  missingDirs.forEach(d => console.log(`      - ${d}`));
  console.log('');
  hasErrors = true;
}

// Final summary
console.log('═'.repeat(50));
console.log('\n📋 VERIFICATION SUMMARY\n');

if (hasErrors) {
  console.log('❌ Setup incomplete. Please fix the errors above.\n');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('⚠️  Setup mostly complete, but some warnings:\n');
  warnings.forEach((w, i) => console.log(`   ${i + 1}. ${w}`));
  console.log('\n📖 Next steps:');
  console.log('   1. Update .env.local with your Supabase credentials');
  console.log('   2. Run migrations in Supabase SQL Editor');
  console.log('   3. Run: npm run dev');
  console.log('   4. Visit http://localhost:3000\n');
} else {
  console.log('✅ All checks passed!\n');
  console.log('📖 Next steps:');
  console.log('   1. Make sure you ran migrations in Supabase');
  console.log('   2. Run: npm run dev');
  console.log('   3. Visit http://localhost:3000');
  console.log('   4. Try signing up with a test account\n');
  console.log('📚 See SETUP_GUIDE.md for detailed testing instructions\n');
}
