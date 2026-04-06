import { useCallback, useState } from "react";

export function useExpandable(initial = true) {
  const [expanded, setExpanded] = useState(initial);

  const toggle = useCallback(() => {
    setExpanded((value) => !value);
  }, []);

  return {
    expanded,
    setExpanded,
    toggle,
  };
}
