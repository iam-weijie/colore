import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`, { fullResults: true });
    const body = await request.json();
    const { email, clerkId, salt } = body;

    console.log("[DEBUG] newUser API - Received request:", {
      email: email || null,
      clerkId: clerkId || null,
      saltProvided: Boolean(salt)
    });

    // Check if email and clerkId are provided (salt can be added later)
    if (!email || !clerkId) {
      console.log("[DEBUG] newUser API - Error: Missing required fields", {
        email: Boolean(email),
        clerkId: Boolean(clerkId)
      });
      return Response.json(
        { error: "Missing email or clerkId" },
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    const { rows: existingUsers } = await sql.query(
      `SELECT id, email, clerk_id FROM users WHERE email = $1`,
      [email]
    );

    if (existingUsers.length > 0) {
      console.log("[DEBUG] newUser API - User already exists with this email:", email);
      
      // Do not update clerk_id to avoid foreign key constraint issues
      // Just return the existing user information
      return new Response(JSON.stringify({ 
        success: true,
        message: "User already exists",
        data: {
          id: existingUsers[0].id,
          email: existingUsers[0].email,
          clerk_id: existingUsers[0].clerk_id // Return the existing clerk_id
        }
      }), {
        status: 200,
      });
    }

    // Create a default username from email (remove domain part)
    const defaultUsername = email.split('@')[0];
    
    // Proceed with user creation even if salt is not provided
    const insertQuery = salt 
      ? `INSERT INTO users (email, clerk_id, salt, username) VALUES ($1, $2, $3, $4) RETURNING id, email, clerk_id`
      : `INSERT INTO users (email, clerk_id, username) VALUES ($1, $2, $3) RETURNING id, email, clerk_id`;
    
    const params = salt ? [email, clerkId, salt, defaultUsername] : [email, clerkId, defaultUsername];
    
    console.log(`[DEBUG] newUser API - Inserting new user ${salt ? 'with' : 'without'} salt`);
    const { rows } = await sql.query(insertQuery, params);

    console.log("[DEBUG] newUser API - User created successfully:", {
      id: rows[0]?.id,
      email: rows[0]?.email
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: "User created successfully",
      data: {
        id: rows[0]?.id,
        email: rows[0]?.email,
        clerk_id: rows[0]?.clerk_id
      }
    }), {
      status: 201,
    });
  } catch (error) {
    console.error("[DEBUG] newUser API - Error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
