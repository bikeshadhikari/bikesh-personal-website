import 'server-only';
import type { RelationKey, ResourceDef } from './resources';
import { getCategories } from './content';
import { sectionChoices } from './political';
import { techCollectionChoices, techLinkChoices } from './tech';

export type Choice = { value: string; label: string };

const LOADERS: Record<RelationKey, () => Promise<Choice[]>> = {
  categories: async () => (await getCategories()).map((c) => ({ value: String(c.id), label: c.name })),
  political_sections: sectionChoices,
  tech_collections: techCollectionChoices,
  tech_links: techLinkChoices,
};

/** The choices for every dropdown on a form that reads from another table. */
export async function relationChoices(def: ResourceDef): Promise<Record<string, Choice[]>> {
  const keys = [...new Set(Object.values(def.fields)
    .map((f) => f.options)
    .filter((o): o is RelationKey => typeof o === 'string'))];
  const entries = await Promise.all(keys.map(async (k) => [k, await LOADERS[k]()] as const));
  return Object.fromEntries(entries);
}
