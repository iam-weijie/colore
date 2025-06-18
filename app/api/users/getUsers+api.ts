import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  //console.log("received GET request for user information");
  //console.log("Received GET request:", request.url);
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("id");
    const max = url.searchParams.get("maxUsers");

    // console.log("Extracted Clerk ID:", clerkId);

    if (!clerkId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
      });
    }
    const response = await sql.query(
      `
      SELECT
        id,
        clerk_id,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM friendships f
            WHERE 
              (f.user_id = $1 AND f.friend_id = users.clerk_id)
              OR
              (f.friend_id = $1 AND f.user_id = users.clerk_id)
          ) THEN nickname
          ELSE username
        END AS username,
        country,
        state,
        city
      FROM users
      WHERE clerk_id != $1
      LIMIT $2
    `,
      [clerkId, max]
    );
    if (response.length === 0) {
      return new Response(JSON.stringify({ error: "Users not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user info" }),
      {
        status: 500,
      }
    );
  }
}
