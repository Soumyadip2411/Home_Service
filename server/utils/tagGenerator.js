import natural from 'natural';
import { removeStopwords } from 'stopword';

// Initialize tokenizer and TF-IDF
const tokenizer = new natural.WordTokenizer();
const tfidf = new natural.TfIdf();
const stemmer = natural.PorterStemmer;

// Common service-related keywords and their categories
const serviceKeywords = {
  cleaning: ['clean', 'cleaning', 'housekeeping', 'maid', 'janitor', 'sanitize', 'disinfect', 'dust', 'vacuum', 'mop'],
  repair: ['repair', 'fix', 'maintenance', 'install', 'replace', 'upgrade', 'service', 'troubleshoot', 'diagnose'],
  beauty: ['beauty', 'salon', 'spa', 'massage', 'facial', 'manicure', 'pedicure', 'haircut', 'styling', 'makeup'],
  fitness: ['fitness', 'gym', 'workout', 'training', 'yoga', 'pilates', 'personal', 'coach', 'exercise'],
  education: ['tutor', 'teaching', 'coaching', 'training', 'education', 'learning', 'course', 'class', 'workshop'],
  technology: ['tech', 'computer', 'software', 'programming', 'web', 'app', 'digital', 'IT', 'support'],
  transportation: ['transport', 'delivery', 'pickup', 'drive', 'car', 'bike', 'logistics', 'shipping'],
  food: ['catering', 'cooking', 'chef', 'food', 'meal', 'restaurant', 'delivery', 'baking'],
  photography: ['photo', 'photography', 'camera', 'video', 'filming', 'editing', 'studio'],
  legal: ['legal', 'lawyer', 'attorney', 'consultation', 'document', 'contract', 'advice'],
  financial: ['accounting', 'tax', 'finance', 'bookkeeping', 'audit', 'consulting', 'investment'],
  health: ['medical', 'health', 'therapy', 'counseling', 'nursing', 'care', 'wellness', 'treatment'],
  home: ['home', 'house', 'interior', 'design', 'renovation', 'construction', 'plumbing', 'electrical'],
  pet: ['pet', 'dog', 'cat', 'animal', 'veterinary', 'grooming', 'walking', 'sitting'],
  event: ['event', 'party', 'wedding', 'celebration', 'planning', 'decoration', 'entertainment'],
  security: ['security', 'guard', 'surveillance', 'protection', 'safety', 'monitoring'],
  gardening: ['garden', 'landscaping', 'lawn', 'plants', 'irrigation', 'maintenance'],
  automotive: ['car', 'auto', 'vehicle', 'mechanic', 'repair', 'maintenance', 'service']
};

// Synonyms map for common service-related terms
const tagSynonyms = {
  cleaning: ['clean', 'sanitize', 'disinfect', 'tidy'],
  repair: ['fix', 'mend', 'restore', 'patch'],
  beauty: ['salon', 'spa', 'grooming', 'makeover'],
  fitness: ['workout', 'exercise', 'training', 'gym'],
  education: ['tutor', 'teach', 'lesson', 'course'],
  technology: ['tech', 'it', 'software', 'computer'],
  food: ['catering', 'meal', 'chef', 'cook'],
  photography: ['photo', 'camera', 'shoot', 'video'],
  legal: ['lawyer', 'attorney', 'legal', 'counsel'],
  financial: ['accounting', 'tax', 'finance', 'audit'],
  health: ['medical', 'therapy', 'wellness', 'care'],
  home: ['house', 'residence', 'apartment', 'dwelling'],
  pet: ['animal', 'dog', 'cat', 'veterinary'],
  event: ['party', 'wedding', 'celebration', 'gathering'],
  security: ['guard', 'protection', 'safety', 'surveillance'],
  gardening: ['garden', 'lawn', 'landscape', 'plants'],
  automotive: ['car', 'vehicle', 'auto', 'mechanic']
};

