import axios from 'axios';
import dotenv from 'dotenv';
import process from 'node:process';

// Initialize dotenv to load environment variables
dotenv.config();
const env = process.env;

/**
 * Sleep function for retry mechanism
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Detects language of input text
 * @param {string} text - Text to detect language for
 * @returns {string} - ISO language code ('en', 'ta', 'hi', etc.)
 */
export async function detectLanguage(text) {
  try {
    // Basic detection using Unicode ranges - do this first for reliability
    if (/[\u0B80-\u0BFF]/.test(text)) {
      console.log('Detected Tamil text using Unicode range');
      return 'ta'; // Tamil unicode range
    }
    if (/[\u0900-\u097F]/.test(text)) {
      console.log('Detected Hindi text using Unicode range');
      return 'hi'; // Hindi unicode range
    }
    
    const API_KEY = env.HUGGINGFACE_API_KEY;
    
    if (!API_KEY) {
      console.log('No API key found, using fallback language detection');
      return 'en'; // Default to English when no API key
    }
    
    // Use language detection model
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/papluca/xlm-roberta-base-language-detection',
      { inputs: text },
      { 
        headers: { 
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json' 
        },
        timeout: 5000 // 5 second timeout
      }
    );
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      const topLanguage = response.data[0].sort((a, b) => b.score - a.score)[0];
      console.log('Detected language via API:', topLanguage.label.toLowerCase());
      return topLanguage.label.toLowerCase();
    }
    
    // Fallback if API response format is unexpected
    return 'en';
  } catch (error) {
    console.error('Error detecting language:', error.message);
    
    // Try Unicode detection when API fails
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil unicode range
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi unicode range
    
    return 'en'; // Default to English on error
  }
}

/**
 * Analyzes text sentiment using Hugging Face API
 * @param {string} text - The text to analyze
 * @param {string} language - ISO language code (en, ta, hi, etc.)
 * @param {number} retries - Number of retries for transient errors
 * @returns {Promise<string>} - 'positive', 'negative', or 'neutral'
 */
