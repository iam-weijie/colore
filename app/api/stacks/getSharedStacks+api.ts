import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    const response = await sql`
      SELECT *
      FROM stacks
      WHERE ${userId} = ANY (SELECT jsonb_array_elements_text(is_sharing))
    `;

    return new Response(
      JSON.stringify({ success: true, data: response.rows }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Database error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to retrieve shared stacks",
        details: errorMessage 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
