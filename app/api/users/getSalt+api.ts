import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    const id = url.searchParams.get("id");

    console.log("[DEBUG] getSalt API - Parameters:", { email, id });

    if (!email && !id) {
      console.log("[DEBUG] getSalt API - Error: No email or id provided");
      return new Response(JSON.stringify({ error: "Email or ID is required" }), {
        status: 400,
      });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    let response = null;
    
    // First try to find by email if provided
    if (email) {
      console.log("[DEBUG] getSalt API - Searching by email:", email);
      response = await sql`SELECT salt, clerk_id FROM users WHERE email = ${email}`;
      
      // If not found by email but we have a clerk_id from the response, try that
      if (response.length === 0 && id) {
        console.log("[DEBUG] getSalt API - Email search failed, trying clerk_id:", id);
        response = await sql`SELECT salt FROM users WHERE clerk_id = ${id}`;
      }
    } else if (id) {
      // If only id is provided
      console.log("[DEBUG] getSalt API - Searching by clerk_id:", id);
      response = await sql`SELECT salt FROM users WHERE clerk_id = ${id}`;
    }

    console.log("[DEBUG] getSalt API - Query response length:", response?.length || 0);
    
    if (!response || response.length === 0) {
      console.log("[DEBUG] getSalt API - User not found");
      return new Response(JSON.stringify({ error: "User not found", salt: null }), {
        status: 404,
      });
    }

    // If we found the user but they don't have a salt yet
    const hasSalt = Boolean(response[0].salt);
    console.log("[DEBUG] getSalt API - Salt found:", hasSalt);
    
    return new Response(JSON.stringify({ 
      salt: response[0].salt,
      clerk_id: response[0].clerk_id || id,
    }), {
      status: 200,
    });
  } catch (error) {
    console.error("[DEBUG] getSalt API - Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch salt" }), {
      status: 500,
    });
  }
} 