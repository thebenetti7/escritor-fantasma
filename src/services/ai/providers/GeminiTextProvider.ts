import type { ITextGenerator, AiProvider, TextGenerationParams, GeneratedContent, AnalysisResult } from '../types';

export class GeminiTextProvider implements ITextGenerator {
    providerName: AiProvider = 'google';
    private apiKey: string;
    private apiUrl: string;
    private analysisCache = new Map<string, AnalysisResult>();
    private trendsCache = new Map<string, string[]>();

    constructor(apiKey: string, baseUrl: string = '/api/gemini/v1beta/models/gemini-2.0-flash:generateContent') {
        this.apiKey = apiKey;
        this.apiUrl = baseUrl;
    }

    async generatePost(params: TextGenerationParams): Promise<GeneratedContent> {
        console.log(`[GeminiTextProvider] Generating post with params:`, params);

        // --- MODO MANUAL (REVISÃO) ---
        if (params.originalText) {
            const systemPrompt = `
                Você é um Editor Sênior e Revisor Gramatical (Copy Desk).
                Sua tarefa é polir, corrigir e melhorar o texto fornecido, mantendo a voz original mas garantindo impacto e correção gramatical.
                
                TEXTO ORIGINAL:
                "${params.originalText}"

                PRODUTO: ${params.productUrl}
                TOM: ${params.tone}

                Retorne o resultado APENAS como JSON válido na estrutura padrão de artigos:
                {
                    "title": "Título Melhorado (H1)",
                    "seoKeywords": ["tags", "do", "texto"],
                    "sections": [ ... separe o texto em seções lógicas com H2 e HTML content ... ]
                }
            `;
            return this.executePrompt(systemPrompt);
        }

        // --- MODO TREND-FIRST ou AUTO-TREND ---
        let trendInstruction = "";
        if (params.trendContext) {
            trendInstruction = `
            🔥 MODO TREND-FIRST ATIVADO:
            O foco deste artigo NÃO é apenas o produto, mas a TREND: "${params.trendContext}".
            
            ESTRUTURA OBRIGATÓRIA:
            1. Abertura (Newsjacking): Comece falando da Trend/Notícia. Prenda a atenção pelo assunto do momento.
            2. Conexão: Só então apresente o Produto como a ferramenta ideal para quem quer entrar nessa trend.
            3. O resto do artigo segue a estrutura padrão, mas sempre voltando à trend.
            `;
        }

        // Updated "Golden Standard" Prompt
        const systemPrompt = `
            ✍️ ESTILO DE ESCRITA:
            Tom e Voz:
            - Conversacional e acessível.
            - Entusiasmado mas autêntico.
            - Culto e antenado.
            - Inclusivo.

            ${trendInstruction}

            Elementos Obrigatórios:
            1. Abertura com gancho cultural/trend.
            2. Storytelling.
            3. Conexões inteligentes.
            4. Dicas práticas.
            5. Referências visuais.

            📝 ESTRUTURA DO ARTIGO (JSON OBRIGATÓRIO):
            Você deve responder APENAS com um objeto JSON válido.
            
            Estrutura do JSON:
            {
                "title": "Um título criativo e chamativo (Newsjacking se aplicável)",
                "seoKeywords": ["keyword1", "keyword2", "keyword3"],
                "sections": [
                    {
                        "heading": "Abertura (H2 implícito)",
                        "content": "<p>Hook cultural/trend forte + Conexão emocional.</p>",
                        "ctaType": null
                    },
                    {
                        "heading": "Contexto Cultural (H2)",
                        "content": "<p>Por que isso é relevante AGORA?</p>",
                        "ctaType": null
                    },
                    {
                        "heading": "O Produto como Solução (H2)",
                        "content": "<p>Detalhes narrativos do produto.</p>",
                        "ctaType": "buy"
                    },
                    {
                        "heading": "Como Usar / Styling (H2)",
                        "content": "<p>Sugestões de combinações.</p>",
                        "ctaType": "category"
                    },
                    {
                        "heading": "Fechamento (H2)",
                        "content": "<p>Call-to-action suave.</p>",
                        "ctaType": "buy"
                    }
                ]
            }

            INPUT:
            PRODUTO: ${params.productUrl || params.topic}
            PERSONA: ${params.persona}
            TOM: ${params.tone}
            ${params.trendContext ? `TREND: ${params.trendContext}` : ''}
        `;

        return this.executePrompt(systemPrompt);
    }

