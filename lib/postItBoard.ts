import { Post, MappingPostitProps, PostWithPosition, Stacks } from "@/types/type";


/**
 * Maps a post to coordinate object for stack tracking.
 */
export const mappingPostIt = ({ id, coordinates }: MappingPostitProps) => ({
  id,
  coordinates: {
    x_coordinate: coordinates.x_coordinate,
    y_coordinate: coordinates.y_coordinate,
  },
});

/**
 * Reorders posts by moving the selected post to the top.
 */
export const reorderPost = (posts: Post[], targetPost: Post): Post[] => [
  ...posts.filter((post) => post.id !== targetPost.id),
  targetPost,
];

