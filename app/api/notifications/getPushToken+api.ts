import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { userId } = await request.json();

    if (!userId) {
      return Response.json({ error: "Missing User ID" }, { status: 400 });
    }

    const response = await sql`
      SELECT
        push_token
      FROM users
      WHERE clerk_id = ${userId}
    `;

    if (response.length == 0) {
      return Response.json({ error: "No push token found" }, { status: 404 });
    }

    return new Response(JSON.stringify({ data: response[0] }), {
      status: 200,
    });
  } catch (error) {
    return Response.json({ error: error }, { status: 500 });
  }
}
