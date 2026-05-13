import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedHostelId } from "@/lib/auth";
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
    const hostel_id = await getAuthenticatedHostelId();
    if (!hostel_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const result = await sql`SELECT isacceptingapplications FROM hostels WHERE id = ${hostel_id}`;
        return NextResponse.json(result[0].isacceptingapplications);
    } catch (error) {
        console.error("Error fetching application status:", error);
        return NextResponse.json({ error: "Failed to fetch application status" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const hostel_id = await getAuthenticatedHostelId();
    try {
        const { isAcceptingApplications } = await request.json();
        await sql`UPDATE hostels SET isacceptingapplications = ${isAcceptingApplications} WHERE id = ${hostel_id}`;
        return NextResponse.json({ message: "Application status updated" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update application status" }, { status: 500 });
    }
}
