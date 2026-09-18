import { firebaseAuth } from './firebase.server';
import { prisma } from './prisma';
import { normalizePhoneTo233 } from './utils';
import type { UserRole } from '../lib/generated/prisma/client';

export interface AuthResult {
  user: {
    id: string; // email or phone
    name: string;
    phone: string | null;
    role?: string;
    /**
     * Normalised high-level account status for dashboard / guards
     * - For riders: derived from Rider.status (PENDING/APPROVED/REJECTED)
     * - For sellers: derived from Seller.status (PENDING/APPROVED/REJECTED)
     */
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    sellerAccounts?: Array<{
      id: string;
      role: string;
      seller: {
        id: string;
        businessName: string;
        contactName: string;
        status: string;
      };
    }>;
    riderAccounts?: Array<{
      id: string;
      role: string;
      rider: {
        id: string;
        status: string;
      };
    }>;
  };
  token: string;
}

/**
 * Verify Firebase ID token and get or create user in database
 * For new users, defaults to CUSTOMER role
 * NOTE: This function needs to be updated to work with the new schema
 * where User.id is email/phone and roles are in UserRoleAssignment
 */
export async function verifyFirebaseToken(idToken: string): Promise<AuthResult> {
  try {
    // Check if firebaseAuth is initialized
    if (!firebaseAuth) {
      const errorMsg = 'Firebase Admin is not initialized. Please check your service account configuration.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!idToken || typeof idToken !== 'string') {
      throw new Error('Invalid ID token provided');
    }

    // Verify the Firebase ID token
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const email = decodedToken.email;
    const rawPhone = decodedToken.phone_number || null;
    // Normalize phone number to ensure consistency (Firebase returns E.164 format, but normalize to be safe)
    const phone = rawPhone ? normalizePhoneTo233(rawPhone) : null;
    const name = decodedToken.name || email?.split('@')[0] || phone || 'User';

    // For phone auth, email might be null
    if (!email && !phone) {
      throw new Error('Email or phone is required for authentication');
    }

    // User.id is email or phone (normalized)
    const userId = email || phone!;

    // Upsert user (create or update)
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        name: name || undefined,
        phone: phone || undefined,
      },
      create: {
        id: userId,
        name,
        phone,
      },
    });

    // If user has phone, ensure customer record exists (with normalized phone)
    let customer = null;
    if (phone) {
      const normalizedCustomerPhone = normalizePhoneTo233(phone);
      customer = await prisma.customer.upsert({
        where: { phone: normalizedCustomerPhone },
        update: {
          name: name || undefined,
        },
        create: {
          phone: normalizedCustomerPhone,
          name: name || undefined,
        },
      });
    }

    // Fetch user with seller and rider accounts
    const userWithAccounts = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sellerAccounts: {
          include: {
            seller: true,
          },
        },
        riderAccounts: {
          include: {
            rider: true,
          },
        },
      },
    });

    if (!userWithAccounts) {
      throw new Error('Failed to create or retrieve user');
    }

    // Determine role: CUSTOMER if customer record exists (phone auth), otherwise check seller/rider accounts
    let role = 'CUSTOMER';
    if (customer) {
      // User has customer record - they're a customer
      role = 'CUSTOMER';
    } else if (userWithAccounts.sellerAccounts.length > 0) {
      role = 'SELLER';
    } else if (userWithAccounts.riderAccounts && userWithAccounts.riderAccounts.length > 0) {
      role = 'RIDER';
    }

    // Derive a normalised high-level status for guards & dashboards
    let status: 'PENDING' | 'APPROVED' | 'REJECTED' | undefined = undefined;

    if (role === 'RIDER' && userWithAccounts.riderAccounts.length > 0) {
      const riderStatus = userWithAccounts.riderAccounts[0].rider?.status;
      if (riderStatus === 'APPROVED') {
        status = 'APPROVED';
      } else if (riderStatus === 'REJECTED') {
        status = 'REJECTED';
      } else {
        // PENDING_APPROVAL, INACTIVE, SUSPENDED → treat as pending for guard logic
        status = 'PENDING';
      }
    } else if (role === 'SELLER' && userWithAccounts.sellerAccounts.length > 0) {
      const sellerStatus = userWithAccounts.sellerAccounts[0].seller?.status;
      if (sellerStatus === 'VERIFIED' || sellerStatus === 'ACTIVE') {
        status = 'APPROVED';
      } else if (sellerStatus === 'SUSPENDED' || sellerStatus === 'INACTIVE') {
        status = 'REJECTED';
      } else {
        // PENDING_VERIFICATION, PENDING_INFORMATION_UPDATE → pending
        status = 'PENDING';
      }
    }

    return {
      user: {
        id: userWithAccounts.id,
        name: userWithAccounts.name,
        phone: userWithAccounts.phone,
        role,
        status,
        sellerAccounts: userWithAccounts.sellerAccounts.map((assignment) => ({
          id: assignment.id,
          role: assignment.role,
          seller: {
            id: assignment.seller.id,
            businessName: assignment.seller.businessName,
            contactName: assignment.seller.contactName,
            status: assignment.seller.status,
          },
        })),
        riderAccounts: userWithAccounts.riderAccounts.map((assignment) => ({
          id: assignment.id,
          role: assignment.role,
          rider: {
            id: assignment.rider.id,
            status: assignment.rider.status,
          },
        })),
      },
      token: idToken,
    };
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    // Provide more specific error messages
    if (error instanceof Error) {
      // If it's a Firebase auth error, preserve the original message
      if (error.message.includes('auth/') || error.message.includes('token')) {
        throw error;
      }
      // If it's a database connection error, provide a more helpful message
      if (error.message.includes('pool timeout') || error.message.includes('connection')) {
        console.error('Database connection error - this is likely a database connectivity issue, not an authentication problem');
        throw new Error('Database connection failed. Please try again in a moment.');
      }
      throw new Error(`Authentication failed: ${error.message}`);
    }
    throw new Error('Invalid or expired token');
  }
}

