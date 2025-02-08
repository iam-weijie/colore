import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const comment = await request.json();
    const commentId = comment.commentId;

    if (!commentId) {
      return new Response(
        JSON.stringify({ error: "Missing commentId field" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Execute the SQL update query
    const response = await sql`
      UPDATE comments
      SET notified = TRUE
      WHERE id = ${commentId}
      RETURNING *;
    `;

    if (response.length === 0) {
      return new Response(
        JSON.stringify({ error: "Comment not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Comment notified status updated", data: response }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update comment notified status" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
