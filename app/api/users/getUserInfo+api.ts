import { neon } from "@neondatabase/serverless";
import { UserProfileProps } from "@/types/type";
import { allColors } from "@/constants/colors";

export async function GET(request: Request) {
  //console.log("received GET request for user information");
  //console.log("Received GET request:", request.url);
  try {
    const sql = neon(`${process.env.DATABASE_URL}`, { fullResults: true });
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("id");

    if (!clerkId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
      });
    }
    const { rows } = await sql.query(`
      SELECT 
        *
      FROM users WHERE clerk_id = $1
    `, [clerkId]);
    
    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const user = rows.map((u) => {
      return {
        id: u.id,
        created_at: u.created_at,
        updated_at: u.updated_at,
        clerk_id: u.clerk_id,
        username: u.username,
        nickname: u.nickname,
        nicknames: u.nicknames ? u.nicknames : [],
        incognito_name: u.incognito_name,
        username_encrypted: u.username_encrypted,
        nickname_encrypted: u.nickname_encrypted,
        incognito_name_encrypted: u.incognito_name_encrypted,
        email: u.email,
        date_of_birth: u.date_of_birth,
        city: u.city,
        state: u.state,
        country: u.country,
        device_token: u.device_token,
        is_paid_user: u.is_paid_user,
        report_count: u.report_count,
        saved_posts: u.saved_posts ? u.saved_posts : [],
        shorthand_emojis: u.shorthand_emojis ? u.shorthand_emojis : [],
        colors: u.colors.map((color: string) => {
          const foundColor = allColors.find((c) => c.id == color);
          if (foundColor) {
            return foundColor;
          }
        }),
        salt: u.salt,
        last_connection: u.last_connection,
      } as unknown as UserProfileProps;
    });


    return new Response(JSON.stringify({ data: user }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user info" }),
      {
        status: 500,
      }
    );
  }
}
