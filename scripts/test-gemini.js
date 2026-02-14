
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tenta ler o .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);
    if (match) {
        apiKey = match[1].trim();
        console.log('✅ Chave encontrada no .env.local');
    } else {
        console.error('❌ Chave VITE_GEMINI_API_KEY não encontrada no .env.local');
        process.exit(1);
    }
} catch (e) {
    console.error('❌ Arquivo .env.local não encontrado');
    process.exit(1);
}

const testGemini = async () => {
    console.log('🔄 Testando conexão com Gemini...');

    // 1. Listar Modelos Dispersíveis
    const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        console.log('🔍 Listando modelos disponíveis...');
        const listResp = await fetch(listModelsUrl);
        const listData = await listResp.json();

        if (!listResp.ok) {
            console.error('❌ Erro ao listar modelos:', JSON.stringify(listData, null, 2));
            return;
        }

        console.log('✅ Modelos encontrados:', listData.models?.map(m => m.name).slice(0, 5) || 'Nenhum');
    } catch (e) {
        console.error('❌ Falha na conexão ao listar modelos:', e.message);
        return;
    }

    // 1. Listar Modelos Dispersíveis (Novamente para ter certeza absoluta)
    const listModelsUrl2 = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        console.log('🔍 Listando modelos disponíveis...');
        const listResp = await fetch(listModelsUrl2);
        const listData = await listResp.json();

        if (!listResp.ok) {
            console.error('❌ Erro ao listar modelos:', JSON.stringify(listData, null, 2));
            return;
        }

        console.log('--- RAW MODELS LIST ---');
        listData.models?.forEach(m => console.log(m.name));
        console.log('-----------------------');

        // Tentar usar o PRIMEIRO que tiver 'generateContent'
        const viableModel = listData.models?.find(m => m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('gemini'));

        if (viableModel) {
            const cleanName = viableModel.name.replace('models/', '');
            console.log(`\n🤖 Tentando modelo encontrado na lista: ${cleanName}`);

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanName}:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Responda apenas com a palavra 'FUNCIONOU'" }] }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ SUCESSO! Conectado com:', cleanName);
                console.log('Resposta:', data.candidates?.[0]?.content?.parts?.[0]?.text);
            } else {
                console.error('❌ Falha mesmo usando nome da lista:', await response.text());
            }

        } else {
            console.error('❌ Nenhum modelo Gemini viável encontrado na lista.');
        }

    } catch (e) {
        console.error('❌ Falha na conexão:', e.message);
    }
};

testGemini();
