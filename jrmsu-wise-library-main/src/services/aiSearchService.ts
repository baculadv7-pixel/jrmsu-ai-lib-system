// AI Search Service
// Intelligent search with auto-complete, suggestions, and semantic understanding

import { aiService } from './aiService';
import { BooksService, type BookRecord } from './books';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'book' | 'author' | 'category' | 'keyword';
  confidence: number;
  metadata?: any;
}

export interface SearchResult {
  book: BookRecord;
  relevanceScore: number;
  matchedFields: string[];
  aiReason?: string;
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
  resultsCount: number;
  userId: string;
}

const SEARCH_HISTORY_KEY = 'jrmsu_search_history';
const MAX_HISTORY = 50;

class AISearchService {
  // Enhanced search with AI ranking
  async smartSearch(query: string, userId: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    // Get all books
    const allBooks = BooksService.list();
    
    // Basic keyword search
    const keywordResults = this.keywordSearch(query, allBooks);
    
    // AI-enhanced ranking
    const rankedResults = await this.rankWithAI(query, keywordResults);
    
    // Save to search history
    this.saveSearchHistory(query, userId, rankedResults.length);
    
    return rankedResults;
  }

  // Keyword-based search
  private keywordSearch(query: string, books: BookRecord[]): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter(t => t.length > 0);
    
    const results: SearchResult[] = [];
    
    for (const book of books) {
      let score = 0;
      const matchedFields: string[] = [];
      
      // Title matching (highest weight)
      if (book.title.toLowerCase().includes(lowerQuery)) {
        score += 10;
        matchedFields.push('title');
      } else {
        terms.forEach(term => {
          if (book.title.toLowerCase().includes(term)) {
            score += 5;
            if (!matchedFields.includes('title')) matchedFields.push('title');
          }
        });
      }
      
      // Author matching
      if (book.author.toLowerCase().includes(lowerQuery)) {
        score += 8;
        matchedFields.push('author');
      } else {
        terms.forEach(term => {
          if (book.author.toLowerCase().includes(term)) {
            score += 4;
            if (!matchedFields.includes('author')) matchedFields.push('author');
          }
        });
      }
      
      // Category matching
      if (book.category.toLowerCase().includes(lowerQuery)) {
        score += 6;
        matchedFields.push('category');
      } else {
        terms.forEach(term => {
          if (book.category.toLowerCase().includes(term)) {
            score += 3;
            if (!matchedFields.includes('category')) matchedFields.push('category');
          }
        });
      }
      
      // ISBN matching (exact)
      if (book.isbn && book.isbn.toLowerCase().includes(lowerQuery)) {
        score += 15;
        matchedFields.push('isbn');
      }
      
      // Book code matching
      if (book.id.toLowerCase().includes(lowerQuery)) {
        score += 12;
        matchedFields.push('code');
      }
      
      // Boost available books
      if (book.status === 'available') {
        score += 2;
      }
      
      if (score > 0) {
        results.push({
          book,
          relevanceScore: score,
          matchedFields
        });
      }
    }
    
    // Sort by relevance
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // AI-enhanced ranking
  private async rankWithAI(query: string, results: SearchResult[]): Promise<SearchResult[]> {
    if (results.length === 0) return [];
    
    try {
      // For top results, ask AI to provide reasoning
      const topResults = results.slice(0, 5);
      
      for (const result of topResults) {
        const prompt = `User searched for: "${query}". 
Book found: "${result.book.title}" by ${result.book.author} (${result.book.category}).
In one brief sentence, explain why this book matches their search.`;
        
        try {
          const response = await aiService.sendMessage(prompt, 'system', []);
          result.aiReason = response.content;
        } catch {
          // If AI fails, continue without reason
        }
      }
      
      return results;
    } catch (error) {
      console.error('AI ranking failed:', error);
      return results;
    }
  }

