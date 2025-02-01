import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const user_id = url.searchParams.get("user_id");
    const friend_id = url.searchParams.get("friend_id");

    if (!user_id || !friend_id) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // i mean why would you do this
    if (user_id === friend_id) {
      return Response.json({ error: "Unauthorized action." }, { status: 403 });
    }

    // return friend relationship (UNIQUE) if it exists
    /**
     * {
     *  id,
     *  user_id,
     *  friend_id,
     *  created_at
     * }
     */
    const response = await sql`
        SELECT * FROM friendships
        WHERE (user_id = ${user_id} AND friend_id = ${friend_id})
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching friend for user:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch friend for user",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
