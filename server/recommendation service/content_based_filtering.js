import natural from "natural";
import Service from "../models/service.model.js";
import Interaction from "../models/interaction.model.js";

const tfidf = new natural.TfIdf();
const tokenizer = new natural.WordTokenizer();

export const getContentRecommendations = async (userId) => {
  // Get user interaction history
  const interactions = await Interaction.find({ user: userId })
    .populate("service")
    .limit(50);

  // Create user profile from interacted services
  const profile = interactions.reduce((acc, { service }) => {
    if (!service) return acc;
    
    const tokens = [
      ...(service.title ? tokenizer.tokenize(service.title.toLowerCase()) : []),
      ...(service.tags || []),
      ...(service.category?.name ? [service.category.name.toLowerCase()] : [])
    ].filter(token => token && token.trim()); // Filter out empty tokens
    
    tokens.forEach(token => tfidf.addDocument([token]));
    return acc.concat(tokens);
  }, []);

  // Calculate TF-IDF scores for all services
  const services = await Service.find().populate("category");
  return services.map(service => {
    const serviceTokens = [
      ...(service.title ? tokenizer.tokenize(service.title.toLowerCase()) : []),
      ...(service.tags || []),
      ...(service.category?.name ? [service.category.name.toLowerCase()] : [])
    ].filter(token => token && token.trim()); // Filter out empty tokens
    
    const score = serviceTokens.reduce((sum, token) => 
      sum + (profile.includes(token) ? tfidf.tfidf(token, profile) : 0), 0
    );
    return { service, score };
  }).sort((a, b) => b.score - a.score);
};

// Utility: Compute TF-IDF cosine similarity between user profile doc and service doc
export function getContentSimilarityScore(userProfileDoc, service) {
  // Tokenize user profile doc
  const userTokens = tokenizer.tokenize((userProfileDoc || '').toLowerCase());
  // Tokenize service doc (title, tags, category)
  const serviceTokens = [
    ...(service.title ? tokenizer.tokenize(service.title.toLowerCase()) : []),
    ...(service.tags || []),
    ...(service.category?.name ? [service.category.name.toLowerCase()] : [])
  ].filter(token => token && token.trim());
  // Build term frequency vectors
  const allTokens = Array.from(new Set([...userTokens, ...serviceTokens]));
  const userVec = allTokens.map(tok => userTokens.filter(t => t === tok).length);
  const serviceVec = allTokens.map(tok => serviceTokens.filter(t => t === tok).length);
  // Compute cosine similarity
  const dot = userVec.reduce((sum, v, i) => sum + v * serviceVec[i], 0);
  const userNorm = Math.sqrt(userVec.reduce((sum, v) => sum + v * v, 0));
  const serviceNorm = Math.sqrt(serviceVec.reduce((sum, v) => sum + v * v, 0));
  if (userNorm === 0 || serviceNorm === 0) return 0;
  return dot / (userNorm * serviceNorm);
}