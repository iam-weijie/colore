import { ConversationItem } from "@/types/type";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`, { fullResults: true });
    const url = new URL(request.url);
    const userId = url.searchParams.get("id");

    ////console.log("Received GET request for conversations for user with ID: ", userId);

    const rawResponse = await sql.query(
      `
      SELECT 
        c.id::text,
        CASE 
          WHEN c.clerk_id_1 = $1 THEN
            CASE
              WHEN EXISTS (
                SELECT 1
                FROM friendships f
                WHERE 
                  (f.user_id = $1 AND f.friend_id = c.clerk_id_2)
                  OR
                  (f.friend_id = $1 AND f.user_id = c.clerk_id_2)
              ) THEN u2.incognito_name
              ELSE u2.username
            END
          ELSE
            CASE
              WHEN EXISTS (
                SELECT 1
                FROM friendships f
                WHERE 
                  (f.user_id = $1 AND f.friend_id = c.clerk_id_1)
                  OR
                  (f.friend_id = $1 AND f.user_id = c.clerk_id_1)
              ) THEN u1.incognito_name
              ELSE u1.username
            END
        END AS username,
        CASE 
          WHEN c.clerk_id_1 = $1 THEN c.clerk_id_2
          ELSE c.clerk_id_1
        END AS other_clerk_id,
        c.last_message as "lastMessageContent",
        c.last_message_timestamp as "lastMessageTimestamp",
        u_self.nicknames as nicknames
      FROM conversations c
      LEFT JOIN users u1 ON c.clerk_id_1 = u1.clerk_id
      LEFT JOIN users u2 ON c.clerk_id_2 = u2.clerk_id
      LEFT JOIN users u_self ON u_self.clerk_id = $1
      WHERE c.clerk_id_1 = $1
      OR c.clerk_id_2 = $1
    `,
      [userId]
    );

    // Transform the raw response to match the interface
    const conversations: ConversationItem[] = rows.map((row) => {
      // Find nickname for the other user if it exists
      const nicknames: string[][] = row.nicknames || [];
      const nickname = nicknames.find(
        ([clerkId]) => clerkId === row.other_clerk_id
      )?.[1];

      return {
        id: row.id,
        name: nickname || row.username, // Use nickname if exists, otherwise use username
        clerk_id: row.other_clerk_id,
        lastMessageContent: row.lastMessageContent || null,
        lastMessageTimestamp: row.lastMessageTimestamp
          ? row.lastMessageTimestamp.toISOString()
          : null,
        nickname: row.nicknames,
        active_participants: row.active_participants || 0,
        unread_messages: row.unread_messages || 0,
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
