import type { ITextGenerator, AiProvider, TextGenerationParams, GeneratedContent, AnalysisResult } from '../types';

export class OpenAiTextProvider implements ITextGenerator {
    providerName: AiProvider = 'openai';
    private apiKey: string;
    private apiUrl = '/api/openai/v1/chat/completions';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generatePost(params: TextGenerationParams): Promise<GeneratedContent> {
        console.log(`[OpenAiTextProvider] Generating post with params:`, params);

        const systemPrompt = `
            Você é um redator profissional especialista em SEO e Marketing de Conteúdo (Copywriting).
            Sua tarefa é escrever um artigo de blog completo sobre um produto, baseado na URL ou Tópico fornecido.
            
            DETALHES DO PEDIDO:
            - **Produto/Tópico**: ${params.productUrl || params.topic}
            - **Persona Alvo**: ${params.persona || 'Público Geral'}
            - **Tom de Voz**: ${params.tone}
            
            REGRAS DE FORMATAÇÃO (JSON OBRIGATÓRIO):
            Você deve responder APENAS com um objeto JSON válido seguindo a estrutura exata abaixo. Não inclua markdown (como \`\`\`json) ao redor. Apenas o JSON puro.
            
            Estrutura do JSON:
            {
                "title": "Um título chamativo e otimizado para SEO (H1)",
                "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
                "sections": [
                    {
                        "heading": "Subtítulo da Seção 1 (H2)",
                        "content": "<p>Parágrafos do conteúdo em HTML. Use <strong>negrito</strong> para ênfase.</p>",
                         "ctaType": null
                    },
                    {
                         "heading": "Subtítulo de uma seção de Benefícios",
                         "content": "<ul><li>Benefício 1</li><li>Benefício 2</li></ul>",
                         "ctaType": "buy"
                    },
                    ... (crie pelo menos 4 seções no total)
                ]
            }

            REGRAS DE CONTEÚDO:
            1. Use tags HTML simples (<p>, <ul>, <li>, <strong>) para o campo 'content'.
            2. O texto deve ser engajador, persuasivo e adequado ao tom de voz escolhido.
            3. Inclua pelo menos uma seção com 'ctaType': 'buy' e outra com 'ctaType': 'category'.
        `;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', // Ou gpt-3.5-turbo se preferir custo menor
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `Escreva o artigo sobre: ${params.productUrl || params.topic}` }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[OpenAiTextProvider] API Error:', errorData);
                throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const contentString = data.choices[0]?.message?.content;

            if (!contentString) {
                throw new Error('OpenAI returned empty content');
            }

            // Tentativa de limpar markdown se a IA colocar (apesar do prompt pedir para não)
            const jsonString = contentString.replace(/```json\n?|\n?```/g, '').trim();

            const parsedContent = JSON.parse(jsonString) as GeneratedContent;
            return parsedContent;

        } catch (error) {
            console.error('[OpenAiTextProvider] Generation failed:', error);
            throw error;
        }
    }
    async analyzeProduct(productUrl: string): Promise<AnalysisResult> {
        console.log(`[OpenAiTextProvider] Analyzing product: ${productUrl}`);

        const systemPrompt = `
            Você é um estrategista de marketing digital experiente.
            Analise o produto (URL ou Nome) fornecido e identifique:
            1. A Persona Principal (quem compra esse produto?).
            2. Uma justificativa breve baseada em benefícios.

            Responda APENAS com um JSON neste formato:
            {
                "persona": "Nome da Persona",
                "reason": "Justificativa curta"
            }
        `;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `PRODUTO/URL: ${productUrl}` }
                    ],
                    temperature: 0.5
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI Analysis Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const contentString = data.choices[0]?.message?.content;
            if (!contentString) throw new Error('OpenAI returned empty content');

            const jsonString = contentString.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(jsonString) as AnalysisResult;

        } catch (error) {
            console.error('[OpenAiTextProvider] Analysis failed:', error);
            return {
                persona: "Consumidor Geral",
                reason: "Erro na análise da IA."
            };
        }
    }
    public async getTrends(productUrl: string, persona: string): Promise<string[]> {
        console.log(`[OpenAiTextProvider] Suggesting trends for: ${persona}`);
        const systemPrompt = `
            Atue como um Caçador de Tendências (Trend Hunter).
            CONTEXTO: Produto: ${productUrl}, Persona: ${persona}
            MISSÃO: Liste 3 tópicos muito em alta agora que se conectam com essa persona.
            Responda APENAS com um JSON contendo um array de strings: ["Trend 1", "Trend 2", "Trend 3"]
        `;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: "system", content: systemPrompt }],
                    temperature: 0.7
                })
            });

            if (!response.ok) return ["Erro ao buscar trends OpenAI"];

            const data = await response.json();
            const contentString = data.choices[0]?.message?.content;
            const jsonString = contentString.replace(/```json\n?|\n?```/g, '').trim();
            const result = JSON.parse(jsonString);
            return Array.isArray(result) ? result : [];

        } catch (error) {
            console.error('[OpenAiTextProvider] Trend suggestion failed:', error);
            return [];
        }
    }
}
