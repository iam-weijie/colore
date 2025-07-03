import { neon } from "@neondatabase/serverless";
import { validateUserAuthorization } from "@/lib/auth";

/**
 * API endpoint for migrating user identity fields from plaintext to encrypted
 * This is called during login when a user needs lazy migration
 */
export async function PATCH(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const {
      clerkId,
      username_encrypted,
      nickname_encrypted
    } = await request.json();

    if (!clerkId) {
      return Response.json(
        { error: "Missing clerk_id" },
        { status: 400 }
      );
    }

    // Validate user authorization (now async)
    if (!(await validateUserAuthorization(clerkId, request.headers))) {
      return Response.json(
        { error: "Unauthorized - invalid user credentials" },
        { status: 401 }
      );
    }

    // Verify user exists
    const userCheck = await sql`
      SELECT clerk_id FROM users WHERE clerk_id = ${clerkId}
    `;

    if (userCheck.length === 0) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only update username_encrypted and nickname_encrypted
    let response;
    if (username_encrypted !== undefined && nickname_encrypted !== undefined) {
      response = await sql`
        UPDATE users 
        SET username_encrypted = ${username_encrypted},
            nickname_encrypted = ${nickname_encrypted}
        WHERE clerk_id = ${clerkId}
        RETURNING *
      `;
    } else if (username_encrypted !== undefined) {
      response = await sql`
        UPDATE users 
        SET username_encrypted = ${username_encrypted}
        WHERE clerk_id = ${clerkId}
        RETURNING *
      `;
    } else if (nickname_encrypted !== undefined) {
      response = await sql`
        UPDATE users 
        SET nickname_encrypted = ${nickname_encrypted}
        WHERE clerk_id = ${clerkId}
        RETURNING *
      `;
    } else {
      return Response.json(
        { error: "No encryption fields provided" },
        { status: 400 }
      );
    }

    return new Response(JSON.stringify({ 
      data: response,
      message: "User identity fields migrated to encrypted format successfully"
    }), {
      status: 200,
    });

  } catch (error: any) {
    console.error("Error migrating user encryption:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
