import { Post, MappingPostitProps, PostWithPosition, Stacks } from "@/types/type";
import { distanceBetweenPosts } from "./post";

/**
 * Updates a stack with a post's new coordinates.
 */
export const updateStacks = (
  postId: number,
  newCoordinates: { x_coordinate: number; y_coordinate: number },
  postsWithPosition: Post[],
  stacks: Stacks[],
  setStacks: (s: Stacks[]) => void,
  setAllPostsInStack: (p: Post[]) => void,
  maps: MappingPostitProps[]
) => {
  let updatedStacks: Stacks[] = [...stacks];

  const post = postsWithPosition.find(p => p.id === postId);
  if (!post) return;

  updatedStacks = updatedStacks.map(stack => {
    if (stack.ids.includes(postId)) {
      return {
        ...stack,
        ids: stack.ids.filter(id => id !== postId),
        elements: stack.elements.filter(el => el.id !== postId),
      };
    }
    return stack;
  }).filter(stack => stack.ids.length > 0);

  const insideStackIndex = updatedStacks.findIndex(stack => {
    const dist = distanceBetweenPosts(
      stack.center.x,
      stack.center.y,
      newCoordinates.x_coordinate,
      newCoordinates.y_coordinate
    );
    return dist <= 40;
  });

  if (insideStackIndex !== -1) {
    const stack = updatedStacks[insideStackIndex];
    if (!stack.ids.includes(postId)) {
      const updatedStack = {
        ...stack,
        ids: [...stack.ids, postId],
        elements: [...stack.elements, post],
      };
      updatedStacks[insideStackIndex] = updatedStack;
    }

    setStacks(updatedStacks);
    return;
  }

  const nearby = maps.filter(m => {
    if (m.id === postId) return false;
    const dist = distanceBetweenPosts(
      newCoordinates.x_coordinate,
      newCoordinates.y_coordinate,
      m.coordinates.x_coordinate,
      m.coordinates.y_coordinate
    );
    return dist <= 40;
  });

  if (nearby.length > 0) {
    const nearbyFullPosts = nearby
      .map(m => postsWithPosition.find(p => p.id === m.id))
      .filter((p): p is PostWithPosition => p !== undefined);

    const newStack = {
      name: `New Stack ${updatedStacks.length + 1}`,
      ids: [postId, ...nearby.map(m => m.id)],
      elements: [post, ...nearbyFullPosts],
      center: {
        x: newCoordinates.x_coordinate,
        y: newCoordinates.y_coordinate,
      },
    };

    updatedStacks.push(newStack);
    setStacks(updatedStacks);
    const allPosts = updatedStacks.flatMap((s) => s.elements);
    setAllPostsInStack(allPosts);
    return;
  }

  setStacks(updatedStacks);
};
