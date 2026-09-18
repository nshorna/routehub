#!/usr/bin/env node

/**
 * Script to delete all Firebase users
 * 
 * This script will:
 * 1. List all Firebase users
 * 2. Delete all Firebase users in batches
 * 
 * Usage:
 *   pnpm delete-all-firebase-users [--confirm]
 * 
 * Or directly:
 *   npx tsx scripts/delete-all-firebase-users.ts [--confirm]
 * 
 * Examples:
 *   # List users and ask for confirmation
 *   pnpm delete-all-firebase-users
 * 
 *   # Skip confirmation prompt (use with caution!)
 *   pnpm delete-all-firebase-users --confirm
 * 
 * Warning: This will permanently delete ALL Firebase users!
 *          This action cannot be undone.
 */

import 'dotenv/config';
import admin from 'firebase-admin';
import * as readline from 'readline';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '');
if (!serviceAccount?.project_id) {
  throw new Error('Set FIREBASE_SERVICE_ACCOUNT in your environment before running this script.');
}

let firebaseAdmin: admin.app.App;
try {
  firebaseAdmin = admin.app();
} catch (error) {
  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firebaseAuth = firebaseAdmin.auth();

// Batch size for deletion (Firebase has rate limits)
const BATCH_SIZE = 1000;

/**
 * Get confirmation from user
 */
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Delete all Firebase users
 */
async function deleteAllFirebaseUsers(skipConfirmation: boolean = false) {
  try {
    console.log('\n🔍 Fetching all Firebase users...\n');

    // List all users
    let allUsers: admin.auth.UserRecord[] = [];
    let nextPageToken: string | undefined;

    do {
      const listUsersResult = await firebaseAuth.listUsers(BATCH_SIZE, nextPageToken);
      allUsers = allUsers.concat(listUsersResult.users);
      nextPageToken = listUsersResult.pageToken;
      
      console.log(`   Found ${allUsers.length} users so far...`);
    } while (nextPageToken);

    const totalUsers = allUsers.length;

    if (totalUsers === 0) {
      console.log('\n✅ No Firebase users found. Nothing to delete.\n');
      return;
    }

    console.log(`\n📊 Total Firebase users found: ${totalUsers}`);
    console.log('\nUsers to be deleted:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email || user.phoneNumber || 'No email/phone'} (UID: ${user.uid})`);
    });

    // Ask for confirmation unless --confirm flag is provided
    if (!skipConfirmation) {
      console.log('\n⚠️  WARNING: This will permanently delete ALL Firebase users!');
      console.log('   This action cannot be undone.\n');
      
      const confirmed = await askConfirmation('Are you sure you want to proceed? (yes/no): ');
      
      if (!confirmed) {
        console.log('\n❌ Operation cancelled. No users were deleted.\n');
        return;
      }
    }

    console.log('\n🗑️  Starting deletion process...\n');

    // Delete users in batches
    let deletedCount = 0;
    let failedCount = 0;
    const failedUsers: { uid: string; email?: string; error: string }[] = [];

    for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
      const batch = allUsers.slice(i, i + BATCH_SIZE);
      const uids = batch.map(user => user.uid);

      try {
        await firebaseAuth.deleteUsers(uids);
        deletedCount += batch.length;
        console.log(`   ✓ Deleted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} users (Total: ${deletedCount}/${totalUsers})`);
      } catch (error: any) {
        // If batch deletion fails, try individual deletions
        console.log(`   ⚠️  Batch deletion failed, trying individual deletions...`);
        
        for (const user of batch) {
          try {
            await firebaseAuth.deleteUser(user.uid);
            deletedCount++;
            console.log(`   ✓ Deleted: ${user.email || user.phoneNumber || user.uid}`);
          } catch (individualError: any) {
            failedCount++;
            const errorMsg = individualError.message || 'Unknown error';
            failedUsers.push({
              uid: user.uid,
              email: user.email,
              error: errorMsg,
            });
            console.log(`   ✗ Failed to delete: ${user.email || user.phoneNumber || user.uid} - ${errorMsg}`);
          }
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Deletion Summary:');
    console.log('='.repeat(60));
    console.log(`   Total users found: ${totalUsers}`);
    console.log(`   Successfully deleted: ${deletedCount}`);
    console.log(`   Failed: ${failedCount}`);

    if (failedUsers.length > 0) {
      console.log('\n❌ Failed deletions:');
      failedUsers.forEach(({ uid, email, error }) => {
        console.log(`   - ${email || uid}: ${error}`);
      });
    }

    if (deletedCount === totalUsers) {
      console.log('\n✅ Success! All Firebase users have been deleted.\n');
    } else if (deletedCount > 0) {
      console.log(`\n⚠️  Partial success: ${deletedCount} out of ${totalUsers} users were deleted.\n`);
    } else {
      console.log('\n❌ Failed to delete any users.\n');
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const skipConfirmation = args.includes('--confirm') || args.includes('-y');

  try {
    await deleteAllFirebaseUsers(skipConfirmation);
  } catch (error) {
    console.error('Failed to delete Firebase users:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { deleteAllFirebaseUsers };
