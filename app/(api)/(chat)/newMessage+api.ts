import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    console.log("Received POST request.");
    const { conversationId, message, timestamp, senderId } = await request.json();

    const response = await sql`
      INSERT INTO messages (conversationId, message, timestamp, senderId)
      VALUES (${conversationId}, ${message}, ${timestamp}, ${senderId});
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
