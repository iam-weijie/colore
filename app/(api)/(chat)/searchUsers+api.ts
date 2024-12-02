import { UserNicknamePair } from "@/types/type";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const userId = url.searchParams.get("id");

    //console.log("Received GET request for users from user:", userId);

    const rawResponse = await sql`
      SELECT 
        u.clerk_id,
        u.username,
        u_self.nicknames as nicknames
      FROM users u
      LEFT JOIN users u_self ON u_self.clerk_id = ${userId}
      WHERE u.clerk_id != ${userId} 
    `;

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
