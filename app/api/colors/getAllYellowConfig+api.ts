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

    // Step 1: Get all post IDs made by the user
    const userPostsResult = await sql`
      SELECT id FROM posts WHERE user_id = ${userId};
    `;
    const postIds = userPostsResult.map((row) => row.id);

    let totalLikesReceived = 0;
    let totalCommentsReceived = 0;

    if (postIds.length > 0) {
      // Step 2: Count likes received
      const likesResult = await sql`
        SELECT COUNT(*)::int AS count
        FROM post_likes
        WHERE post_id = ANY(${postIds}::int[]);
      `;
      totalLikesReceived = likesResult[0]?.count ?? 0;

      // Step 3: Count comments received
      const commentsResult = await sql`
        SELECT COUNT(*)::int AS count
        FROM comments
        WHERE post_id = ANY(${postIds}::int[]);
      `;
      totalCommentsReceived = commentsResult[0]?.count ?? 0;
    }

    // Step 4: Get all prompt IDs made by the user
    const userPromptsResult = await sql`
      SELECT id FROM prompts WHERE user_id = ${userId};
    `;
    const promptIds = userPromptsResult.map((row) => row.id);

    let totalPromptAnswersReceived = 0;

    if (promptIds.length > 0) {
      // Step 5: Count posts that are answers to user's prompts
      const answersResult = await sql`
        SELECT COUNT(*)::int AS count
        FROM posts
        WHERE prompt_id = ANY(${promptIds}::int[]);
      `;
      totalPromptAnswersReceived = answersResult[0]?.count ?? 0;
    }

    return Response.json(
      {
        totalLikesReceived,
        totalCommentsReceived,
        totalPromptAnswersReceived
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch engagement stats:", error);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
