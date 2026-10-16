import { SITE_ORIGIN } from '../spec/site';

/**
 * Structured data (schema.org JSON-LD) for every page.
 *
 * Each page emits one @graph: the WebSite, its author (a Person with stable @id
 * on the portfolio, so the lab and suprabhat-dev.com describe the same entity),
 * the WebPage itself, and optional extras (a WebApplication for the lab, a
 * TechArticle and BreadcrumbList for scenario guides).
 */

/** When the guides' content last changed; bump it with substantive edits. */
export const GUIDES_UPDATED = '2026-10-16';

export const SITE_URL = SITE_ORIGIN;
export const REPO_URL = 'https://github.com/suprabhat02/dashboard-ux-lab';

export const AUTHOR = {
  name: 'Suprabhat Kumar',
  url: 'https://suprabhat-dev.com/',
  github: 'https://github.com/suprabhat02',
  x: 'https://x.com/SuprabhatKarn97',
  twitter: '@SuprabhatKarn97',
} as const;

const PERSON_ID = `${AUTHOR.url}#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

type JsonLd = Record<string, unknown>;

export interface Crumb {
  readonly name: string;
  /** Absolute URL. */
  readonly url: string;
}

export interface PageSchemaInput {
  /** Absolute canonical URL of the page. */
  readonly url: string;
  readonly name: string;
  readonly description: string;
  /** BCP 47 language of this page. */
  readonly inLanguage: string;
  /** Languages the whole site is published in. */
  readonly siteLanguages: readonly string[];
  readonly siteName: string;
  /** Absolute URL of the page's social image. */
  readonly image: string;
  /** Absolute URL of the author's portrait. */
  readonly authorImage: string;
  readonly authorJobTitle: string;
  readonly pageType?: 'WebPage' | 'CollectionPage' | 'AboutPage';
  readonly breadcrumbs?: readonly Crumb[];
  /** Extra nodes (WebApplication, TechArticle…), linked to this page by the caller. */
  readonly extra?: readonly JsonLd[];
}

export function pageGraph(input: PageSchemaInput): JsonLd {
  const pageId = `${input.url}#webpage`;
  const breadcrumbId = `${input.url}#breadcrumb`;

  const person: JsonLd = {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: AUTHOR.name,
    url: AUTHOR.url,
    image: input.authorImage,
    jobTitle: input.authorJobTitle,
    sameAs: [AUTHOR.url, AUTHOR.github, AUTHOR.x],
  };

  const website: JsonLd = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: input.siteName,
    inLanguage: input.siteLanguages,
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
  };

  const page: JsonLd = {
    '@type': input.pageType ?? 'WebPage',
    '@id': pageId,
    url: input.url,
    name: input.name,
    description: input.description,
    inLanguage: input.inLanguage,
    isPartOf: { '@id': WEBSITE_ID },
    author: { '@id': PERSON_ID },
    primaryImageOfPage: { '@type': 'ImageObject', url: input.image },
    ...(input.breadcrumbs ? { breadcrumb: { '@id': breadcrumbId } } : {}),
  };

  const breadcrumb: JsonLd[] = input.breadcrumbs
    ? [
        {
          '@type': 'BreadcrumbList',
          '@id': breadcrumbId,
          itemListElement: input.breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: crumb.url,
          })),
        },
      ]
    : [];

  return {
    '@context': 'https://schema.org',
    '@graph': [website, person, page, ...breadcrumb, ...(input.extra ?? [])],
  };
}

/** The lab itself, described as a free web application. */
export function webApplication(input: {
  readonly url: string;
  readonly name: string;
  readonly description: string;
  readonly inLanguage: string;
}): JsonLd {
  return {
    '@type': 'WebApplication',
    '@id': `${input.url}#app`,
    name: input.name,
    url: input.url,
    description: input.description,
    inLanguage: input.inLanguage,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@id': PERSON_ID },
    codeRepository: REPO_URL,
    mainEntityOfPage: { '@id': `${input.url}#webpage` },
  };
}

/** A scenario guide, described as technical documentation. */
export function techArticle(input: {
  readonly url: string;
  readonly headline: string;
  readonly description: string;
  readonly inLanguage: string;
  readonly image: string;
  readonly dateModified: string;
}): JsonLd {
  return {
    '@type': 'TechArticle',
    '@id': `${input.url}#article`,
    headline: input.headline,
    description: input.description,
    inLanguage: input.inLanguage,
    image: input.image,
    dateModified: input.dateModified,
    proficiencyLevel: 'Intermediate',
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: { '@id': `${input.url}#webpage` },
  };
}

/** Serialises JSON-LD for a <script> element; "<" is escaped so it can never close it. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
