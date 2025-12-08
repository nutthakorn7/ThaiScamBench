
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

// Initial Mock Data
const mockKnowledgeBase: KnowledgeBaseItem[] = [
  {
    id: 'kb_1',
    image_url: '/placeholder-slip.jpg',
    pattern_name: 'Generic Fake Slip (KBank Template 2024)',
    confidence: 0.98,
    learned_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'active',
    category: 'fake_slip',
    ocr_keywords: ['โอนเงินสำเร็จ', '99.00', 'ธนาคารกสิกรไทย'],
    vector_signature: [0.12, 0.45, 0.88, 0.11]
  },
  {
    id: 'kb_2',
    image_url: '/placeholder-slip.jpg',
    pattern_name: 'Gambling Ad Banner #4',
    confidence: 0.95,
    learned_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    source_case_id: 'req_x9z8y7',
    status: 'active',
    category: 'gambling',
    vector_signature: [0.99, 0.01, 0.22, 0.33]
  },
  {
    id: 'kb_3',
    image_url: '/placeholder-slip.jpg',
    pattern_name: 'Loan Scam QR Pattern',
    confidence: 0.89,
    learned_at: new Date(Date.now() - 43200000).toISOString(),
    status: 'reviewing',
    category: 'loan_scam',
    vector_signature: [0.55, 0.66, 0.77, 0.88]
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
