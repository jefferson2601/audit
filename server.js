const express = require('express');
const cors = require('cors');
const app = express();

// Configuração do CORS para permitir todas as origens (temporário para debug)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Simulação de dados de contratos
const contractDatabase = {
    '0xdac17f958d2ee523a2206206994597c13d831ec7': {
        name: 'Tether USD',
        compilerVersion: '0.4.17',
        network: 'Ethereum Mainnet',
        creationDate: '2017-11-26',
        balance: '0.5',
        transactionCount: '1234567'
    },
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': {
        name: 'Wrapped BTC',
        compilerVersion: '0.4.18',
        network: 'Ethereum Mainnet',
        creationDate: '2018-01-10',
        balance: '0.1',
        transactionCount: '987654'
    }
};

// Simulação de análise de vulnerabilidades
function analyzeContract(sourceCode) {
    console.log('Iniciando análise do contrato...');
    // Simula um delay de processamento
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Análise concluída, gerando resultados...');
            const vulnerabilities = [
                {
                    name: "Reentrancy",
                    severity: "high",
                    description: "Possível vulnerabilidade de reentrada no contrato",
                    impact: "Um atacante pode drenar fundos do contrato",
                    recommendation: "Implementar o padrão checks-effects-interactions"
                },
                {
                    name: "Unchecked External Call",
                    severity: "medium",
                    description: "Chamada externa sem verificação de retorno",
                    impact: "A chamada pode falhar silenciosamente",
                    recommendation: "Verificar o retorno da chamada externa"
                }
            ];
            resolve(vulnerabilities);
        }, 2000);
    });
}

// Endpoint para análise de contrato
app.post('/analyze', async (req, res) => {
    console.log('Recebida requisição de análise');
    const { sourceCode } = req.body;

    try {
        console.log('Iniciando análise...');
        console.log('Iniciando análise do contrato...');

        // Simular análise
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Gerar resultados simulados
        const vulnerabilities = [
            {
                name: 'Access Control',
                severity: 'high',
                description: 'Funções críticas sem controle de acesso adequado',
                impact: 'Possível execução não autorizada de funções',
                recommendation: 'Implementar modifiers de controle de acesso'
            },
            {
                name: 'Front-Running',
                severity: 'medium',
                description: 'Possível vulnerabilidade a front-running',
                impact: 'Manipulação de preços e operações',
                recommendation: 'Implementar mecanismo commit-reveal'
            }
        ];

        console.log('Análise concluída, gerando resultados...');
        console.log('Análise concluída com sucesso');

        res.json({
            success: true,
            vulnerabilities
        });
    } catch (error) {
        console.error('Erro na análise:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao analisar contrato'
        });
    }
});

// Endpoint para detalhes do contrato
app.post('/contract-details', async (req, res) => {
    console.log('Recebida requisição de detalhes do contrato');
    console.log('Body da requisição:', req.body);
    
    const { address } = req.body;
    
    if (!address) {
        console.log('Endereço não fornecido');
        return res.status(400).json({
            error: 'Endereço do contrato é obrigatório'
        });
    }
    
    try {
        // Simular busca de detalhes
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Retornar dados simulados ou dados do banco de dados
        const details = contractDatabase[address.toLowerCase()] || {
            name: 'Contrato Desconhecido',
            compilerVersion: 'Desconhecida',
            network: 'Desconhecida',
            creationDate: 'Desconhecida',
            balance: '0',
            transactionCount: '0'
        };

        console.log('Detalhes do contrato:', details);
        res.json(details);
    } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
        res.status(500).json({
            error: 'Erro ao buscar detalhes do contrato'
        });
    }
});

// Rota de teste
app.get('/test', (req, res) => {
    res.json({ message: 'Servidor está funcionando!' });
});

// Rota raiz
app.get('/', (req, res) => {
    console.log('Rota raiz acessada');
    res.json({ 
        status: 'online',
        message: 'Servidor está funcionando!',
        endpoints: {
            test: '/test',
            analyze: '/analyze',
            contractDetails: '/contract-details'
        }
    });
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor' 
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('Use Ctrl+C para encerrar o servidor');
}); 