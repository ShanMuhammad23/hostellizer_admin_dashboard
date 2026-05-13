import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL environment variable is not set' },
        { status: 500 }
      );
    }

    // Log connection string (without sensitive info)
    const dbUrl = process.env.DATABASE_URL;
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    console.log('Testing connection to:', maskedUrl);

    // Test connection with different SSL modes
    let sql;
    let connectionError = null;

    // Try with SSL require first
    try {
      sql = postgres(dbUrl, { 
        ssl: 'require',
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10
      });
      
      // Test basic connection
      const result = await sql`SELECT version() as version, current_database() as database, current_user as user`;
      
      // Test if we can query tables
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;

      // Close the connection
      await sql.end();

      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        connection: {
          version: result[0]?.version,
          database: result[0]?.database,
          user: result[0]?.user
        },
        tables: tables.map(t => t.table_name),
        totalTables: tables.length
      });

    } catch (sslError) {
      connectionError = sslError;
      console.log('SSL require failed, trying without SSL...');
      
      // Try without SSL
      try {
        sql = postgres(dbUrl, { 
          ssl: false,
          max: 1,
          idle_timeout: 20,
          connect_timeout: 10
        });
        
        const result = await sql`SELECT version() as version, current_database() as database, current_user as user`;
        const tables = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
        `;

        await sql.end();

        return NextResponse.json({
          success: true,
          message: 'Database connection successful (without SSL)',
          connection: {
            version: result[0]?.version,
            database: result[0]?.database,
            user: result[0]?.user
          },
          tables: tables.map(t => t.table_name),
          totalTables: tables.length
        });

      } catch (noSslError) {
        connectionError = noSslError;
        console.log('Both SSL modes failed');
      }
    }

    // If we get here, both connection attempts failed
    throw connectionError;

  } catch (error) {
    console.error('Database connection error:', error);
    
    // Provide more detailed error information
    let errorDetails = 'Unknown error';
    let errorCode = 'UNKNOWN';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Check for specific error patterns
      if (error.message.includes('Tenant or user not found')) {
        errorCode = 'AUTH_ERROR';
        errorDetails = 'Authentication failed - check your database credentials and connection string';
      } else if (error.message.includes('ENOTFOUND')) {
        errorCode = 'CONNECTION_ERROR';
        errorDetails = 'Could not resolve hostname - check your database URL';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorCode = 'CONNECTION_REFUSED';
        errorDetails = 'Connection refused - check if database is running and accessible';
      } else if (error.message.includes('timeout')) {
        errorCode = 'TIMEOUT';
        errorDetails = 'Connection timeout - check network and firewall settings';
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        errorCode,
        details: errorDetails,
        suggestions: [
          'Verify your DATABASE_URL format is correct',
          'Check if the database credentials are valid',
          'Ensure the database is accessible from your network',
          'Try testing the connection string in a database client first'
        ]
      },
      { status: 500 }
    );
  }
}
