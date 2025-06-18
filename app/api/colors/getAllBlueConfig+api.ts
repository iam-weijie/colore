import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json(
        { error: "UserId parameter is required" },
        { status: 400 }
      );
    }

    // Posts config
    const postMadeResult = await sql`
      SELECT id FROM posts WHERE userId = ${userId};
    `;
    const postMadeIdList = postMadeResult.map((row) => row.id);

    const [postMadeCountResult, postReceivedCountResult] = await sql.transaction([
      sql`SELECT COUNT(*)::int AS count FROM posts WHERE userId = ${userId}`,
      sql`SELECT COUNT(*)::int AS count FROM posts WHERE recipient_user_id = ${userId}`
    ]);

    const totalPostMade = postMadeCountResult[0]?.count || 0;
    const totalPostReceived = postReceivedCountResult[0]?.count || 0;

    let totalPostContentLength = 0;
    if (postMadeIdList.length > 0) {
      const result = await sql`
        SELECT SUM(LENGTH(content)) AS total_length
        FROM posts
        WHERE id = ANY(${postMadeIdList}::int[]);
      `;
      totalPostContentLength = result[0]?.total_length ?? 0;
    }

    // Boards config
    const [boardMadeResult, boardJoinedResult] = await sql.transaction([
      sql`SELECT COUNT(*)::int AS count FROM boards WHERE userId = ${userId}`,
      sql`SELECT COUNT(*)::int AS count FROM boards WHERE members_id @> ARRAY[${userId}]::text[]`
    ]);

    const totalBoardMade = boardMadeResult[0]?.count || 0;
    const totalBoardJoined = boardJoinedResult[0]?.count || 0;

    // Prompt config
    const promptResult = await sql`
      SELECT COUNT(*)::int AS count FROM prompts WHERE userId = ${userId};
    `;
    const totalPromptMade = promptResult[0]?.count || 0;

    return Response.json(
      {
        totalPostMade,
        totalPostReceived,
        totalPostContentLength,
        totalBoardMade,
        totalBoardJoined,
        totalPromptMade
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch user summary:", error);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
