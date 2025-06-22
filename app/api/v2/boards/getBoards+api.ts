import { neon } from "@neondatabase/serverless";
import { Board } from "@/types/type";

type FetchType = "personal" | "community" | "discover";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const typeParam = (url.searchParams.get("type") as FetchType) || "discover";
  const idParam   = url.searchParams.get("user_id");
  const userId    = idParam ? parseInt(idParam, 10) : NaN;

  // If they asked for personal or community boards, user_id is required
  if ((typeParam === "personal" || typeParam === "community") &&
      (!idParam || isNaN(userId))) {
    return new Response(
      JSON.stringify({ error: "A valid user_id is required for this type." }),
      { status: 400 }
    );
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // 1) Fetch the raw boards based on type
    let rawBoards = await (async () => {
      switch (typeParam) {
        case "personal":
          return await sql`
            SELECT b.*, COALESCE(ARRAY[]::text[], b.members_id) AS members_id
            FROM boards b
            WHERE b.user_id = ${userId}
            ORDER BY b.created_at ASC;
          `;
        case "community":
          return await sql`
            SELECT b.*, COALESCE(ARRAY[]::text[], b.members_id) AS members_id
            FROM boards b
            WHERE b.members_id @> ARRAY[${userId}]::text[]
              AND b.restrictions @> '{"Everyone"}'::text[]
            ORDER BY b.created_at ASC
            LIMIT 20;
          `;
        case "discover":
        default:
          return await sql`
            SELECT b.*, COALESCE(ARRAY[]::text[], b.members_id) AS members_id
            FROM boards b
            WHERE b.restrictions @> '{"Everyone"}'::text[]
            ORDER BY b.created_at ASC
            LIMIT 20;
          `;
      }
    })();

    // 2) Gather IDs for count query
    const boardIds = rawBoards.map((b) => Number(b.id)).filter(Number.isInteger);
    if (boardIds.length === 0) {
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }

    // 3) Fetch post counts
    const counts: { board_id: number; post_count: number }[] = await sql`
      SELECT p.board_id, COUNT(*) AS post_count
      FROM posts p
      WHERE p.board_id = ANY(${boardIds}::int[])
      GROUP BY p.board_id;
    `;

    // 4) Map into Board[]
    const boards: Board[] = rawBoards.map((b) => {
      const cntEntry = counts.find((c) => c.board_id === Number(b.id));
      const ageInDays =
        (Date.now() - new Date(b.created_at).getTime()) /
        (1000 * 60 * 60 * 24);

      return {
        id:              b.id,
        title:           b.title,
        description:     b.description,
        members_id:      b.members_id,
        user_id:         b.user_id,
        board_type:      b.board_type,
        restrictions:    b.restrictions,
        created_at:      b.created_at,
        count:           cntEntry ? cntEntry.post_count : 0,
        isNew:           ageInDays < 3,
        isPrivate:       b.restrictions.includes("Private"),
        commentAllowed:  b.restrictions.includes("commentsAllowed"),
        imageUrl:        "",
      };
    });

    return new Response(JSON.stringify({ data: boards }), {
      status: 200,
      headers: {
        "Content-Type":  "application/json",
        "Cache-Control": "s-maxage=60, stale-while-revalidate",
      },
    });
  } catch (err) {
    console.error("Error fetching boards:", err);
    const details =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : undefined;

    return new Response(
      JSON.stringify({
        error: "Failed to fetch boards.",
        ...(details && { details }),
      }),
      { status: 500 }
    );
  }
}
