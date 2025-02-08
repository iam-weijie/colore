import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
    try {
      const sql = neon(`${process.env.DATABASE_URL}`);
      const url = new URL(request.url);
      const clerkId = url.searchParams.get("id");
      
      if (!clerkId) {
        return Response.json(
          { error: "Missing User Id" },
          { status: 400 }
        );
      }

      await sql`
      UPDATE users
      SET last_connection = NOW()
      WHERE id = ${clerkId}
    `;

    } catch (error) {
        console.error(error);
        return new Response(
          JSON.stringify({ error: "Failed to update user info" }),
          {
            status: 500,
          }
        );
      }

}