import { neon } from "@neondatabase/serverless";
import { validateUserAuthorization } from "@/lib/auth";

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

    // Validate user authorization
    if (!validateUserAuthorization(userId, request.headers)) {
      return Response.json(
        { error: "Unauthorized - invalid user credentials" },
        { status: 401 }
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
     *  user1_username_encrypted,
     *  user2_username_encrypted
     * }
     */
    const response = await sql`
      SELECT 
        fr.id,
        fr.user_id1,
        fr.user_id2,
        fr.requestor,
        fr.created_at,
        fr.notified,
        u1.username_encrypted AS user1_username_encrypted,
        u1.nickname_encrypted AS user1_nickname_encrypted,
        u2.username_encrypted AS user2_username_encrypted,
        u2.nickname_encrypted AS user2_nickname_encrypted
      FROM friend_requests fr
      JOIN users u1 ON fr.user_id1 = u1.clerk_id
      JOIN users u2 ON fr.user_id2 = u2.clerk_id
      WHERE fr.user_id1 = ${userId} OR fr.user_id2 = ${userId}
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch comments",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
