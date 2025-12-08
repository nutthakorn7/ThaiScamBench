
// import { delay } from "./utils"; // Removed invalid import

// Helper for delay since we might not have a shared util
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface KnowledgeBaseItem {
  id: string;
  image_url: string;
  pattern_name: string; // e.g., "Fake Slip Template A"
  confidence: number;
  learned_at: string;
  source_case_id?: string;
  status: 'active' | 'reviewing';
  ocr_keywords?: string[];
  category?: string;
  vector_signature?: number[]; // Mock embedding
}

// Initial Mock Data (Story Arc: Baseline Knowledge)
const mockKnowledgeBase: KnowledgeBaseItem[] = [
  {
    id: 'kb_baseline_001',
    image_url: 'https://placehold.co/600x600/fecaca/991b1b.png?text=ROMANCE+SCAM\nPROFILE+A',
    pattern_name: 'Romance Scam Profile (Doctor Template)',
    confidence: 0.99,
    learned_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    status: 'active',
    category: 'romance_scam',
    vector_signature: [0.8, 0.1, 0.1, 0.9]
  }
];

/**
 * Fetch all knowledge base items (Simulates Vector DB Query)
 */
export const getKnowledgeBase = async (): Promise<KnowledgeBaseItem[]> => {
  await wait(800); // Simulate network/db latency
  return [...mockKnowledgeBase];
};

/**
 * Add a new pattern to the knowledge base (Simulates "Teaching" the AI)
 */
export const addToKnowledgeBase = async (caseId: string, patternName: string, category: string = 'unknown'): Promise<void> => {
  await wait(1200); // Simulate embedding generation time
  
  const newItem: KnowledgeBaseItem = {
      id: `kb_${Date.now()}`,
      image_url: '/placeholder-slip.jpg', // In real app, this comes from the case
      pattern_name: patternName,
      confidence: 0.90, // Initial confidence
      learned_at: new Date().toISOString(),
      source_case_id: caseId,
      status: 'active',
      category,
      vector_signature: Array.from({length: 4}, () => Math.random()) // Fake embedding
  };
  
  mockKnowledgeBase.unshift(newItem);
  console.log(`[AdaptAI] Learned new pattern: ${patternName} from Case ${caseId}`);
};

/**
 * Simulate searching for similar patterns (Vector Search)
 */
export const searchKnowledgeBase = async (query: string): Promise<KnowledgeBaseItem[]> => {
    await wait(600);
    // Simple filter simulation
    return mockKnowledgeBase.filter(item => 
        item.pattern_name.toLowerCase().includes(query.toLowerCase()) ||
        item.category?.toLowerCase().includes(query.toLowerCase())
    );
}

/**
 * Delete identifying pattern
 */
export const deletePattern = async (id: string): Promise<void> => {
    await wait(500);
    const index = mockKnowledgeBase.findIndex(i => i.id === id);
    if (index > -1) {
        mockKnowledgeBase.splice(index, 1);
    }
}