/**
 * Register a new user with a specific role
 */
export async function registerUser(
  idToken: string,
  role: UserRole,
  additionalData?: {
    name?: string;
    phone?: string;
    email?: string; // For sellers, this is the business email
    businessName?: string; // For sellers
    contactName?: string; // For sellers
    pickupAddress?: string; // For sellers
    bikeInfo?: string; // For riders
  }
): Promise<AuthResult | null> {
  try {
    // Verify the Firebase ID token
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const email = decodedToken.email;
    const phone = decodedToken.phone_number || additionalData?.phone || null;
    const name = additionalData?.name || decodedToken.name || email?.split('@')[0] || 'User';

    // User.id is email or phone - we need at least one
    if (!email && !phone) {
      throw new Error('Email or phone is required for registration');
    }

    // Use email as the user ID (primary identifier)
    const userId = email || phone!;

    // // Check if user already exists
    // const existingUser = await prisma.user.findUnique({
    //   where: { id: userId },
    //   include: {
    //     roleAssignments: {
    //       where: { role: 'SELLER' },
    //     },
    //   },
    // });

    // if (existingUser) {
    //   // Check if they already have this role
    //   const hasRole = existingUser.roleAssignments.some((ra) => ra.role === role);
    //   if (hasRole) {
    //     throw new Error(`User already has the ${role} role`);
    //   }
    // }

    // // Create or update user
    // const user = existingUser
    //   ? await prisma.user.update({
    //       where: { id: userId },
    //       data: {
    //         name: name || existingUser.name,
    //         phone: phone || existingUser.phone,
    //       },
    //     })
    //   : await prisma.user.create({
    //       data: {
    //         id: userId,
    //         name,
    //         phone,
    //       },
    //     });

    // // Create role-specific profile and assignment
    // if (role === 'SELLER' && additionalData) {
    //   if (!additionalData.businessName || !additionalData.contactName || !additionalData.pickupAddress) {
    //     throw new Error('Business name, contact name, and pickup address are required for seller registration');
    //   }

    //   // Create seller profile
    //   const seller = await prisma.seller.create({
    //     data: {
    //       businessName: additionalData.businessName,
    //       contactName: additionalData.contactName,
    //       pickupAddress: additionalData.pickupAddress,
    //       phone: phone || undefined,
    //       businessEmail: additionalData.email || email || undefined,
    //     },
    //   });

    //   // Create role assignment linking user to seller
    //   await prisma.userRoleAssignment.create({
    //     data: {
    //       userId: user.id,
    //       role: 'SELLER',
    //       sellerId: seller.id,
    //     },
    //   });
    // } else if (role === 'ADMIN') {
    //   await prisma.userRoleAssignment.create({
    //     data: {
    //       userId: user.id,
    //       role: 'ADMIN',
    //     },
    //   });
    // } else if (role === 'RIDER' && additionalData) {
    //   const rider = await prisma.rider.create({
    //     data: {
    //       bikeInfo: additionalData.bikeInfo || null,
    //     },
    //   });

    //   await prisma.userRoleAssignment.create({
    //     data: {
    //       userId: user.id,
    //       role: 'RIDER',
    //       riderId: rider.id,
    //     },
    //   });
    // } else if (role === 'CUSTOMER') {
    //   // Create customer profile (id will be auto-generated as cuid)
    //   const customer = await prisma.customer.create({
    //     data: {},
    //   });

    //   await prisma.userRoleAssignment.create({
    //     data: {
    //       userId: user.id,
    //       role: 'CUSTOMER',
    //       customerId: customer.id,
    //     },
    //   });
    // }

    // return {
    //   user: {
    //     id: user.id,
    //     name: user.name,
    //     phone: user.phone,
    //   },
    //   token: idToken,
    // };
    return null
  } catch (error) {
    console.error('Error registering user:', error);
    throw error instanceof Error ? error : new Error('Registration failed');
  }
}

