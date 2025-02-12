import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("id");

    if (!clerkId) {
      return new Response(
        JSON.stringify({ error: "Missing user ID parameter" }),
        { status: 400 }
      );
    }

    console.log("fetching messages");

    // Query to fetch only unread messages where senderId is not the clerkId
    const userMessages = await sql`
      SELECT 
        m.conversationid,
        m.id AS message_id,
        m.senderid,
        m.message,
        m.timestamp,
        m.unread,
        m.notified
      FROM messages m
      JOIN conversations c 
        ON m.conversationid = c.id
      WHERE (c.clerk_id_1 = ${clerkId} OR c.clerk_id_2 = ${clerkId})
        AND m.unread = TRUE
        AND m.senderid != ${clerkId}
      ORDER BY m.timestamp ASC;
    `;

    let unread_messages = userMessages.length;
    const groupedMessages: Record<number, any> = {};

    userMessages.forEach((msg: any) => {
      // Only include unnotified messages in groupedMessages
      if (!msg.notified) {
        if (!groupedMessages[msg.conversationid]) {
          groupedMessages[msg.conversationid] = {
            conversationid: msg.conversationid,
            messages: [],
          };
        }
        groupedMessages[msg.conversationid].messages.push({
          id: msg.message_id,
          senderId: msg.senderid,
          message: msg.message,
          timestamp: msg.timestamp,
          unread: msg.unread,
          notified: msg.notified,
        });
      }
    });

    // Convert grouped messages to an array & filter out empty message lists
    const responseList = Object.values(groupedMessages).filter(
      (conversation) => conversation.messages.length > 0
    );

    return new Response(
      JSON.stringify({ toNotify: responseList, toRead: userMessages, unread_count: unread_messages }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch messages." }),
      { status: 500 }
    );
  }
}
