import natural from "natural";
import Service from "../models/service.model.js";

const tfidf = new natural.TfIdf();
const tokenizer = new natural.WordTokenizer();

// Most advanced content-based filtering combining multiple approaches
export const getAdvancedContentBasedRecommendations = async (tagProfile) => {
  try {
    // Step 1: Create user profile document
    const userProfileDoc = createUserProfileDocument(tagProfile);
    
    // Step 2: Get all services
    const services = await Service.find().populate("category");
    
    // Step 3: Score each service using multiple approaches
    const scoredServices = services.map(service => {
      const scores = calculateMultiApproachScore(service, userProfileDoc, tagProfile);
      return { 
        service, 
        score: scores.finalScore,
        breakdown: scores
      };
    });
    
    // Step 4: Sort by final score
    return scoredServices.sort((a, b) => b.score - a.score);
    
  } catch (error) {
    console.error("Advanced content-based filtering error:", error);
    return [];
  }
};

// Create comprehensive user profile document
function createUserProfileDocument(tagProfile) {
  const documentTokens = [];
  
  // Add tags with frequency based on weight
  Object.entries(tagProfile).forEach(([tag, weight]) => {
    const frequency = Math.max(1, Math.round(weight * 5));
    for (let i = 0; i < frequency; i++) {
      documentTokens.push(tag.toLowerCase());
    }
  });
  
  return documentTokens.join(' ');
}

// Multi-approach scoring system
function calculateMultiApproachScore(service, userProfileDoc, tagProfile) {
  const serviceTokens = [
    ...(service.title ? tokenizer.tokenize(service.title.toLowerCase()) : []),
    ...(service.tags || []).map(tag => tag.toLowerCase()),
    ...(service.category?.name ? [service.category.name.toLowerCase()] : []),
    ...(service.description ? tokenizer.tokenize(service.description.toLowerCase()) : [])
  ].filter(token => token && token.trim());

  // Approach 1: Simple Tag Matching (Fast & Reliable)
  const simpleTagScore = calculateSimpleTagScore(service, tagProfile);
  
  // Approach 2: TF-IDF Semantic Similarity (Advanced)
  const tfidfScore = calculateTFIDFScore(service, userProfileDoc);
  
  // Approach 3: Fuzzy Matching (Flexible)
  const fuzzyScore = calculateFuzzyScore(service, tagProfile);
  
  // Approach 4: Category Matching (Contextual)
  const categoryScore = calculateCategoryScore(service, tagProfile);
  
  // Approach 5: Semantic Similarity (Advanced NLP)
  const semanticScore = calculateSemanticScore(service, userProfileDoc);
  
  // Intelligent weighting based on data quality
  const weights = calculateDynamicWeights(service, tagProfile);
  
  const finalScore = 
    (simpleTagScore * weights.simple) +
    (tfidfScore * weights.tfidf) +
    (fuzzyScore * weights.fuzzy) +
    (categoryScore * weights.category) +
    (semanticScore * weights.semantic);
  
  return {
    finalScore,
    simpleTagScore,
    tfidfScore,
    fuzzyScore,
    categoryScore,
    semanticScore,
    weights
  };
}

// Approach 1: Simple Tag Matching
function calculateSimpleTagScore(service, tagProfile) {
  let score = 0;
  const serviceTags = (service.tags || []).map(tag => tag.toLowerCase());
  
  Object.entries(tagProfile).forEach(([userTag, weight]) => {
    const normalizedUserTag = userTag.toLowerCase();
    
    // Exact match (highest score)
    if (serviceTags.includes(normalizedUserTag)) {
      score += weight * 1.0;
    }
    // Partial match (medium score)
    else if (serviceTags.some(serviceTag => 
      serviceTag.includes(normalizedUserTag) || normalizedUserTag.includes(serviceTag)
    )) {
      score += weight * 0.6;
    }
  });
  
  return score;
}

