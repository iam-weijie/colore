import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Validate ID parameter
    if (!id) {
      return Response.json(
        { error: "Board ID parameter is required" },
        { status: 400 }
      );
    }

    // Use a transaction for atomic operations
    const [board, countResult] = await sql.transaction([
      sql`SELECT * FROM boards WHERE id = ${id}`,
      sql`SELECT COUNT(*)::int AS post_count FROM posts WHERE board_id = ${id}`
    ]);

    if (!board.length) {
      return Response.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    return Response.json(
      { 
        data: board[0], 
        count: countResult[0].post_count 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Database error:", error);
    return Response.json(
      { 
        error: "Failed to fetch board",
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      },
      { status: 500 }
    );
  }
}