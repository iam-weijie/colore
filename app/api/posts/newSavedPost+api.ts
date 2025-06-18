// /api/saved-posts/route.ts
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { userId, postId } = await request.json();

    if (!userId || !postId) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await sql`
      INSERT INTO saved_posts (user_id, post_id)
      VALUES (${userId}, ${postId})
      RETURNING *;
    `;

    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Insert error:", error);
    return new Response(JSON.stringify({ error: "Failed to save post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