// Enhanced tag generation function
export const generateTags = (title, description, category) => {
  try {
    const combinedText = `${title} ${description || ''}`.toLowerCase();
    
    // Tokenize and clean the text
    let tokens = tokenizer.tokenize(combinedText);
    
    // Remove stopwords and short words
    tokens = removeStopwords(tokens.filter(token => 
      token.length > 2 && 
      !/^\d+$/.test(token) && 
      !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(token)
    ));
    
    // Extract meaningful keywords
    const keywords = new Set();
    
    // Add category-based keywords
    if (category && category.name) {
      keywords.add(category.name.toLowerCase());
      // Add stem and synonyms for category
      keywords.add(stemmer.stem(category.name.toLowerCase()));
      if (tagSynonyms[category.name.toLowerCase()]) {
        tagSynonyms[category.name.toLowerCase()].forEach(syn => keywords.add(syn));
      }
    }
    
    // Add service-specific keywords
    tokens.forEach(token => {
      // Add original token and its stem
      keywords.add(token);
      keywords.add(stemmer.stem(token));
      // Add synonyms if available
      Object.entries(tagSynonyms).forEach(([main, syns]) => {
        if (main === token || syns.includes(token)) {
          keywords.add(main);
          syns.forEach(syn => keywords.add(syn));
        }
      });
      
      // Check against service keyword categories
      Object.entries(serviceKeywords).forEach(([category, words]) => {
        if (words.some(word => token.includes(word) || word.includes(token))) {
          keywords.add(category);
          keywords.add(token);
        }
      });
      
      // Add common service-related words
      if (['service', 'professional', 'expert', 'quality', 'reliable', 'experienced'].includes(token)) {
        keywords.add(token);
      }
    });
    
    // Extract location-related keywords
    const locationKeywords = extractLocationKeywords(combinedText);
    locationKeywords.forEach(keyword => keywords.add(keyword));
    
    // Extract time-related keywords
    const timeKeywords = extractTimeKeywords(combinedText);
    timeKeywords.forEach(keyword => keywords.add(keyword));
    
    // Extract price-related keywords
    const priceKeywords = extractPriceKeywords(combinedText);
    priceKeywords.forEach(keyword => keywords.add(keyword));
    
    // Generate contextual tags
    const contextualTags = generateContextualTags(title, description, category);
    contextualTags.forEach(tag => keywords.add(tag));
    
    // Convert to array and limit to 15 tags
    const tags = Array.from(keywords).slice(0, 15);
    
    return tags;
  } catch (error) {
    console.error('Error generating tags:', error);
    return [];
  }
};

// Extract location-related keywords
const extractLocationKeywords = (text) => {
  const locationKeywords = [];
  const locationPatterns = [
    /home|house|office|apartment|building|room/g,
    /indoor|outdoor|onsite|remote|online/g,
    /local|nearby|within|area|zone/g
  ];
  
  locationPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      locationKeywords.push(...matches);
    }
  });
  
  return locationKeywords;
};

// Extract time-related keywords
const extractTimeKeywords = (text) => {
  const timeKeywords = [];
  const timePatterns = [
    /hour|daily|weekly|monthly|yearly/g,
    /quick|fast|urgent|emergency|same.day/g,
    /flexible|available|schedule|appointment/g
  ];
  
  timePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      timeKeywords.push(...matches);
    }
  });
  
  return timeKeywords;
};

// Extract price-related keywords
const extractPriceKeywords = (text) => {
  const priceKeywords = [];
  const pricePatterns = [
    /affordable|cheap|budget|economical/g,
    /premium|luxury|high.end|exclusive/g,
    /discount|offer|deal|package/g
  ];
  
  pricePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      priceKeywords.push(...matches);
    }
  });
  
  return priceKeywords;
};

// Generate contextual tags based on content
const generateContextualTags = (title, description, category) => {
  const contextualTags = [];
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Service type indicators
  if (text.includes('cleaning') || text.includes('clean')) {
    contextualTags.push('cleaning', 'maintenance');
  }
  
  if (text.includes('repair') || text.includes('fix')) {
    contextualTags.push('repair', 'maintenance');
  }
  
  if (text.includes('install') || text.includes('setup')) {
    contextualTags.push('installation', 'setup');
  }
  
  if (text.includes('consult') || text.includes('advice')) {
    contextualTags.push('consultation', 'advice');
  }
  
  if (text.includes('teach') || text.includes('tutor')) {
    contextualTags.push('education', 'teaching');
  }
  
  if (text.includes('design') || text.includes('creative')) {
    contextualTags.push('design', 'creative');
  }
  
  if (text.includes('delivery') || text.includes('transport')) {
    contextualTags.push('delivery', 'transport');
  }
  
  // Quality indicators
  if (text.includes('professional') || text.includes('expert')) {
    contextualTags.push('professional', 'expert');
  }
  
  if (text.includes('certified') || text.includes('licensed')) {
    contextualTags.push('certified', 'licensed');
  }
  
  if (text.includes('experienced') || text.includes('years')) {
    contextualTags.push('experienced');
  }
  
  return contextualTags;
};

