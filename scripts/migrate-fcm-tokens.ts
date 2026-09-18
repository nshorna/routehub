#!/usr/bin/env node

/**
 * Migration script to migrate FCM tokens from User.fcmToken to Device table
 * 
 * This script will:
 * 1. Find all users with a non-null fcmToken
 * 2. Create Device records for each token
 * 3. Optionally clear the old fcmToken field (if --clear flag is provided)
 * 
 * Usage:
 *   npx tsx scripts/migrate-fcm-tokens.ts [--clear]
 * 
 * Options:
 *   --clear    Clear the old fcmToken field after migration (default: false)
 * 
 * Examples:
 *   # Migrate tokens without clearing old field
 *   npx tsx scripts/migrate-fcm-tokens.ts
 * 
 *   # Migrate tokens and clear old field
 *   npx tsx scripts/migrate-fcm-tokens.ts --clear
 */

import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function migrateFcmTokens(clearOldTokens: boolean = false) {
  console.log('🔄 Starting FCM token migration...\n');

  try {
    // Find all users with FCM tokens
    const usersWithTokens = await prisma.user.findMany({
      where: {
        fcmToken: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        fcmToken: true,
      },
    });

    if (usersWithTokens.length === 0) {
      console.log('✅ No users with FCM tokens found. Nothing to migrate.\n');
      return;
    }

    console.log(`📊 Found ${usersWithTokens.length} user(s) with FCM tokens\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of usersWithTokens) {
      if (!user.fcmToken) {
        continue;
      }

      try {
        // Check if device with this token already exists
        const existingDevice = await prisma.device.findUnique({
          where: { fcmToken: user.fcmToken },
        });

        if (existingDevice) {
          // Device already exists, check if it belongs to this user
          if (existingDevice.userId === user.id) {
            console.log(`⏭️  Skipping user ${user.id} (${user.name || user.phone || 'N/A'}) - device already exists`);
            skippedCount++;
            continue;
          } else {
            // Token belongs to different user - update it
            console.log(`🔄 Updating device for user ${user.id} (${user.name || user.phone || 'N/A'})`);
            await prisma.device.update({
              where: { fcmToken: user.fcmToken },
              data: {
                userId: user.id,
                deviceInfo: 'Migrated from User.fcmToken',
                updatedAt: new Date(),
              },
            });
            migratedCount++;
          }
        } else {
          // Create new device record
          console.log(`✅ Creating device for user ${user.id} (${user.name || user.phone || 'N/A'})`);
          await prisma.device.create({
            data: {
              userId: user.id,
              fcmToken: user.fcmToken,
              deviceInfo: 'Migrated from User.fcmToken',
            },
          });
          migratedCount++;
        }

        // Clear old token if requested
        if (clearOldTokens) {
          await prisma.user.update({
            where: { id: user.id },
            data: { fcmToken: null },
          });
        }
      } catch (error: any) {
        console.error(`❌ Error migrating token for user ${user.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (clearOldTokens) {
      console.log(`\n🧹 Old fcmToken fields have been cleared`);
    } else {
      console.log(`\n💡 Old fcmToken fields preserved (use --clear to remove them)`);
    }

    console.log('\n✅ Migration completed!\n');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const clearOldTokens = args.includes('--clear');

  try {
    await migrateFcmTokens(clearOldTokens);
  } catch (error) {
    console.error('Failed to migrate FCM tokens:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { migrateFcmTokens };
