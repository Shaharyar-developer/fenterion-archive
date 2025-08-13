import { useState, useCallback } from "react";

export function useBoolean(initial = false) {
  const [value, setValue] = useState(initial);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  return { value, setTrue, setFalse } as const;
}
