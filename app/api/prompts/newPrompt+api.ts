import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Parse incoming JSON from the request body
    const { clerkId, cue, content, theme } = await request.json();

    if (!content || !clerkId) {
      return new Response(
        JSON.stringify({ error: "content and clerkId are required" }),
        { status: 400 }
      );
    }

    // Execute the SQL query
    const [insertedPrompt] = await sql`
      INSERT INTO prompts (user_id, cue, content, theme, created_at, expires_at)
      VALUES (${clerkId}, ${cue}, ${content}, ${theme}, NOW(), NOW() + INTERVAL '3 days')
      RETURNING id, content, expires_at;
    `;

    return new Response(JSON.stringify({ data: insertedPrompt }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error("Error inserting into the database:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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