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

    const sql = neon(`${process.env.DATABASE_URL}`, { fullResults: true });
    let rows = null;
    
    // First try to find by email if provided
    if (email) {
      console.log("[DEBUG] getSalt API - Searching by email:", email);
      const { rows: emailRows } = await sql.query(
        "SELECT salt, clerk_id FROM users WHERE email = $1",
        [email]
      );
      rows = emailRows;
      
      // If not found by email but we have a clerk_id from the response, try that
      if (rows.length === 0 && id) {
        console.log("[DEBUG] getSalt API - Email search failed, trying clerk_id:", id);
        const { rows: idRows } = await sql.query(
          "SELECT salt FROM users WHERE clerk_id = $1",
          [id]
        );
        rows = idRows;
      }
    } else if (id) {
      // If only id is provided
      console.log("[DEBUG] getSalt API - Searching by clerk_id:", id);
      const { rows: idRows } = await sql.query(
        "SELECT salt FROM users WHERE clerk_id = $1",
        [id]
      );
      rows = idRows;
    }

    console.log("[DEBUG] getSalt API - Query response length:", rows?.length || 0);
    
    if (!rows || rows.length === 0) {
      console.log("[DEBUG] getSalt API - User not found");
      return new Response(JSON.stringify({ error: "User not found", salt: null }), {
        status: 404,
      });
    }

    // If we found the user but they don't have a salt yet
    const hasSalt = Boolean(rows[0].salt);
    console.log("[DEBUG] getSalt API - Salt found:", hasSalt);
    
    return new Response(JSON.stringify({ 
      salt: rows[0].salt,
      clerk_id: rows[0].clerk_id || id,
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