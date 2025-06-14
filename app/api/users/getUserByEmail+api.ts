import { neon } from "@neondatabase/serverless";
import { UserProfileProps } from "@/types/type";
import { allColors } from "@/constants/colors";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    console.log("[DEBUG] getUserByEmail API - Parameters:", { email });

    if (!email) {
      console.log("[DEBUG] getUserByEmail API - Error: No email provided");
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
      });
    }

    const sql = neon(`${process.env.DATABASE_URL}`, { fullResults: true });
    const { rows } = await sql.query(`
      SELECT * FROM users WHERE email = $1
    `, [email]);

    console.log("[DEBUG] getUserByEmail API - Query response length:", rows?.length || 0);
    
    if (rows.length === 0) {
      console.log("[DEBUG] getUserByEmail API - User not found");
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Format the data in the same way as getUserInfo+api.ts
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
        colors: u.colors?.map((color: string) => {
          const foundColor = allColors.find((c) => c.id == color);
          if (foundColor) {
            return foundColor;
          }
        }) || [],
        salt: u.salt,
        last_connection: u.last_connection,
      } as unknown as UserProfileProps;
    });

    return new Response(JSON.stringify({ data: user }), {
      status: 200,
    });
  } catch (error) {
    console.error("[DEBUG] getUserByEmail API - Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch user" }), {
      status: 500,
    });
  }
} 