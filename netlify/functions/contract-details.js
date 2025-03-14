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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(details)
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