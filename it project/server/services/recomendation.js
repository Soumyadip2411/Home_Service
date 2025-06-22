const natural = require('natural');
const sw = require('stopword');
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

// Clean and tokenize text
function cleanAndExtractTokens(text) {
  const lower = text.toLowerCase();
  const tokens = tokenizer.tokenize(lower);
  const cleanedTokens = sw.removeStopwords(tokens);
  const alphanumeric = cleanedTokens.filter(token => /^[a-z0-9]+$/i.test(token));
  return alphanumeric.join(' ');
}

// Assume data is loaded as an array of product objects
function preprocessData(trainData, columnsToExtractTokensFrom) {
  trainData.forEach(product => {
    columnsToExtractTokensFrom.forEach(col => {
      product[col] = cleanAndExtractTokens(product[col] || '');
    });
    product.tags = columnsToExtractTokensFrom.map(col => product[col]).join(', ');
  });
}

// Create a TF-IDF based recommendation
function contentBasedRecommendations(trainData, itemName, topN = 10) {
  const index = trainData.findIndex(item => item.Name === itemName);
  if (index === -1) {
    console.log(`Item '${itemName}' not found in the training data`);
    return [];
  }

  const tfidf = new TfIdf();
  trainData.forEach(product => tfidf.addDocument(product.tags));

  const similarities = [];
  tfidf.tfidfs(trainData[index].tags, (i, measure) => {
    similarities.push({ index: i, score: measure });
  });

  similarities.sort((a, b) => b.score - a.score);
  const topIndices = similarities.slice(0, topN).map(item => item.index);

  const recommendations = topIndices.map(i => {
    const product = trainData[i];
    return {
      Name: product.Name,
      ReviewCount: product.ReviewCount,
      Brand: product.Brand,
      ImageURL: product.ImageURL,
      Rating: product.Rating
    };
  });

  return recommendations;
}
