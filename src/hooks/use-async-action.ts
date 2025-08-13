import { useRef, useState, useCallback } from "react";
import { toast } from "sonner";

export function useAsyncAction() {
  const actionRef = useRef<null | string>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const run = useCallback(
    async (label: string, fn: () => Promise<void> | void) => {
      actionRef.current = label;
      setLoading(label);
      const id = toast.loading(`${label}...`);
      try {
        await fn();
        toast.success(`${label} complete`);
      } catch (e) {
        toast.error(`${label} failed`);
      } finally {
        toast.dismiss(id);
        setLoading(null);
      }
    },
    []
  );
  return { run, loading } as const;
}
