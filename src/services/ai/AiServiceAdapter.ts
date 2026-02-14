import type { ITextGenerator, IImageGenerator, TextGenerationParams, ImageGenerationParams, GeneratedContent, GeneratedImage } from './types';
import { MockTextProvider } from './providers/MockTextProvider';
import { MockImageProvider } from './providers/MockImageProvider';
import { OpenAiTextProvider } from './providers/OpenAiTextProvider';
import { GeminiTextProvider } from './providers/GeminiTextProvider';

class AiServiceAdapter {
    private textProvider: ITextGenerator;
    private imageProvider: IImageGenerator;

    constructor() {
        const openAiKey = import.meta.env.VITE_OPENAI_API_KEY;
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

        console.log('[AiService] Initializing...');
        console.log('[AiService] OpenAi Key present:', !!openAiKey);
        console.log('[AiService] Gemini Key present:', !!geminiKey);

        if (geminiKey) {
            console.log('[AiService] Selected Provider: Gemini');

            // Reverted to simple proxy path. 
            // Local: Handled by vite.config.ts
            // Prod: Handled by vercel.json rewrites
            const baseUrl = '/api/gemini/v1beta/models/gemini-2.0-flash:generateContent';

            this.textProvider = new GeminiTextProvider(geminiKey, baseUrl);
        } else if (openAiKey) {
            console.log('[AiService] Selected Provider: OpenAI');
            this.textProvider = new OpenAiTextProvider(openAiKey);
        } else {
            console.log('[AiService] Selected Provider: Mock (No keys found)');
            this.textProvider = new MockTextProvider();
        }

        this.imageProvider = new MockImageProvider();
    }

    public getProviderName(): string {
        return this.textProvider.providerName;
    }

    // Allow runtime switching of providers
    public setTextProvider(provider: ITextGenerator) {
        this.textProvider = provider;
    }

    public setImageProvider(provider: IImageGenerator) {
        this.imageProvider = provider;
    }

    public async generateText(params: TextGenerationParams): Promise<GeneratedContent> {
        return this.textProvider.generatePost(params);
    }

    public async analyzeProduct(productUrl: string): Promise<{ persona: string; reason: string }> {
        return this.textProvider.analyzeProduct(productUrl);
    }

    public async getTrends(productUrl: string, persona: string): Promise<string[]> {
        const provider = this.textProvider as any;
        if (typeof provider.getTrends === 'function') {
            return provider.getTrends(productUrl, persona);
        }
        return [];
    }

    public async generateImages(params: ImageGenerationParams): Promise<GeneratedImage[]> {
        return this.imageProvider.generateVariations(params);
    }
}

// Export a singleton instance
export const aiService = new AiServiceAdapter();
