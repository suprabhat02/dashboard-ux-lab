import { describe, expect, it } from 'vitest';
import { pageGraph, serializeJsonLd, techArticle } from '../../src/site/seo';

const base = {
  url: 'https://lab.suprabhat-dev.com/scenarios/slow/',
  name: 'Slow response',
  description: 'Twelve seconds.',
  inLanguage: 'en',
  siteLanguages: ['en', 'es', 'ar'],
  siteName: 'Dashboard UX Lab',
  image: 'https://lab.suprabhat-dev.com/og/en.png',
  authorImage: 'https://lab.suprabhat-dev.com/_astro/portrait.webp',
  authorJobTitle: 'Senior front-end engineer',
} as const;

type Node = Record<string, unknown> & { '@type': string; '@id'?: string };
const nodes = (graph: Record<string, unknown>): Node[] => graph['@graph'] as Node[];

describe('structured data', () => {
  it('links the page, the site and one shared author', () => {
    const graph = nodes(pageGraph(base));
    const types = graph.map((node) => node['@type']);
    expect(types).toEqual(['WebSite', 'Person', 'WebPage']);
    const person = graph[1];
    expect(person?.['@id']).toBe('https://suprabhat-dev.com/#person');
    expect(graph[2]?.author).toEqual({ '@id': person?.['@id'] });
  });

  it('adds a breadcrumb trail only when given one', () => {
    const graph = nodes(
      pageGraph({
        ...base,
        breadcrumbs: [
          { name: 'Home', url: 'https://lab.suprabhat-dev.com/' },
          { name: 'Slow response', url: base.url },
        ],
        extra: [
          techArticle({
            url: base.url,
            headline: 'Slow response',
            description: base.description,
            inLanguage: 'en',
            image: base.image,
            dateModified: '2026-10-16',
          }),
        ],
      }),
    );
    const trail = graph.find((node) => node['@type'] === 'BreadcrumbList');
    expect(trail?.itemListElement).toHaveLength(2);
    expect(graph.at(-1)?.['@type']).toBe('TechArticle');
  });

  it('can never close its own <script> element', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});
