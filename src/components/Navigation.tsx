"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/manual", label: "Manual Input", icon: "✎" },
  { href: "/audit", label: "Audit Log", icon: "◎" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌙</span>
          <div>
            <p className="font-semibold text-slate-800 text-sm leading-tight">Mara Agent</p>
            <p className="text-xs text-slate-500">Sleep Affirmations</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname.startsWith(item.href)
                ? "bg-slate-100 text-slate-900 font-medium"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-slate-100">
        <p className="text-xs text-slate-400">Review-only by default</p>
        <p className="text-xs text-slate-400">No auto-posting</p>
      </div>
    </aside>
  );
}
