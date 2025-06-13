import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const body = await request.json();
    const { email, clerkId, salt } = body;

    console.log("[DEBUG] newUser API - Received request:", {
      email: email || null,
      clerkId: clerkId || null,
      saltProvided: Boolean(salt)
    });

    if (!email || !clerkId || !salt) {
      console.log("[DEBUG] newUser API - Error: Missing required fields", {
        email: Boolean(email),
        clerkId: Boolean(clerkId),
        salt: Boolean(salt)
      });
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("[DEBUG] newUser API - Inserting new user with salt");
    const response = await sql`
      INSERT INTO users (email, clerk_id, salt)
      VALUES (${email}, ${clerkId}, ${salt})
      RETURNING id, email, clerk_id
    `;

    console.log("[DEBUG] newUser API - User created successfully:", {
      id: response[0]?.id,
      email: response[0]?.email
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: "User created successfully",
      data: {
        id: response[0]?.id,
        email: response[0]?.email,
        clerk_id: response[0]?.clerk_id
      }
    }), {
      status: 201,
    });
  } catch (error) {
    console.error("[DEBUG] newUser API - Error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
