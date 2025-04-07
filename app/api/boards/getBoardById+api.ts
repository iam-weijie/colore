import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {

  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const id = url.searchParams.get("id"); // Retrieve the 'ids' query param

    const response = await sql`
      SELECT *
      FROM boards b
      WHERE b.id = ${id}
    `;

    if (response.length === 0) {
      return new Response(JSON.stringify({ error: "No board found" }), {
        status: 404,
      });
    }

    // Return the posts data in the response
    return new Response(JSON.stringify({ data: response }), { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch board" }), {
      status: 500,
    });
  }
}