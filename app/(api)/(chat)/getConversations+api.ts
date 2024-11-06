import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const userId = url.searchParams.get("id");

    console.log("Received GET request for conversations for user with ID: ", userId);

    const response = await sql`
      SELECT * FROM conversations WHERE clerk_id_1 = ${userId} OR clerk_id_2 = ${userId};      `;
    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user posts." }),
      {
        status: 500,
      }
    );
  }
}
