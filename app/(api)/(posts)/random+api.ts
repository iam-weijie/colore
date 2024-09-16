import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    console.log("Received GET request for random posts.");

    const response = await sql`
      SELECT * 
      FROM posts
      ORDER BY RANDOM()
      LIMIT 3;
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch random posts" }),
      {
        status: 500,
      }
    );
  }
}
