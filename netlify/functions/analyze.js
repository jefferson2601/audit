exports.handler = async function(event, context) {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Responder a requisições OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers
        };
    }

    try {
        const { address, sourceCode } = JSON.parse(event.body);

        if (!address) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Endereço do contrato é obrigatório'
                })
            };
        }

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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                vulnerabilities
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Erro ao analisar contrato'
            })
        };
    }
}; 