import { sql } from '@/lib/db';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const updateHostelSchema = z.object({
  hostel_name: z.string().min(2, "Hostel name must be at least 2 characters").optional(),
  hostel_email: z.string().email("Invalid email address").optional(),
  hostel_phone: z.string().min(10, "Phone number must be at least 10 digits"),
  addresses: z.array(z.object({
    street: z.string().min(1, "Street is required"),
    town: z.string().min(1, "Town is required"),
    city: z.string().min(1, "City is required"),
  })).optional(),
  hostel_monthly_rent_range: z.object({
    min: z.number().min(0, "Minimum rent must be at least 0"),
    max: z.number().min(0, "Maximum rent must be at least 0"),
  }),
  hostel_rules: z.array(z.string()),
  amenities: z.object({
    wifi: z.boolean(),
    laundry: z.boolean(),
    mess: z.object({
      available: z.boolean(),
      price_per_month: z.number().min(0, "Price must be at least 0"),
    }),
    security: z.boolean(),
    powerBackup: z.boolean(),
    kitchen: z.boolean(),
    parking: z.boolean(),
    electricity: z.object({
      included_in_rent: z.boolean(),
      price_per_unit: z.number().min(0, "Price must be at least 0"),
    }),
    transport: z.object({
      speedo_stop: z.string(),
      distance_in_meters: z.number().min(0, "Distance must be at least 0"),
    }),
  }),
  total_rooms: z.number().min(0, "Total rooms must be at least 0"),
  vacancies_available: z.number().min(0, "Vacancies must be at least 0"),
  total_vacancies: z.number().min(0, "Total vacancies must be at least 0"),
});

// Handle PATCH request for both fetching and updating hostel
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    console.log('Received PATCH request for hostel:', params.id);
    console.log('Request body:', body);
    
    // If no body is provided, fetch the hostel data
    if (!body || Object.keys(body).length === 0) {
      console.log('No body provided, fetching hostel data');
      const hostel = await sql`
        SELECT 
          h.id,
          h.name as hostel_name,
          h.email as hostel_email,
          h.phone as hostel_phone,
          h.totalrooms,
          h.vacanciesavailable,
          h.rentrange as hostel_monthly_rent_range,
          json_agg(DISTINCT jsonb_build_object(
            'street', ha.street,
            'town', ha.town,
            'city', ha.city
          )) as addresses,
          json_agg(DISTINCT hr.description) as hostel_rules,
          h.amenities::jsonb as amenities
        FROM hostels h
        LEFT JOIN addresses ha ON h.id = ha.hostel_id
        LEFT JOIN rules hr ON h.id = hr.hostelid
        WHERE h.id = ${params.id}
        GROUP BY h.id
      `;

      if (!hostel || hostel.length === 0) {
        console.log('Hostel not found:', params.id);
        return NextResponse.json(
          {
            success: false,
            message: "Hostel not found",
          },
          { status: 404 }
        );
      }

      console.log('Successfully fetched hostel data');
      return NextResponse.json({
        success: true,
        data: hostel[0],
      });
    }

    // Otherwise, update the hostel data
    console.log('Validating update data');
    const validatedData = updateHostelSchema.parse(body);
    console.log('Data validated successfully');

    // Use sql.begin() for transaction
    console.log('Starting database transaction');
    const result = await sql.begin(async (sql) => {
      // Update main hostel information
      console.log('Updating main hostel information');
      await sql`
        UPDATE hostels
        SET 
          ${validatedData.hostel_name ? sql`name = ${validatedData.hostel_name},` : sql``}
          ${validatedData.hostel_email ? sql`email = ${validatedData.hostel_email},` : sql``}
          phone = ${validatedData.hostel_phone},
          totalrooms = ${validatedData.total_rooms},
          vacanciesavailable = ${validatedData.vacancies_available},
          rentrange = ${JSON.stringify(validatedData.hostel_monthly_rent_range)}::jsonb,
          amenities = ${JSON.stringify(validatedData.amenities)}::jsonb
        WHERE id = ${params.id}
      `;

      // Only update addresses if provided
      if (validatedData.addresses) {
        // Delete existing addresses
        console.log('Deleting existing addresses');
        await sql`
          DELETE FROM addresses
          WHERE hostel_id = ${params.id}
        `;

        // Insert new addresses
        console.log('Inserting new addresses');
        for (const address of validatedData.addresses) {
          await sql`
            INSERT INTO addresses (hostel_id, street, town, city)
            VALUES (${params.id}, ${address.street}, ${address.town}, ${address.city})
          `;
        }
      }

      // Delete existing rules
      console.log('Deleting existing rules');
      await sql`
        DELETE FROM rules
        WHERE hostelid = ${params.id}
      `;

      // Insert new rules
      console.log('Inserting new rules');
      for (const rule of validatedData.hostel_rules) {
        await sql`
          INSERT INTO rules (hostelid, description)
          VALUES (${params.id}, ${rule})
        `;
      }

      // Fetch the updated hostel data
      console.log('Fetching updated hostel data');
      const updatedHostel = await sql`
        SELECT 
          h.id,
          h.name as hostel_name,
          h.email as hostel_email,
          h.phone as hostel_phone,
          h.totalrooms,
          h.vacanciesavailable,
          h.rentrange as hostel_monthly_rent_range,
          json_agg(DISTINCT jsonb_build_object(
            'street', ha.street,
            'town', ha.town,
            'city', ha.city
          )) as addresses,
          json_agg(DISTINCT hr.description) as hostel_rules,
          h.amenities::jsonb as amenities
        FROM hostels h
        LEFT JOIN addresses ha ON h.id = ha.hostelid
        LEFT JOIN rules hr ON h.id = hr.hostelid
        WHERE h.id = ${params.id}
        GROUP BY h.id
      `;

      console.log('Transaction completed successfully');
      return updatedHostel[0];
    });

    console.log('Sending success response');
    return NextResponse.json({
      success: true,
      message: "Hostel profile updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error with hostel operation:", error);
    
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to perform hostel operation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
