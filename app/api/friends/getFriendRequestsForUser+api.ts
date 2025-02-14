import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const id_1 = url.searchParams.get("user_id");
    const id_2 = url.searchParams.get("request_id");

    if (!id_1 || !id_2) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // i mean why would you do this
    if (id_1 === id_2) {
      return Response.json({ error: "Unauthorized action." }, { status: 403 });
    }

    // pick the smaller id to use as user_id1
    // to optimize sql query/ensure uniformity
    // of returned data
    const smallerId = id_1 < id_2 ? id_1 : id_2;
    const largerId = id_1 > id_2 ? id_1 : id_2;

    // return friend request (UNIQUE) if it exists
    // the response is of the form )
    /**
     * {
     *  id,
     *  user_id1,
     *  user_id2,
     *  requestor = 'UID1' or 'UID2',
     *  created_at
     * }
     */
    const response = await sql`
        SELECT * FROM friend_requests
        WHERE (user_id1 = ${smallerId} AND user_id2 = ${largerId}) 
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch friend requests for user",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
