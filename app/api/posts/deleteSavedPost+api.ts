import { neon } from "@neondatabase/serverless";

export async function DELETE(request: Request) {
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
      DELETE FROM saved_posts
      WHERE user_id = ${userId} AND post_id = ${postId}
      RETURNING *;
    `;

    return new Response(JSON.stringify({ success: true, data: result[0] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Delete error:", error);
    return new Response(JSON.stringify({ error: "Failed to unsave post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