// Enhanced search function that uses tags, provider names, and prefixes
export const searchServicesByTags = (searchQuery, services) => {
  try {
    const queryTokens = tokenizer.tokenize(searchQuery.toLowerCase());
    const queryTags = new Set();
    const searchTerm = searchQuery.toLowerCase();
    
    // Extract tags from search query
    queryTokens.forEach(token => {
      // Check against service keywords
      Object.entries(serviceKeywords).forEach(([category, words]) => {
        if (words.some(word => token.includes(word) || word.includes(token))) {
          queryTags.add(category);
          queryTags.add(token);
        }
      });
      
      // Check against tag synonyms
      Object.entries(tagSynonyms).forEach(([main, syns]) => {
        if (main === token || syns.includes(token)) {
          queryTags.add(main);
          syns.forEach(syn => queryTags.add(syn));
        }
      });
    });
    
    // Score services based on multiple criteria
    const scoredServices = services.map(service => {
      let score = 0;
      const serviceTags = service.tags || [];
      const providerName = (service.provider?.name || '').toLowerCase();
      const serviceTitle = (service.title || '').toLowerCase();
      const serviceDescription = (service.description || '').toLowerCase();
      const categoryName = (service.category?.name || '').toLowerCase();
      
      // 1. Exact tag matches (highest priority)
      serviceTags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (queryTags.has(tagLower)) {
          score += 10; // High score for exact tag matches
        }
      });
      
      // 2. Tag prefix matches
      serviceTags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (tagLower.startsWith(searchTerm) || searchTerm.startsWith(tagLower)) {
          score += 8; // High score for prefix matches
        }
      });
      
      // 3. Provider name matches
      if (providerName.includes(searchTerm)) {
        score += 7; // High score for provider matches
      }
      
      // 4. Provider name prefix matches
      if (providerName.startsWith(searchTerm)) {
        score += 6; // Good score for provider prefix
      }
      
      // 5. Category name matches
      if (categoryName.includes(searchTerm)) {
        score += 5; // Good score for category matches
      }
      
      // 6. Title matches
      if (serviceTitle.includes(searchTerm)) {
        score += 4; // Good score for title matches
      }
      
      // 7. Partial tag matches
      serviceTags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        queryTags.forEach(queryTag => {
          if (tagLower.includes(queryTag) || queryTag.includes(tagLower)) {
            score += 3; // Medium score for partial matches
          }
        });
      });
      
      // 8. Description matches
      if (serviceDescription.includes(searchTerm)) {
        score += 2; // Lower score for description matches
      }
      
      // 9. Fuzzy matching for similar terms
      queryTokens.forEach(token => {
        serviceTags.forEach(tag => {
          const tagLower = tag.toLowerCase();
          // Check for similar terms (e.g., "clean" vs "cleaning")
          if (tagLower.includes(token) || token.includes(tagLower)) {
            score += 1; // Low score for fuzzy matches
          }
        });
      });
      
      // 10. Boost for services with higher ratings
      if (service.avgRating && service.avgRating >= 4.0) {
        score += 1; // Small boost for highly rated services
      }
      
      return { ...service, searchScore: score };
    });
    
    // Sort by score and return
    return scoredServices
      .filter(service => service.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore);
  } catch (error) {
    console.error('Error searching services by tags:', error);
    return services;
  }
};

// Function to update existing services with generated tags
export const updateServiceTags = async (serviceId, title, description, category) => {
  try {
    const tags = generateTags(title, description, category);
    return tags;
  } catch (error) {
    console.error('Error updating service tags:', error);
    return [];
  }
};

// Batch update tags for existing services
export const batchUpdateTags = async (Service) => {
  try {
    const services = await Service.find().populate('category');
    let updatedCount = 0;
    
    for (const service of services) {
      const newTags = generateTags(service.title, service.description, service.category);
      
      if (newTags.length > 0) {
        await Service.findByIdAndUpdate(service._id, { tags: newTags });
        updatedCount++;
      }
    }
    
    console.log(`Updated tags for ${updatedCount} services`);
    return updatedCount;
  } catch (error) {
    console.error('Error in batch tag update:', error);
    return 0;
  }
}; 