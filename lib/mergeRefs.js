/**
 * Combines multiple refs (callback or object refs) into a single ref
 * callback, so the same DOM node can be observed by more than one hook.
 */
export default function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(node);
      else ref.current = node;
    });
  };
}
