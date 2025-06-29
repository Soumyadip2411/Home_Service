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