"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  {
    label: "Newsletter",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    children: [
      { label: "Generate Newsletter", href: "/newsletter/generate" },
      { label: "Create Campaign",     href: "/newsletter/campaign" },
      { label: "History",             href: "/newsletter/history"  },
      { label: "Manage Services",     href: "/newsletter/services" },
    ],
  },
];

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>(["Newsletter"]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-white border-r border-gray-200 flex-col shrink-0 shadow-sm">
        <SidebarContent
          pathname={pathname}
          openSections={openSections}
          toggleSection={toggleSection}
          onLinkClick={() => {}}
        />
      </aside>

      {/* Mobile sidebar — slide-in drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-lg font-bold text-indigo-600 tracking-tight">Newsletter</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <SidebarContent
          pathname={pathname}
          openSections={openSections}
          toggleSection={toggleSection}
          onLinkClick={onClose}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  pathname,
  openSections,
  toggleSection,
  onLinkClick,
}: {
  pathname: string;
  openSections: string[];
  toggleSection: (label: string) => void;
  onLinkClick?: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Logo — desktop only */}
      <div className="px-5 py-5 border-b border-gray-100 hidden lg:flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-base font-bold text-gray-900 tracking-tight">Newsletter</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isOpen = openSections.includes(item.label);
          return (
            <div key={item.label} className="mb-2">
              <button
                onClick={() => toggleSection(item.label)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isOpen ? "bg-indigo-50/50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`${isOpen ? "text-indigo-600" : "text-gray-400"}`}>{item.icon}</span>
                  {item.label}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {isOpen && item.children && (
                <div className="ml-4 mt-2 mb-2 pl-4 border-l-2 border-indigo-100 space-y-1">
                  {item.children.map((child) => {
                    const active = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onLinkClick}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                          active
                            ? "bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-200"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-white" : "bg-gray-300"}`} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-6 py-6 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">System</p>
        <p className="text-xs text-gray-500 mt-1">Powered by n8n automation</p>
      </div>
    </div>
  );
}
