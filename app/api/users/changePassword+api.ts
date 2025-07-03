import { neon } from "@neondatabase/serverless";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { validateUserAuthorization } from "@/lib/auth";

/**
 * API endpoint for changing user password and re-encrypting data
 * This requires the old password to decrypt existing data and new password to re-encrypt
 */
export async function PATCH(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const {
      clerkId,
      newEncryptedData, // Data re-encrypted with new key
      newSalt, // New salt for the new password
      newPassword, // New password to update in Clerk
    } = await request.json();

    if (!clerkId || !newEncryptedData || !newSalt || !newPassword) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate user authorization
    if (!(await validateUserAuthorization(clerkId, request.headers))) {
      return Response.json(
        { error: "Unauthorized - invalid user credentials" },
        { status: 401 }
      );
    }

    // Update password in Clerk
    try {
      await clerkClient.users.updateUser(clerkId, { password: newPassword });
    } catch (clerkError) {
      return Response.json(
        { error: "Failed to update password in Clerk", details: typeof clerkError === 'object' && clerkError !== null && 'message' in clerkError ? (clerkError as any).message : String(clerkError) },
        { status: 500 }
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

    // Update user with new salt and re-encrypted data (no incognito_name_encrypted)
    const response = await sql`
      UPDATE users 
      SET 
        salt = ${newSalt},
        username_encrypted = ${newEncryptedData.username_encrypted || null},
        nickname_encrypted = ${newEncryptedData.nickname_encrypted || null}
      WHERE clerk_id = ${clerkId}
      RETURNING *
    `;

    if (response.length === 0) {
      return Response.json(
        { error: "Failed to update user data" },
        { status: 500 }
      );
    }

    return Response.json({ 
      success: true,
      message: "Password changed and data re-encrypted successfully" 
    });

  } catch (error: any) {
    console.error("Error changing password:", error);
    return Response.json({ 
      error: "Failed to change password",
      details: error.message 
    }, { status: 500 });
  }
}
