import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { stackId, userIds } = await request.json();

    if (!stackId || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing stackId or userIds to share" }),
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    const [existing] = await sql`
      SELECT is_sharing
      FROM stacks
      WHERE id = ${stackId}
    `;

    const currentSharing = existing.is_sharing || [];

    const updatedSharing = [...new Set([...currentSharing, ...userIds])]; // avoid duplicates

    const [response] = await sql`
      UPDATE stacks
      SET is_sharing = ${JSON.stringify(updatedSharing)}
      WHERE id = ${stackId}
      RETURNING *
    `;

    return new Response(
      JSON.stringify({ success: true, data: response }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Database error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Failed to share stack",
        details: errorMessage 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
