const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Credentials': true
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    try {
        const { address } = JSON.parse(event.body);

        if (!address) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Endereço do contrato não fornecido' })
            };
        }

        if (!process.env.ETHERSCAN_API_KEY) {
            throw new Error('ETHERSCAN_API_KEY não configurada');
        }

        const API_KEY = process.env.ETHERSCAN_API_KEY;
        const BASE_URL = 'https://api.etherscan.io/api';

        // Buscar código-fonte verificado
        const sourceUrl = `${BASE_URL}?module=contract&action=getsourcecode&address=${address}&apikey=${API_KEY}`;
        const response = await fetch(sourceUrl);
        const data = await response.json();

        if (data.status !== '1' || !data.result || !data.result[0]) {
            throw new Error('Não foi possível obter o código-fonte do contrato');
        }

        const contractInfo = data.result[0];
        const isVerified = contractInfo.SourceCode && contractInfo.SourceCode !== '';

        let sourceCode = '';
        let constructorArguments = '';
        let optimization = false;
        let optimizationRuns = '';
        let evmVersion = '';
        let libraries = {};

        if (isVerified) {
            // Tratar diferentes formatos de código-fonte
            if (contractInfo.SourceCode.startsWith('{')) {
                try {
                    // Código em formato JSON
                    const sourceObject = JSON.parse(contractInfo.SourceCode);
                    if (sourceObject.sources) {
                        // Múltiplos arquivos
                        sourceCode = Object.entries(sourceObject.sources)
                            .map(([file, content]) => `// File: ${file}\n${content.content}`)
                            .join('\n\n');
                    } else {
                        sourceCode = sourceObject.content || contractInfo.SourceCode;
                    }
                } catch (e) {
                    sourceCode = contractInfo.SourceCode;
                }
            } else {
                sourceCode = contractInfo.SourceCode;
            }

            constructorArguments = contractInfo.ConstructorArguments || '';
            optimization = contractInfo.OptimizationUsed === '1';
            optimizationRuns = contractInfo.Runs || '';
            evmVersion = contractInfo.EVMVersion || 'default';
            
            try {
                libraries = JSON.parse(contractInfo.Library || '{}');
            } catch (e) {
                libraries = {};
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                isVerified,
                sourceCode,
                contractName: contractInfo.ContractName,
                compilerVersion: contractInfo.CompilerVersion,
                optimization,
                optimizationRuns,
                evmVersion,
                constructorArguments,
                libraries,
                implementation: contractInfo.Implementation || null, // Para contratos proxy
                proxy: contractInfo.Proxy || '0'
            })
        };
    } catch (error) {
        console.error('Erro:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Erro ao buscar código-fonte do contrato',
                details: error.message 
            })
        };
    }
}; 