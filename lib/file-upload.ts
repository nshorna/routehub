import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from './prisma';

export interface FileUploadResult {
  id: string;
  uuid: string;
  originalName: string;
  storedName: string;
  path: string;
  mimeType: string;
  size: number;
}

/**
 * Upload a file to the assets folder with UUID naming
 * @param file - File buffer or data
 * @param originalName - Original filename
 * @param mimeType - MIME type of the file
 * @param ownerId - User ID who owns the file
 * @returns File upload result with database record
 */
export async function uploadFile(
  file: Buffer | Uint8Array,
  originalName: string,
  mimeType: string,
  ownerId: string
): Promise<FileUploadResult> {
  // Generate UUID without hyphens
  const uuid = randomUUID().replace(/-/g, '');
  
  // Get file extension from original name
  const extension = originalName.split('.').pop() || '';
  const storedName = `${uuid}${extension ? '.' + extension : ''}`;
  
  // Create assets directory if it doesn't exist
  const assetsDir = join(process.cwd(), 'assets');
  try {
    await mkdir(assetsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
  
  // Write file to assets folder
  const filePath = join(assetsDir, storedName);
  await writeFile(filePath, file);
  
  // Get file size
  const size = file.length;
  
  // Save file metadata to database
  const fileRecord = await prisma.file.create({
    data: {
      uuid,
      originalName,
      storedName,
      mimeType,
      size,
      ownerId,
    },
  });
  
  return {
    id: fileRecord.id,
    uuid: fileRecord.uuid,
    originalName: fileRecord.originalName,
    storedName: fileRecord.storedName,
    path: filePath,
    mimeType: fileRecord.mimeType || mimeType,
    size: fileRecord.size || size,
  };
}

/**
 * Get file by UUID
 */
export async function getFileByUuid(uuid: string) {
  return await prisma.file.findUnique({
    where: { uuid },
  });
}

/**
 * Get files by owner
 */
export async function getFilesByOwner(ownerId: string) {
  return await prisma.file.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Delete file from filesystem and database
 */
export async function deleteFile(uuid: string, ownerId?: string) {
  const file = await prisma.file.findUnique({
    where: { uuid },
  });
  
  if (!file) {
    throw new Error('File not found');
  }
  
  // Check ownership if ownerId is provided
  if (ownerId && file.ownerId !== ownerId) {
    throw new Error('Unauthorized: You do not own this file');
  }
  
  // Delete from filesystem
  const { unlink } = await import('fs/promises');
  const assetsDir = join(process.cwd(), 'assets');
  const filePath = join(assetsDir, file.storedName);
  
  try {
    await unlink(filePath);
  } catch (error) {
    console.error('Error deleting file from filesystem:', error);
    // Continue with database deletion even if filesystem deletion fails
  }
  
  // Delete from database
  await prisma.file.delete({
    where: { uuid },
  });
  
  return { success: true };
}
