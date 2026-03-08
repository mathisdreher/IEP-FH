"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

interface ShareButtonProps {
  label: string;
  copiedLabel: string;
}

export function ShareButton({ label, copiedLabel }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-500" />
          {copiedLabel}
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
