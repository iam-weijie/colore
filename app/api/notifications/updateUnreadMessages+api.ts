import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    //console.log("Received PATCH request for unread comments on post");
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerkId, senderId, messageId} = await request.json();

    if (!clerkId || !messageId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await sql`
      UPDATE messages
      SET unread=FALSE
      WHERE id=${messageId}
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200, // successful update
    });
  } catch (error) {
    //console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
