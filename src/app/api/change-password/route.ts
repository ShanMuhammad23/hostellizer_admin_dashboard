import { NextRequest, NextResponse } from "next/server";
import { sql } from '@/lib/db';

import { getAuthenticatedHostelId } from "@/lib/auth";
import { addNotification } from "@/lib/notifications";
export async function POST(request: NextRequest) {
    const hostel_id = await getAuthenticatedHostelId();
    if (!hostel_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { currentPassword, newPassword } = await request.json();
    const user = await sql`SELECT * FROM hostels WHERE id = ${hostel_id}`;
    console.log(user);
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const isPasswordValid = await (currentPassword === user[0].password);
    if (!isPasswordValid) {
        return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
    }
    await sql`UPDATE hostels SET password = ${newPassword} WHERE id = ${hostel_id}`;
    await addNotification("Security Alert: Your password has been changed.");
    return NextResponse.json({ message: "Password changed successfully" }, { status: 200 });
}
