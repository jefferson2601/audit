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

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';

async function getContractSourceCode(address) {
    try {
        const response = await fetch(`${ETHERSCAN_API_URL}?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_API_KEY}`);
        const data = await response.json();
        
        if (data.status === '1' && data.result && data.result[0]) {
            return {
                sourceCode: data.result[0].SourceCode,
                compilerVersion: data.result[0].CompilerVersion,
                optimizationUsed: data.result[0].OptimizationUsed,
                runs: data.result[0].Runs,
                constructorArguments: data.result[0].ConstructorArguments,
                contractName: data.result[0].ContractName,
                proxy: data.result[0].Proxy === '1',
                implementation: data.result[0].Implementation,
                library: data.result[0].Library,
                licenseType: data.result[0].LicenseType,
                timestamp: data.result[0].TimeStamp
            };
        }
        throw new Error('Não foi possível obter o código fonte do contrato');
    } catch (error) {
        console.error('Erro ao buscar código fonte:', error);
        throw error;
    }
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
                    error: 'Endereço do contrato é obrigatório'
                })
            };
        }

        // Buscar código fonte real do contrato
        const contractDetails = await getContractSourceCode(address);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(contractDetails)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Erro ao buscar detalhes do contrato'
            })
        };
    }
}; 