import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const { sender_id, receiver_id, option } = await request.json();

    if (!sender_id || !receiver_id) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (option != "accept" && option != "reject") {
      return Response.json({ error: "Invalid option" }, { status: 403 });
    }

    // pick the smaller id to use as user_id1
    // to optimize sql query/ensure uniformity
    // of returned data
    const smallerId = sender_id < receiver_id ? sender_id : receiver_id;
    const largerId = sender_id > receiver_id ? sender_id : receiver_id;

    let response;

    if (option === "accept") {
      response = await sql`
        INSERT INTO friendships (user_id, friend_id) VALUES (${sender_id}, ${receiver_id})
        INSERT INTO friendships (user_id, friend_id) VALUES (${receiver_id}, ${sender_id})

        DELETE FROM friend_requests
          WHERE (user_id1 = ${smallerId} AND user_id2 = ${largerId})
      `;
    } else if (option === "reject") {
      response = await sql`
        DELETE FROM friend_requests
          WHERE (user_id1 = ${smallerId} AND user_id2 = ${largerId})
      `;
    }

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
