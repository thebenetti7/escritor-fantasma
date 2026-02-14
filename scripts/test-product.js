
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

// Ler a API Key do .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey) {
    console.error('❌ Erro: VITE_GEMINI_API_KEY não encontrada no .env.local');
    process.exit(1);
}

const run = async () => {
    const productUrl = 'https://www.centersport.com.br/tenismasculino/tenis-adidas-duramo-rc2-preto-masculino';
    const modelName = 'gemini-2.0-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`\n🤖 Gerando conteúdo para: ${productUrl}`);
    console.log(`Using Model: ${modelName}`);

    const systemPrompt = `
        Você é um redator profissional especialista em SEO e Marketing de Conteúdo (Copywriting).
        Sua tarefa é escrever um artigo de blog completo sobre um produto, baseado na URL ou Tópico fornecido.
        
        DETALHES DO PEDIDO:
        - **Produto/Tópico**: ${productUrl}
        - **Persona Alvo**: Corredores Iniciantes
        - **Tom de Voz**: Entusiasta
        
        REGRAS DE FORMATAÇÃO (JSON OBRIGATÓRIO):
        Você deve responder APENAS com um objeto JSON válido seguindo a estrutura exata abaixo. Não inclua markdown (como \`\`\`json) ao redor. Apenas o JSON puro.
        
        Estrutura do JSON:
        {
            "title": "Um título chamativo e otimizado para SEO (H1)",
            "seoKeywords": ["keyword1", "keyword2", "keyword3"],
            "sections": [
                {
                    "heading": "Subtítulo (H2)",
                    "content": "<p>Conteúdo HTML.</p>",
                    "ctaType": null
                }
            ]
        }
    `;

    const maxRetries = 5;
    let attempt = 0;
    let delay = 2000;

    while (attempt <= maxRetries) {
        try {
            console.log(`\nTentativa ${attempt + 1}/${maxRetries + 1}...`);
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: systemPrompt + `\n\nEscreva o artigo sobre: ${productUrl}`
                        }]
                    }]
                })
            });

            if (response.status === 429) {
                console.warn(`⚠️ Rate Limit (429). Esperando ${delay / 1000}s...`);
                await new Promise(r => setTimeout(r, delay));
                delay *= 2;
                attempt++;
                continue;
            }

            if (!response.ok) {
                console.error(`❌ Erro API: ${response.status} ${response.statusText}`);
                console.error(await response.text());
                return;
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            console.log('\n✅ GERAÇÃO BEM SUCEDIDA!');
            console.log('--- RESPOSTA DA IA (Início) ---');
            console.log(text.substring(0, 500) + '...');
            console.log('--- RESPOSTA DA IA (Fim) ---');
            return;

        } catch (e) {
            console.error('❌ Erro de execução:', e);
            attempt++;
        }
    }
    console.error('❌ Falha após várias tentativas.');
};

run();