/**
 * Register a new seller
 * - If user exists, throws error (should redirect to login)
 * - If user is new, creates User, Seller, and SellerRoleAssignment with role OWNER
 */
export async function registerSeller(
  idToken: string,
  data: {
    name: string;
    phone?: string;
    email?: string; // Business email
    businessName: string;
    contactName: string;
    pickupAddress: string;
  }
): Promise<AuthResult> {
  try {
    // Verify the Firebase ID token
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const email = decodedToken.email;
    const rawPhone = decodedToken.phone_number || data.phone || null;
    // Normalize phone number to ensure consistency
    const phone = rawPhone ? normalizePhoneTo233(rawPhone) : null;
    const name = data.name || decodedToken.name || email?.split('@')[0] || 'User';

    // User.id is email or phone - we need at least one
    if (!email && !phone) {
      throw new Error('Email or phone is required for registration');
    }

    // Use email as the user ID (primary identifier), or normalized phone
    const userId = email || phone!;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sellerAccounts: {
          include: { seller: true },
        },
      },
    });

    if (existingUser) {
      // User exists - redirect to login
      throw new Error('User already exists. Please log in instead.');
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        phone,
      },
    });

    // Create seller profile with PENDING_VERIFICATION status
    const seller = await prisma.seller.create({
      data: {
        businessName: data.businessName,
        contactName: data.contactName,
        pickupAddress: data.pickupAddress,
        phone: phone || undefined,
        businessEmail: data.email || email || undefined,
        status: 'PENDING_VERIFICATION',
      },
    });

    // Create SellerRoleAssignment with role OWNER
    await prisma.sellerRoleAssignment.create({
      data: {
        userId: user.id,
        role: 'OWNER',
        sellerId: seller.id,
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
      token: idToken,
    };
  } catch (error) {
    console.error('Error registering seller:', error);
    throw error instanceof Error ? error : new Error('Seller registration failed');
  }
}

/**
 * Register a new rider/courier
 * - If user exists, throws error (should redirect to login)
 * - If user is new, creates User, Rider, and RiderRoleAssignment with role OWNER
 */
