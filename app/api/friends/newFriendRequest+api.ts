import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    //console.log("Received POST request for new friend request.");

    const { clerkId, friendId } = await request.json();

    if (!clerkId || !friendId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // i mean why would you do this 🥀🥀🥀
    if (clerkId === friendId) {
      return Response.json({ error: "Unauthorized action." }, { status: 403 });
    }

    // pick the "lesser" id to set as user_id1
    // constraint was placed on table to speed up searching
    // for the friend request
    const smallerId = clerkId < friendId ? clerkId : friendId;
    const largerId = clerkId > friendId ? clerkId : friendId;

    // choose whether it is user_id1 or user_id2 that is sending the request
    const sending_id = clerkId === smallerId ? "UID1" : "UID2";

    // query will fail (due to constraints set on table)
    // if the client attempts to send friend request
    // if request is already pending (say, friend has already sent request)
    // should be handled by method that calls this api route
    const response = await sql`
      WITH inserted AS (
        INSERT INTO friend_requests (user_id1, user_id2, requestor)
        VALUES (${smallerId}, ${largerId}, ${sending_id})
        RETURNING id, user_id1, user_id2, requestor, created_at, notified
      )
      SELECT 
        inserted.*,
        u1.username AS user1_username,
        u2.username AS user2_username
      FROM inserted
      JOIN users u1 ON inserted.user_id1 = u1.clerk_id
      JOIN users u2 ON inserted.user_id2 = u2.clerk_id;
    `;

    const friend_req = response[0];
    const notification = {
      userId: friendId,
      requests: [friend_req],
    };

    // Sending out friend request notification through websocket
    const res = await fetch(`${process.env.EXPO_PUBLIC_SERVER_URL}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: friendId,
        type: "Requests",
        notification,
        content: friend_req,
      }),
    });

    const data = await res.json();
    if (!data.success) {
      console.log(data.message!);
    } else {
      console.log("friend request notif shot!");
    }

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating friend request:", error);
    return Response.json(
      {
        error: "Failed to create friend request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
