import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Parse and validate incoming JSON
    const { content, clerkId, color = "yellow", emoji = null } = await request.json();

    if (!content || !clerkId) {
      return new Response(
        JSON.stringify({ error: "content and clerkId are required" }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Execute the SQL query
    const insertedPost = await sql`
      INSERT INTO posts 
        (user_id, content, like_count, report_count, color, emoji, expires_at)
      VALUES 
        (${clerkId}, ${content}, 0, 0, ${color}, ${emoji}, NOW() + INTERVAL '14 days')
      RETURNING id, color, expires_at;
    `;

    console.log("response", insertedPost)
    return new Response(JSON.stringify({ data: insertedPost }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error("Database operation failed:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to create post",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}