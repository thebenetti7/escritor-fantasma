import type { ITextGenerator, AiProvider, TextGenerationParams, GeneratedContent, AnalysisResult } from '../types';

export class MockTextProvider implements ITextGenerator {
    providerName: AiProvider = 'mock';

    async generatePost(params: TextGenerationParams): Promise<GeneratedContent> {
        console.log(`[MockTextProvider] Generating post for topic: ${params.topic} with tone: ${params.tone}`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
            title: `Por que ${params.topic || 'Este Produto'} é a Revolução Que Você Esperava`,
            seoKeywords: ['esporte', 'performance', 'tecnologia', params.topic || 'produto'].filter(Boolean),
            sections: [
                {
                    heading: 'Abertura',
                    content: `<p>Você já se imaginou cruzando a linha de chegada com a mesma energia de quem acabou de começar? É exatamente essa a promessa do <strong>${params.topic || 'Adidas Duramo RC2'}</strong>. Assim como na série <em>The Last Dance</em>, onde cada detalhe conta para a vitória, a escolha do tênis certo pode ser o plot twist da sua jornada como corredor.</p>`
                },
                {
                    heading: 'Contexto Cultural & Lifestyle',
                    content: `<p>Vivemos o boom da "estética atlética". Não é mais apenas sobre correr, é sobre o lifestyle. O ${params.topic || 'Duramo RC2'} não é só uma ferramenta de treino; é um passaporte para essa comunidade que valoriza saúde e estilo em igual medida.</p>`
                },
                {
                    heading: 'O Produto como Protagonista',
                    content: `<p>Esqueça os termos técnicos chatos. Imagine pisar em nuvens, mas com propulsão de foguete. O cabedal em mesh respirável não é só "ventilado", é como um ar-condicionado para seus pés nos dias de verão. O amortecimento Lightmotion? É o seu co-piloto garantindo aterrissagens suaves.</p>`,
                    ctaType: 'buy'
                },
                {
                    heading: 'Como Usar (Styling)',
                    content: `<p>Para um look treino impecável: combine com shorts de compressão pretos e uma regata neon (vibe anos 90 voltou com tudo!). Para o pós-treino casual: vai super bem com uma calça jogger cinza e moletom oversized.</p>`,
                    ctaType: 'category'
                },
                {
                    heading: 'Veredito Final',
                    content: `<p>Se você quer elevar seu nível sem quebrar o banco, essa é a pedida. Não seja apenas mais um na multidão.</p>`,
                    ctaType: 'buy'
                }
            ]
        };
    }
    async analyzeProduct(productUrl: string): Promise<AnalysisResult> {
        console.log(`[MockTextProvider] Analyzing product: ${productUrl}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            persona: 'Corredor de Performance (Mock)',
            reason: 'Identificado base na análise simulada de keywords e estrutura do produto.'
        };
    }

    public async getTrends(productUrl: string, persona: string): Promise<string[]> {
        console.log(`[MockTextProvider] Suggesting trends for: ${persona}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return [
            "Estética 'Old Money' Esportiva",
            "Treino Híbrido (Crossfit + Corrida)",
            "Sustentabilidade em Alta Performance"
        ];
    }
}
