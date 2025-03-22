import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const post = await request.json()
    const postId = post.id;

    if (!postId) {
      return new Response(
        JSON.stringify({ error: "Missing messageId field" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("came here")

    const response = await sql`
      UPDATE posts
      SET notified = TRUE
      WHERE id = ${postId}
      RETURNING *;
    `;

    if (response.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Message notified status updated", data: response }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update message notified status" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
