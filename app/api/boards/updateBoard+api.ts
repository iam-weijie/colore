import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { userId, boardId, title } = await request.json();

    if (!userId || !boardId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!title) {
      return Response.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Check if the user owns this board
    const boardCheck = await sql`
      SELECT user_id FROM boards WHERE id = ${boardId}
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

    const response = await sql`
      UPDATE boards
      SET title = ${title}
      WHERE id = ${boardId} AND user_id = ${userId}
      RETURNING *
    `;

    return new Response(JSON.stringify({ 
      success: true,
      data: response[0],
      message: "Board title updated successfully" 
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
