import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get('clerkId');

    if (!clerkId) {
      return Response.json(
        { error: "Missing clerkId parameter" },
        { status: 400 }
      );
    }

    const response = await sql`
      SELECT username 
      FROM users 
      WHERE clerk_id = ${clerkId}
      LIMIT 1;
    `;

    if (response.length === 0) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ 
      data: { username: response[0].username }
    }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching username:", error);
    return Response.json(
      {
        error: "Failed to fetch username",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
