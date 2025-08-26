import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { userId, boardId, restrictions, title, description } = await request.json();

    if (!userId || !boardId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the user owns this board
    const boardCheck = await sql`
      SELECT user_id, board_type FROM boards WHERE id = ${boardId}
    `;

    if (boardCheck.length === 0) {
      return Response.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    if (boardCheck[0].user_id !== userId) {
      return Response.json(
        { error: "Unauthorized to modify this board" },
        { status: 403 }
      );
    }

    // Build update query dynamically based on what's provided
    let updateQuery = `UPDATE boards SET `;
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (restrictions) {
      updateQuery += `restrictions = $${paramIndex}, `;
      updateValues.push(restrictions);
      paramIndex++;
    }

    if (title) {
      updateQuery += `title = $${paramIndex}, `;
      updateValues.push(title);
      paramIndex++;
    }

    if (description) {
      updateQuery += `description = $${paramIndex}, `;
      updateValues.push(description);
      paramIndex++;
    }

    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`;
    updateValues.push(boardId, userId);

    // Execute the update
    const response = await sql.unsafe(updateQuery, ...updateValues);

    // Fetch updated board data
    const updatedBoard = await sql`
      SELECT * FROM boards WHERE id = ${boardId}
    `;

    return new Response(JSON.stringify({ 
      success: true,
      data: updatedBoard[0],
      message: "Board updated successfully" 
    }), {
      status: 200,
    });

  } catch (error) {
    console.error("Error updating board:", error);
    return Response.json({ 
      error: "Failed to update board",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
