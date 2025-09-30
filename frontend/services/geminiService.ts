import { GoogleGenAI, Chat } from "@google/genai";
import type { ChatMessage } from '../types';
import { MessageAuthor } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const systemInstruction = `You are an expert in software architecture and code visualization. Your primary function is to generate Mermaid code for diagrams based on user requests. 
- When a user asks for a diagram (e.g., "flowchart for login", "sequence diagram for API call"), you MUST respond ONLY with the Mermaid code enclosed in a markdown block like this:
\`\`\`mermaid
graph TD
    A[Start] --> B{Is it?};
    B -- Yes --> C[OK];
    C --> D[End];
    B -- No --> E[KO];
    E --> D[End];
\`\`\`
- Do not add any explanation or introductory text outside the markdown block.
- If the user provides Mermaid code, acknowledge it and ask if they need modifications or analysis.
- For general conversation, be a helpful coding assistant.`;

let chat: Chat | null = null;

const getChat = (): Chat => {
  if (!chat) {
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
    });
  }
  return chat;
};

export const streamChatResponse = async (
  history: ChatMessage[],
  newMessage: string
): Promise<AsyncGenerator<string, void, unknown>> => {
  const chatInstance = getChat();
  
  // The SDK currently doesn't support passing full history for `sendMessageStream`. 
  // We manage history in the app and send the latest message. The chat instance maintains context.
  const stream = await chatInstance.sendMessageStream({ message: newMessage });

  async function* generator(): AsyncGenerator<string, void, unknown> {
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  }

  return generator();
};

export const generateClassSpecification = async (className: string): Promise<string> => {
  const prompt = `Generate a detailed functional specification for a class named '${className}'. The specification should include:

1.  **Purpose:** A brief description of the class's responsibility.
2.  **Properties/Attributes:** A list of its main properties and their types/purposes.
3.  **Methods/Functions:** A breakdown of its key methods, including their parameters, return values, and what they do.

Format the output using markdown for clarity and structure. Respond ONLY with the markdown content. Do not include any introductory or concluding sentences like "Here is the specification...".`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating class specification:", error);
    return "Sorry, I encountered an error while generating the specification.";
  }
};