export async function analyzeText(text, language = null, retries = 2) {
  try {
    // First check if we have a Hugging Face API key
    const API_KEY = env.HUGGINGFACE_API_KEY;
    
    // Detect language if not provided
    if (!language) {
      language = await detectLanguage(text);
    }
    
    if (!API_KEY) {
      console.warn('Missing Hugging Face API key, falling back to local analysis');
      return fallbackSentimentAnalysis(text, language);
    }
    
    console.log(`Analyzing ${language} text with Hugging Face API: "${text}"`);
    
    // Select appropriate model based on language
    let modelEndpoint;
    switch(language) {
      case 'ta':
        // Use a multilingual model that supports Tamil better
        modelEndpoint = 'cardiffnlp/twitter-xlm-roberta-base-sentiment';
        break;
      case 'hi':
        modelEndpoint = 'cardiffnlp/twitter-xlm-roberta-base-sentiment';
        break;
      default:
        modelEndpoint = 'distilbert-base-uncased-finetuned-sst-2-english'; // English model (default)
    }
    
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${modelEndpoint}`,
        { inputs: text },
        { 
          headers: { 
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json' 
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      console.log('Hugging Face API response:', response.data);
      
      // Extract the sentiment from the response
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Process the first result (for single text input)
        const result = response.data[0];
        
        // Sort labels by score (highest first)
        const sortedLabels = [...result].sort((a, b) => b.score - a.score);
        const topLabel = sortedLabels[0];
        
        console.log('Top predicted label:', topLabel);
        
        // Map to our standard format (handle different model output formats)
        const label = topLabel.label.toUpperCase();
        if (label === 'POSITIVE' || label === 'POSITIVE_SENTIMENT' || label === 'LABEL_2') return 'positive';
        if (label === 'NEGATIVE' || label === 'NEGATIVE_SENTIMENT' || label === 'LABEL_0') return 'negative';
        if (label === 'NEUTRAL' || label === 'NEUTRAL_SENTIMENT' || label === 'LABEL_1') return 'neutral';
        
        // Binary classification models
        if (label === '1' || label === 'POS') return 'positive';
        if (label === '0' || label === 'NEG') return 'negative';
        
        return 'neutral';
      }
      
      // If we couldn't process the response properly, use fallback
      console.warn('Unexpected API response format, using fallback analysis');
      return fallbackSentimentAnalysis(text, language);
      
    } catch (apiError) {
      console.error('Error analyzing sentiment with Hugging Face API:', apiError.message);
      
      if (apiError.response) {
        console.log('Response status:', apiError.response.status);
        
        // Check for specific error types
        if (apiError.response.status === 503 && retries > 0) {
          console.log('Model is currently loading, retrying after delay...');
          await sleep(2000); // Wait 2 seconds before retry
          return analyzeText(text, language, retries - 1);
        } else if (apiError.response.status === 401 || apiError.response.status === 403) {
          console.log('Authentication error - check your API key');
        } else if (apiError.response.status === 404) {
          console.log('Model not found, using fallback analysis');
        }
      }
      
      // Fallback to basic sentiment analysis if API fails
      return fallbackSentimentAnalysis(text, language);
    }
    
  } catch (error) {
    console.error('Error in sentiment analysis workflow:', error);
    return fallbackSentimentAnalysis(text, language);
  }
}

/**
 * Fallback sentiment analysis function using basic word matching
 * @param {string} text - The text to analyze
 * @param {string} language - ISO language code (en, ta, hi)
 * @returns {string} - 'positive', 'negative', or 'neutral'
 */
function fallbackSentimentAnalysis(text, language = 'en') {
  try {
    console.log(`Using fallback sentiment analysis for ${language} text: "${text}"`);
    
    // Word lists for different languages
    const positiveWords = {
      en: [
        'great', 'good', 'excellent', 'amazing', 'love', 'perfect', 'convenient', 'easy', 
        'clean', 'secure', 'nice', 'helpful', 'friendly', 'awesome', 'fantastic', 'wonderful',
        'spacious', 'available', 'accessible', 'recommended', 'satisfied', 'best'
      ],
      ta: [
        'நன்று', 'சிறந்த', 'அருமை', 'மகிழ்ச்சி', 'சந்தோஷம்', 'நல்ல', 'அற்புதம்',
        'வசதி', 'எளிது', 'சுத்தமான', 'பாதுகாப்பான', 'உதவி', 'அழகான', 'பரிந்துரை',
        'அற்புதமான', 'திருப்தி', 'மிகவும் நன்று', 'வசதியான', 'பயனுள்ள', 'சிறப்பான'
      ],
      hi: [
        'अच्छा', 'बढ़िया', 'उत्तम', 'शानदार', 'प्यार', 'सही', 'सुविधाजनक', 'आसान',
        'साफ', 'सुरक्षित', 'मददगार', 'दोस्ताना', 'शानदार', 'विशाल', 'उपलब्ध', 'संतुष्ट',
        'सुन्दर', 'अच्छी सुविधा', 'बहुत अच्छा', 'सहायक', 'आरामदायक'
      ]
    };
    
    const negativeWords = {
      en: [
        'bad', 'poor', 'terrible', 'awful', 'horrible', 'difficult', 'dirty', 'unsafe', 
        'expensive', 'problem', 'issue', 'broken', 'small', 'crowded', 'avoid', 'worst',
        'disappointed', 'inconvenient', 'hard', 'limited', 'dangerous', 'uncomfortable'
      ],
      ta: [
        'மோசம்', 'கெட்டது', 'சிரமம்', 'அசுத்தமான', 'பாதுகாப்பற்ற', 'விலை அதிகம்',
        'பிரச்சனை', 'சிறியது', 'நெரிசல்', 'ஏமாற்றம்', 'கடினமான', 'ஆபத்தான', 'மோசமான',
        'மிகவும் மோசம்', 'தவிர்க்க', 'சிக்கல்', 'அசௌகரியம்', 'பிரச்சினை', 'திருப்தி இல்லை',
        'கஷ்டம்', 'வசதியற்ற', 'அபாயகரமான', 'குறைபாடு', 'துர்நாற்றம்'
      ],
      hi: [
        'बुरा', 'खराब', 'भयानक', 'मुश्किल', 'गंदा', 'असुरक्षित', 'महंगा',
        'समस्या', 'टूटा हुआ', 'छोटा', 'भीड़', 'निराश', 'असुविधाजनक', 'कठिन', 'खतरनाक',
        'बहुत बुरा', 'बेकार', 'परेशानी', 'अव्यवस्थित', 'बदबू', 'अनुचित', 'बहुत खराब'
      ]
    };
    
    // Use English as fallback if language not supported
    const lang = positiveWords[language] ? language : 'en';
    
    const textLower = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    // For Tamil, add extra weight to certain strong words
    const extraWeight = {
      'ta': {
        'மிகவும் மோசமான': 2,  // Very bad
        'மிகவும் நல்லது': 2,   // Very good
        'அசுத்தமான': 1.5,      // Dirty
        'பாதுகாப்பற்ற': 1.5,    // Unsafe
        'அற்புதமான': 1.5        // Wonderful
      }
    };
    
    positiveWords[lang].forEach(word => {
      if (textLower.includes(word)) {
        // Apply extra weight for strong expressions
        if (lang === 'ta' && extraWeight['ta'][word]) {
          positiveCount += extraWeight['ta'][word];
        } else {
          positiveCount++;
        }
      }
    });
    
    negativeWords[lang].forEach(word => {
      if (textLower.includes(word)) {
        // Apply extra weight for strong expressions
        if (lang === 'ta' && extraWeight['ta'][word]) {
          negativeCount += extraWeight['ta'][word];
        } else {
          negativeCount++;
        }
      }
    });
    
    console.log(`Fallback analysis results - Positive words: ${positiveCount}, Negative words: ${negativeCount}`);
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  } catch (error) {
    console.error('Error in fallback sentiment analysis:', error);
    return 'neutral'; // Ultimate fallback
  }
}