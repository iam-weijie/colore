import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { name, center_x, center_y, ids, boardId, userId } = await request.json();

    if (!name || !center_x || !center_y || !boardId || !userId) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields (name, center, boardId, or userId)" 
        }),
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    const [response] = await sql`
      INSERT INTO stacks (
        name, 
        center_x, 
        center_y, 
        ids, 
        board_id, 
        user_id
      )
       VALUES (
        ${name}, 
        ${JSON.stringify(center_x)}, 
        ${JSON.stringify(center_y)}, 
        ${JSON.stringify(ids)}, 
        ${boardId}, 
        ${userId}
      )
      RETURNING *
    `;

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: response 
      }), 
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Database error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to create stack",
        details: errorMessage 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
