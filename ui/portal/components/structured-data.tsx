/**
 * StructuredData component - Injects JSON-LD structured data into pages
 * 
 * Usage:
 * import { StructuredData } from '@/components/structured-data';
 * import { homepageSchemas } from '@/lib/structured-data';
 * 
 * export default function Page() {
 *   return (
 *     <>
 *       <StructuredData schemas={homepageSchemas} />
 *       <main>...</main>
 *     </>
 *   );
 * }
 */

import { generateJsonLd } from '@/lib/structured-data';

interface StructuredDataProps {
    schemas: object | object[];
}

export function StructuredData({ schemas }: StructuredDataProps) {
    const jsonLd = generateJsonLd(schemas);

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd }}
            suppressHydrationWarning
        />
    );
}
