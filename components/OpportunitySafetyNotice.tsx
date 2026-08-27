import type { Opportunity } from "@/lib/schema";

// The standing safety notice. Deliberately a COMPONENT, not a content field: an author cannot omit
// it, forget it, or write a weaker version of it. A per-entry `safetyNote` only ever adds to it.
//
// It renders directly above the apply block, because a warning at the top of a long page is one the
// learner scrolls past on the way to the link.
//
// Draft wording - to be reviewed with safeguarding, and translated.
// See docs/PATHWAY-OPPORTUNITIES-PLAN.md, "Safety on every opportunity".

export function OpportunitySafetyNotice({
  opportunity,
  compact = false,
}: {
  opportunity?: Opportunity;
  compact?: boolean;
}) {
  const appliedBy = opportunity?.applicant.appliedBy;
  // "Talk to an adult you trust before you apply" does not parse when the adult IS the applicant.
  const trustedAdultLine =
    appliedBy === "educator" || appliedBy === "team-with-educator" || appliedBy === "institution"
      ? "An educator applies for this, not you. Ask them to look at it with you before they do."
      : "Talk to an adult you trust before you apply - your mentor, your facilitator, a family member, or another adult you trust. Show them this opportunity and ask what they think.";

  const hasFee = Boolean(opportunity?.requirements.cost.applicationFee);

  return (
    <aside
      className={`rounded-lg border border-orange/40 bg-orange/5 ${compact ? "p-4" : "p-5"}`}
      aria-labelledby="safety-heading"
    >
      <h2 id="safety-heading" className="font-heading text-base font-bold text-dark-navy">
        Before you apply — check first
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-ink">
        <li>{trustedAdultLine}</li>
        <li>
          <strong>Never give money to anyone to get a place, a job, or an application form.</strong>{" "}
          A real job pays you; it does not ask you to pay.
        </li>
        <li>Never hand over your original documents. Copies only.</li>
        <li>Never give your bank details, your passwords, or your family&rsquo;s details.</li>
        <li>
          If someone promises you a job or a visa for certain, asks you to keep it secret, or rushes
          you to decide today — stop, and talk to an adult you trust.
        </li>
        {/*
          This claim has to match reality. Saying "we check these" over an unverified entry would be
          the board telling a learner a comforting untruth about the one thing that protects them.
        */}
        {!opportunity ? (
          <li>
            Every opportunity here shows whether we have checked it, and when. Some have not been
            checked yet. If anything feels wrong, it is always alright to walk away.
          </li>
        ) : opportunity.verification.status === "verified" ? (
          <li>
            We checked this opportunity, but things change. If anything feels wrong, it is always
            alright to walk away.
          </li>
        ) : (
          <li>
            <strong>We have not checked this one yet.</strong> Make sure the organisation is real
            before you send them anything. If anything feels wrong, it is always alright to walk
            away.
          </li>
        )}
        {hasFee && (
          <li className="font-semibold">
            This one has an application fee. Check with an adult you trust before you pay anything.
          </li>
        )}
      </ul>

      {opportunity?.safetyNote && (
        <p className="mt-3 border-t border-orange/30 pt-3 text-sm font-medium text-ink">
          {opportunity.safetyNote}
        </p>
      )}

      {opportunity?.integrityContact?.reportTo && (
        <p className="mt-3 text-sm text-ink-soft">
          {opportunity.integrityContact.statement}{" "}
          {opportunity.integrityContact.statement ? "The provider asks you to report" : "Report"} any
          corruption in the application process to{" "}
          <span className="font-medium text-navy">{opportunity.integrityContact.reportTo}</span>.
        </p>
      )}
    </aside>
  );
}
