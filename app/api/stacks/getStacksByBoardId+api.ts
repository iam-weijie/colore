import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { boardId } = await request.json();

    if (!boardId) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required field (boardId)" 
        }),
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    const response = await sql`
      SELECT * FROM stacks
      WHERE board_id = ${boardId}
      ORDER BY created_at ASC
    `;

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: response.rows 
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Database error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to retrieve stacks",
        details: errorMessage 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
