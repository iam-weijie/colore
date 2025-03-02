import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const message = await request.json()
    const messageId = message.messageId;

    if (!messageId) {
      return new Response(
        JSON.stringify({ error: "Missing messageId field" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await sql`
      UPDATE messages
      SET notified = TRUE
      WHERE id = ${messageId}
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
