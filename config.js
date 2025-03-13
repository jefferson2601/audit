// Carregar variáveis de ambiente
const env = {
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY || 'YOUR_API_KEY'
};

// Exportar configurações
window.APP_CONFIG = env; 