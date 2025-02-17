import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const body = await request.json();
    const clerkId = body.clerkId;

    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Missing User Id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Execute the SQL update query
    const response = await sql`
      UPDATE users
      SET last_connection = NOW()
      WHERE clerk_id = ${clerkId}
      RETURNING *;
    `;

    if (response.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // console.log(response);

    return new Response(
      JSON.stringify({
        success: true,
        message: "User last connection updated",
        data: response,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update user info" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
