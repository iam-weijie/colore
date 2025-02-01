import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // return friend requests involving user (sent or receiving)
    // if they exist as array of responses
    // the response is of the form:
    /**
     * {
     *  id,
     *  user_id1,
     *  user_id2,
     *  requestor = 'UID1' or 'UID2',
     *  created_at,
     *  user1_username,
     *  user2_username
     * }
     */
    const response = await sql`
      SELECT 
        fr.id,
        fr.user_id,
        fr.friend_id,
        fr.created_at,
        u1.username AS friend_username
      FROM friendships fr
      JOIN users u1 ON fr.user_id = u1.clerk_id
      WHERE fr.user_id = ${userId}
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching friend list:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch friend list",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
