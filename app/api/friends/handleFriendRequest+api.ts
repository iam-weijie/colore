import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { sender_id, receiver_id } = await request.json();

    if (!sender_id || !receiver_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }

    const smallerId = sender_id < receiver_id ? sender_id : receiver_id;
    const largerId = sender_id > receiver_id ? sender_id : receiver_id;


    // Ensure the friend request exists before inserting friendship
    const existingRequest = await sql`
      SELECT * FROM friend_requests 
      WHERE user_id1 = ${smallerId} AND user_id2 = ${largerId}
    `;

    console.log("existing request", existingRequest)

    if (existingRequest.length === 0) {
      return new Response(
        JSON.stringify({ error: "Friend request not found" }),
        { status: 404 }
      );
    }

    await sql`
      INSERT INTO friendships (user_id, friend_id) 
      VALUES (${sender_id}, ${receiver_id}), (${receiver_id}, ${sender_id})
    `;

    console.log("Added to friendship")

    return new Response(JSON.stringify({ message: "Friend request accepted" }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to accept request" }),
      { status: 500 }
    );
  }
}
