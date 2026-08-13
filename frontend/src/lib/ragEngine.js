import { KNOWLEDGE_BASE } from './knowledgeBase';

/**
 * Clean and tokenize text into keywords
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2); // Filter out short stop-words
}

/**
 * Searches the built-in knowledge base and user-uploaded documents
 * Returns: { contextString, citations: [{ id, title, category }] }
 */
export function queryRAG(userQuery, uploadedDocs = [], topN = 2) {
  const queryTokens = tokenize(userQuery);
  if (queryTokens.length === 0) {
    return { contextString: "", citations: [] };
  }

  // Combine static knowledge base with dynamic uploaded documents
  const allDocs = [
    ...KNOWLEDGE_BASE.map(doc => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      content: doc.content,
      tags: doc.tags,
      isUserUploaded: false
    })),
    ...uploadedDocs.map((doc, idx) => ({
      id: `uploaded_${idx}_${Date.now()}`,
      title: doc.name,
      category: "Dokumen Unggahan Pengguna",
      content: doc.content,
      tags: tokenize(doc.name),
      isUserUploaded: true
    }))
  ];

  // Score each document
  const scoredDocs = allDocs.map(doc => {
    let score = 0;
    const titleTokens = tokenize(doc.title);
    const contentTokens = tokenize(doc.content);
    const tagTokens = doc.tags ? doc.tags.flatMap(t => tokenize(t)) : [];

    queryTokens.forEach(token => {
      // Direct matches in tags (weight: 15)
      const tagMatches = tagTokens.filter(t => t.includes(token) || token.includes(t)).length;
      score += tagMatches * 15;

      // Direct matches in title (weight: 10)
      const titleMatches = titleTokens.filter(t => t.includes(token) || token.includes(t)).length;
      score += titleMatches * 10;

      // Matches in content (weight: 2 per occurrence)
      const occurrences = contentTokens.filter(t => t === token).length;
      score += occurrences * 2.5;

      // Substring matches in content (weight: 0.5)
      const contentSubMatches = contentTokens.filter(t => t.includes(token) && t !== token).length;
      score += contentSubMatches * 0.5;
    });

    return { doc, score };
  });

  // Filter, sort by score descending, and select top N
  const matches = scoredDocs
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  if (matches.length === 0) {
    return { contextString: "", citations: [] };
  }

  // Build context string for the AI prompt
  const contextString = matches
    .map(match => {
      const typeStr = match.doc.isUserUploaded ? "[DOKUMEN DIUNGGAH USER]" : "[DOKUMEN UTAMA GEOLOGI]";
      return `${typeStr} Kategori: ${match.doc.category}\nJudul: ${match.doc.title}\nKonten:\n${match.doc.content}\n--------------------`;
    })
    .join("\n\n");

  const citations = matches.map(match => ({
    id: match.doc.id,
    title: match.doc.title,
    category: match.doc.category,
    isUserUploaded: match.doc.isUserUploaded
  }));

  return { contextString, citations };
}
