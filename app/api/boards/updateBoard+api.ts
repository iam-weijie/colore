import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    //console.log("Received PATCH request for unread comments on post");
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerkId, boardId, title  } = await request.json();

    if (!clerkId || !boardId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }


    if (!title) {
    const response = await sql`
      UPDATE boards
      SET title=${title}
      WHERE id=${boardId} AND user_id=${clerkId}
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200, // successful update
    });
  } 

  } catch (error) {
    //console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
