import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return Response.json(
        { error: "User ID parameter is required" },
        { status: 400 }
      );
    }

    const response = await sql`
        SELECT * FROM shared_stacks WHERE shared_to_id = ${userId}
    `;

    const sharedStacks = await Promise.all(
      response.map(async (sharedStack) => {
        const stack = await sql`
      SELECT * FROM stacks WHERE id = ${sharedStack.stack_id}
    `;
        return stack[0];
      })
    );

    return Response.json(
      {
        data: sharedStacks,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Database error:", error);
    return Response.json(
      {
        error: "Failed to fetch shared stacks",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 }
    );
  }
}
