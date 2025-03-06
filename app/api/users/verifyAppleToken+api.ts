import { fetchAPI } from "@/lib/fetch"; 
import { neon } from "@neondatabase/serverless";
import * as jose from "jose"; // Import jose for JWT handling

export async function getUserInfo(userId: string) {
  const sql = neon(`${process.env.DATABASE_URL}`);
  const response = await sql`
    SELECT * FROM users WHERE clerk_id = ${userId}
  `;
  return response;
}

export async function createUser(userData: { clerkId: string; email: string }) {
  const sql = neon(`${process.env.DATABASE_URL}`);
  const response = await sql`
    INSERT INTO users (clerk_id, email) 
    VALUES (${userData.clerkId}, ${userData.email}) 
    RETURNING *;
  `;
  return response[0];
}


export async function POST(request: Request) {

  try {
    const { identityToken, user } = await request.json();

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

    console.log("Checking user:", sub);

    // Check if user exists
    let existingUser;
    try {
      existingUser = await getUserInfo(encodeURI(sub))
      console.log("existinguser", existingUser)
    } catch (fetchError) {
      console.error("Failed to fetch existing user:", fetchError);
      existingUser = null;
    }

    if (existingUser.length > 0) {
      console.log("goes here")
      return new Response(JSON.stringify({ success: true, userInfo: existingUser}), { status: 200 });
    }

    // Create a new user
    let newUser;
    try {
      newUser = await createUser({ clerkId: sub, email: email || "" });
      console.log("has created a new user")
    } catch (createError) {
      console.error("Failed to create new user:", createError);
      return new Response(JSON.stringify({ error: "Failed to create user" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, user: newUser }), { status: 201 });

  } catch (error) {
    console.error("Error verifying Apple token:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
