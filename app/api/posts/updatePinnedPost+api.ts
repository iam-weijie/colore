import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    //console.log("Received PATCH request for unread comments on post");
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { userId, postId, pinnedStatus } = await request.json();
    console.log("tried pin ", userId, postId, pinnedStatus);
    if (!postId || !userId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // should be checked on front-end, but just in case, return error
    // if attempting to call this route when the post owner is not
    // the same as the current user

    const response = await sql`
    UPDATE posts
    SET pinned = ${pinnedStatus}
    WHERE id = ${postId} 
      AND (${userId} = user_id OR ${userId} = recipient_user_id)
    RETURNING*;
  `;
    console.log("response", response);
    return new Response(JSON.stringify({ data: response }), {
      status: 200, // successful update
    });
  } catch (error) {
    //console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
