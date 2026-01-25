import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    // Step 1: Count boards made by user
    const boardResult = await sql`
      SELECT COUNT(*)::int AS count FROM boards WHERE user_id = ${userId};
    `;
    const totalBoards = boardResult[0]?.count ?? 0;

    // Step 2: Count posts with emoji
    const emojiResult = await sql`
      SELECT COUNT(*)::int AS count FROM posts WHERE user_id = ${userId} AND emoji IS NOT NULL;
    `;
    const totalEmoji = emojiResult[0]?.count ?? 0;

    // Step 3: Count posts with formatting
    const formattingResult = await sql`
      SELECT COUNT(*)::int AS count FROM posts WHERE user_id = ${userId} AND formatting IS NOT NULL;
    `;
    const totalFormattingPost = formattingResult[0]?.count ?? 0;

    // Step 4: Check if nickname ≠ username
    const userResult = await sql`
      SELECT nickname, username FROM users WHERE clerk_id = ${userId};
    `;
    const user = userResult[0] || {};
    const nicknameDiffers = user.nickname && user.username && user.nickname !== user.username;

    // Step 5: Count liked posts
    const likedResult = await sql`
      SELECT COUNT(*)::int AS count FROM liked_posts WHERE user_id = ${userId};
    `;
    const totalLikedPost = likedResult[0]?.count ?? 0;

    // Step 6: Count saved posts
    const savedResult = await sql`
      SELECT COUNT(*)::int AS count FROM saved_posts WHERE user_id = ${userId};
    `;
    const totalSavedPost = savedResult[0]?.count ?? 0;

    // Step 7: Get all colors of posts made by the user
    const colorResult = await sql`
      SELECT color FROM posts WHERE user_id = ${userId};
    `;
    const colorsUsed = colorResult.map((row) => row.color).filter(Boolean);

    return Response.json(
      {
        totalBoards,
        totalEmoji,
        totalFormattingPost,
        nicknameDiffers,
        totalLikedPost,
        totalSavedPost,
        colorsUsed
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
