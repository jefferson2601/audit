const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';

// Função para buscar o código fonte do contrato
async function getContractSourceCode(address) {
    try {
        const response = await fetch(`${ETHERSCAN_API_URL}?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_API_KEY}`);
        const data = await response.json();
        
        if (data.status === '1' && data.result && data.result[0]) {
            return data.result[0].SourceCode;
        }
        throw new Error('Não foi possível obter o código fonte do contrato');
    } catch (error) {
        console.error('Erro ao buscar código fonte:', error);
        throw error;
    }
}

// Função para analisar vulnerabilidades
function analyzeVulnerabilities(sourceCode) {
    const vulnerabilities = [];

    // Verificar Reentrancy
    if (sourceCode.includes('call.value') || sourceCode.includes('send(')) {
        const reentrancyPattern = /call\.value\([^)]*\)\s*\(\s*["']\s*["']\s*\)/g;
        if (reentrancyPattern.test(sourceCode)) {
            vulnerabilities.push({
                name: 'Reentrancy',
                severity: 'high',
                description: 'Possível vulnerabilidade de reentrância detectada',
                impact: 'Risco de drenagem de fundos do contrato',
                recommendation: 'Implementar o padrão checks-effects-interactions ou usar ReentrancyGuard'
            });
        }
    }

    // Verificar Access Control
    const accessControlPattern = /function\s+\w+\s*\([^)]*\)\s*(?:public|external)/g;
    const matches = sourceCode.match(accessControlPattern);
    if (matches) {
        const criticalFunctions = matches.filter(func => 
            func.includes('withdraw') || 
            func.includes('transfer') || 
            func.includes('mint') || 
            func.includes('burn')
        );
        
        if (criticalFunctions.length > 0) {
            vulnerabilities.push({
                name: 'Access Control',
                severity: 'high',
                description: 'Funções críticas sem controle de acesso adequado',
                impact: 'Risco de execução não autorizada de funções críticas',
                recommendation: 'Implementar modifiers de controle de acesso'
            });
        }
    }

    // Verificar Integer Overflow/Underflow
    if (sourceCode.includes('SafeMath') === false && 
        (sourceCode.includes('+') || sourceCode.includes('-') || sourceCode.includes('*'))) {
        vulnerabilities.push({
            name: 'Integer Overflow/Underflow',
            severity: 'medium',
            description: 'Possível vulnerabilidade de overflow/underflow',
            impact: 'Risco de manipulação de valores numéricos',
            recommendation: 'Usar SafeMath ou Solidity >= 0.8.0'
        });
    }

    // Verificar Front-Running
    if (sourceCode.includes('block.timestamp') || sourceCode.includes('now')) {
        vulnerabilities.push({
            name: 'Front-Running',
            severity: 'medium',
            description: 'Possível vulnerabilidade a front-running',
            impact: 'Risco de manipulação de preços e operações',
            recommendation: 'Implementar mecanismo commit-reveal'
        });
    }

    // Verificar Timestamp Dependence
    if (sourceCode.includes('block.timestamp') || sourceCode.includes('now')) {
        const timestampPattern = /block\.timestamp\s*[<>=]\s*[^;]+/g;
        if (timestampPattern.test(sourceCode)) {
            vulnerabilities.push({
                name: 'Timestamp Dependence',
                severity: 'medium',
                description: 'Dependência de timestamp detectada',
                impact: 'Risco de manipulação de resultados',
                recommendation: 'Evitar uso de block.timestamp para operações críticas'
            });
        }
    }

    return vulnerabilities;
}

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
        const { address } = JSON.parse(event.body);

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

        // Buscar código fonte do contrato
        const sourceCode = await getContractSourceCode(address);

        // Analisar vulnerabilidades
        const vulnerabilities = analyzeVulnerabilities(sourceCode);

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