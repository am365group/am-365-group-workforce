import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

export type TourStep = {
  /** CSS selector for the element to highlight */
  target: string;
  /** Title shown in tooltip */
  title: string;
  /** Description shown in tooltip */
  description: string;
  /** Where to place the tooltip relative to the target */
  placement?: "top" | "bottom" | "left" | "right";
};

type Props = {
  steps: TourStep[];
  /** Called when tour finishes or is skipped */
  onComplete: () => void;
  /** localStorage key to track completion */
  storageKey?: string;
};

export function OnboardingTour({ steps, onComplete, storageKey = "am365_tour_done" }: Props) {
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[current];

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.target);
    if (el) {
      setRect(el.getBoundingClientRect());
      // Scroll element into view if needed
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      setRect(null);
    }
  }, [step]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  // Re-measure after a short delay (for sidebar animation)
  useEffect(() => {
    const t = setTimeout(measure, 300);
    return () => clearTimeout(t);
  }, [current, measure]);

  const finish = useCallback(() => {
    localStorage.setItem(storageKey, "1");
    onComplete();
  }, [storageKey, onComplete]);

  const next = () => {
    if (current < steps.length - 1) setCurrent(current + 1);
    else finish();
  };

  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  if (!step) return null;

  // Compute tooltip position
  const placement = step.placement ?? "bottom";
  let tooltipStyle: React.CSSProperties = { position: "fixed", zIndex: 10002 };

  if (rect) {
    const pad = 12;
    switch (placement) {
      case "bottom":
        tooltipStyle.top = rect.bottom + pad;
        tooltipStyle.left = rect.left + rect.width / 2;
        tooltipStyle.transform = "translateX(-50%)";
        break;
      case "top":
        tooltipStyle.bottom = window.innerHeight - rect.top + pad;
        tooltipStyle.left = rect.left + rect.width / 2;
        tooltipStyle.transform = "translateX(-50%)";
        break;
      case "right":
        tooltipStyle.top = rect.top + rect.height / 2;
        tooltipStyle.left = rect.right + pad;
        tooltipStyle.transform = "translateY(-50%)";
        break;
      case "left":
        tooltipStyle.top = rect.top + rect.height / 2;
        tooltipStyle.right = window.innerWidth - rect.left + pad;
        tooltipStyle.transform = "translateY(-50%)";
        break;
    }
  } else {
    // Fallback: center on screen
    tooltipStyle.top = "50%";
    tooltipStyle.left = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
  }

  return (
    <>
      {/* Backdrop overlay with cutout */}
      <div className="fixed inset-0 z-[10000]" style={{ pointerEvents: "none" }}>
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {rect && (
                <rect
                  x={rect.left - 6}
                  y={rect.top - 6}
                  width={rect.width + 12}
                  height={rect.height + 12}
                  rx={10}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask="url(#tour-mask)"
          />
        </svg>
      </div>

      {/* Highlight ring around target */}
      {rect && (
        <div
          className="fixed z-[10001] rounded-xl ring-2 ring-primary ring-offset-2 animate-pulse pointer-events-none"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="w-80 bg-card border shadow-2xl rounded-xl p-5 animate-fade-in"
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-bold text-base">{step.title}</h4>
          <button
            onClick={finish}
            className="text-muted-foreground hover:text-foreground transition-colors -mt-1 -mr-1 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {current + 1} of {steps.length}
          </span>
          <div className="flex gap-2">
            {current > 0 && (
              <Button variant="ghost" size="sm" onClick={prev}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {current < steps.length - 1 ? (
                <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
              ) : (
                "Get Started"
              )}
            </Button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
