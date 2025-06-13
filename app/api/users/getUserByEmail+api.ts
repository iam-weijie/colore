import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    console.log("[DEBUG] getUserByEmail API - Parameters:", { email });

    if (!email) {
      console.log("[DEBUG] getUserByEmail API - Error: No email provided");
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
      });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`
      SELECT clerk_id, email, nickname, username, salt 
      FROM users 
      WHERE email = ${email}`;

    console.log("[DEBUG] getUserByEmail API - Query response length:", response?.length || 0);
    
    if (!response || response.length === 0) {
      console.log("[DEBUG] getUserByEmail API - User not found");
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ 
      clerk_id: response[0].clerk_id,
      email: response[0].email,
      nickname: response[0].nickname,
      username: response[0].username,
      has_salt: Boolean(response[0].salt)
    }), {
      status: 200,
    });
  } catch (error) {
    console.error("[DEBUG] getUserByEmail API - Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch user" }), {
      status: 500,
    });
  }
} 