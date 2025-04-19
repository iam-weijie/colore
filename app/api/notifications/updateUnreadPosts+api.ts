import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const post = await request.json()
    const postId = post.id;

    if (!postId) {
      return new Response(
        JSON.stringify({ error: "Missing postId field" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await sql`
      UPDATE posts
      SET unread = FALSE
      WHERE id = ${postId}
      RETURNING *;
    `;

    if (response.length === 0) {
      return new Response(
        JSON.stringify({ error: "Post not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Post notified status updated", data: response }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update post unread status" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
