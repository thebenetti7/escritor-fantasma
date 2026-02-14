
import dotenv from 'dotenv';
import { GeminiTextProvider } from '../src/services/ai/providers/GeminiTextProvider';

// Load env vars
const result = dotenv.config({ path: '.env.local' });

console.log('📂 CWD:', process.cwd());
if (result.error) {
    console.warn('⚠️ Error loading .env.local:', result.error.message);
} else {
    console.log('✅ .env.local loaded');
}

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ API Key not found in process.env');
    console.log('Env keys:', Object.keys(process.env).filter(k => k.startsWith('VITE_')));
    process.exit(1);
}

console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');

import fs from 'fs';

async function runTest() {
    console.log('🔍 Listing available models...');
    try {
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (modelsRes.ok) {
            const data = await modelsRes.json();
            const modelNames = (data.models || []).map((m: any) => m.name.replace('models/', ''));
            console.log('📜 Available Models:', modelNames.join(', '));

            // Prioritize models based on known good ones
            const priorityModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-2.0-flash-exp'];
            const availablePriorityModels = priorityModels.filter(m => modelNames.includes(m));

            if (availablePriorityModels.length > 0) {
                console.log(`✅ Using first available priority model: ${availablePriorityModels[0]}`);
                // Proceed with test... passing this model to loop or directly using it
                // For simplicity, let's redefine 'models' array here to just use the best available ONE
                // But I need to pass it to the loop below.
                // Let's just log it for now and manually update if needed, OR update the loop to try these.
            }
        } else {
            console.error('❌ Failed to list models:', modelsRes.status, modelsRes.statusText);
        }
    } catch (e) {
        console.error('❌ Exception listing models:', e);
    }

    const models = [
        'gemini-2.0-flash'
    ];

    const productUrl = 'https://www.centersport.com.br/tenis-adidas-ultraboost-light-masculino-ie1768';
    let analysisResult;

    for (const model of models) {
        console.log(`\n🔄 Testing Model: ${model}`);
        const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const provider = new GeminiTextProvider(apiKey, googleApiUrl);

        try {
            analysisResult = await provider.analyzeProduct(productUrl);
            if (analysisResult.reason !== "Erro de conexão." && analysisResult.persona !== "ERROR") {
                console.log(`✅ SUCCESS with model: ${model}`);
                console.log('✅ Analysis Result:', analysisResult);

                // If success, save this model preference? (For now just log it)
                break;
            } else {
                console.log(`❌ Failed with model: ${model} (${analysisResult.reason})`);
            }
        } catch (error) {
            console.log(`❌ Failed with model: ${model} (Exception)`);
        }
    }

    console.log('\n--- 🧪 TEST 2: Suggest Trends (Product-First Mode) ---');
    let trendsResult;
    try {
        // The provider for trends will use the last successfully tested model, or the last model in the list if all failed.
        // For a more robust solution, you might want to store the successful provider or model name.
        const lastUsedModel = models[models.length - 1]; // Fallback to last model if no break occurred
        const googleApiUrlForTrends = `https://generativelanguage.googleapis.com/v1beta/models/${lastUsedModel}:generateContent`;
        const providerForTrends = new GeminiTextProvider(apiKey, googleApiUrlForTrends);

        trendsResult = await providerForTrends.suggestTrends(productUrl, 'Corredor de Performance');
        console.log('✅ Suggested Trends:', trendsResult);
    } catch (error: any) {
        console.error('❌ Trend Suggestion Failed:', error);
        trendsResult = { error: error.message || String(error) };
    }

    console.log('📝 Writing results to test_results.json...');
    fs.writeFileSync('test_results.json', JSON.stringify({
        analysis: analysisResult,
        trends: trendsResult
    }, null, 2));
    console.log('✅ Results written.');
}

runTest();
