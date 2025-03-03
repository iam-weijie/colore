import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const friendRequest = await request.json()
    const requestId = friendRequest.id;

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: "Missing requestId field" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await sql`
      UPDATE friend_requests
      SET notified = TRUE
      WHERE id = ${requestId}
      RETURNING *;
    `;

    if (response.length === 0) {
      return new Response(
        JSON.stringify({ error: "Friend Request not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Friend notified status updated", data: response }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update requests notified status" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
