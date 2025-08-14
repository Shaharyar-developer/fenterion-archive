"use client";

import { useEffect, useState, useCallback } from "react";
import { VirtualizedCombobox } from "@/components/ui/virtualized-combobox";
import { fetchFonts } from "@/lib/fonts";
import { Loader2 } from "lucide-react";
import WebFont from "webfontloader";
import { toast } from "sonner";

interface FontPickerProps {
  targetClass: string;
  defaultFont?: string;
  width?: string;
  height?: string;
  className?: string;
}

export default function FontPicker({
  targetClass,
  defaultFont = "Fira Mono",
  width = "240px",
  height = "300px",
  className,
}: FontPickerProps) {
  const [fontsList, setFontsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFont, setSelectedFont] = useState(defaultFont);

  // Load and apply a font
  const applyFont = useCallback(
    (fontName: string, { silent = false }: { silent?: boolean } = {}) => {
      if (!fontName) return;
      const loadFont = new Promise<string>((resolve, reject) => {
        WebFont.load({
          google: { families: [fontName] },
          active: () => resolve(fontName),
          inactive: () => reject(new Error("inactive")),
        });
      });

      const onSuccess = (loadedName: string) => {
        document.documentElement.style.setProperty(
          "--editor-font",
          `"${loadedName}", sans-serif`
        );
        setSelectedFont(loadedName);
        try {
          localStorage.setItem("editorFont:v1", loadedName);
        } catch {}
        return `Font set to ${loadedName}`;
      };

      if (silent) {
        loadFont.then(onSuccess).catch(() => {});
        return;
      }

      toast.promise(loadFont.then(onSuccess), {
        loading: `Loading ${fontName}…`,
        success: (msg) => msg,
        error: () => `Failed to load ${fontName}`,
      });
    },
    []
  );

  // Fetch font list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const fonts = await fetchFonts();
        if (mounted) {
          setFontsList(fonts);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Hydrate previously selected font (fallback to default)
  useEffect(() => {
    let initial = defaultFont;
    try {
      const stored = localStorage.getItem("editorFont:v1");
      if (stored) initial = stored;
    } catch {}
    applyFont(initial, { silent: true });
  }, [defaultFont, applyFont]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-10 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading fonts…
      </div>
    );
  }

  return (
    <VirtualizedCombobox
      options={fontsList}
      searchPlaceholder={selectedFont || "Select font…"}
      width={width}
      height={height}
      onSelectOption={(fontName) => applyFont(fontName)}
      className={className}
    />
  );
}