export async function registerRider(
  idToken: string,
  data: {
    name: string;
    phone?: string;
    email?: string;
    // Ghana Card Information
    ghanaCardName?: string;
    ghanaCardNumber?: string;
    dateOfBirth?: string; // ISO date string
    // Motorcycle License Information
    licenseNumber?: string;
    licenseExpiration?: string; // ISO date string
    bikeInfo?: string;
    // Device Verification
    hasSmartphone?: boolean;
    hasGhanaNumber?: boolean;
    // File UUIDs (files should be uploaded first, then referenced by UUID)
    licenseImageFileId?: string;
    profilePhotoFileId?: string;
  }
): Promise<AuthResult> {
  try {
    // Verify the Firebase ID token
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const email = decodedToken.email;
    const rawPhone = decodedToken.phone_number || data.phone || null;
    // Normalize phone number to ensure consistency
    const phone = rawPhone ? normalizePhoneTo233(rawPhone) : null;
    const name = data.name || decodedToken.name || email?.split('@')[0] || 'User';

    // User.id is email or phone - we need at least one
    if (!email && !phone) {
      throw new Error('Email or phone is required for registration');
    }

    // Use email as the user ID (primary identifier), or normalized phone
    const userId = email || phone!;

    // Parse date strings to DateTime objects
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    const licenseExpiration = data.licenseExpiration ? new Date(data.licenseExpiration) : null;

    // Check if user already exists and has a rider account
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        riderAccounts: {
          include: { rider: true },
        },
      },
    });

    if (existingUser) {
      // If user already has a rider account, redirect to login
      if (existingUser.riderAccounts.length > 0) {
        throw new Error('This email already has a courier account. Please log in instead.');
      }
      // User exists but doesn't have a rider account - update user info and create rider account
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name, // Use the provided name from registration form
          phone: phone || existingUser.phone, // Use provided phone or keep existing
        },
      });
      
      // Create rider profile with all data
      const rider = await prisma.rider.create({
        data: {
          email: data.email || email || null,
          phone: phone || null,
          ghanaCardName: data.ghanaCardName || null,
          ghanaCardNumber: data.ghanaCardNumber || null,
          dateOfBirth: dateOfBirth,
          licenseNumber: data.licenseNumber || null,
          licenseExpiration: licenseExpiration,
          bikeInfo: data.bikeInfo || null,
          hasSmartphone: data.hasSmartphone ?? false,
          hasGhanaNumber: data.hasGhanaNumber ?? false,
          status: 'PENDING_APPROVAL',
        },
      });

      // Create RiderRoleAssignment with role OWNER
      await prisma.riderRoleAssignment.create({
        data: {
          userId: user.id,
          role: 'OWNER',
          riderId: rider.id,
        },
      });

      // Link files if provided (accept either UUID or file ID)
      if (data.licenseImageFileId) {
        // Try to find file by UUID first, then by ID
        const file = await prisma.file.findFirst({
          where: {
            OR: [
              { uuid: data.licenseImageFileId },
              { id: data.licenseImageFileId },
            ],
          },
        });
        
        if (file) {
          await prisma.riderFile.create({
            data: {
              riderId: rider.id,
              fileId: file.id,
              fileType: 'LICENSE',
            },
          });
        } else {
          console.warn(`License file not found: ${data.licenseImageFileId}`);
        }
      }

      if (data.profilePhotoFileId) {
        // Try to find file by UUID first, then by ID
        const file = await prisma.file.findFirst({
          where: {
            OR: [
              { uuid: data.profilePhotoFileId },
              { id: data.profilePhotoFileId },
            ],
          },
        });
        
        if (file) {
          await prisma.riderFile.create({
            data: {
              riderId: rider.id,
              fileId: file.id,
              fileType: 'PROFILE_PHOTO',
            },
          });
        } else {
          console.warn(`Profile photo file not found: ${data.profilePhotoFileId}`);
        }
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
        },
        token: idToken,
      };
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        phone,
      },
    });

    // Create rider profile with all data
    const rider = await prisma.rider.create({
      data: {
        email: data.email || email || null,
        phone: phone || null,
        ghanaCardName: data.ghanaCardName || null,
        ghanaCardNumber: data.ghanaCardNumber || null,
        dateOfBirth: dateOfBirth,
        licenseNumber: data.licenseNumber || null,
        licenseExpiration: licenseExpiration,
        bikeInfo: data.bikeInfo || null,
        hasSmartphone: data.hasSmartphone ?? false,
        hasGhanaNumber: data.hasGhanaNumber ?? false,
        status: 'PENDING_APPROVAL',
      },
    });

    // Create RiderRoleAssignment with role OWNER
    await prisma.riderRoleAssignment.create({
      data: {
        userId: user.id,
        role: 'OWNER',
        riderId: rider.id,
      },
    });

    // Link files if provided (accept either UUID or file ID)
    if (data.licenseImageFileId) {
      // Try to find file by UUID first, then by ID
      const file = await prisma.file.findFirst({
        where: {
          OR: [
            { uuid: data.licenseImageFileId },
            { id: data.licenseImageFileId },
          ],
        },
      });
      
      if (file) {
        await prisma.riderFile.create({
          data: {
            riderId: rider.id,
            fileId: file.id,
            fileType: 'LICENSE',
          },
        });
      } else {
        console.warn(`License file not found: ${data.licenseImageFileId}`);
      }
    }

    if (data.profilePhotoFileId) {
      // Try to find file by UUID first, then by ID
      const file = await prisma.file.findFirst({
        where: {
          OR: [
            { uuid: data.profilePhotoFileId },
            { id: data.profilePhotoFileId },
          ],
        },
      });
      
      if (file) {
        await prisma.riderFile.create({
          data: {
            riderId: rider.id,
            fileId: file.id,
            fileType: 'PROFILE_PHOTO',
          },
        });
      } else {
        console.warn(`Profile photo file not found: ${data.profilePhotoFileId}`);
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
      token: idToken,
    };
  } catch (error) {
    console.error('Error registering rider:', error);
    throw error instanceof Error ? error : new Error('Rider registration failed');
  }
}

