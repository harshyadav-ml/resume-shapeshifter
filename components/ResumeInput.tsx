"use client";

import { useState } from "react";
import { useRef } from "react";
import { FileText, FileUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface ResumeInputProps {
  value: string;
  onChange: (text: string) => void;
  className?: string;
}

export default function ResumeInput({ value, onChange, className }: ResumeInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_CHARS = 12000;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onChange(text.slice(0, MAX_CHARS));
    };
    // For Phase 1 — read as text. Phase 2 will send to backend parser.
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const charCount = value.length;
  const charPercent = Math.min((charCount / MAX_CHARS) * 100, 100);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-primary" />
          Your Resume
        </label>
        {value && (
          <button
            type="button"
            id="clear-resume"
            onClick={() => onChange("")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          "rounded-xl border-2 border-dashed transition-all",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/60 hover:border-primary/40",
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Textarea
          id="resume-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Paste your resume here (plain text)...

Or drag & drop a .txt, .pdf, or .docx file above."
          className="min-h-[300px] border-0 bg-transparent resize-none focus-visible:ring-0 font-mono text-sm leading-relaxed rounded-xl"
          aria-label="Resume text input"
        />
      </div>

      {/* Footer: char count + upload */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                charPercent > 90 ? "bg-amber-500" : "bg-primary/60"
              )}
              style={{ width: `${charPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.docx"
          onChange={handleFileInput}
          className="hidden"
          id="resume-file-input"
          aria-label="Upload resume file"
        />
        <button
          type="button"
          id="upload-resume-btn"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all"
        >
          <FileUp className="h-3.5 w-3.5" />
          Upload File
        </button>
      </div>

      {/* Upload hint */}
      <p className="text-[11px] text-muted-foreground">
        Accepts .txt, .pdf, .docx — PDF/DOCX parsing via AI backend in Phase 2.
      </p>
    </div>
  );
}
