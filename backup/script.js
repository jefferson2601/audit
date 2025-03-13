// Elementos do DOM
const contractInput = document.getElementById('contractAddress');
const analyzeButton = document.getElementById('analyzeButton');
const statusMessage = document.getElementById('statusMessage');
const resultsContainer = document.getElementById('resultsContainer');

// Função para validar o endereço do contrato
function isValidContractAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Função para mostrar mensagem de status
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

// Função para criar um card de vulnerabilidade
function createVulnerabilityCard(vulnerability) {
    const card = document.createElement('div');
    card.className = `vulnerability-card ${vulnerability.severity.toLowerCase()}`;
    
    card.innerHTML = `
        <span class="severity ${vulnerability.severity.toLowerCase()}">
            ${vulnerability.severity}
        </span>
        <h3>${vulnerability.name}</h3>
        <p><strong>Descrição:</strong> ${vulnerability.description}</p>
        <p><strong>Impacto:</strong> ${vulnerability.impact}</p>
        <p><strong>Recomendação:</strong> ${vulnerability.recommendation}</p>
    `;
    
    return card;
}

// Função para simular a análise do contrato
async function analyzeContract(address) {
    showStatus('Analisando contrato...', 'loading');
    
    try {
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Dados simulados para teste
        const mockResults = {
            vulnerabilities: [
                {
                    name: 'Reentrancy',
                    description: 'Possível vulnerabilidade de reentrada no contrato',
                    severity: 'HIGH',
                    impact: 'Pode permitir que um atacante drene os fundos do contrato',
                    recommendation: 'Implementar o padrão checks-effects-interactions'
                },
                {
                    name: 'Unchecked External Call',
                    description: 'Chamada externa sem tratamento de erro',
                    severity: 'MEDIUM',
                    impact: 'Pode resultar em falha silenciosa da transação',
                    recommendation: 'Adicionar tratamento de erro adequado'
                }
            ]
        };
        
        // Limpar e exibir resultados
        resultsContainer.innerHTML = '';
        mockResults.vulnerabilities.forEach(vuln => {
            resultsContainer.appendChild(createVulnerabilityCard(vuln));
        });
        
        showStatus('Análise concluída com sucesso!', 'success');
    } catch (error) {
        showStatus('Erro ao analisar contrato: ' + error.message, 'error');
    }
}

// Event Listeners
analyzeButton.addEventListener('click', async () => {
    const address = contractInput.value.trim();
    
    if (!address) {
        showStatus('Por favor, insira um endereço de contrato', 'error');
        return;
    }
    
    if (!isValidContractAddress(address)) {
        showStatus('Endereço de contrato inválido', 'error');
        return;
    }
    
    analyzeButton.disabled = true;
    await analyzeContract(address);
    analyzeButton.disabled = false;
});

// Permitir análise ao pressionar Enter
contractInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        analyzeButton.click();
    }
}); 