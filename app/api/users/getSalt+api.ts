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
    const response = await sql`SELECT clerk_id, salt, email FROM users WHERE email = ${email}`;

    if (response.length === 0) {
      console.log("[DEBUG] getSalt API - User not found");
      return new Response(JSON.stringify({ error: "User not found", salt: null }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ userId: response[0].clerk_id, salt: response[0].salt, email: response[0].email }), {
      status: 200,
    });
  } catch (error) {
    console.error("[DEBUG] getSalt API - Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch salt" }), {
      status: 500,
    });
  }
} 