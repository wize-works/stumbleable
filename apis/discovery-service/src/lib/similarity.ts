/**
 * Enhanced Content Similarity Algorithms
 * H2.4: Advanced content similarity matching for better recommendations
 * 
 * Features:
 * - TF-IDF scoring for topic relevance
 * - Semantic similarity preparation
 * - Cross-topic recommendations
 * - Similarity caching for performance
 */

export interface TopicFrequency {
    topic: string;
    frequency: number;
    tf: number; // Term frequency
    idf: number; // Inverse document frequency
    tfidf: number; // TF-IDF score
}

export interface SimilarityCache {
    contentId: string;
    similarContentIds: string[];
    scores: number[];
    calculatedAt: Date;
    expiresAt: Date;
}

/**
 * Calculate Term Frequency (TF) for topics in content
 * TF = (number of times topic appears) / (total number of topics)
 */
export function calculateTermFrequency(
    contentTopics: string[],
    allTopics: string[]
): Map<string, number> {
    const tfMap = new Map<string, number>();
    const totalTopics = contentTopics.length;

    if (totalTopics === 0) return tfMap;

    // Count frequency of each topic
    const topicCounts = new Map<string, number>();
    contentTopics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });

    // Calculate TF for each topic
    topicCounts.forEach((count, topic) => {
        tfMap.set(topic, count / totalTopics);
    });

    return tfMap;
}

/**
 * Calculate Inverse Document Frequency (IDF) for topics across corpus
 * IDF = log(total documents / documents containing topic)
 */
export function calculateInverseDocumentFrequency(
    corpusTopics: Array<string[]>, // Array of topic arrays from all content
    allTopics: string[]
): Map<string, number> {
    const idfMap = new Map<string, number>();
    const totalDocuments = corpusTopics.length;

    if (totalDocuments === 0) return idfMap;

    // Count documents containing each topic
    const documentCounts = new Map<string, number>();

    allTopics.forEach(topic => {
        const docsWithTopic = corpusTopics.filter(doc => doc.includes(topic)).length;
        documentCounts.set(topic, docsWithTopic);
    });

    // Calculate IDF for each topic
    documentCounts.forEach((count, topic) => {
        if (count > 0) {
            idfMap.set(topic, Math.log(totalDocuments / count));
        }
    });

    return idfMap;
}

/**
 * Calculate TF-IDF scores for content topics
 * TF-IDF = TF × IDF
 */
export function calculateTFIDF(
    contentTopics: string[],
    corpusTopics: Array<string[]>,
    allTopics: string[]
): TopicFrequency[] {
    const tfMap = calculateTermFrequency(contentTopics, allTopics);
    const idfMap = calculateInverseDocumentFrequency(corpusTopics, allTopics);

    const tfidfScores: TopicFrequency[] = [];

    // Calculate TF-IDF for each topic in content
    const uniqueTopics = [...new Set(contentTopics)];

    uniqueTopics.forEach(topic => {
        const tf = tfMap.get(topic) || 0;
        const idf = idfMap.get(topic) || 0;
        const tfidf = tf * idf;

        tfidfScores.push({
            topic,
            frequency: contentTopics.filter(t => t === topic).length,
            tf,
            idf,
            tfidf
        });
    });

    // Sort by TF-IDF score (descending)
    tfidfScores.sort((a, b) => b.tfidf - a.tfidf);

    return tfidfScores;
}

/**
 * Calculate cosine similarity between two TF-IDF vectors
 */
export function calculateCosineSimilarity(
    vectorA: Map<string, number>,
    vectorB: Map<string, number>
): number {
    // Get all unique topics
    const allTopics = new Set([...vectorA.keys(), ...vectorB.keys()]);

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    allTopics.forEach(topic => {
        const valueA = vectorA.get(topic) || 0;
        const valueB = vectorB.get(topic) || 0;

        dotProduct += valueA * valueB;
        magnitudeA += valueA * valueA;
        magnitudeB += valueB * valueB;
    });

    const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);

    return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Calculate enhanced similarity score using TF-IDF
 */
export function calculateTFIDFSimilarity(
    contentATopics: string[],
    contentBTopics: string[],
    corpusTopics: Array<string[]>,
    allTopics: string[]
): number {
    // Calculate TF-IDF vectors
    const tfidfA = calculateTFIDF(contentATopics, corpusTopics, allTopics);
    const tfidfB = calculateTFIDF(contentBTopics, corpusTopics, allTopics);

    // Create vector maps
    const vectorA = new Map<string, number>();
    const vectorB = new Map<string, number>();

    tfidfA.forEach(item => vectorA.set(item.topic, item.tfidf));
    tfidfB.forEach(item => vectorB.set(item.topic, item.tfidf));

    // Calculate cosine similarity
    return calculateCosineSimilarity(vectorA, vectorB);
}

