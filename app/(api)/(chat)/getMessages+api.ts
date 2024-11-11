import { neon } from "@neondatabase/serverless";
import { Message } from "@/types/type";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const conversationId = url.searchParams.get("id");

    console.log("Received GET request for messages from conversation with ID: ", conversationId);

  
    const rawResponse = await sql`
      SELECT id, message, timestamp, senderid FROM messages WHERE conversationid = ${conversationId}`;

    // Transform the raw response to match the interface
    const conversation: Message[] = rawResponse.map(row => {
      return {
        id: row.id,
        senderId: row.senderid,
        content: row.message,
        timestamp: row.timestamp.toISOString()
      };
    });

    return new Response(JSON.stringify({ data: conversation }), {
      status: 200,
    });
    
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user conversations." }),
      {
        status: 500,
      }
    );
  }
}
