import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    //console.log("Received POST request.");
    const { title, clerkId, type, restrictions } = await request.json();

    const response = await sql`
      INSERT INTO boards (user_id, members_id, title, board_type, restrictions)
      VALUES (${clerkId}, [${clerkId}], ${title}, ${type}, ${restrictions})
      RETURNING *
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    //console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
