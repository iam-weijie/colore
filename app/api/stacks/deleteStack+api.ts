import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required field (id)" 
        }),
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    await sql`
      DELETE FROM stacks
      WHERE id = ${id}
    `;

    return new Response(
      JSON.stringify({ 
        success: true 
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Database error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to delete stack",
        details: errorMessage 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
