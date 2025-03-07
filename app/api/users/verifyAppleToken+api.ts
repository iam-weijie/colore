import { fetchAPI } from "@/lib/fetch";
import { neon } from "@neondatabase/serverless";
import * as jose from "jose"; // Import jose for JWT handling
import { useGlobalContext } from "@/app/globalcontext";

export async function POST(request: Request) {
  try {
    const { identityToken } = await request.json();

    if (!identityToken) {
      return new Response(JSON.stringify({ error: "Identity token is missing" }), { status: 400 });
    }

    // Decode token manually (without relying on header)
    const parts = identityToken.split(".");
    if (parts.length !== 3) {
      return new Response(JSON.stringify({ error: "Invalid token format" }), { status: 400 });
    }

    // Decode payload safely
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    console.log("Decoded Payload:", payload);

    const { email, sub } = payload;

    if (!sub) {
      return new Response(JSON.stringify({ error: "User ID (sub) is missing" }), { status: 400 });
    }


    // 🔥 Step 2: Check if the user exists in your database
    let existingUser;
    try {
      const sql = neon(`${process.env.DATABASE_URL}`);
      const response = await sql`
      SELECT * from users WHERE apple_id = ${sub}
    `;
    existingUser = response.length > 0;
    } catch (fetchError) {
      console.error("Failed to fetch existing user:", fetchError);
    existingUser = false;
    }

    console.log("existinuser", existingUser)

    

    console.log("finally")
    return new Response(
      JSON.stringify({
        success: true,
        existingUser: existingUser,
        identityToken: identityToken,
        email: email,
        user: sub,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying Apple token:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}