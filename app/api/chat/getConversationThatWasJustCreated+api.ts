import { neon } from "@neondatabase/serverless";
import { ConversationItem } from "@/types/type";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const userId1 = url.searchParams.get("id1");
    const userId2 = url.searchParams.get("id2");

    //console.log("Received GET request for conversation between ", userId1, " and ", userId2);

  
    const rawResponse = await sql`
      SELECT 
        c.id::text, 
        c.clerk_id_1, 
        c.clerk_id_2 as other_clerk_id,
        c.last_message as "lastMessageContent", 
        c.last_message_timestamp as "lastMessageTimestamp",
        u_self.nicknames as nicknames,
        u2.username
      FROM conversations c
      LEFT JOIN users u2 ON c.clerk_id_2 = u2.clerk_id
      LEFT JOIN users u_self ON u_self.clerk_id = ${userId1}
      WHERE c.clerk_id_1 = ${userId1} 
      AND c.clerk_id_2 = ${userId2}
    `;

    // Transform the raw response to match the interface
    const conversations: ConversationItem[] = rawResponse.map(row => {
      // Find nickname for the other user if it exists
      const nicknames: string[][] = row.nicknames || [];
      const nickname = nicknames.find(([clerkId]) => clerkId === row.other_clerk_id)?.[1];

      return {
        id: row.id,
        name: nickname || row.username, // Use nickname if exists, otherwise use username
        clerk_id: row.other_clerk_id,
        lastMessageContent: row.lastMessageContent || null,
        lastMessageTimestamp: row.lastMessageTimestamp ? 
          row.lastMessageTimestamp.toISOString() : null,
        nickname: row.nicknames
      };
    });

    return new Response(JSON.stringify({ data: conversations }), {
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
