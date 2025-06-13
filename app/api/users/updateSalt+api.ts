import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const { email, clerkId, salt } = await request.json();
    
    console.log("[DEBUG] updateSalt API - Parameters:", { email, clerkId, saltProvided: Boolean(salt) });

    if ((!email && !clerkId) || !salt) {
      console.log("[DEBUG] updateSalt API - Error: Missing required parameters");
      return new Response(JSON.stringify({ error: "Email/clerkId and salt are required" }), {
        status: 400,
      });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
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
      console.log("[DEBUG] updateSalt API - User not found");
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
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