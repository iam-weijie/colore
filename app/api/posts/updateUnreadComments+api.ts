import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    //console.log("Received PATCH request for unread comments on post");
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerkId, postId, postClerkId } = await request.json();

    if (!clerkId || !postId || !postClerkId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // should be checked on front-end, but just in case, return error
    // if attempting to call this route when the post owner is not
    // the same as the current user
    if (postClerkId !== clerkId) {
      return Response.json({ error: "Unauthorized action." }, { status: 403 });
    }

    const response = await sql`
      UPDATE posts
      SET unread_comments=0
      WHERE id=${postId}
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200, // successful update
    });
  } catch (error) {
    //console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
