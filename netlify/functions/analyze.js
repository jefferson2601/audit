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
            func.includes('burn') ||
            func.includes('pause') ||
            func.includes('unpause') ||
            func.includes('upgrade')
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

    // Verificar Unchecked External Calls
    const uncheckedCallPattern = /\.call\.value\([^)]*\)\s*\(\s*["']\s*["']\s*\)/g;
    if (uncheckedCallPattern.test(sourceCode)) {
        vulnerabilities.push({
            name: 'Unchecked External Call',
            severity: 'high',
            description: 'Chamadas externas sem verificação de retorno',
            impact: 'Risco de falha silenciosa de operações críticas',
            recommendation: 'Verificar o retorno de chamadas externas e implementar mecanismos de fallback'
        });
    }

    // Verificar Delegatecall Injection
    if (sourceCode.includes('delegatecall')) {
        vulnerabilities.push({
            name: 'Delegatecall Injection',
            severity: 'high',
            description: 'Uso de delegatecall detectado',
            impact: 'Risco de execução de código malicioso',
            recommendation: 'Evitar uso de delegatecall ou implementar controles rigorosos'
        });
    }

    // Verificar Denial of Service
    const loopPattern = /for\s*\([^)]*\)\s*{[\s\S]*?}/g;
    if (loopPattern.test(sourceCode)) {
        vulnerabilities.push({
            name: 'Denial of Service',
            severity: 'medium',
            description: 'Possível vulnerabilidade de negação de serviço',
            impact: 'Risco de bloqueio de operações devido a loops infinitos ou gas insuficiente',
            recommendation: 'Implementar limites de iteração e mecanismos de pagamento de gas'
        });
    }

    // Verificar Random Number Generation
    if (sourceCode.includes('blockhash') || sourceCode.includes('keccak256')) {
        const randomPattern = /keccak256\([^)]*\)/g;
        if (randomPattern.test(sourceCode)) {
            vulnerabilities.push({
                name: 'Weak Random Number Generation',
                severity: 'medium',
                description: 'Possível geração fraca de números aleatórios',
                impact: 'Risco de previsibilidade de valores aleatórios',
                recommendation: 'Usar VRF (Verifiable Random Function) ou oráculos externos'
            });
        }
    }

    // Verificar Gas Limit Issues
    if (sourceCode.includes('transfer(') || sourceCode.includes('send(')) {
        vulnerabilities.push({
            name: 'Gas Limit Issues',
            severity: 'medium',
            description: 'Possíveis problemas com limite de gas',
            impact: 'Risco de falha em transferências de ETH',
            recommendation: 'Usar call em vez de transfer/send ou implementar mecanismos de retry'
        });
    }

    // Verificar Signature Replay
    if (sourceCode.includes('ecrecover')) {
        vulnerabilities.push({
            name: 'Signature Replay',
            severity: 'high',
            description: 'Possível vulnerabilidade de replay de assinatura',
            impact: 'Risco de reutilização de assinaturas',
            recommendation: 'Implementar nonce ou timestamp nas assinaturas'
        });
    }

    // Verificar Unprotected Initialization
    if (sourceCode.includes('initialize(') || sourceCode.includes('init(')) {
        const initPattern = /function\s+initialize\s*\([^)]*\)\s*(?:public|external)/g;
        if (initPattern.test(sourceCode)) {
            vulnerabilities.push({
                name: 'Unprotected Initialization',
                severity: 'high',
                description: 'Função de inicialização sem proteção',
                impact: 'Risco de reinicialização do contrato',
                recommendation: 'Implementar controle de acesso e verificações de estado'
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