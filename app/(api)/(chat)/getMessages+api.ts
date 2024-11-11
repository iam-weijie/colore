import { neon } from "@neondatabase/serverless";
import { Message } from "@/types/type";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const Id = url.searchParams.get("id");

    console.log("Received GET request for messages from conversation with ID: ", Id);

  
    const rawResponse = await sql`
      SELECT 
        c.messages WHERE c.id = ${Id}`;

    // Transform the raw response to match the interface
    const conversation: Message[] = rawResponse.map(row => {
      return {
        id: row.messages[0],
        senderId: row.messages[1],
        content: row.messages[2],
        timestamp: row.messages[3]
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
