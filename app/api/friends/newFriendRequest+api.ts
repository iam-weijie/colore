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

    // i mean why would you do this
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
      INSERT INTO friend_requests (user_id1, user_id2, requestor)
      VALUES (${smallerId}, ${largerId}, ${sending_id})
      RETURNING id, user_id1, user_id2;
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating friend request:", error);
    return Response.json(
      {
        error: "Failed to create comment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