  // Get auto-complete suggestions
  async getAutocompleteSuggestions(partialQuery: string): Promise<SearchSuggestion[]> {
    if (partialQuery.length < 2) return [];
    
    const suggestions: SearchSuggestion[] = [];
    const lowerQuery = partialQuery.toLowerCase();
    const allBooks = BooksService.list();
    
    // Track unique suggestions
    const seen = new Set<string>();
    
    // Book titles
    allBooks.forEach(book => {
      if (book.title.toLowerCase().includes(lowerQuery) && !seen.has(book.title)) {
        suggestions.push({
          id: `title_${book.id}`,
          text: book.title,
          type: 'book',
          confidence: 0.9,
          metadata: { bookId: book.id }
        });
        seen.add(book.title);
      }
    });
    
    // Authors
    allBooks.forEach(book => {
      if (book.author.toLowerCase().includes(lowerQuery) && !seen.has(book.author)) {
        suggestions.push({
          id: `author_${book.author}`,
          text: book.author,
          type: 'author',
          confidence: 0.85,
          metadata: { author: book.author }
        });
        seen.add(book.author);
      }
    });
    
    // Categories
    allBooks.forEach(book => {
      if (book.category.toLowerCase().includes(lowerQuery) && !seen.has(book.category)) {
        suggestions.push({
          id: `cat_${book.category}`,
          text: book.category,
          type: 'category',
          confidence: 0.8,
          metadata: { category: book.category }
        });
        seen.add(book.category);
      }
    });
    
    // Sort by confidence and limit
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);
  }

  // Get popular searches
  getPopularSearches(userId?: string): string[] {
    const history = this.getSearchHistory(userId);
    
    // Count frequency
    const frequency = new Map<string, number>();
    history.forEach(h => {
      const count = frequency.get(h.query) || 0;
      frequency.set(h.query, count + 1);
    });
    
    // Sort by frequency
    const sorted = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([query]) => query);
    
    return sorted.slice(0, 10);
  }

  // Get search recommendations based on user behavior
  async getSearchRecommendations(userId: string): Promise<string[]> {
    const history = this.getSearchHistory(userId);
    
    if (history.length === 0) {
      return [
        'Popular fiction books',
        'Computer science textbooks',
        'Philippine history',
        'Mathematics reference'
      ];
    }
    
    // Get recent search patterns
    const recentQueries = history.slice(-5).map(h => h.query).join(', ');
    
    try {
      const prompt = `Based on these recent library searches: "${recentQueries}", suggest 3 related search queries the user might be interested in. List only the queries, one per line.`;
      
      const response = await aiService.sendMessage(prompt, userId, []);
      
      // Parse response into array
      const suggestions = response.content
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 3);
      
      return suggestions;
    } catch (error) {
      console.error('Failed to get search recommendations:', error);
      return [];
    }
  }

  // Natural language query understanding
  async parseNaturalLanguageQuery(query: string): Promise<{
    intent: string;
    entities: Record<string, string>;
    reformulatedQuery: string;
  }> {
    try {
      const prompt = `Parse this library search query: "${query}"
Extract:
- Intent (find_book, check_availability, get_recommendation, etc.)
- Entities (title, author, category, etc.)
- Reformulated query (clear search terms)
Format as JSON.`;
      
      const response = await aiService.sendMessage(prompt, 'system', []);
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(response.content);
        return parsed;
      } catch {
        // Fallback to simple parsing
        return {
          intent: 'find_book',
          entities: {},
          reformulatedQuery: query
        };
      }
    } catch (error) {
      return {
        intent: 'find_book',
        entities: {},
        reformulatedQuery: query
      };
    }
  }

  // Save search history
  private saveSearchHistory(query: string, userId: string, resultsCount: number): void {
    try {
      const history = this.getSearchHistory();
      
      const entry: SearchHistory = {
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        timestamp: new Date(),
        resultsCount,
        userId
      };
      
      history.push(entry);
      
      // Keep only last MAX_HISTORY entries
      const trimmed = history.slice(-MAX_HISTORY);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  // Get search history
  getSearchHistory(userId?: string): SearchHistory[] {
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!raw) return [];
      
      const history = JSON.parse(raw) as SearchHistory[];
      
      if (userId) {
        return history.filter(h => h.userId === userId);
      }
      
      return history;
    } catch (error) {
      console.error('Failed to load search history:', error);
      return [];
    }
  }

  // Clear search history
  clearSearchHistory(userId?: string): void {
    if (userId) {
      const history = this.getSearchHistory();
      const filtered = history.filter(h => h.userId !== userId);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
    } else {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    }
  }

  // Get trending searches (across all users)
  getTrendingSearches(timeframe: 'day' | 'week' | 'month' = 'week'): string[] {
    const history = this.getSearchHistory();
    
    // Calculate date threshold
    const now = Date.now();
    const timeframes = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    
    const threshold = now - timeframes[timeframe];
    
    // Filter by timeframe
    const recentSearches = history.filter(h => 
      new Date(h.timestamp).getTime() > threshold
    );
    
    // Count frequency
    const frequency = new Map<string, number>();
    recentSearches.forEach(h => {
      const count = frequency.get(h.query) || 0;
      frequency.set(h.query, count + 1);
    });
    
    // Sort by frequency
    const trending = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([query]) => query)
      .slice(0, 10);
    
    return trending;
  }

  // Smart query expansion
  expandQuery(query: string): string[] {
    const expansions: string[] = [query];
    
    // Add common variations
    const synonyms: Record<string, string[]> = {
      'book': ['textbook', 'novel', 'publication'],
      'computer': ['computing', 'IT', 'tech'],
      'science': ['scientific', 'sciences'],
      'history': ['historical', 'chronicles'],
      'math': ['mathematics', 'mathematical'],
      'physics': ['physical'],
      'chemistry': ['chemical'],
      'biology': ['biological', 'life science']
    };
    
    const terms = query.toLowerCase().split(/\s+/);
    
    terms.forEach(term => {
      if (synonyms[term]) {
        synonyms[term].forEach(syn => {
          const expanded = query.toLowerCase().replace(term, syn);
          expansions.push(expanded);
        });
      }
    });
    
    return [...new Set(expansions)];
  }
}

// Export singleton instance
export const aiSearchService = new AISearchService();