/**
 * Calculate Jaccard similarity between two topic sets
 * Jaccard = |intersection| / |union|
 */
export function calculateJaccardSimilarity(
    topicsA: string[],
    topicsB: string[]
): number {
    const setA = new Set(topicsA);
    const setB = new Set(topicsB);

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate domain-based similarity bonus
 * Content from same domain or related domains gets bonus
 */
export function calculateDomainSimilarity(
    domainA: string,
    domainB: string,
    relatedDomains?: Map<string, string[]> // domain -> related domains
): number {
    if (domainA === domainB) {
        return 1.0; // Same domain = perfect match
    }

    // Check if domains are related
    if (relatedDomains) {
        const relatedA = relatedDomains.get(domainA) || [];
        const relatedB = relatedDomains.get(domainB) || [];

        if (relatedA.includes(domainB) || relatedB.includes(domainA)) {
            return 0.5; // Related domains = partial match
        }
    }

    return 0; // Unrelated domains
}

/**
 * Calculate cross-topic recommendations
 * Identifies content that bridges between topics the user likes
 */
export function calculateCrossTopicScore(
    contentTopics: string[],
    userPrimaryTopics: string[], // Main interests
    userSecondaryTopics: string[], // Secondary interests
    topicRelationships: Map<string, string[]> // topic -> related topics
): number {
    // Check if content bridges primary and secondary interests
    const hasPrimary = contentTopics.some(t => userPrimaryTopics.includes(t));
    const hasSecondary = contentTopics.some(t => userSecondaryTopics.includes(t));

    if (hasPrimary && hasSecondary) {
        return 1.0; // Perfect bridge content
    }

    // Check if content connects related topics
    let relationshipScore = 0;

    contentTopics.forEach(topic => {
        const relatedTopics = topicRelationships.get(topic) || [];

        const primaryMatches = relatedTopics.filter(t => userPrimaryTopics.includes(t)).length;
        const secondaryMatches = relatedTopics.filter(t => userSecondaryTopics.includes(t)).length;

        if (primaryMatches > 0 && secondaryMatches > 0) {
            relationshipScore += 0.3;
        } else if (primaryMatches > 0 || secondaryMatches > 0) {
            relationshipScore += 0.1;
        }
    });

    return Math.min(1.0, relationshipScore);
}

/**
 * Multi-factor similarity score combining multiple algorithms
 * H2.4: Enhanced similarity matching
 */
export function calculateMultiFactorSimilarity(
    contentA: {
        topics: string[];
        domain: string;
        quality: number;
        readingTime: number;
        ageHours: number;
    },
    contentB: {
        topics: string[];
        domain: string;
        quality: number;
        readingTime: number;
        ageHours: number;
    },
    context?: {
        corpusTopics?: Array<string[]>;
        allTopics?: string[];
        relatedDomains?: Map<string, string[]>;
        topicRelationships?: Map<string, string[]>;
    }
): {
    overallScore: number;
    components: {
        topicSimilarity: number;
        domainSimilarity: number;
        qualitySimilarity: number;
        lengthSimilarity: number;
        tfidfSimilarity?: number;
    };
} {
    // Basic Jaccard similarity
    const jaccardScore = calculateJaccardSimilarity(contentA.topics, contentB.topics);

    // TF-IDF similarity (if corpus provided)
    let tfidfScore: number | undefined;
    if (context?.corpusTopics && context?.allTopics) {
        tfidfScore = calculateTFIDFSimilarity(
            contentA.topics,
            contentB.topics,
            context.corpusTopics,
            context.allTopics
        );
    }

    // Domain similarity
    const domainScore = calculateDomainSimilarity(
        contentA.domain,
        contentB.domain,
        context?.relatedDomains
    );

    // Quality similarity
    const qualityDiff = Math.abs(contentA.quality - contentB.quality);
    const qualityScore = 1 - qualityDiff;

    // Reading time similarity
    const timeDiff = Math.abs(contentA.readingTime - contentB.readingTime);
    const lengthScore = Math.max(0, 1 - timeDiff / 30); // 30 min max difference

    // Combine scores with weights
    const topicWeight = 0.50;
    const domainWeight = 0.15;
    const qualityWeight = 0.20;
    const lengthWeight = 0.15;

    // Use TF-IDF if available, otherwise Jaccard
    const topicScore = tfidfScore !== undefined ? tfidfScore : jaccardScore;

    const overallScore =
        topicScore * topicWeight +
        domainScore * domainWeight +
        qualityScore * qualityWeight +
        lengthScore * lengthWeight;

    return {
        overallScore: Math.max(0, Math.min(1, overallScore)),
        components: {
            topicSimilarity: topicScore,
            domainSimilarity: domainScore,
            qualitySimilarity: qualityScore,
            lengthSimilarity: lengthScore,
            tfidfSimilarity: tfidfScore
        }
    };
}

/**
 * Generate similarity matrix for a batch of content
 * Useful for precomputing similarities
 */
export function generateSimilarityMatrix(
    contentList: Array<{
        id: string;
        topics: string[];
        domain: string;
        quality: number;
        readingTime: number;
        ageHours: number;
    }>,
    context?: {
        corpusTopics?: Array<string[]>;
        allTopics?: string[];
        relatedDomains?: Map<string, string[]>;
    }
): Map<string, Map<string, number>> {
    const matrix = new Map<string, Map<string, number>>();

    // Calculate similarity for each pair
    for (let i = 0; i < contentList.length; i++) {
        const contentA = contentList[i];
        const rowMap = new Map<string, number>();

        for (let j = 0; j < contentList.length; j++) {
            if (i === j) {
                rowMap.set(contentList[j].id, 1.0); // Perfect similarity with self
                continue;
            }

            const contentB = contentList[j];

            const similarity = calculateMultiFactorSimilarity(contentA, contentB, context);
            rowMap.set(contentB.id, similarity.overallScore);
        }

        matrix.set(contentA.id, rowMap);
    }

    return matrix;
}

/**
 * Find K most similar items using precomputed similarity matrix
 */
export function findTopKSimilar(
    contentId: string,
    k: number,
    similarityMatrix: Map<string, Map<string, number>>,
    excludeIds?: Set<string>
): Array<{ contentId: string; similarity: number }> {
    const similarities = similarityMatrix.get(contentId);

    if (!similarities) {
        return [];
    }

    const results: Array<{ contentId: string; similarity: number }> = [];

    similarities.forEach((similarity, id) => {
        if (id !== contentId && (!excludeIds || !excludeIds.has(id))) {
            results.push({ contentId: id, similarity });
        }
    });

    // Sort by similarity (descending) and take top K
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, k);
}

