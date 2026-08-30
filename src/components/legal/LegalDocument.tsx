import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import type { LegalDoc } from "@/content/legal";

interface Props {
  doc: LegalDoc;
  homeLabel: string;
}

/**
 * Renders a legal document as static markup.
 *
 * A server component on purpose: Google's OAuth brand verification fetches the
 * privacy policy and terms URLs, and the content has to be in the HTML it reads.
 */
export default function LegalDocument({ doc, homeLabel }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-4">
      <nav aria-label="Breadcrumb" className="mb-4 py-3">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-text dark:text-gray-400">
          <li>
            <Link href="/" className="hover:text-primary">
              {homeLabel}
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight size={12} className="rtl:rotate-180" />
            <span className="text-dark dark:text-gray-200">{doc.title}</span>
          </li>
        </ol>
      </nav>

      <article className="pb-16">
        <h1 className="text-2xl font-bold text-dark dark:text-gray-100 sm:text-3xl">
          {doc.title}
        </h1>
        <p className="mt-2 text-xs text-gray-text dark:text-gray-400">
          {doc.updatedLabel}
        </p>

        <div className="mt-6 space-y-4">
          {doc.intro.map((p, i) => (
            <p
              key={i}
              className="text-sm leading-7 text-gray-700 dark:text-gray-300"
            >
              {p}
            </p>
          ))}
        </div>

        {doc.sections.map((section, i) => (
          <section key={i} className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-dark dark:text-gray-100">
              {section.heading}
            </h2>

            {section.body?.map((p, j) => (
              <p
                key={j}
                className="mb-3 text-sm leading-7 text-gray-700 dark:text-gray-300"
              >
                {p}
              </p>
            ))}

            {section.bullets && (
              <ul className="space-y-2 ps-5">
                {section.bullets.map((b, j) => (
                  <li
                    key={j}
                    className="list-disc text-sm leading-7 text-gray-700 marker:text-primary dark:text-gray-300"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>
    </div>
  );
}