// Approach 2: TF-IDF Semantic Similarity
function calculateTFIDFScore(service, userProfileDoc) {
  try {
    const userTokens = tokenizer.tokenize(userProfileDoc.toLowerCase());
    const serviceTokens = [
      ...(service.title ? tokenizer.tokenize(service.title.toLowerCase()) : []),
      ...(service.tags || []).map(tag => tag.toLowerCase()),
      ...(service.category?.name ? [service.category.name.toLowerCase()] : [])
    ].filter(token => token && token.trim());
    
    // Build TF-IDF vectors
    const allTokens = Array.from(new Set([...userTokens, ...serviceTokens]));
    const userVec = allTokens.map(token => userTokens.filter(t => t === token).length);
    const serviceVec = allTokens.map(token => serviceTokens.filter(t => t === token).length);
    
    // Calculate cosine similarity
    const dotProduct = userVec.reduce((sum, val, i) => sum + val * serviceVec[i], 0);
    const userNorm = Math.sqrt(userVec.reduce((sum, val) => sum + val * val, 0));
    const serviceNorm = Math.sqrt(serviceVec.reduce((sum, val) => sum + val * val, 0));
    
    if (userNorm === 0 || serviceNorm === 0) return 0;
    return dotProduct / (userNorm * serviceNorm);
  } catch (error) {
    return 0;
  }
}

// Approach 3: Fuzzy Matching
function calculateFuzzyScore(service, tagProfile) {
  let score = 0;
  const serviceTokens = [
    ...(service.title ? tokenizer.tokenize(service.title.toLowerCase()) : []),
    ...(service.tags || []).map(tag => tag.toLowerCase())
  ];
  
  Object.entries(tagProfile).forEach(([userTag, weight]) => {
    const normalizedUserTag = userTag.toLowerCase();
    
    serviceTokens.forEach(serviceToken => {
      const distance = natural.LevenshteinDistance(serviceToken, normalizedUserTag);
      const maxLength = Math.max(serviceToken.length, normalizedUserTag.length);
      const similarity = 1 - (distance / maxLength);
      
      if (similarity > 0.8) {
        score += weight * similarity;
      }
    });
  });
  
  return score;
}

// Approach 4: Category Matching
function calculateCategoryScore(service, tagProfile) {
  if (!service.category?.name) return 0;
  
  const categoryName = service.category.name.toLowerCase();
  let score = 0;
  
  Object.entries(tagProfile).forEach(([userTag, weight]) => {
    const normalizedUserTag = userTag.toLowerCase();
    
    // Check if user tag matches category
    if (categoryName.includes(normalizedUserTag) || normalizedUserTag.includes(categoryName)) {
      score += weight * 0.8;
    }
  });
  
  return score;
}

// Approach 5: Semantic Similarity (Advanced)
function calculateSemanticScore(service, userProfileDoc) {
  try {
    // Create service document
    const serviceDoc = [
      service.title || '',
      (service.tags || []).join(' '),
      service.category?.name || '',
      service.description || ''
    ].join(' ').toLowerCase();
    
    // Simple semantic similarity using word overlap
    const userWords = new Set(userProfileDoc.toLowerCase().split(' '));
    const serviceWords = new Set(serviceDoc.split(' '));
    
    const intersection = new Set([...userWords].filter(x => serviceWords.has(x)));
    const union = new Set([...userWords, ...serviceWords]);
    
    return intersection.size / union.size;
  } catch (error) {
    return 0;
  }
}

// Dynamic weighting based on data quality
function calculateDynamicWeights(service, tagProfile) {
  const hasRichContent = service.description && service.description.length > 50;
  const hasManyTags = (service.tags || []).length > 2;
  const hasUserPreferences = Object.keys(tagProfile).length > 0;
  
  // Base weights
  let weights = {
    simple: 0.3,    // Always reliable
    tfidf: 0.2,     // Good for rich content
    fuzzy: 0.2,     // Good for typos/variations
    category: 0.15, // Good for context
    semantic: 0.15  // Good for semantic understanding
  };
  
  // Adjust weights based on data quality
  if (hasRichContent) {
    weights.tfidf += 0.1;
    weights.semantic += 0.1;
    weights.simple -= 0.1;
  }
  
  if (hasManyTags) {
    weights.simple += 0.1;
    weights.fuzzy += 0.05;
    weights.tfidf -= 0.05;
  }
  
  if (!hasUserPreferences) {
    weights.simple = 0.5;  // Fallback to simple matching
    weights.tfidf = 0.1;
    weights.fuzzy = 0.2;
    weights.category = 0.1;
    weights.semantic = 0.1;
  }
  
  return weights;
}

// Utility function for hybrid system (legacy support)
export function getContentSimilarityScore(userProfileDoc, service) {
  return calculateTFIDFScore(service, userProfileDoc);
}

// Legacy function for backward compatibility
export const getContentRecommendations = async (userId) => {
  // This function is kept for backward compatibility but not used in the new system
  console.warn("getContentRecommendations is deprecated. Use getAdvancedContentBasedRecommendations instead.");
  return [];
};