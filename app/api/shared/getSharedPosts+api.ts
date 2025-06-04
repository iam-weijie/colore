import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sharedToId = url.searchParams.get("sharedToId");

    const sql = neon(process.env.DATABASE_URL!);

    const results = sharedToId
      ? await sql`SELECT * FROM shared_posts WHERE shared_to_id = ${sharedToId}`
      : await sql`SELECT * FROM shared_posts`;

    return new Response(JSON.stringify({ success: true, data: results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch shared posts" }),
      { status: 500 }
    );
  }
}
