import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { id, name, center, ids } = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required field (id)" 
        }),
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    const updates = [];

    if (name !== undefined) updates.push(`name = '${name}'`);
    if (center !== undefined) {
      updates.push(`center_x = ${center.x}`);
      updates.push(`center_y = ${center.y}`);
    }
    if (ids !== undefined) updates.push(`ids = '${JSON.stringify(ids)}'`);

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No fields provided to update" 
        }),
        { status: 400 }
      );
    }

    const queryString = `
      UPDATE stacks
      SET ${updates.join(", ")}
      WHERE id = '${id}'
      RETURNING *
    `;

    const [response] = await sql.query(queryString);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: response 
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Database error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to update stack",
        details: errorMessage 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
