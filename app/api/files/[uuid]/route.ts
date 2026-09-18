import { NextRequest, NextResponse } from 'next/server';
import { getFileByUuid, deleteFile } from '@/lib/file-upload';
import { verifyFirebaseToken } from '@/lib/auth-utils';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    const file = await getFileByUuid(uuid);

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file from filesystem
    const assetsDir = join(process.cwd(), 'assets');
    const filePath = join(assetsDir, file.storedName);
    
    try {
      const fileBuffer = await readFile(filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': file.mimeType || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${file.originalName}"`,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found on filesystem' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error getting file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get file' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    const authResult = await verifyFirebaseToken(idToken);
    const ownerId = authResult.user.id;

    const { uuid } = params;

    await deleteFile(uuid, ownerId);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete file' },
      { status: 500 }
    );
  }
}
