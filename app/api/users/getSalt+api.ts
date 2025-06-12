import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
      });
    }

    const sql = neon(`${process.env.DATABASE_URL}`);
    const response = await sql`SELECT salt FROM users WHERE email = ${email}`;

    if (response.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ salt: response[0].salt }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to fetch salt" }), {
      status: 500,
    });
  }
} 