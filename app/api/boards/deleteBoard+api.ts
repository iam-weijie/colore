import { neon } from "@neondatabase/serverless";

export async function DELETE(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { userId, boardId } = await request.json();

    if (!userId || !boardId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First check if the user owns this board
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
        { error: "Unauthorized to delete this board" },
        { status: 403 }
      );
    }

    // Delete all posts associated with this board first
    await sql`
      DELETE FROM posts WHERE board_id = ${boardId}
    `;

    // Delete the board
    const response = await sql`
      DELETE FROM boards WHERE id = ${boardId} AND user_id = ${userId}
    `;

    return new Response(JSON.stringify({ 
      success: true,
      message: "Board deleted successfully" 
    }), {
      status: 200,
    });

  } catch (error) {
    console.error("Error deleting board:", error);
    return Response.json({ 
      error: "Failed to delete board",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
