import { NextResponse } from 'next/server';
import { getAuthenticatedHostelId } from '@/lib/auth';

// Remove the old config export and use route segment config
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum allowed for Hobby plan

export async function POST(request: Request) {
  try {
    const hostel_id = await getAuthenticatedHostelId();
    if (!hostel_id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ message: 'No image provided' }, { status: 400 });
    }

    // Upload to Cloudinary using their API
    const formData = new FormData();
    formData.append('file', image);
    formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || '');
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();

    return NextResponse.json({ 
      message: 'Profile picture uploaded successfully',
      imageUrl: result.secure_url 
    });
  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json({ 
      message: 'Error uploading profile picture',
      error: error.message 
    }, { status: 500 });
  }
} 