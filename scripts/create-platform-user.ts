#!/usr/bin/env node

/**
 * Script to create or update platform users
 * 
 * This script will:
 * 1. Create a Firebase user (or update password if user exists)
 * 2. Upsert the user in PlatformUsers table
 * 3. Assign/update roles in PlatformUserRoleAssignment table
 * 
 * Usage:
 *   pnpm create-platform-user <email> <password> [roles...]
 * 
 * Or directly:
 *   npx tsx scripts/create-platform-user.ts <email> <password> [roles...]
 * 
 * Roles (one or more): OWNER, ADMIN, SELLER_ADMIN, RIDER_ADMIN, ANALYTICS
 * 
 * Examples:
 *   # Create user with OWNER role
 *   pnpm create-platform-user admin@gmail.com password123 OWNER
 * 
 *   # Create user with multiple roles
 *   pnpm create-platform-user admin@gmail.com password123 OWNER ADMIN SELLER_ADMIN
 * 
 *   # Update existing user (will update password and roles)
 *   pnpm create-platform-user existing@gmail.com newpassword123 ADMIN ANALYTICS
 * 
 * Note: If user already exists in Firebase, the password will be updated.
 *       Roles will be added/removed to match the provided list.
 */

import 'dotenv/config';
import admin from 'firebase-admin';
import { prisma } from '../lib/prisma';

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

// Valid roles
const VALID_ROLES = ['OWNER', 'ADMIN', 'SELLER_ADMIN', 'RIDER_ADMIN', 'ANALYTICS'] as const;
type PlatformUserRole = typeof VALID_ROLES[number];

async function createPlatformUser(
  email: string,
  password: string,
  roles: PlatformUserRole[],
  name?: string
) {
  try {
    console.log(`\n🚀 Creating platform user: ${email}`);
    console.log(`   Roles: ${roles.join(', ')}`);

    // Step 1: Create or get Firebase user
    let firebaseUser: admin.auth.UserRecord;
    let firebaseUid: string;

    try {
      // Try to get existing user
      firebaseUser = await firebaseAuth.getUserByEmail(email);
      firebaseUid = firebaseUser.uid;
      console.log(`   ✓ Firebase user already exists (UID: ${firebaseUid})`);
      
      // Update password if provided
      if (password) {
        await firebaseAuth.updateUser(firebaseUid, {
          password: password,
        });
        console.log(`   ✓ Password updated`);
      }
    } catch (error: any) {
      // User doesn't exist, create it
      if (error.code === 'auth/user-not-found') {
        firebaseUser = await firebaseAuth.createUser({
          email,
          password,
          displayName: name || email.split('@')[0],
          emailVerified: false,
        });
        firebaseUid = firebaseUser.uid;
        console.log(`   ✓ Firebase user created (UID: ${firebaseUid})`);
      } else {
        throw error;
      }
    }

    // Step 2: Upsert PlatformUser in database
    const platformUser = await prisma.platformUser.upsert({
      where: { email },
      update: {
        firebaseUid,
        name: name || firebaseUser.displayName || email.split('@')[0],
        updatedAt: new Date(),
      },
      create: {
        email,
        firebaseUid,
        name: name || firebaseUser.displayName || email.split('@')[0],
      },
    });

    console.log(`   ✓ PlatformUser upserted (ID: ${platformUser.id})`);

    // Step 3: Handle role assignments
    // Get existing roles
    const existingRoles = await prisma.platformUserRoleAssignment.findMany({
      where: { platformUserId: platformUser.id },
    });

    const existingRoleValues = existingRoles.map(r => r.role);
    const rolesToAdd = roles.filter(r => !existingRoleValues.includes(r));
    const rolesToRemove = existingRoleValues.filter(r => !roles.includes(r));

    // Remove roles that are no longer assigned
    if (rolesToRemove.length > 0) {
      await prisma.platformUserRoleAssignment.deleteMany({
        where: {
          platformUserId: platformUser.id,
          role: { in: rolesToRemove },
        },
      });
      console.log(`   ✓ Removed roles: ${rolesToRemove.join(', ')}`);
    }

    // Add new roles
    if (rolesToAdd.length > 0) {
      await prisma.platformUserRoleAssignment.createMany({
        data: rolesToAdd.map(role => ({
          platformUserId: platformUser.id,
          role,
        })),
        skipDuplicates: true,
      });
      console.log(`   ✓ Added roles: ${rolesToAdd.join(', ')}`);
    }

    if (rolesToAdd.length === 0 && rolesToRemove.length === 0) {
      console.log(`   ✓ Roles unchanged: ${roles.join(', ')}`);
    }

    // Step 4: Display final result
    const finalRoles = await prisma.platformUserRoleAssignment.findMany({
      where: { platformUserId: platformUser.id },
      select: { role: true },
    });

    console.log(`\n✅ Success! Platform user created/updated:`);
    console.log(`   Email: ${platformUser.email}`);
    console.log(`   Name: ${platformUser.name || 'N/A'}`);
    console.log(`   Firebase UID: ${platformUser.firebaseUid}`);
    console.log(`   Roles: ${finalRoles.map(r => r.role).join(', ')}`);
    console.log(`   ID: ${platformUser.id}\n`);

    return platformUser;
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(`
Usage: node -r ts-node/register scripts/create-platform-user.ts <email> <password> [roles...]

Roles (one or more): OWNER, ADMIN, SELLER_ADMIN, RIDER_ADMIN, ANALYTICS

Examples:
  npx tsx scripts/create-platform-user.ts admin@example.com password123 OWNER
  npx tsx scripts/create-platform-user.ts admin@example.com password123 OWNER ADMIN
  npx tsx scripts/create-platform-user.ts admin@example.com password123 OWNER ADMIN SELLER_ADMIN ANALYTICS
`);
    process.exit(1);
  }

  const email = args[0];
  const password = args[1];
  const roles = args.slice(2) as PlatformUserRole[];

  // Validate email
  if (!email.includes('@')) {
    console.error('❌ Error: Invalid email address');
    process.exit(1);
  }

  // Validate roles
  if (roles.length === 0) {
    console.error('❌ Error: At least one role must be specified');
    console.error(`   Valid roles: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  const invalidRoles = roles.filter(r => !VALID_ROLES.includes(r));
  if (invalidRoles.length > 0) {
    console.error(`❌ Error: Invalid roles: ${invalidRoles.join(', ')}`);
    console.error(`   Valid roles: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  try {
    await createPlatformUser(email, password, roles);
  } catch (error) {
    console.error('Failed to create platform user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { createPlatformUser };
