import { UserNicknamePair } from "@/types/type";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const ids = url.searchParams.get("ids");

    if (!ids) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'ids' query parameter" }),
        { status: 400 }
      );
    }

    const cleanIds = ids.trim().split(",");

    const rawResponse = await sql.query(
      `
      SELECT 
        u.clerk_id,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM friendships f
            WHERE 
              (f.user_id = $1 AND f.friend_id = u.clerk_id)
              OR
              (f.friend_id = $1 AND f.user_id = u.clerk_id)
          ) THEN u.nickname
          ELSE u.username
        END AS username,
        u_self.nicknames as nicknames
      FROM users u
      LEFT JOIN users u_self ON u_self.clerk_id = $1
      WHERE u.clerk_id = ANY($2::text[])
    `,
      [userId, cleanIds]
    );

    // Transform to array of [clerk_id, nickname] pairs
    const response: UserNicknamePair[] = rawResponse.map((row) => {
      //Find nicknames
      const nicknames: string[][] = row.nicknames || [];
      const nickname = nicknames.find(
        ([clerkId]) => clerkId === row.clerk_id
      )?.[1];
      return [
        row.clerk_id,
        nickname || row.username, // Use nickname if exists, otherwise use username
      ];
    });
    //console.log("Response: ", response)

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user conversations." }),
      {
        status: 500,
      }
    );
  }
}