/**
 * Build topic relationship graph from corpus
 * Topics that frequently appear together are considered related
 */
export function buildTopicRelationships(
    corpusTopics: Array<string[]>,
    minCooccurrence: number = 3
): Map<string, string[]> {
    const relationshipMap = new Map<string, string[]>();
    const cooccurrenceMap = new Map<string, Map<string, number>>();

    // Count co-occurrences
    corpusTopics.forEach(topics => {
        const uniqueTopics = [...new Set(topics)];

        for (let i = 0; i < uniqueTopics.length; i++) {
            const topicA = uniqueTopics[i];

            if (!cooccurrenceMap.has(topicA)) {
                cooccurrenceMap.set(topicA, new Map());
            }

            const cooccurrences = cooccurrenceMap.get(topicA)!;

            for (let j = i + 1; j < uniqueTopics.length; j++) {
                const topicB = uniqueTopics[j];
                cooccurrences.set(topicB, (cooccurrences.get(topicB) || 0) + 1);
            }
        }
    });

    // Build relationship map
    cooccurrenceMap.forEach((cooccurrences, topic) => {
        const relatedTopics: string[] = [];

        cooccurrences.forEach((count, relatedTopic) => {
            if (count >= minCooccurrence) {
                relatedTopics.push(relatedTopic);
            }
        });

        if (relatedTopics.length > 0) {
            relationshipMap.set(topic, relatedTopics);
        }
    });

    return relationshipMap;
}

/**
 * Prepare data for semantic similarity (embeddings)
 * This prepares metadata that would be used with a vector database
 */
export interface SemanticSimilarityPrep {
    contentId: string;
    textForEmbedding: string; // Combined text for embedding generation
    metadata: {
        topics: string[];
        domain: string;
        quality: number;
        readingTime: number;
    };
}

export function prepareForSemanticSimilarity(
    content: {
        id: string;
        title: string;
        description: string;
        topics: string[];
        domain: string;
        quality: number;
        readingTime: number;
    }
): SemanticSimilarityPrep {
    // Combine text fields for embedding
    // Title is most important, then description, then topics
    const textForEmbedding = `${content.title}. ${content.description}. Topics: ${content.topics.join(', ')}`;

    return {
        contentId: content.id,
        textForEmbedding,
        metadata: {
            topics: content.topics,
            domain: content.domain,
            quality: content.quality,
            readingTime: content.readingTime
        }
    };
}
