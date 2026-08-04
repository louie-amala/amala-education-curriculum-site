import Link from "next/link";
import { HeaderSearch } from "@/components/HeaderSearch";

const NAV = [
  { href: "/programmes", label: "Programmes" },
  { href: "/courses", label: "Courses" },
  { href: "/modules", label: "Modules" },
  { href: "/materials", label: "Materials" },
  { href: "/educators", label: "Educators" },
  { href: "/competencies", label: "Competencies" },
  { href: "/foundations", label: "Foundations" },
  { href: "/glossary", label: "Glossary" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-cool-grey/20 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/amala-logo.png" alt="Amala — Education for change" width={82} height={42} className="h-10 w-auto" />
          <span className="font-heading text-lg font-semibold text-cool-grey">Curriculum</span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-x-6">
          <nav aria-label="Primary">
            <ul className="flex flex-wrap gap-4 text-sm font-medium text-dark-navy sm:gap-6">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-navy hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <HeaderSearch />
        </div>
      </div>
    </header>
  );
}

// Licence for the curriculum content and downloadable materials, shown site-wide.
// [to verify] Confirm the exact Creative Commons licence Amala uses; change here to update everywhere.
export const CC_LICENCE = {
  label: "CC BY-NC-SA 4.0",
  url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-cool-grey/20 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/amala-logo.png" alt="Amala — Education for change" width={70} height={36} className="h-9 w-auto" />
          <p className="text-sm text-cool-grey">A design tool with the curriculum built in.</p>
        </div>
        <p className="text-xs text-cool-grey sm:text-right">
          © Amala Education. Curriculum and materials licensed under{" "}
          <a
            href={CC_LICENCE.url}
            target="_blank"
            rel="noopener noreferrer license"
            className="font-medium text-navy hover:underline"
          >
            {CC_LICENCE.label}
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
