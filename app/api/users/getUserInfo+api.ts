import { neon } from "@neondatabase/serverless";
import { UserProfileProps } from "@/types/type";
import { allColors } from "@/constants";

export async function GET(request: Request) {
  //console.log("received GET request for user information");
  //console.log("Received GET request:", request.url);
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("id");

    if (!clerkId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
      });
    }
    const response = await sql`
      SELECT * from users WHERE clerk_id = ${clerkId}
    `;
    if (response.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const user = response.map((u) => {
      return {
        id: u.id,
        created_at: u.created_at,
        updated_at: u.updated_at,
        clerk_id: u.clerk_id,
        firstname: u.firstname,
        lastname: u.lastname,
        username: u.username,
        nickname: u.nickname,
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
        colors: u.colors.map((color: string) => {
          const foundColor = allColors.find((c) => c.name === color);
          if (foundColor) {
            return foundColor;
          }
        }),
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
