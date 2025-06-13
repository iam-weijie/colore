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

    const sql = neon(`${process.env.DATABASE_URL}`);
    let userExists = false;
    
    // First check if the user exists
    if (email) {
      console.log("[DEBUG] updateSalt API - Checking if user exists by email");
      const checkUser = await sql`SELECT clerk_id FROM users WHERE email = ${email}`;
      userExists = checkUser.length > 0;
      
      if (userExists && !clerkId && checkUser[0].clerk_id) {
        // If clerkId wasn't provided but we found it in the database, use it
        clerkId = checkUser[0].clerk_id;
        console.log("[DEBUG] updateSalt API - Found clerkId from email lookup:", clerkId);
      }
    } else if (clerkId) {
      console.log("[DEBUG] updateSalt API - Checking if user exists by clerk_id");
      const checkUser = await sql`SELECT email FROM users WHERE clerk_id = ${clerkId}`;
      userExists = checkUser.length > 0;
      
      if (userExists && !email && checkUser[0].email) {
        // If email wasn't provided but we found it in the database, use it
        email = checkUser[0].email;
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
    let response;
    
    if (email) {
      console.log("[DEBUG] updateSalt API - Updating by email:", email);
      response = await sql`
        UPDATE users 
        SET salt = ${salt} 
        WHERE email = ${email} 
        RETURNING clerk_id, email, salt`;
    } else {
      console.log("[DEBUG] updateSalt API - Updating by clerk_id:", clerkId);
      response = await sql`
        UPDATE users 
        SET salt = ${salt} 
        WHERE clerk_id = ${clerkId} 
        RETURNING clerk_id, email, salt`;
    }

    console.log("[DEBUG] updateSalt API - Update response:", response.length > 0);
    
    if (response.length === 0) {
      console.log("[DEBUG] updateSalt API - Update failed, no rows affected");
      return new Response(JSON.stringify({ error: "Update failed" }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Salt updated successfully",
      user: {
        clerk_id: response[0].clerk_id,
        email: response[0].email,
        saltUpdated: Boolean(response[0].salt)
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