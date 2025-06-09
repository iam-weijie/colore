import { neon } from "@neondatabase/serverless";

// TODO: update this route to be able to only update properties
// that the user specifies - for example, updating email
// if only the email parameter is non-empty
// TODO: merge with the other PATCH route

export async function PATCH(request: Request) {
  try {
    //console.log("Received PATCH request for user nicknames");
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerkId, nicknames } = await request.json();

    if (!clerkId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await sql`
      UPDATE users
      SET nicknames=${nicknames}
      WHERE clerk_id=${clerkId}
    
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200, // successful update
    });
  } catch (error) {
    //console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
