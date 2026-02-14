
import fs from 'fs';
import path from 'path';

// Ler a API Key do .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envContent.match(/VITE_OPENAI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey) {
    console.error('❌ Erro: VITE_OPENAI_API_KEY não encontrada no .env.local');
    process.exit(1);
}

const run = async () => {
    const productUrl = 'https://www.centersport.com.br/tenismasculino/tenis-adidas-duramo-rc2-preto-masculino';
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    console.log(`\n🤖 OpenAI: Gerando conteúdo para: ${productUrl}`);

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

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Escreva o artigo sobre: ${productUrl}` }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            console.error(`❌ Erro API: ${response.status} ${response.statusText}`);
            console.error(await response.text());
            return;
        }

        const data = await response.json();
        const text = data.choices[0]?.message?.content;

        console.log('\n✅ GERAÇÃO BEM SUCEDIDA!');
        console.log('--- RESPOSTA DA IA (Início) ---');
        console.log(text.substring(0, 500) + '...');
        console.log('--- RESPOSTA DA IA (Fim) ---');

    } catch (e) {
        console.error('❌ Erro de execução:', e);
    }
};

run();
