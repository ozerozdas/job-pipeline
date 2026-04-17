"use client";

import { useEffect, useRef, useState } from "react";

interface JobActionsDropdownProps {
  onCoverLetter: () => void;
  onChat: () => void;
}

export const JobActionsDropdown = ({ onCoverLetter, onChat }: JobActionsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white p-1.5 text-stone-500 shadow-sm transition hover:border-accent hover:text-accent"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
        type="button"
        title="Actions"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          <button
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-stone-700 transition hover:bg-stone-50"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onCoverLetter();
            }}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Cover Letter
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-stone-700 transition hover:bg-stone-50"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onChat();
            }}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Chat
          </button>
        </div>
      )}
    </div>
  );
};
