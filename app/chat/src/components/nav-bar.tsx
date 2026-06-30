"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./theme-provider";

const LINKS = [
  { href: "/", label: "Chat" },
  { href: "/notes", label: "Notes" },
] as const;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Theme: ${theme}`}
      title={`Theme: ${theme}`}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900
        dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

export function NavBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 backdrop-blur-xl bg-white/90 dark:bg-gray-950/90"
      aria-label="Main navigation"
    >
      <div className="max-w-3xl mx-auto flex items-center h-16 px-6">
        <Link href="/" className="flex items-center gap-2.5 mr-auto">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-600 dark:text-blue-400"
          >
            <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.8-3.5 6-.3.2-.5.5-.5.9V17a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.1c0-.4-.2-.7-.5-.9C6.3 13.8 5 11.5 5 9a7 7 0 0 1 7-7z" />
            <path d="M9 21h6" />
            <path d="M10 21a2 2 0 0 0 4 0" />
          </svg>
          <span className="text-base font-semibold tracking-tight">Second Brain</span>
        </Link>

        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`h-9 px-4 flex items-center rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
