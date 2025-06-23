import { useCallback, useRef, useEffect } from 'react';
import { decryptText } from '@/lib/encryption';
import { Post } from '@/types/type';

interface UseDecryptPostsOptions {
  encryptionKey: string | null;
  userId?: string;
  debugPrefix?: string;
}

export const useDecryptPosts = ({ 
  encryptionKey, 
  userId, 
  debugPrefix = "useDecryptPosts" 
}: UseDecryptPostsOptions) => {
  const decryptedPostsCache = useRef<Map<number, Post>>(new Map());

  // Clear decrypted posts cache on component unmount or when user changes
  useEffect(() => {
    return () => {
      // Clear cache when component unmounts
      decryptedPostsCache.current.clear();
    };
  }, [userId]); // Re-initialize cache when user changes

  // Function to decrypt posts and cache the results
  const decryptPosts = useCallback((postsToDecrypt: Post[]) => {
    if (!encryptionKey || postsToDecrypt.length === 0) {
      return postsToDecrypt;
    }
    
    // First filter out posts that need decryption (optimization)
    const postsNeedingDecryption = postsToDecrypt.filter(post => {
      // Skip posts that don't need decryption
      if (!post.recipient_user_id || !post.content || typeof post.content !== 'string' || !post.content.startsWith('U2FsdGVkX1')) {
        return false;
      }
      // Skip posts already in cache
      if (decryptedPostsCache.current.has(post.id)) {
        return false;
      }
      return true;
    });

    // If nothing needs decryption, return original posts with cached items replaced
    if (postsNeedingDecryption.length === 0) {
      console.log(`[DEBUG] ${debugPrefix} - All ${postsToDecrypt.length} posts already cached, no decryption needed`);
      // Replace posts with cached versions where available
      return postsToDecrypt.map(post => decryptedPostsCache.current.get(post.id) || post);
    }
    
    console.log(`[DEBUG] ${debugPrefix} - Decrypting ${postsNeedingDecryption.length} out of ${postsToDecrypt.length} posts`);
    
    // Process each post, using cache when possible
    return postsToDecrypt.map(post => {
      // Check if this post is already in cache
      const cachedPost = decryptedPostsCache.current.get(post.id);
      if (cachedPost) {
        return cachedPost;
      }
      
      // Post needs decryption
      if (post.recipient_user_id && 
          typeof post.content === 'string' && 
          post.content.startsWith('U2FsdGVkX1')) {
        try {
          const decryptedContent = decryptText(post.content, encryptionKey);
          
          // Handle formatting - check both formatting and formatting_encrypted fields
          let decryptedFormatting = post.formatting;
          
          // If formatting_encrypted exists, it takes precedence (newer format)
          if (post.formatting_encrypted && typeof post.formatting_encrypted === "string") {
            try {
              const decryptedFormattingStr = decryptText(post.formatting_encrypted, encryptionKey);
              decryptedFormatting = JSON.parse(decryptedFormattingStr);
            } catch (formattingError) {
              console.warn(`[DEBUG] ${debugPrefix} - Failed to decrypt formatting_encrypted for post ${post.id}`, formattingError);
            }
          } 
          // Otherwise try the old way (formatting as encrypted string)
          else if (post.formatting && typeof post.formatting === "string" && 
                  ((post.formatting as string).startsWith('U2FsdGVkX1') || (post.formatting as string).startsWith('##FALLBACK##'))) {
            try {
              const decryptedFormattingStr = decryptText(post.formatting as unknown as string, encryptionKey);
              decryptedFormatting = JSON.parse(decryptedFormattingStr);
            } catch (formattingError) {
              console.warn(`[DEBUG] ${debugPrefix} - Failed to decrypt formatting for post ${post.id}`, formattingError);
            }
          }
          
          // Create decrypted post object
          const decryptedPost = { 
            ...post, 
            content: decryptedContent, 
            formatting: decryptedFormatting 
          };
          
          // Cache the decrypted post
          decryptedPostsCache.current.set(post.id, decryptedPost);
          
          return decryptedPost;
        } catch (e) {
          console.warn(`[DEBUG] ${debugPrefix} - Failed decryption for post ${post.id}`, e);
          return post;
        }
      }
      return post;
    });
  }, [encryptionKey, debugPrefix]);

  return {
    decryptPosts,
    clearCache: () => decryptedPostsCache.current.clear()
  };
}; 