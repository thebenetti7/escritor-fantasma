export type AiProvider = 'openai' | 'anthropic' | 'google' | 'mock';
export type ImageProvider = 'midjourney' | 'dalle' | 'nano-banana' | 'mock';

export type ToneOfVoice = 'serious' | 'journalistic' | 'humorous' | 'technical';

export interface TextGenerationParams {
    productUrl?: string;
    topic?: string;
    persona?: string;
    tone: ToneOfVoice;
    trendContext?: string; // Para Modo Trend-First
    originalText?: string; // Para Modo Manual
}

export interface GeneratedContent {
    title: string;
    sections: {
        heading: string;
        content: string; // HTML or Markdown
        ctaType?: 'buy' | 'category'; // For injecting CTAs
    }[];
    seoKeywords: string[];
}

export interface ImageGenerationParams {
    originalImageUrl: string;
    promptModifier: string; // e.g. "on a marble table", "lifestyle shot"
    style: 'photorealistic' | '3d-render' | 'cartoon';
}

export interface GeneratedImage {
    url: string;
    variantId: string;
}

export interface AnalysisResult {
    persona: string;
    reason: string;
}

export interface ITextGenerator {
    providerName: AiProvider;
    generatePost(params: TextGenerationParams): Promise<GeneratedContent>;
    analyzeProduct(productUrl: string): Promise<AnalysisResult>;
    // getTrends removed to fix build error
}

export interface IImageGenerator {
    providerName: ImageProvider;
    generateVariations(params: ImageGenerationParams): Promise<GeneratedImage[]>;
}
