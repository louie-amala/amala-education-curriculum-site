import Link from "next/link";

const NAV = [
  { href: "/programmes/gsd", label: "Programme" },
  { href: "/courses", label: "Courses" },
  { href: "/materials", label: "Materials" },
  { href: "/competencies", label: "Competencies" },
  { href: "/foundations", label: "Foundations" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-cool-grey/20 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-heading text-lg font-bold text-navy">
          Amala <span className="font-normal text-cool-grey">Curriculum</span>
        </Link>
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
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-cool-grey/20 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-cool-grey">
        Amala — Education for Change. A design tool with the curriculum built in.
      </div>
    </footer>
  );
}
