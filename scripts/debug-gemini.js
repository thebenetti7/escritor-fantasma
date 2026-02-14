
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const apiKey = 'AIzaSyCjT37ugcPE2fSiNX3irL5LBrb2JS84vIw'; // Hardcoded for debugging since we know it from .env.local

const run = async () => {
    console.log('--- START DEBUG ---');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log(`URL: ${url}`);

    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status} ${res.statusText}`);

        const data = await res.json();
        console.log('--- MODELS FOUND ---');
        if (data.models) {
            const geminiModels = data.models.filter(m => m.name.includes('gemini'));
            console.log('--- GEMINI MODELS FOUND ---');
            geminiModels.forEach(m => console.log(m.name));
            if (geminiModels.length === 0) console.log('No Gemini models found');
        } else {
            console.log('No models found in response');
            console.log(JSON.stringify(data, null, 2));
        }
        console.log('--- END MODELS ---');

    } catch (e) {
        console.error('Fetch Error:', e);
    }
    console.log('--- END DEBUG ---');
}

run();
