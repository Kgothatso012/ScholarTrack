// AI Service - Connect to OpenClaw gateway for AI features
// Uses MiniMax M2.5 via local gateway

const GATEWAY_URL = 'http://127.0.0.1:18789/v1';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface ChatCompletionResponse {
  id: string;
  choices: {
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const aiService = {
  // Send chat message to AI
  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch(`${GATEWAY_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'MiniMax-M2.5',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        } as ChatCompletionRequest),
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data: ChatCompletionResponse = await response.json();
      return data.choices[0]?.message?.content || 'No response';
    } catch (error) {
      console.error('AI chat error:', error);
      return 'Sorry, I could not process your request. Please try again.';
    }
  },

  // Extract trip details from natural language
  async extractTripDetails(text: string): Promise<{
    pickup?: string;
    dropoff?: string;
    time?: string;
    childName?: string;
  }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a trip booking assistant. Extract the following from the user message: pickup location, dropoff location, pickup time, and child name. Return ONLY a JSON object with these fields: pickup, dropoff, time, childName. If a field is not mentioned, use null. Example: {"pickup": "Mamelodi High School", "dropoff": "45 Oxford Road", "time": "2:30pm", "childName": "Thabo"}',
      },
      {
        role: 'user',
        content: text,
      },
    ];

    const response = await this.chat(messages);
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[^}]+\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse trip details:', e);
    }
    
    return {};
  },

  // Validate driver document
  async validateDocument(documentType: string, text: string): Promise<{
    isValid: boolean;
    extractedData: Record<string, string>;
    warnings: string[];
  }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a document validation assistant. Analyze this ${documentType} and determine if it's valid. Extract relevant fields and check for issues. Return JSON: { isValid: boolean, extractedData: { field: value }, warnings: string[] }`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    const response = await this.chat(messages);
    
    try {
      const jsonMatch = response.match(/\{[^}]+\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse document validation:', e);
    }
    
    return { isValid: false, extractedData: {}, warnings: ['Could not analyze document'] };
  },

  // General AI support chat
  async getSupportResponse(userMessage: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are MalumeScholarTrack AI Support. Help parents and drivers with: booking trips, driver hiring, payment issues, tracking children, emergency assistance. Be helpful, concise, and friendly. If you cannot help, suggest contacting human support.',
      },
      {
        role: 'user',
        content: userMessage,
      },
    ];

    return this.chat(messages);
  },
};

export default aiService;
