import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { stackId, sharedById, sharedToId, boardId, message } = await request.json();
    
    if (!stackId || !sharedById) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: stackId or sharedById" }),
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Check if a shared stack already exists with the same stackId, sharedById, and sharedToId
    const [existing] = await sql`
      SELECT * FROM shared_stacks 
      WHERE stack_id = ${stackId} 
        AND shared_by_id = ${sharedById} 
        AND shared_to_id = ${sharedToId}
    `;

    if (existing) {
      // Get username for the existing shared stack
      const [user] = await sql`
        SELECT username FROM users WHERE clerk_id = ${sharedToId}
      `;
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          warning: "Stack already shared with this user",
          data: user 
        }), 
        {
          status: 409, // Conflict status
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Insert new shared stack if no duplicate exists
    const [response] = await sql`
      INSERT INTO shared_stacks (
        stack_id,
        shared_by_id,
        shared_to_id,
        board_id,
        message
      ) VALUES (
        ${stackId},
        ${sharedById},
        ${sharedToId ?? null},
        ${boardId ?? null},
        ${message ?? null}
      )
      RETURNING *;
    `;

    console.log("[newCreatedStack] response:", response);

    // Get username for the newly shared stack
    const [user] = await sql`
      SELECT username FROM users WHERE clerk_id = ${sharedToId}
    `;

    console.log("[newCreatedStack] user: ", user);

    return new Response(
      JSON.stringify({ success: true, data: user }), 
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error: unknown) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to share stack" }),
      { status: 500 }
    );
  }
}