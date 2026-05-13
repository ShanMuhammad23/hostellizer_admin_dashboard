import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

import { getAuthenticatedHostelId } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET endpoint to fetch images for a hostel
export async function GET(request: NextRequest) {
    try {
        const hostel_id = await getAuthenticatedHostelId();

        const result = await sql`
            SELECT images
            FROM hostels
            WHERE id = ${hostel_id}::uuid;
        `;

        if (!result || result.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Hostel not found'
            }, { status: 404 });
        }

        const images = result[0].images || [];
        
        return NextResponse.json({
            success: true,
            images: images
        });
    } catch (error) {
        console.error('Error fetching images:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching images',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// POST endpoint to upload images for a hostel
export async function POST(request: NextRequest) {
    try {
        const hostel_id = await getAuthenticatedHostelId();
        
        if (!hostel_id) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json({ success: false, message: 'No image URL provided' }, { status: 400 });
        }

        // Update the hostel's images array in the database
        const result = await sql`
            UPDATE hostels
            SET images = array_append(COALESCE(images, ARRAY[]::text[]), ${imageUrl}::text)
            WHERE id = ${hostel_id}::uuid
            RETURNING images;
        `;

        return NextResponse.json({
            success: true,
            message: 'Image added successfully',
            images: result[0].images
        });
    } catch (error) {
        console.error('Error adding image:', error);
        return NextResponse.json({
            success: false,
            message: 'Error adding image',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// DELETE endpoint to remove an image
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        const hostel_id = await getAuthenticatedHostelId();
        const { imagePath } = await request.json();

        if (!imagePath) {
            return NextResponse.json({
                success: false,
                message: 'No image path provided'
            }, { status: 400 });
        }

        // Extract public_id from the Cloudinary URL
        const publicId = imagePath.split('/').slice(-1)[0].split('.')[0];

        // Delete from Cloudinary
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/destroy`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    public_id: publicId,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET,
                    timestamp: Math.floor(Date.now() / 1000),
                }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to delete image from Cloudinary');
        }

        // Remove the URL from the database
        const result = await sql`
            UPDATE hostels
            SET images = array_remove(images, ${imagePath}::text)
            WHERE id = ${hostel_id}::uuid
            RETURNING images;
        `;

        return NextResponse.json({
            success: true,
            message: 'Image deleted successfully',
            images: result[0].images
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        return NextResponse.json({
            success: false,
            message: 'Error deleting image',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
