"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderPost = exports.mappingPostIt = void 0;
/**
 * Maps a post to coordinate object for stack tracking.
 */
const mappingPostIt = ({ id, coordinates }) => ({
    id,
    coordinates: {
        x_coordinate: coordinates.x_coordinate,
        y_coordinate: coordinates.y_coordinate,
    },
});
exports.mappingPostIt = mappingPostIt;
/**
 * Reorders posts by moving the selected post to the top.
 */
const reorderPost = (posts, targetPost) => [
    ...posts.filter((post) => post.id !== targetPost.id),
    targetPost,
];
exports.reorderPost = reorderPost;
