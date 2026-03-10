
import { GoogleGenAI, LiveServerMessage, Modality, GenerateContentResponse } from '@google/genai';
import { GENERATE_ASSET_TOOL, GENERATE_VIDEO_TOOL, INITIATE_TRANSFER_TOOL, GET_BALANCES_TOOL } from './tools';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';

/**
 * PRODUCTION NOTE:
 * In a production environment (hostname !== 'localhost'), this service 
 * connects to a backend proxy via WebSockets to protect the API_KEY.
 */

export class GeminiService {
  private ai: any;
  private session: any;
  private apiKey: string | null = null;

  constructor() {
    // In AI Studio, process.env.GEMINI_API_KEY is automatically injected
    // In VM deployments, VITE_GEMINI_API_KEY might be baked in during build
    this.apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).process?.env?.API_KEY || (window as any).process?.env?.GEMINI_API_KEY || null;
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
      console.log("GeminiService: Initialized with Direct SDK Mode (Key found in environment)");
    }
  }

  private async ensureInitialized() {
    // Always try to get the latest key if we don't have one or if we're in a session
    if (this.ai && this.apiKey) return;
    
    try {
      // Check local environment first (Vite/AI Studio)
      const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).process?.env?.API_KEY || (window as any).process?.env?.GEMINI_API_KEY;
      
      if (envKey) {
        this.apiKey = envKey;
        this.ai = new GoogleGenAI({ apiKey: this.apiKey });
        console.log("GeminiService: Initialized with Environment Key");
        return;
      }

      console.log("GeminiService: Fetching API key from backend...");
      const resp = await fetch('/api/config');
      if (!resp.ok) throw new Error(`Backend config fetch failed: ${resp.statusText}`);
      const config = await resp.json();
      this.apiKey = config.apiKey;
      if (this.apiKey) {
        this.ai = new GoogleGenAI({ apiKey: this.apiKey });
        console.log("GeminiService: Initialized with Backend Key");
      } else {
        console.warn("GeminiService: No API Key found in backend or environment. Image/Video generation will fail.");
      }
    } catch (err) {
      console.error("GeminiService: Failed to initialize API key", err);
    }
  }

  async connect(config: any, callbacks: any) {
    await this.ensureInitialized();
    // Use the latest key for the session
    const currentKey = (window as any).process?.env?.API_KEY || (window as any).process?.env?.GEMINI_API_KEY || this.apiKey;
    if (!currentKey) {
       console.error("GeminiService: Cannot connect session - No API Key available.");
       throw new Error("API Key missing. Please configure GEMINI_API_KEY.");
    }

    this.session = await this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        tools: [{ functionDeclarations: [GENERATE_ASSET_TOOL, GENERATE_VIDEO_TOOL, INITIATE_TRANSFER_TOOL, GET_BALANCES_TOOL] }],
        ...config
      }
    });
    return this.session;
  }

  async generateImage(prompt: string, type?: string): Promise<GenerateContentResponse> {
    await this.ensureInitialized();
    // Re-read key from environment to catch updates from "Select Key" dialog
    const currentKey = (window as any).process?.env?.API_KEY || (window as any).process?.env?.GEMINI_API_KEY || this.apiKey;
    
    console.log("[GeminiService] Generating image. Key available:", !!currentKey);
    
    if (!currentKey) {
      throw new Error("API Key not available for image generation. Please ensure GEMINI_API_KEY is set in your environment.");
    }
    
    const ai = new GoogleGenAI({ apiKey: currentKey });
    const fullPrompt = type ? `Asset Type: ${type}\n\nDescription: ${prompt}` : prompt;
    
    try {
      // Using gemini-3.1-flash-image-preview for better reliability and quality on VM deployments
      return await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts: [{ text: fullPrompt }] }
      });
    } catch (err: any) {
      console.error("[GeminiService] Image generation failed:", err);
      if (err.message?.includes("429")) {
        throw new Error("Rate limit exceeded (429). Please wait a moment before generating another asset, or check your Google Cloud quota.");
      }
      if (err.message?.includes("403") || err.message?.includes("permission")) {
        throw new Error("Image generation failed (403). Please ensure the 'Generative AI API' is enabled in your Google Cloud project and billing is active.");
      }
      throw err;
    }
  }

  async generateVideo(
    prompt: string, 
    aspectRatio: '16:9' | '9:16' = '16:9', 
    onProgress?: (status: string) => void
  ): Promise<string | null> {
    await this.ensureInitialized();
    // Re-read key from environment to catch updates from "Select Key" dialog
    const currentKey = (window as any).process?.env?.API_KEY || (window as any).process?.env?.GEMINI_API_KEY || this.apiKey;
    if (!currentKey) throw new Error("API Key not available for video generation");

    const ai = new GoogleGenAI({ apiKey: currentKey });
    onProgress?.("Authenticating request...");
    
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio }
      });

      onProgress?.("Synthesizing cinematic visualization...");
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        onProgress?.("Refining temporal frames...");
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      return downloadLink ? `${downloadLink}&key=${currentKey}` : null;
    } catch (err: any) {
      console.error("[GeminiService] Video generation failed:", err);
      if (err.message?.includes("429")) {
        throw new Error("Rate limit exceeded (429). Please wait a moment before generating another video, or check your Google Cloud quota.");
      }
      throw err;
    }
  }

  sendRealtimeInput(input: any) {
    if (this.session) {
      this.session.sendRealtimeInput(input);
    }
  }

  sendToolResponse(response: any) {
    if (this.session) {
      this.session.sendToolResponse(response);
    }
  }

  close() {
    if (this.session) {
      this.session.close();
    }
  }
}
