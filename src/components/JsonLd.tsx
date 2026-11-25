import { jsonForScript } from '@/lib/utils';

/** Structured data for search engines and AI assistants. Escaped for a <script> block. */
export default function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonForScript(data) }} />;
}