    private async executePrompt(promptText: string): Promise<GeneratedContent> {
        // 🚨 URGENT: Retries disabled to prevent quota drain (User Report: 1 failure cost 12 requests)
        const maxRetries = 0;
        let attempt = 0;
        let delay = 1000;

        while (attempt <= maxRetries) {
            try {
                console.log(`[GeminiTextProvider] Request Start (Attempt ${attempt + 1})`);
                const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }]
                    })
                });

                if (response.status === 429 || response.status === 503) {
                    const isRateLimit = response.status === 429;
                    console.warn(`[GeminiTextProvider] ${isRateLimit ? 'Rate limit (429)' : 'Service overloaded (503)'}. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                    attempt++;
                    continue;
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    // Throw immediately for non-retryable errors
                    throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                const contentString = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!contentString) throw new Error('Gemini API returned empty content');

                const jsonString = contentString.replace(/```json\n?|\n?```/g, '').trim();
                return JSON.parse(jsonString) as GeneratedContent;

            } catch (error: any) {
                // If it's a network error (fetch failed), we might want to retry too? 
                // For now, let's treat unknown errors as fatal unless we want to be very robust.
                // But the loop logic above only retries on explicit 429/503.
                // Re-throwing non-rate-limit errors.
                console.error('[GeminiTextProvider] Generation failed:', error);
                throw error;
            }
        }

        throw new Error('Não foi possível gerar o conteúdo. O serviço do Google Gemini está instável ou atingimos o limite de requisições gratuitas. Tente novamente em 1 minuto.');
    }

    async analyzeProduct(productUrl: string): Promise<AnalysisResult> {
        if (this.analysisCache.has(productUrl)) {
            console.log(`[GeminiTextProvider] Serving cached analysis for: ${productUrl}`);
            return this.analysisCache.get(productUrl)!;
        }

        console.log(`[GeminiTextProvider] Analyzing product: ${productUrl}`);
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
            
            PRODUTO/URL: ${productUrl}
        `;

        try {
            // Direct fetch to keep it isolated from generatePost logic
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`❌ Gemini API Error: ${response.status} ${response.statusText}`);
                return {
                    persona: "Erro de Conexão",
                    reason: `Erro ${response.status}: ${response.statusText}. Aguarde...`
                };
            }
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
            const result = JSON.parse(jsonString) as AnalysisResult;
            this.analysisCache.set(productUrl, result);
            return result;

        } catch (error) {
            return { persona: "Consumidor Padrão", reason: "Análise indisponível." };
        }
    }

    public async getTrends(productUrl: string, persona: string): Promise<string[]> {
        const cacheKey = `${productUrl}-${persona}`;
        if (this.trendsCache.has(cacheKey)) {
            console.log(`[GeminiTextProvider] Serving cached trends for: ${cacheKey}`);
            return this.trendsCache.get(cacheKey)!;
        }

        console.log(`[GeminiTextProvider] Suggesting trends for: ${persona}`);
        const systemPrompt = `
            Atue como um Caçador de Tendências (Trend Hunter) e Jornalista de Moda/Esporte.
            
            CONTEXTO:
            - Produto: ${productUrl}
            - Persona Alvo: ${persona}
    
            MISSÃO:
            Liste 3 tópicos muito em alta agora (Newsjacking), tendências de comportamento ou modas virais que se conectam com essa persona e esse produto.
            Seja específico (ex: "Brazilcore", "Corrida de Rua", "Estética Old Money").
    
            Responda APENAS com um JSON contendo um array de strings:
            ["Trend 1 - Explicação curta", "Trend 2 - Explicação curta", "Trend 3"]
        `;

        try {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
            });

            if (!response.ok) {
                console.error(`❌ Gemini Trends API Error: ${response.status} ${response.statusText}`);
                const errorBody = await response.text();
                console.error(`❌ Trends Error Body: ${errorBody}`);
                return ["Tendências Gerais do Verão", "Dicas de Estilo Casual", "Performance Esportiva"]; // Fallback
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
            const result = JSON.parse(jsonString);
            const trends = Array.isArray(result) ? result : result.trends || [];

            if (trends.length > 0) {
                this.trendsCache.set(cacheKey, trends);
            }
            return trends;

        } catch (error) {
            console.error('Trend suggestion failed:', error);
            return ["Lifestyle Saudável", "Moda Esportiva", "Bem-estar"];
        }
    }
}
