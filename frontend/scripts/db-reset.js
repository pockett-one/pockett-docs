#!/usr/bin/env node
/**
 * Complete database reset script
 * Works for both LOCAL (Docker Supabase) and PRODUCTION (Supabase Cloud)
 * Deletes all database data FIRST, then auth users
 * 
 * Usage: npm run db:reset
 */

// Load environment variables from .env file
require('dotenv').config();

const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

async function deleteAllAuthUsers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing environment variables:');
        console.error('   NEXT_PUBLIC_SUPABASE_URL');
        console.error('   SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log('🗑️  Deleting all Supabase auth users...');

    // Fetch all users (paginated)
    let allUsers = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({
            page,
            perPage
        });

        if (error) {
            console.error('❌ Error fetching users:', error.message);
            process.exit(1);
        }

        if (!data.users || data.users.length === 0) {
            break;
        }

        allUsers = allUsers.concat(data.users);
        console.log(`   Found ${data.users.length} users on page ${page}`);

        if (data.users.length < perPage) {
            break;
        }

        page++;
    }

    console.log(`   Total users found: ${allUsers.length}`);

    if (allUsers.length === 0) {
        console.log('   ✅ No users to delete');
        return;
    }

    // Delete all users
    let deleted = 0;
    let failed = 0;

    for (const user of allUsers) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);

        if (error) {
            console.error(`   ❌ Failed to delete ${user.email}: ${error.message}`);
            failed++;
        } else {
            deleted++;
        }
    }

    console.log(`   ✅ Deleted ${deleted} users (${failed} failed)\n`);
}

async function main() {
    console.log('🔄 Starting complete database reset...\n');

    try {
        // Step 1: Reset database with Prisma FIRST (deletes all data)
        console.log('1️⃣  Resetting database schema and deleting all data...');
        execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });

        // Step 2: Delete all auth users AFTER data is deleted
        console.log('\n2️⃣  Deleting auth users...\n');
        await deleteAllAuthUsers();

        console.log('✅ Complete reset finished!');
        console.log('\n📝 Next steps:');
        console.log('   1. Run: npx prisma migrate deploy');
        console.log('   2. Run: npx prisma generate');
        console.log('   3. Test the signup flow at /signup\n');

    } catch (error) {
        console.error('\n❌ Reset failed:', error.message);
        process.exit(1);
    }
}

main();
