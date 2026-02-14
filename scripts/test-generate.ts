
import dotenv from 'dotenv';
import { GeminiTextProvider } from '../src/services/ai/providers/GeminiTextProvider';
import type { TextGenerationParams } from '../src/services/ai/types';

// Load env vars
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ API Key not found');
    process.exit(1);
}

async function runTest() {
    // Use direct URL for Node.js
    const googleApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const provider = new GeminiTextProvider(apiKey, googleApiUrl);

    const params: TextGenerationParams = {
        productUrl: 'https://www.centersport.com.br/tenis-adidas-ultraboost-light-masculino-ie1768',
        persona: 'Corredor de Performance',
        tone: 'journalistic',
        mode: 'product-first',
        trendContext: 'Moda Esportiva'
    };

    console.log('🚀 Testing generatePost with params:', params);

    try {
        const result = await provider.generatePost(params);
        console.log('✅ Generation Success!');
        console.log('Title:', result.title);
        console.log('Sections:', result.sections.length);
    } catch (error: any) {
        console.error('❌ Generation Failed:', error.message);
        if (error.message.includes('429')) {
            console.log('⚠️ Confirmed Rate Limit (429)');
        }
    }
}

runTest();
