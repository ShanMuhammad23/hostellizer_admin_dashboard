import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

import { getAuthenticatedHostelId } from '@/lib/auth';

// GET - Fetch all documents for a student
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const hostelId = await getAuthenticatedHostelId();

    // Verify student belongs to the authenticated hostel
    const studentCheck = await sql`
      SELECT id FROM students 
      WHERE id = ${id}::integer AND hostelid = ${hostelId}
    `;

    if (studentCheck.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Student not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch documents for the student
    const documents = await sql`
      SELECT 
        id,
        hostelid,
        studentid,
        documentdata,
        created_at,
        updated_at
      FROM documents
      WHERE studentid = ${id}::integer
      ORDER BY created_at DESC
    `;

    // Parse the JSONB documentdata for each document
    const parsedDocuments = documents.map(doc => ({
      ...doc,
      documentdata: typeof doc.documentdata === 'string' 
        ? JSON.parse(doc.documentdata) 
        : doc.documentdata
    }));

    return NextResponse.json({
      success: true,
      documents: parsedDocuments
    });

  } catch (error) {
    console.error('Error fetching student documents:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch documents',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Upload a new document for a student
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const hostelId = await getAuthenticatedHostelId();
    const body = await request.json();
    
    const { documentType, imageUrl, fileName, status = 'pending' } = body;

    // Validate required fields
    if (!documentType || !imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Document type and image URL are required' },
        { status: 400 }
      );
    }

    // Validate document type
    const validDocumentTypes = ['e-stamp', 'cnic-front', 'cnic-back', 'parent-id-1', 'parent-id-2'];
    if (!validDocumentTypes.includes(documentType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid document type' },
        { status: 400 }
      );
    }

    // Verify student belongs to the authenticated hostel
    const studentCheck = await sql`
      SELECT id FROM students 
      WHERE id = ${id}::integer AND hostelid = ${hostelId}
    `;

    if (studentCheck.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Student not found or access denied' },
        { status: 404 }
      );
    }

    // Check if document of this type already exists for the student
    const existingDocument = await sql`
      SELECT id FROM documents 
      WHERE studentid = ${id}::integer AND documentdata->>'type' = ${documentType}
    `;

    let result;
    // Prepare document data object
    const documentData = {
      type: documentType,
      url: imageUrl,
      fileName: fileName || `${documentType}.jpg`,
      status: status,
      uploadedAt: new Date().toISOString()
    };

    if (existingDocument.length > 0) {
      // Update existing document
      result = await sql`
        UPDATE documents 
        SET 
          documentdata = ${JSON.stringify(documentData)}::jsonb,
          updated_at = CURRENT_TIMESTAMP
        WHERE studentid = ${id}::integer AND documentdata->>'type' = ${documentType}
        RETURNING id, hostelid, studentid, documentdata, created_at, updated_at
      `;
    } else {
      // Create new document
      result = await sql`
        INSERT INTO documents (
          hostelid,
          studentid,
          documentdata
        ) VALUES (
          ${hostelId},
          ${id}::integer,
          ${JSON.stringify(documentData)}::jsonb
        )
        RETURNING id, hostelid, studentid, documentdata, created_at, updated_at
      `;
    }

    // Parse the JSONB documentdata in the result
    const parsedResult = {
      ...result[0],
      documentdata: typeof result[0].documentdata === 'string' 
        ? JSON.parse(result[0].documentdata) 
        : result[0].documentdata
    };

    return NextResponse.json({
      success: true,
      message: existingDocument.length > 0 ? 'Document updated successfully' : 'Document uploaded successfully',
      document: parsedResult
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload document',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const hostelId = await getAuthenticatedHostelId();
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { success: false, message: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Verify student belongs to the authenticated hostel
    const studentCheck = await sql`
      SELECT id FROM students 
      WHERE id = ${id}::integer AND hostelid = ${hostelId}
    `;

    if (studentCheck.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Student not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the document
    const result = await sql`
      DELETE FROM documents 
      WHERE id = ${documentId}::uuid AND studentid = ${id}::integer AND hostelid = ${hostelId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete document',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
