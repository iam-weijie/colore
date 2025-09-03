// contexts/StacksContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Post, Stacks } from "@/types/type";
import { distanceBetweenPosts } from "@/lib/post";

const STACK_RADIUS = 32;
const CELL_SIZE = 48;
const CHECK_INTERVAL_MS = 16;


const keyFor = (x: number, y: number) =>
  `${Math.floor(x / CELL_SIZE)},${Math.floor(y / CELL_SIZE)}`;

type StacksContextType = {
  stacks: Stacks[];
  setStacks: React.Dispatch<React.SetStateAction<Stacks[]>>;
  virtualMap: Post[];
  setVirtualMap: React.Dispatch<React.SetStateAction<Post[]>>;
  onDragStart: (postId: number) => void;
  trackPostit: (postId: number, dx: number, dy: number) => void;
  onDragEnd: (postId: number) => void;
};

const StacksContext = createContext<StacksContextType | undefined>(undefined);

export const StacksProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [stacks, setStacks] = useState<Stacks[]>([]);
  const [virtualMap, _setVirtualMap] = useState<Post[]>([]);

  const idIndexRef = useRef<Map<number, number>>(new Map());
  const membershipRef = useRef<Map<number, number>>(new Map());
  const gridRef = useRef<Map<string, Set<number>>>(new Map());
  const cellOfRef = useRef<Map<number, string>>(new Map());
  const lastCheckAtRef = useRef<number>(0);
  const draggingIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (stacks.length > 0) {
      console.log("✅ Stacks updated:", stacks);
    }
  }, [stacks]);

  const addToGrid = (id: number, x: number, y: number) => {
    const k = keyFor(x, y);
    if (!gridRef.current.has(k)) gridRef.current.set(k, new Set());
    gridRef.current.get(k)!.add(id);
    cellOfRef.current.set(id, k);
  };

  const removeFromGrid = (id: number) => {
    const k = cellOfRef.current.get(id);
    if (!k) return;
    const bucket = gridRef.current.get(k);
    if (bucket) {
      bucket.delete(id);
      if (bucket.size === 0) gridRef.current.delete(k);
    }
    cellOfRef.current.delete(id);
  };

  const moveInGrid = (id: number, newX: number, newY: number) => {
    const newK = keyFor(newX, newY);
    const oldK = cellOfRef.current.get(id);
    if (oldK === newK) return;
    removeFromGrid(id);
    addToGrid(id, newX, newY);
  };

  const rebuildGrid = (posts: Post[]) => {
    gridRef.current.clear();
    cellOfRef.current.clear();
    idIndexRef.current.clear();

    posts.forEach((p, idx) => {
      if (p?.id == null || !p.position) return;
      idIndexRef.current.set(p.id, idx);
      addToGrid(p.id, p.position.left, p.position.top);
    });
  };

  const setVirtualMap: React.Dispatch<React.SetStateAction<Post[]>> = useCallback(
    (upd) => {
      _setVirtualMap((prev) => {
        const next = typeof upd === "function" ? (upd as any)(prev) : upd;
        rebuildGrid(next);
        return next;
      });
    },
    []
  );

  const onStack = useCallback((newId: number, post: Post) => {
    const postId = post.id;
    if (postId == null || newId == null) return;
  
    setStacks((prev) => {
      let updated = [...prev];
      const targetStackId = membershipRef.current.get(postId) ?? null;
      const draggedStackId = membershipRef.current.get(newId) ?? null;
  
      if (targetStackId) {
        if (!draggedStackId) {
          updated = updated.map((s) =>
            s.id === targetStackId ? { ...s, ids: [...s.ids, newId] } : s
          );
          membershipRef.current.set(newId, targetStackId);
          return updated;
        } else if (targetStackId !== draggedStackId) {
          updated = updated.map((s) =>
            s.id === draggedStackId
              ? { ...s, ids: s.ids.filter((id) => id !== newId) }
              : s
          );
          updated = updated.map((s) =>
            s.id === targetStackId ? { ...s, ids: [...s.ids, newId] } : s
          );
          membershipRef.current.set(newId, targetStackId);
          return updated;
        }
      } else {
        const newStackId = updated.length > 0 ? updated[updated.length - 1].id + 1 : 1;
        const newStackName = `Stack ${newStackId}`;
        updated.push({ id: newStackId, ids: [newId, postId], name: newStackName });
        membershipRef.current.set(newId, newStackId);
        membershipRef.current.set(postId, newStackId);
        return updated;
      }
      return updated;
    });
  }, []);
  

  const onClearStacks = useCallback(() => {
    setStacks((prev) => {
      const kept = prev.filter((s) => s.ids.length > 1);
      membershipRef.current.clear();
      kept.forEach((s) => s.ids.forEach((id) => membershipRef.current.set(id, s.id)));
      return kept;
    });
  }, []);

  const getNeighbors = (x: number, y: number): number[] => {
    const cx = Math.floor(x / CELL_SIZE);
    const cy = Math.floor(y / CELL_SIZE);
    const res: number[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const k = `${cx + dx},${cy + dy}`;
        const s = gridRef.current.get(k);
        if (s) s.forEach((id) => res.push(id));
      }
    }
    return res;
  };

  const checkForStackCandidate = useCallback(
    (movingId: number, x: number, y: number) => {
      const now = Date.now();
      if (now - lastCheckAtRef.current < CHECK_INTERVAL_MS) return;
      lastCheckAtRef.current = now;

      const ids = getNeighbors(x, y);
      if (!ids.length) return;

      const radius2 = STACK_RADIUS * STACK_RADIUS;
      let bestId: number | null = null;
      let bestD2 = Infinity;

      for (const candidateId of ids) {
        if (candidateId === movingId) continue;
        const idx = idIndexRef.current.get(candidateId);
        if (idx == null) continue;
        const p = virtualMap[idx];
        const pos = p?.position;
        if (!pos) continue;

        const d2 = distanceBetweenPosts(x, y, pos.left, pos.top);
        console.log(`Canditate ${p.id} is at ${d2} distance`)
        if (d2 < radius2 && d2 < bestD2) {
          bestD2 = d2;
          bestId = candidateId;
        }
      }

      if (bestId != null) {
        const idx = idIndexRef.current.get(bestId);
        if (idx == null) return;
        const target = virtualMap[idx];
        onStack(movingId, target);
      }
    },
    [virtualMap, onStack]
  );

  const onDragStart = useCallback((postId: number) => {
    draggingIdRef.current = postId;
  }, []);

  const onDragEnd = useCallback(
    (postId: number) => {
      if (draggingIdRef.current === postId) {
        onClearStacks();
        draggingIdRef.current = null;
      }
    },
    [onClearStacks]
  );

  const trackPostit = useCallback(
    (postId: number, newLeft: number, newTop: number) => {
      console.log(`[STACK] new position { x: ${newLeft}, y: ${newTop}} `)
      _setVirtualMap((prev) => {
        const idx = idIndexRef.current.get(postId);
        if (idx == null) return prev;
        const current = prev[idx];
        if (!current?.position) return prev;

        const currentX = current.position.left
        const currentY = current.position.top

        const dragThreshold = 32;
        const dragDistance = distanceBetweenPosts(newLeft, newTop, currentX, currentY);
        
        if (dragDistance > dragThreshold) {
          setStacks((prevStacks) => {
            const updated = prevStacks
              .map((s) => ({
                ...s,
                ids: s.ids.filter((id) => id !== postId),
              }))
              .filter((s) => s.ids.length > 1);
            membershipRef.current.delete(postId);
            return updated;
          });
          onClearStacks()
        }
  
        // Since newLeft/newTop are absolute, no addition needed
        moveInGrid(postId, newLeft, newTop);
  
        const next = [...prev];
        next[idx] = {
          ...current,
          position: { left: newLeft, top: newTop },
        };
  
        checkForStackCandidate(postId, newLeft, newTop);
  
        return next;
      });
    },
    [checkForStackCandidate]
  );
  

  return (
    <StacksContext.Provider
      value={{
        stacks,
        setStacks,
        virtualMap,
        setVirtualMap,
        onDragStart,
        trackPostit,
        onDragEnd,
      }}
    >
      {children}
    </StacksContext.Provider>
  );
};

export const useStacksManager = () => {
  const ctx = useContext(StacksContext);
  if (!ctx) throw new Error("useStacksManager must be used within a StacksProvider");
  return ctx;
};
