import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpportunityMeta } from "@/components/OpportunityMeta";
import { OpportunitySafetyNotice } from "@/components/OpportunitySafetyNotice";
import { getOpportunity, materials, opportunities } from "@/lib/content";
import {
  APPLIED_BY_LABEL,
  KIND_META,
  PROVIDER_TYPE_LABEL,
  callToAction,
  formatDate,
  titleCase,
} from "@/lib/opportunities";

export function generateStaticParams() {
  return opportunities.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const o = getOpportunity(slug);
  return o ? { title: o.title, description: o.summary } : {};
}

export default async function OpportunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = getOpportunity(slug);
  if (!o) notFound();

  const meta = KIND_META[o.kind];
  const cost = o.requirements.cost;
  const docs = o.requirements.documents;
  const lang = o.requirements.language;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <nav className="text-sm text-ink-soft">
        <Link href="/opportunities" className="hover:underline">
          Pathway Opportunities
        </Link>{" "}
        · {meta.label}
      </nav>

      <h1 className="mt-3 font-heading text-3xl font-bold text-navy">{o.title}</h1>
      <p className="mt-2 text-ink-soft">
        {o.provider.name}
        {o.provider.type ? ` · ${PROVIDER_TYPE_LABEL[o.provider.type] ?? o.provider.type}` : ""}
      </p>

      <OpportunityMeta opportunity={o} />

      <p className="mt-5 text-lg text-ink">{o.summary}</p>

      {o.whoItIsFor && (
        <section className="mt-6 rounded-lg border border-line bg-paper p-5">
          <h2 className="font-heading text-base font-bold text-dark-navy">Who this is for</h2>
          <p className="mt-2 text-ink">{o.whoItIsFor}</p>
          <p className="mt-3 text-sm font-medium text-navy">
            {APPLIED_BY_LABEL[o.applicant.appliedBy]}
            {o.team?.required && o.team.minMembers
              ? ` · a team of ${o.team.minMembers}–${o.team.maxMembers}`
              : ""}
          </p>
          {o.applicant.note && <p className="mt-1 text-sm text-ink-soft">{o.applicant.note}</p>}
        </section>
      )}

      {/* What it does and does not pay for. The gap is the most consequential number on the page. */}
      {(cost.fundingIncludes.length > 0 || cost.fundingExcludes.length > 0) && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {cost.fundingIncludes.length > 0 && (
            <div className="rounded-lg border border-olive/40 bg-olive/5 p-4">
              <h2 className="font-heading text-base font-bold text-dark-navy">What is covered</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                {cost.fundingIncludes.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
          {cost.fundingExcludes.length > 0 && (
            <div className="rounded-lg border border-terracotta/40 bg-terracotta/5 p-4">
              <h2 className="font-heading text-base font-bold text-dark-navy">
                What you would still have to pay
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                {cost.fundingExcludes.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {cost.estimatedUnfundedCost && (
                <p className="mt-3 border-t border-terracotta/30 pt-3 text-sm text-ink">
                  {cost.estimatedUnfundedCost.status === "needs-research" ? (
                    <>
                      <strong>We do not know how much this comes to yet.</strong> Ask the provider
                      before you apply, and ask your mentor to help you work out whether you could
                      cover it.
                    </>
                  ) : (
                    <>
                      <strong>
                        About {cost.estimatedUnfundedCost.amount}{" "}
                        {cost.estimatedUnfundedCost.currency}
                      </strong>
                      {cost.estimatedUnfundedCost.basis
                        ? ` — ${cost.estimatedUnfundedCost.basis}`
                        : ""}
                    </>
                  )}
                  {cost.estimatedUnfundedCost.note && (
                    <span className="mt-1 block text-ink-soft">
                      {cost.estimatedUnfundedCost.note}
                    </span>
                  )}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {o.risksDisclosed.length > 0 && (
        <section className="mt-6 rounded-lg border border-gold/50 bg-gold/5 p-5">
          <h2 className="font-heading text-base font-bold text-dark-navy">
            What the provider says is not guaranteed
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
            {o.risksDisclosed.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {o.providerInterest && (
        <section className="mt-6 rounded-lg border border-gold/50 bg-gold/5 p-5">
          <h2 className="font-heading text-base font-bold text-dark-navy">Who benefits from this</h2>
          <p className="mt-2 text-sm text-ink">{o.providerInterest}</p>
        </section>
      )}

      <Section title="What you need">
        <Detail label="Qualifications" items={o.requirements.qualifications} />
        <Detail
          label="Documents"
          items={docs.required}
          empty={
            docs.note ? undefined : "Not stated — check with the provider before you apply."
          }
          note={
            [
              docs.passportRequired === false ? "You do not need a passport." : null,
              docs.alternativesAccepted,
              docs.note,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        {(lang.ofDelivery.length > 0 || lang.required.length > 0) && (
          <div className="border-t border-line py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Language</h3>
            <p className="mt-1 text-sm text-ink">
              {lang.ofDelivery.length > 0 && (
                <>Taught in {lang.ofDelivery.map((l) => l.toUpperCase()).join(", ")}. </>
              )}
              {lang.required.length > 0 &&
                lang.required.map((r) => (
                  <span key={r.language}>
                    You need {r.language.toUpperCase()}
                    {r.level ? ` at ${r.level}` : ""} to apply
                    {r.reason ? ` (${r.reason})` : ""}.{" "}
                  </span>
                ))}
              {lang.supportProvided}
              {lang.note}
            </p>
          </div>
        )}
        {o.needs && (
          <div className="border-t border-line py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              To take part you need
            </h3>
            <p className="mt-1 text-sm text-ink">
              {[
                o.needs.connectivity === "none-needed"
                  ? "No internet"
                  : o.needs.connectivity === "low-bandwidth"
                    ? "A little internet"
                    : o.needs.connectivity === "stable-internet"
                      ? "Stable internet"
                      : null,
                o.needs.device === "computer"
                  ? "a computer"
                  : o.needs.device === "own-phone"
                    ? "your own phone"
                    : o.needs.device === "shared-phone"
                      ? "a shared phone is enough"
                      : o.needs.device === "none"
                        ? "no device"
                        : null,
                o.needs.rightToWorkRequired ? "the right to work" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        )}
      </Section>

      <Section title="Who can apply">
        <Detail label="Status" items={o.eligibility.status.map(titleCase)} />
        <Detail
          label="Where you must live"
          items={
            o.eligibility.residingIn.resolved
              ? o.eligibility.residingIn.countries.length > 0
                ? o.eligibility.residingIn.countries.map(titleCase)
                : ["Anywhere"]
              : []
          }
          empty="The provider has not published the list of eligible countries. Check before you spend time applying."
          note={o.eligibility.residingIn.note ?? undefined}
        />
        {o.eligibility.ageRange && (
          <Detail
            label="Age"
            items={[
              `${o.eligibility.ageRange.min ?? "any"} to ${o.eligibility.ageRange.max ?? "any"}`,
              ...(o.eligibility.ageNote ? [o.eligibility.ageNote] : []),
            ]}
          />
        )}
        {o.eligibility.maritalStatus && (
          <Detail label="Family status" items={[o.eligibility.maritalStatus]} />
        )}
        <Detail label="Other conditions" items={o.eligibility.otherConditions} />
      </Section>

      {o.keyDates.length > 0 && (
        <Section title="Key dates">
          <ul className="space-y-1 py-2 text-sm text-ink">
            {o.keyDates.map((d) => (
              <li key={d.label}>
                <span className="font-medium">{d.date ? formatDate(d.date) : "Date not stated"}</span>{" "}
                — {d.label}
                {d.note ? ` (${d.note})` : ""}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {o.instances.length > 0 && (
        <Section title="Where it runs">
          <ul className="space-y-2 py-2 text-sm text-ink">
            {o.instances.map((i) => (
              <li key={i.country}>
                <span className="font-medium">{titleCase(i.country)}</span>
                {i.deadline?.date ? ` — closes ${formatDate(i.deadline.date)}` : ""}
                {i.note ? ` · ${i.note}` : ""}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* The safety notice sits immediately before the apply block - the moment of action. */}
      <div className="mt-8">
        <OpportunitySafetyNotice opportunity={o} />
      </div>

      <section className="mt-4 rounded-lg border border-navy/30 bg-white p-5">
        <h2 className="font-heading text-lg font-bold text-dark-navy">{callToAction(o)}</h2>
        {o.howToApply.steps.length > 0 && (
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink">
            {o.howToApply.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        )}
        {o.howToApply.offline && (
          <p className="mt-3 rounded bg-paper p-3 text-sm text-ink">
            <span className="font-semibold">Without the internet: </span>
            {o.howToApply.offline}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {o.howToApply.online?.url && (
            <a
              href={o.howToApply.online.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-dark-navy"
            >
              Open the provider&rsquo;s page
            </a>
          )}
          {o.howToApply.contact?.email && (
            <span className="text-sm text-ink-soft">{o.howToApply.contact.email}</span>
          )}
          {o.howToApply.contact?.phone && (
            <span className="text-sm text-ink-soft">{o.howToApply.contact.phone}</span>
          )}
        </div>
        {o.howToApply.selectionNote && (
          <p className="mt-3 text-sm text-ink-soft">{o.howToApply.selectionNote}</p>
        )}
        {o.applicationRules.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {o.applicationRules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </section>

      {o.dataRequested && (
        <section className="mt-6 rounded-lg border border-line bg-paper p-5">
          <h2 className="font-heading text-base font-bold text-dark-navy">
            What the application asks for
          </h2>
          {o.dataRequested.aboutStudents.length > 0 && (
            <p className="mt-2 text-sm text-ink">
              <span className="font-medium">About students: </span>
              {o.dataRequested.aboutStudents.join(", ")}
            </p>
          )}
          {o.dataRequested.aboutEducator.length > 0 && (
            <p className="mt-1 text-sm text-ink">
              <span className="font-medium">About the educator: </span>
              {o.dataRequested.aboutEducator.join(", ")}
            </p>
          )}
          {o.dataRequested.note && (
            <p className="mt-2 text-sm text-ink-soft">{o.dataRequested.note}</p>
          )}
        </section>
      )}

      {o.preparedBy.length > 0 && (
        <section className="mt-6">
          <h2 className="font-heading text-lg font-bold text-dark-navy">
            What prepares you for this
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {o.preparedBy.map((slug) => (
              <li key={slug}>
                <Link href={`/materials/${slug}`} className="text-navy hover:underline">
                  {materials.find((m) => m.slug === slug)?.title ?? slug.replace(/-/g, " ")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {o.source && (
        <p className="mt-8 border-t border-line pt-4 text-xs text-ink-soft">Source: {o.source}</p>
      )}

      <p className="mt-4 text-sm">
        <Link href="/opportunities" className="text-navy hover:underline">
          ← All opportunities
        </Link>
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-heading text-lg font-bold text-dark-navy">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/** Renders "not stated" explicitly - a blank field must never read as "not required". */
function Detail({
  label,
  items,
  empty,
  note,
}: {
  label: string;
  items: string[];
  empty?: string;
  note?: string;
}) {
  if (items.length === 0 && !empty && !note) return null;
  return (
    <div className="border-t border-line py-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</h3>
      {items.length > 0 ? (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      ) : (
        empty && <p className="mt-1 text-sm italic text-ink-soft">{empty}</p>
      )}
      {note && <p className="mt-1 text-sm text-ink-soft">{note}</p>}
    </div>
  );
}
