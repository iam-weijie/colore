import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
    try {
      const sql = neon(`${process.env.DATABASE_URL}`);
      const url = new URL(request.url);
      const messageId = url.searchParams.get("id");
      
      if (!messageId) {
        return Response.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      await sql`
      UPDATE messages
      SET notified = TRUE
      WHERE id = ${messageId}
    `;

    } catch (error) {
        console.error(error);
        return new Response(
          JSON.stringify({ error: "Failed to update comment notified status" }),
          {
            status: 500,
          }
        );
      }

}