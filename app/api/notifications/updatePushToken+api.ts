import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    //console.log("Received PATCH request for unread comments on post");
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerkId, pushToken} = await request.json();

    if (!clerkId || !pushToken) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await sql`
      UPDATE users
      SET push_token=${pushToken}
      WHERE clerk_id=${clerkId}
      RETURNING *;
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200, // successful update
    });
  } catch (error) {
    //console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
