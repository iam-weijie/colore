import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const friendId = url.searchParams.get("friendId");

    if (!userId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await sql`
      SELECT 
        username,
        nicknames
      FROM users
      WHERE clerk_id = ${userId}
    `;

    if (userId === friendId) {
      return new Response(
        JSON.stringify({ data: { nickname: response[0].username } }),
        {
          status: 200,
        }
      );
    }

    for (const nickname of response[0].nicknames) {
      if (nickname[0] === friendId) {
        return new Response(
          JSON.stringify({ data: { nickname: nickname[1] } }),
          {
            status: 200,
          }
        );
      }
    }

    return new Response(JSON.stringify({ data: { nickname: null } }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching friend nickname:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch friend nickname",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