/**
 * Get user by ID (email or phone)
 */
export async function getUserById(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sellerAccounts: {
        include: { seller: true },
      },
      riderAccounts: {
        include: { rider: true },
      },
    },
  });
}

/**
 * Get seller accounts for a user by ID token
 */
export async function getSellerAccounts(idToken: string) {
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const email = decodedToken.email;
    const rawPhone = decodedToken.phone_number || null;
    // Normalize phone number to ensure consistency
    const phone = rawPhone ? normalizePhoneTo233(rawPhone) : null;

    if (!email && !phone) {
      throw new Error('Email or phone is required');
    }

    const userId = email || phone!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sellerAccounts: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    return user.sellerAccounts.map((assignment) => ({
      id: assignment.id,
      role: assignment.role,
      seller: {
        id: assignment.seller.id,
        businessName: assignment.seller.businessName,
        contactName: assignment.seller.contactName,
        status: assignment.seller.status,
        businessEmail: assignment.seller.businessEmail,
        phone: assignment.seller.phone,
        pickupAddress: assignment.seller.pickupAddress,
      },
    }));
  } catch (error) {
    console.error('Error getting seller accounts:', error);
    throw error instanceof Error ? error : new Error('Failed to get seller accounts');
  }
}

/**
 * Check if user has required role
 */
export async function checkUserAccess(
  userId: string,
  requiredRole: UserRole
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sellerAccounts: {
        where: { role: requiredRole },
      },
      riderAccounts: {
        where: { role: requiredRole },
      },
    },
  });

  return !!(user?.sellerAccounts?.length || user?.riderAccounts?.length);
}

/**
 * Verify Firebase token and get platform admin user
 * Returns platform user with roles if user exists in PlatformUser table
 */
export async function verifyPlatformAdmin(idToken: string) {
  try {
    // Verify the Firebase ID token
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const email = decodedToken.email;
    const firebaseUid = decodedToken.uid;

    if (!email) {
      throw new Error('Email is required for platform admin authentication');
    }

    // Find platform user by email or firebaseUid
    const platformUser = await prisma.platformUser.findFirst({
      where: {
        OR: [
          { email },
          { firebaseUid },
        ],
      },
      include: {
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!platformUser) {
      throw new Error('This account is not registered as a platform admin');
    }

    // Update firebaseUid if it's not set
    if (!platformUser.firebaseUid) {
      await prisma.platformUser.update({
        where: { id: platformUser.id },
        data: { firebaseUid },
      });
    }

    return {
      id: platformUser.id,
      email: platformUser.email,
      name: platformUser.name,
      firebaseUid: platformUser.firebaseUid || firebaseUid,
      roles: platformUser.roles.map(r => r.role),
    };
  } catch (error) {
    console.error('Error verifying platform admin:', error);
    throw error instanceof Error ? error : new Error('Failed to verify platform admin');
  }
}
