import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is missing!");
      return new Response(
        JSON.stringify({ error: "Database configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = neon(process.env.DATABASE_URL);
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing 'userId' query parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch all entries where pl.user_id = userId
    const response = await sql`
    SELECT * 
    FROM post_likes pl
    JOIN posts p ON pl.post_id = p.id 
    WHERE pl.user_id = ${userId}
      AND p.expires_at > NOW()::timestamp
      AND p.available_at <= NOW()::timestamp
  `;

    if (!response || response.length === 0) {
      return new Response(
        JSON.stringify({ error: "No records found for the given userId" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const likedListIDS = response.map((p) => `${p.post_id}`)

    return new Response(
      JSON.stringify({ data: likedListIDS  }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Database error:", error.message || error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
