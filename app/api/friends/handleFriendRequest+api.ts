import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { sender_id, receiver_id, option } = await request.json();

    if (!sender_id || !receiver_id || !option) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const smallerId = sender_id < receiver_id ? sender_id : receiver_id;
    const largerId = sender_id > receiver_id ? sender_id : receiver_id;

    let response;

    if (option === "accept") {
      await sql`
        INSERT INTO friendships (user_id, friend_id) VALUES (${sender_id}, ${receiver_id})
      `;
      await sql`
        INSERT INTO friendships (user_id, friend_id) VALUES (${receiver_id}, ${sender_id})
      `;
      response = await sql`
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
    console.error("Error handling friend request:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to handle friend request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
