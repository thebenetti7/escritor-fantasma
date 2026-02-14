import type { IImageGenerator, ImageProvider, ImageGenerationParams, GeneratedImage } from '../types';

export class MockImageProvider implements IImageGenerator {
    providerName: ImageProvider = 'mock';

    async generateVariations(params: ImageGenerationParams): Promise<GeneratedImage[]> {
        console.log(`[MockImageProvider] Generating variations for style: ${params.style}`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Return 4 placeholder images
        return Array.from({ length: 4 }).map((_, i) => ({
            variantId: `var-${Date.now()}-${i}`,
            url: `https://placehold.co/600x400/0f172a/00e676?text=Variation+${i + 1}+${params.style}`
        }));
    }
}
