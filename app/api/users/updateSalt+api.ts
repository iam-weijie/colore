import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const requestData = await request.json();
    let { email, clerkId, salt } = requestData;
    
    console.log("[DEBUG] updateSalt API - Parameters:", { 
      email: email || null, 
      clerkId: clerkId || null, 
      saltProvided: Boolean(salt) 
    });

    if ((!email && !clerkId) || !salt) {
      console.log("[DEBUG] updateSalt API - Error: Missing required parameters");
      return new Response(JSON.stringify({ error: "Email/clerkId and salt are required" }), {
        status: 400,
      });
    }

    const sql = neon(`${process.env.DATABASE_URL}`, { fullResults: true });
    let userExists = false;
    
    // First check if the user exists
    if (email) {
      console.log("[DEBUG] updateSalt API - Checking if user exists by email");
      const { rows: checkUserByEmail } = await sql.query(
        "SELECT clerk_id FROM users WHERE email = $1",
        [email]
      );
      userExists = checkUserByEmail.length > 0;
      
      if (userExists && !clerkId && checkUserByEmail[0].clerk_id) {
        // If clerkId wasn't provided but we found it in the database, use it
        clerkId = checkUserByEmail[0].clerk_id;
        console.log("[DEBUG] updateSalt API - Found clerkId from email lookup:", clerkId);
      }
    } else if (clerkId) {
      console.log("[DEBUG] updateSalt API - Checking if user exists by clerk_id");
      const { rows: checkUserById } = await sql.query(
        "SELECT email FROM users WHERE clerk_id = $1",
        [clerkId]
      );
      userExists = checkUserById.length > 0;
      
      if (userExists && !email && checkUserById[0].email) {
        // If email wasn't provided but we found it in the database, use it
        email = checkUserById[0].email;
        console.log("[DEBUG] updateSalt API - Found email from clerkId lookup:", email);
      }
    }
    
    if (!userExists) {
      console.log("[DEBUG] updateSalt API - User not found, cannot update salt");
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }
    
    // Now update the salt
    let rows;
    
    if (email) {
      console.log("[DEBUG] updateSalt API - Updating by email:", email);
      const { rows: updateRows } = await sql.query(
        "UPDATE users SET salt = $1 WHERE email = $2 RETURNING clerk_id, email, salt",
        [salt, email]
      );
      rows = updateRows;
    } else {
      console.log("[DEBUG] updateSalt API - Updating by clerk_id:", clerkId);
      const { rows: updateRows } = await sql.query(
        "UPDATE users SET salt = $1 WHERE clerk_id = $2 RETURNING clerk_id, email, salt",
        [salt, clerkId]
      );
      rows = updateRows;
    }

    console.log("[DEBUG] updateSalt API - Update response:", rows.length > 0);
    
    if (rows.length === 0) {
      console.log("[DEBUG] updateSalt API - Update failed, no rows affected");
      return new Response(JSON.stringify({ error: "Update failed" }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Salt updated successfully",
      user: {
        clerk_id: rows[0].clerk_id,
        email: rows[0].email,
        saltUpdated: Boolean(rows[0].salt)
      }
    }), {
      status: 200,
    });
  } catch (error) {
    console.error("[DEBUG] updateSalt API - Error:", error);
    return new Response(JSON.stringify({ error: "Failed to update salt" }), {
      status: 500,
    });
  }
} 