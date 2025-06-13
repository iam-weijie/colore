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
    let response;
    
    if (email) {
      console.log("[DEBUG] getSalt API - Searching by email:", email);
      response = await sql`SELECT salt FROM users WHERE email = ${email}`;
    } else {
      console.log("[DEBUG] getSalt API - Searching by clerk_id:", id);
      response = await sql`SELECT salt FROM users WHERE clerk_id = ${id}`;
    }

    console.log("[DEBUG] getSalt API - Query response length:", response.length);
    
    if (response.length === 0) {
      console.log("[DEBUG] getSalt API - User not found");
      return new Response(JSON.stringify({ error: "User not found", salt: null }), {
        status: 404,
      });
    }

    console.log("[DEBUG] getSalt API - Salt found:", Boolean(response[0].salt));
    
    return new Response(JSON.stringify({ salt: response[0].salt }), {
      status: 200,
    });
  } catch (error) {
    console.error("[DEBUG] getSalt API - Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch salt" }), {
      status: 500,
    });
  }
} 