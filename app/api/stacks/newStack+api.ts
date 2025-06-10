import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { name, centerX, centerY, ids, boardId, userId } = await request.json();
    
    if (!name || !centerX || !centerY || !boardId || !userId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields (name, center, boardId, or userId)"
        }),
        { status: 400 }
      );
    }

    // Validate ids is an array of integers
    if (!Array.isArray(ids)) {
      return new Response(
        JSON.stringify({
          error: "ids must be an array"
        }),
        { status: 400 }
      );
    }

    if (!ids.every(id => Number.isInteger(id))) {
      return new Response(
        JSON.stringify({
          error: "All ids must be integers"
        }),
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    // Check if duplicate exists first
    const [existing] = await sql`
      SELECT * FROM stacks 
      WHERE name = ${name} 
        AND ids = ${ids} 
        AND user_id = ${userId}
    `;

    let response;
    let wasExisting = false;

    if (existing) {
      response = existing;
      wasExisting = true;
    } else {
      // Insert new stack
      const [newStack] = await sql`
        INSERT INTO stacks (
          name, center_x, center_y, ids, board_id, user_id
        )
        VALUES (
          ${name}, ${JSON.stringify(centerX)}, ${JSON.stringify(centerY)}, 
          ${ids}, ${boardId}, ${userId}
        )
        RETURNING *
      `;
      response = newStack;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
        wasExisting: wasExisting  // Optional: let client know if it was existing
      }),
      { status: wasExisting ? 200 : 201, headers: { 'Content-Type': 'application/json' } }
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