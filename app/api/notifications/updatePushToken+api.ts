import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerkId, pushToken } = await request.json();

    if (!clerkId || !pushToken) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First check if the user exists and get current push token
    const existingUser = await sql`
      SELECT push_token FROM users WHERE clerk_id = ${clerkId}
    `;

    if (existingUser.length === 0) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If the new token is the same as the existing one, return early
    const currentToken = existingUser[0].push_token;
    if (currentToken === pushToken) {
      return new Response(JSON.stringify({ 
        message: "Push token unchanged", 
        data: existingUser[0] 
      }), {
        status: 200,
      });
    }

    // Only update if the token has changed
    const response = await sql`
      UPDATE users
      SET push_token = ${pushToken}
      WHERE clerk_id = ${clerkId}
      RETURNING *;
    `;

    return new Response(JSON.stringify({ 
      message: "Push token updated successfully",
      data: response[0] 
    }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating push token:", error);
    return Response.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}