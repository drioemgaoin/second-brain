"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Chat" },
  { href: "/notes", label: "Notes" },
] as const;

export function NavBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 px-4">
      <div className="max-w-3xl mx-auto flex items-center gap-6 h-12">
        <span className="text-sm font-semibold mr-auto">Second Brain</span>
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm font-medium pb-0.5 border-b-2 transition-colors ${
              isActive(href)
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
