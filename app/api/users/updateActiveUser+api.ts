import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const body = await request.json();
    const { clerkId, conversationId, activity } = body;

    // console.log("clerkId, conversationId, activity", clerkId, conversationId, activity);

    if (!clerkId || !conversationId) {
      return new Response(
        JSON.stringify({
          error: "Missing User Id or Conversation does not exist",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let response;

    if (activity) {
      // Append clerkId if it's not already in the array
      response = await sql`
        UPDATE conversations
        SET active_participants = 
          CASE 
            WHEN NOT (${clerkId} = ANY(active_participants)) 
            THEN array_append(active_participants, ${clerkId})
            ELSE active_participants
          END
        WHERE id = ${conversationId}
        RETURNING active_participants;
      `;
    } else {
      // Remove clerkId from the array
      response = await sql`
        UPDATE conversations
        SET active_participants = array_remove(active_participants, ${clerkId})
        WHERE id = ${conversationId}
        RETURNING active_participants;
      `;
    }

    if (!response || response.length === 0) {
      throw new Error("Failed to update active participants status");
    }

    return new Response(
      JSON.stringify({
        data: { active_participants: response[0].active_participants },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update conversation info" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
