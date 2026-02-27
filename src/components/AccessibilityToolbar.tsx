import { useState, useEffect, useCallback } from "react";
import { Accessibility, Type, Contrast, Eye, Zap, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "gpwdeba-a11y";

interface A11yPrefs {
  fontSize: number; // 0 = default, 1 = large, 2 = x-large
  highContrast: boolean;
  dyslexiaFont: boolean;
  reducedMotion: boolean;
}

const defaults: A11yPrefs = {
  fontSize: 0,
  highContrast: false,
  dyslexiaFont: false,
  reducedMotion: false,
};

const fontLabels = ["Default", "Large", "X-Large"];

function loadPrefs(): A11yPrefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaults, ...JSON.parse(stored) };
  } catch {}
  return defaults;
}

function applyPrefs(prefs: A11yPrefs) {
  const root = document.documentElement;

  // Font size
  root.classList.remove("a11y-font-lg", "a11y-font-xl");
  if (prefs.fontSize === 1) root.classList.add("a11y-font-lg");
  if (prefs.fontSize === 2) root.classList.add("a11y-font-xl");

  // High contrast
  root.classList.toggle("a11y-high-contrast", prefs.highContrast);

  // Dyslexia font
  root.classList.toggle("a11y-dyslexia", prefs.dyslexiaFont);

  // Reduced motion
  root.classList.toggle("a11y-reduced-motion", prefs.reducedMotion);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function AccessibilityToolbar() {
  const [prefs, setPrefs] = useState<A11yPrefs>(loadPrefs);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    applyPrefs(prefs);
  }, [prefs]);

  // Apply on mount
  useEffect(() => {
    applyPrefs(loadPrefs());
  }, []);

  const update = useCallback((partial: Partial<A11yPrefs>) => {
    setPrefs((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetAll = useCallback(() => {
    setPrefs(defaults);
  }, []);

  const hasChanges =
    prefs.fontSize !== 0 ||
    prefs.highContrast ||
    prefs.dyslexiaFont ||
    prefs.reducedMotion;

  return (
    <div
      className="sticky top-0 z-[60] border-b bg-card/95 backdrop-blur transition-all"
      role="toolbar"
      aria-label="Accessibility controls"
    >
      {/* Collapsed bar */}
      <div className="container mx-auto flex items-center justify-between px-4 h-10">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={expanded}
          aria-controls="a11y-panel"
        >
          <Accessibility className="h-4 w-4" />
          <span className="hidden sm:inline">Accessibility</span>
          {hasChanges && (
            <span className="flex h-2 w-2 rounded-full bg-accent" aria-label="Active preferences" />
          )}
        </button>

        {/* Quick controls always visible */}
        <div className="flex items-center gap-3">
          {/* Font size quick controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => update({ fontSize: Math.max(0, prefs.fontSize - 1) })}
              disabled={prefs.fontSize === 0}
              aria-label="Decrease font size"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground w-8 text-center" aria-live="polite">
              {fontLabels[prefs.fontSize]}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => update({ fontSize: Math.min(2, prefs.fontSize + 1) })}
              disabled={prefs.fontSize === 2}
              aria-label="Increase font size"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Quick toggles on desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant={prefs.highContrast ? "default" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => update({ highContrast: !prefs.highContrast })}
              aria-label={`High contrast: ${prefs.highContrast ? "on" : "off"}`}
              aria-pressed={prefs.highContrast}
            >
              <Contrast className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={prefs.dyslexiaFont ? "default" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => update({ dyslexiaFont: !prefs.dyslexiaFont })}
              aria-label={`Dyslexia-friendly font: ${prefs.dyslexiaFont ? "on" : "off"}`}
              aria-pressed={prefs.dyslexiaFont}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={prefs.reducedMotion ? "default" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => update({ reducedMotion: !prefs.reducedMotion })}
              aria-label={`Reduced motion: ${prefs.reducedMotion ? "on" : "off"}`}
              aria-pressed={prefs.reducedMotion}
            >
              <Zap className="h-3.5 w-3.5" />
            </Button>
          </div>

          {hasChanges && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={resetAll}
              aria-label="Reset accessibility settings"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded panel (mobile-friendly) */}
      {expanded && (
        <div
          id="a11y-panel"
          className="border-t bg-card px-4 py-4 animate-fade-in"
        >
          <div className="container mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Font Size */}
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Type className="mt-0.5 h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Font Size</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Adjust text size for readability
                </p>
                <div className="flex items-center gap-2">
                  {fontLabels.map((label, i) => (
                    <Button
                      key={label}
                      variant={prefs.fontSize === i ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => update({ fontSize: i })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* High Contrast */}
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Contrast className="mt-0.5 h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">High Contrast</p>
                  <Switch
                    checked={prefs.highContrast}
                    onCheckedChange={(v) => update({ highContrast: v })}
                    aria-label="Toggle high contrast mode"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enhanced color contrast for better visibility
                </p>
              </div>
            </div>

            {/* Dyslexia Font */}
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Eye className="mt-0.5 h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Dyslexia Font</p>
                  <Switch
                    checked={prefs.dyslexiaFont}
                    onCheckedChange={(v) => update({ dyslexiaFont: v })}
                    aria-label="Toggle dyslexia-friendly font"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use OpenDyslexic font for easier reading
                </p>
              </div>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Zap className="mt-0.5 h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Reduced Motion</p>
                  <Switch
                    checked={prefs.reducedMotion}
                    onCheckedChange={(v) => update({ reducedMotion: v })}
                    aria-label="Toggle reduced motion"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimize animations and transitions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
