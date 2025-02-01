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
     * }
     */
    const response = await sql`
        SELECT * FROM friend_requests
        WHERE user_id1 = ${userId} OR user_id2 = ${userId}
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
