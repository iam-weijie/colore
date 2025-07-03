import { fetchAPI } from "@/lib/fetch";
import { decryptText, encryptText, deriveKey } from "@/lib/encryption";
import { Post } from "@/types/type";

/**
 * Migrates all personal posts for a user to a new encryption key after password change.
 * @param userId - The user's Clerk ID
 * @param oldKey - The old encryption key (hex string)
 * @param newKey - The new encryption key (hex string)
 * @param getToken - Function to get the Clerk session token
 * @returns { migrated: number, failed: number }
 */
export async function migratePersonalPostsEncryption({
  userId,
  oldKey,
  newKey,
  getToken,
}: {
  userId: string;
  oldKey: string;
  newKey: string;
  getToken: () => Promise<string | null>;
}): Promise<{ migrated: number; failed: number }> {
  // Fetch all personal posts for this user (as recipient)
  const token = await getToken();
  const response = await fetchAPI(
    `/api/posts/getPersonalPosts?recipient_id=${userId}&user_id=${userId}&number=1000`,
    {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );
  if (!response || !response.data) {
    return { migrated: 0, failed: 0 };
  }
  const posts: Post[] = response.data;
  let migrated = 0;
  let failed = 0;
  for (const post of posts) {
    try {
      // Decrypt with old key
      const decryptedContent = decryptText(post.content, oldKey);
      if (!decryptedContent) throw new Error("Failed to decrypt post");
      // Re-encrypt with new key
      const reEncryptedContent = encryptText(decryptedContent, newKey);
      // Update post via API
      const updateRes = await fetchAPI("/api/posts/updatePost", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          postId: post.id,
          content: reEncryptedContent,
          color: post.color,
          emoji: post.emoji,
          formatting: post.formatting,
        }),
      });
      if (updateRes && !updateRes.error) {
        migrated++;
      } else {
        failed++;
      }
    } catch (e) {
      failed++;
    }
  }
  return { migrated, failed };
}
