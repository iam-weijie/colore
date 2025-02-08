import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    //console.log("Received POST request.");
    const { conversationId, message, timestamp, senderId } =
      await request.json();

    await sql`
      INSERT INTO messages (conversationId, message, timestamp, senderId)
      VALUES (${conversationId}, ${message}, ${timestamp}, ${senderId});
    `;

    await sql`
    UPDATE conversations
    SET unread_messages = unread_messages + 1
    WHERE id = ${conversationId};
  `;

  return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    //console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
