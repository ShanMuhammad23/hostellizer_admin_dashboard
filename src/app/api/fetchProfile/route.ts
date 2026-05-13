import { sql } from '@/lib/db';

import { NextRequest } from 'next/server';
import { getAuthenticatedHostelId } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const hostel_id = await getAuthenticatedHostelId();
        
        if (!hostel_id) {
            return Response.json({
                success: false,
                message: 'Not authenticated'
            }, { status: 401 });
        }

        console.log('Fetching profile for hostel ID:', hostel_id);
        
        // First, let's check if the hostel exists
        const hostelExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM hostels WHERE id = ${hostel_id}::uuid
            );
        `;

        console.log('Hostel exists check:', hostelExists[0].exists);

        if (!hostelExists[0].exists) {
            return Response.json({
                success: false,
                message: 'Hostel not found. Please log out and log in again.'
            }, { status: 404 });
        }

        const ProfileData = await sql`
            SELECT
                h.id AS hostel_id,
                h.name AS hostel_name,
                (SELECT JSON_AGG(JSON_BUILD_OBJECT('street', ad.street, 'town', ad.town, 'city', ad.city))
                 FROM addresses ad
                 WHERE ad.hostelid = h.id) AS addresses,
                h.email AS hostel_email,
                h.phone AS hostel_phone,
                COALESCE(h.rentrange, '{"min": 0, "max": 0}'::jsonb) AS hostel_monthly_rent_range,
                h.totalrooms,
                h.vacanciesavailable,
                h.totalrooms - h.vacanciesavailable as total_vacancies,
                (SELECT ARRAY_AGG(ru.description)
                 FROM rules ru
                 WHERE ru.hostelid = h.id) AS hostel_rules,
                COALESCE(h.amenities::jsonb, '{
                    "wifi": false,
                    "laundry": false,
                    "mess": {"available": false, "price_per_month": 0},
                    "security": false,
                    "powerBackup": false,
                    "kitchen": false,
                    "parking": false,
                    "electricity": {"included_in_rent": false, "price_per_unit": 0},
                    "transport": {"speedo_stop": "", "distance_in_meters": 0}
                }'::jsonb) AS amenities,
                (SELECT COUNT(*)
                 FROM reviews rev
                 INNER JOIN students st ON st.id = rev.student_id AND st.hostelid = h.id) AS number_of_reviews,
                (SELECT COUNT(*)
                 FROM applications app
                 INNER JOIN students st2 ON st2.id = app.student_id AND st2.hostelid = h.id) AS number_of_applications,
                COALESCE(h.images, ARRAY[]::text[]) AS hostel_images
            FROM
                hostels h
            WHERE
                h.id = ${hostel_id}::uuid;
        `;

        console.log('Query result:', JSON.stringify(ProfileData, null, 2));
        console.log('Rent range data:', ProfileData[0]?.hostel_monthly_rent_range);
        console.log('Rent range type:', typeof ProfileData[0]?.hostel_monthly_rent_range);
        console.log('Rent range parsed:', JSON.parse(JSON.stringify(ProfileData[0]?.hostel_monthly_rent_range)));

        if (!ProfileData || ProfileData.length === 0) {
            console.log('No hostel found with ID:', hostel_id);
            return Response.json({
                success: false,
                message: 'Hostel not found'
            }, { status: 404 });
        }

        // Ensure hostel_images is always an array
        const data = ProfileData[0];
        if (!data.hostel_images) {
            data.hostel_images = [];
        }

        // Parse the rent range JSON string into an object
        if (typeof data.hostel_monthly_rent_range === 'string') {
            try {
                data.hostel_monthly_rent_range = JSON.parse(data.hostel_monthly_rent_range);
            } catch (e) {
                console.error('Error parsing rent range:', e);
                data.hostel_monthly_rent_range = { min: 0, max: 0 };
            }
        }

        // Ensure amenities is an object, not a JSON string
        if (typeof data.amenities === 'string') {
            try {
                data.amenities = JSON.parse(data.amenities);
            } catch (e) {
                console.error('Error parsing amenities:', e);
                data.amenities = {
                    wifi: false,
                    laundry: false,
                    mess: { available: false, price_per_month: 0 },
                    security: false,
                    powerBackup: false,
                    kitchen: false,
                    parking: false,
                    electricity: { included_in_rent: false, price_per_unit: 0 },
                    transport: { speedo_stop: '', distance_in_meters: 0 },
                };
            }
        }

        // Log the final data being sent
        console.log('Sending response data:', JSON.stringify(data, null, 2));

        return Response.json({
            success: true,
            ProfileData: [data]
        });
    } catch (error) {
        console.error('Detailed API Error:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            error: error
        });
        
        return Response.json({
            success: false,
            message: 'Error fetching data',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
