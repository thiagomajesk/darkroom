"use client";

import type { ReactNode } from "react";
import { Grid3X3, Fingerprint, Globe, Eraser, Wand2, Crop, ArrowUpCircle, Paintbrush, type LucideIcon } from "lucide-react";

type ToolWizardProps = {
  title: string;
  icon: string;
  color: string;
  stepLabels: string[];
  currentStep: number;
  stepTitle: string;
  stepDescription: string;
  children: ReactNode;
  sidebar?: ReactNode;
  console?: ReactNode;
  footer?: ReactNode;
};

const iconMap: Record<string, LucideIcon> = {
  Grid3X3,
  Fingerprint,
  Globe,
  Eraser,
  Wand2,
  Crop,
  ArrowUpCircle,
  Paintbrush,
};

export function ToolWizard({
  title,
  icon,
  color,
  stepLabels,
  currentStep,
  stepTitle,
  stepDescription,
  children,
  sidebar,
  console: consoleSlot,
  footer,
}: ToolWizardProps) {
  const Icon = iconMap[icon];

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Header: tool name + steps */}
      <div className="shrink-0 flex items-center justify-between border-b border-border/60 bg-card px-6 py-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div
              className="flex size-7 items-center justify-center rounded-md"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <Icon className="size-4" />
            </div>
          )}
          <span className="text-sm font-semibold tracking-tight">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className={`size-2 rounded-full transition-colors ${
                  i === currentStep
                    ? "bg-primary"
                    : i < currentStep
                      ? "bg-primary/40"
                      : "bg-muted-foreground/20"
                }`}
              />
              <span
                className={`text-xs transition-colors ${
                  i === currentStep
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: step info + content + console */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* Step info */}
          <div className="shrink-0 border-b border-border/40 px-6 py-4 text-center">
            <h2 className="text-base font-semibold">{stepTitle}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{stepDescription}</p>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>

          {/* Console */}
          {consoleSlot && <div className="shrink-0">{consoleSlot}</div>}
        </div>

        {/* Right: sidebar */}
        {sidebar && (
          <div className="no-scrollbar w-56 shrink-0 overflow-y-auto border-l border-border/40 bg-card">
            {sidebar}
          </div>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="shrink-0 flex items-center justify-end gap-2 border-t border-border/60 bg-card px-6 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
