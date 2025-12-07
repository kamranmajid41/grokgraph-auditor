import axios from 'axios';

const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY || '';
const GROK_API_BASE = 'https://api.x.ai/v1';

const grokClient = axios.create({
  baseURL: GROK_API_BASE,
  headers: {
    'Authorization': `Bearer ${GROK_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GrokResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function chatWithGrok(
  messages: GrokMessage[],
  _model?: string
): Promise<string> {
  // Try different model names if one fails
  const modelNames = ['grok-2-latest', 'grok-2', 'grok-beta', 'grok-2-1212'];
  
  for (const modelName of modelNames) {
    try {
      const response = await grokClient.post<GrokResponse>('/chat/completions', {
        model: modelName,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });
      
      if (response.data.choices && response.data.choices[0]?.message?.content) {
        return response.data.choices[0].message.content;
      }
    } catch (error: any) {
      // If it's not a 404, or if this is the last model, throw the error
      if (error.response?.status !== 404 || modelName === modelNames[modelNames.length - 1]) {
        console.error(`Grok API error with model ${modelName}:`, error);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
          
          // If we get a 404, try the next model
          if (error.response.status === 404 && modelName !== modelNames[modelNames.length - 1]) {
            continue;
          }
          
          throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        throw error;
      }
    }
  }
  
  throw new Error('All model attempts failed');
}

export async function generateArticle(topic: string): Promise<string> {
  const messages: GrokMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful assistant that creates comprehensive, well-cited articles for GrokiPedia. Include citations in markdown format: [text](url).',
    },
    {
      role: 'user',
      content: `Create a comprehensive article about "${topic}". Include multiple citations from diverse sources (academic, news, government, NGO). Format citations as markdown links.`,
    },
  ];
  
  return chatWithGrok(messages);
}

export async function analyzeCitations(
  articleText: string,
  citations: Array<{ url: string; text: string }>
): Promise<string> {
  const messages: GrokMessage[] = [
    {
      role: 'system',
      content: 'You are a citation expert analyzing article citations for bias, diversity, and reliability.',
    },
    {
      role: 'user',
      content: `Analyze these citations for the following article:\n\n${articleText}\n\nCitations:\n${citations.map(c => `- ${c.text}: ${c.url}`).join('\n')}\n\nProvide analysis of bias, diversity, and reliability issues.`,
    },
  ];
  
  return chatWithGrok(messages, 'grok-2-latest');
}

export async function suggestCitations(
  topic: string,
  existingCitations: Array<{ url: string; domain: string }>
): Promise<string> {
  const messages: GrokMessage[] = [
    {
      role: 'system',
      content: 'You are a citation expert suggesting diverse, high-quality sources for articles.',
    },
    {
      role: 'user',
      content: `Suggest 5-10 new citations for an article about "${topic}". Current citations are from: ${existingCitations.map(c => c.domain).join(', ')}. Suggest diverse sources (academic, government, news, NGO) that fill gaps. Return as JSON array with url, title, source_type, and reason fields.`,
    },
  ];
  
  return chatWithGrok(messages);
}
