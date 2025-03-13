// Elementos do DOM
const contractInput = document.getElementById('contractInput');
const analyzeButton = document.getElementById('analyzeButton');
const statusMessage = document.getElementById('statusMessage');
const resultsContainer = document.getElementById('resultsContainer');

// Configuração da API
const API_BASE_URL = 'https://smart-contract-auditor-backend.onrender.com';

// Variáveis para controle de tempo
let startTime;
let timerInterval;

// Base de dados de vulnerabilidades com informações detalhadas
const vulnerabilityDatabase = {
    'Reentrancy': {
        description: 'Uma vulnerabilidade que permite que um contrato malicioso execute chamadas recursivas a funções do contrato alvo, potencialmente drenando seus fundos.',
        impact: 'Perda total de fundos do contrato, manipulação de estado do contrato, execução não autorizada de operações.',
        recommendation: 'Implementar o padrão checks-effects-interactions, usar ReentrancyGuard do OpenZeppelin, ou garantir que todas as chamadas externas sejam feitas após todas as atualizações de estado.',
        technicalDetails: 'A vulnerabilidade ocorre quando um contrato faz uma chamada externa antes de atualizar seu estado interno. Um contrato malicioso pode interceptar essa chamada e executar a mesma função novamente antes que o estado seja atualizado.',
        codeExample: `// Vulnerável
function withdraw() {
    uint amount = balances[msg.sender];
    msg.sender.call.value(amount)("");
    balances[msg.sender] = 0;
}

// Seguro
function withdraw() {
    uint amount = balances[msg.sender];
    balances[msg.sender] = 0;
    msg.sender.call.value(amount)("");
}`,
        references: [
            {
                title: 'OpenZeppelin ReentrancyGuard',
                url: 'https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard'
            },
            {
                title: 'Consensys Smart Contract Best Practices',
                url: 'https://consensys.github.io/smart-contract-best-practices/attacks/reentrancy/'
            }
        ]
    },
    'Unchecked External Call': {
        description: 'Uma vulnerabilidade que ocorre quando o resultado de uma chamada externa não é verificado adequadamente.',
        impact: 'Perda de fundos, execução silenciosa de operações críticas, comportamento inesperado do contrato.',
        recommendation: 'Sempre verificar o retorno de chamadas externas, usar require() para validar resultados, implementar mecanismos de fallback.',
        technicalDetails: 'Chamadas externas podem falhar silenciosamente se não forem verificadas adequadamente. É importante implementar verificações e mecanismos de recuperação.',
        codeExample: `// Vulnerável
function sendFunds(address payable recipient) {
    recipient.send(amount);
}

// Seguro
function sendFunds(address payable recipient) {
    require(recipient.send(amount), "Transfer failed");
}`,
        references: [
            {
                title: 'Solidity Documentation - External Calls',
                url: 'https://docs.soliditylang.org/en/v0.8.0/security-considerations.html#external-calls'
            }
        ]
    },
    'Integer Overflow/Underflow': {
        description: 'Uma vulnerabilidade que ocorre quando operações matemáticas excedem os limites do tipo de dado.',
        impact: 'Manipulação de valores numéricos, comportamento inesperado em cálculos, possíveis exploits financeiros.',
        recommendation: 'Usar SafeMath do OpenZeppelin ou Solidity 0.8.0+, implementar verificações de limites antes das operações.',
        technicalDetails: 'Em versões antigas do Solidity, operações matemáticas não verificavam automaticamente overflow/underflow. Isso pode levar a comportamentos inesperados.',
        codeExample: `// Vulnerável (Solidity < 0.8.0)
uint8 a = 255;
uint8 b = 1;
uint8 c = a + b; // c será 0

// Seguro (Solidity >= 0.8.0)
uint8 a = 255;
uint8 b = 1;
uint8 c = a + b; // Revertido automaticamente`,
        references: [
            {
                title: 'OpenZeppelin SafeMath',
                url: 'https://docs.openzeppelin.com/contracts/4.x/api/utils#SafeMath'
            }
        ]
    },
    'Access Control': {
        description: 'Vulnerabilidades relacionadas a controles de acesso inadequados ou ausentes em funções críticas do contrato.',
        impact: 'Execução não autorizada de funções críticas, manipulação de estado do contrato, roubo de fundos.',
        recommendation: 'Implementar controles de acesso usando modifiers, OpenZeppelin AccessControl, ou verificações de ownership.',
        technicalDetails: 'Controles de acesso inadequados podem permitir que qualquer usuário execute funções que deveriam ser restritas.',
        codeExample: `// Vulnerável
function withdraw() {
    msg.sender.transfer(balance);
}

// Seguro
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}

function withdraw() onlyOwner {
    msg.sender.transfer(balance);
}`,
        references: [
            {
                title: 'OpenZeppelin AccessControl',
                url: 'https://docs.openzeppelin.com/contracts/4.x/api/access'
            }
        ]
    },
    'Front-Running': {
        description: 'Vulnerabilidade que permite que um atacante observe uma transação pendente e execute uma transação similar antes dela.',
        impact: 'Manipulação de preços, execução não autorizada de operações, perda de oportunidades de arbitragem.',
        recommendation: 'Implementar mecanismos de commit-reveal, usar preços de referência externos, ou adicionar delays nas operações críticas.',
        technicalDetails: 'O front-running ocorre quando um atacante monitora o mempool e executa uma transação similar antes da transação alvo.',
        codeExample: `// Vulnerável
function buyTokens() {
    uint price = calculatePrice();
    require(msg.value >= price);
    transferTokens(msg.sender);
}

// Seguro (Commit-Reveal)
mapping(bytes32 => uint) public commitments;

function commit(bytes32 hash) {
    commitments[hash] = block.timestamp;
}

function reveal(uint amount, bytes32 secret) {
    bytes32 hash = keccak256(abi.encodePacked(amount, secret));
    require(commitments[hash] > 0);
    require(block.timestamp > commitments[hash] + 1 days);
    // Processar a transação
}`,
        references: [
            {
                title: 'Consensys Front-Running Attacks',
                url: 'https://consensys.github.io/smart-contract-best-practices/attacks/frontrunning/'
            }
        ]
    },
    'Timestamp Dependence': {
        description: 'Vulnerabilidade que ocorre quando o contrato depende do timestamp do bloco para operações críticas.',
        impact: 'Manipulação de resultados de operações, execução não autorizada de funções, comportamento imprevisível.',
        recommendation: 'Evitar uso de block.timestamp para operações críticas, usar block.number para delays, implementar mecanismos de verificação.',
        technicalDetails: 'Miners podem manipular levemente o timestamp do bloco, tornando-o não confiável para operações críticas.',
        codeExample: `// Vulnerável
function random() public view returns (uint) {
    return uint(keccak256(abi.encodePacked(block.timestamp)));
}

// Seguro
uint private nonce;

function random() public returns (uint) {
    nonce++;
    return uint(keccak256(abi.encodePacked(block.timestamp, nonce)));
}`,
        references: [
            {
                title: 'Solidity Documentation - Block and Transaction Properties',
                url: 'https://docs.soliditylang.org/en/v0.8.0/units-and-global-variables.html#block-and-transaction-properties'
            }
        ]
    }
};

// Função para criar o modal
function createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2></h2>
                <button class="close-button">&times;</button>
            </div>
            <div class="modal-body"></div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Função para mostrar o modal com os detalhes
function showVulnerabilityDetails(vulnerabilityName) {
    const vulnerability = vulnerabilityDatabase[vulnerabilityName];
    if (!vulnerability) return;

    const modal = document.querySelector('.modal') || createModal();
    const modalTitle = modal.querySelector('.modal-header h2');
    const modalBody = modal.querySelector('.modal-body');

    modalTitle.textContent = vulnerabilityName;
    modalBody.innerHTML = `
        <div class="modal-section">
            <h3>Descrição</h3>
            <p>${vulnerability.description}</p>
        </div>
        <div class="modal-section">
            <h3>Impacto</h3>
            <p>${vulnerability.impact}</p>
        </div>
        <div class="modal-section">
            <h3>Recomendação</h3>
            <p>${vulnerability.recommendation}</p>
        </div>
        <div class="modal-section">
            <h3>Detalhes Técnicos</h3>
            <p>${vulnerability.technicalDetails}</p>
        </div>
        <div class="modal-section">
            <h3>Exemplo de Código</h3>
            <pre class="code-example">${vulnerability.codeExample}</pre>
        </div>
        <div class="reference-links">
            <h3>Referências</h3>
            <ul>
                ${vulnerability.references.map(ref => `
                    <li><a href="${ref.url}" target="_blank">${ref.title}</a></li>
                `).join('')}
            </ul>
        </div>
    `;

    modal.style.display = 'block';

    // Event listeners para fechar o modal
    const closeButton = modal.querySelector('.close-button');
    closeButton.onclick = () => modal.style.display = 'none';
    modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
}

// Função para criar cartão de vulnerabilidade
function createVulnerabilityCard(vulnerability) {
    const card = document.createElement('div');
    card.className = `vulnerability-card ${vulnerability.severity}`;
    
    card.innerHTML = `
        <h3>${vulnerability.name}</h3>
        <p class="severity">Severidade: ${vulnerability.severity}</p>
        <p class="description">${vulnerability.description}</p>
        <p class="impact"><strong>Impacto:</strong> ${vulnerability.impact}</p>
        <p class="recommendation"><strong>Recomendação:</strong> ${vulnerability.recommendation}</p>
        <button class="details-button">Ver Detalhes</button>
    `;

    // Adicionar event listener para o botão de detalhes
    const detailsButton = card.querySelector('.details-button');
    detailsButton.addEventListener('click', () => showVulnerabilityDetails(vulnerability.name));
    
    return card;
}

// Função para validar endereço do contrato
function isValidContractAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Função para formatar endereço
function formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Função para atualizar o tempo de análise
function updateTimer() {
    const currentTime = Date.now();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000);
    statusMessage.textContent = `Analisando contrato... (${elapsedTime}s)`;
}

// Função para iniciar o timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

// Função para parar o timer
function stopTimer() {
    clearInterval(timerInterval);
}

// Função para mostrar mensagens de status
function showStatus(message, type = 'info') {
    stopTimer();
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
}

// Função para obter informações detalhadas do contrato
async function fetchContractDetails(address) {
    try {
        const response = await fetch(`${API_BASE_URL}/contract-details`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
        throw error;
    }
}

// Função para criar card de informações do contrato
function createContractInfoCard(address, details = null) {
    const card = document.createElement('div');
    card.className = 'contract-info';
    
    let html = `
        <h3>Informações do Contrato</h3>
        <p><strong>Endereço:</strong> ${formatAddress(address)}</p>
        <p><strong>Data da Análise:</strong> ${new Date().toLocaleString()}</p>
    `;

    if (details) {
        html += `
            <div class="contract-details">
                <p><strong>Nome:</strong> ${details.name || 'Desconhecido'}</p>
                <p><strong>Versão do Compilador:</strong> ${details.compilerVersion || 'Desconhecida'}</p>
                <p><strong>Rede:</strong> ${details.network || 'Desconhecida'}</p>
                <p><strong>Data de Criação:</strong> ${details.creationDate || 'Desconhecida'}</p>
                <p><strong>Balance:</strong> ${details.balance || '0'} ETH</p>
                <p><strong>Número de Transações:</strong> ${details.transactionCount || '0'}</p>
            </div>
        `;
    }
    
    card.innerHTML = html;
    return card;
}

// Função para limpar resultados
function clearResults() {
    resultsContainer.innerHTML = '';
    statusMessage.style.display = 'none';
}

// Função para desabilitar/habilitar botões durante a análise
function setLoading(isLoading) {
    analyzeButton.disabled = isLoading;
    document.querySelectorAll('.example-button').forEach(button => {
        button.disabled = isLoading;
    });
}

// Função para analisar contrato
async function analyzeContract(address) {
    try {
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                address,
                sourceCode: getContractSourceCode(address)
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro na análise:', error);
        throw error;
    }
}

// Event Listeners
analyzeButton.addEventListener('click', () => {
    const address = contractInput.value.trim();
    if (isValidContractAddress(address)) {
        analyzeContract(address);
    } else {
        showStatus('Por favor, insira um endereço de contrato válido.', 'error');
    }
});

contractInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const address = contractInput.value.trim();
        if (isValidContractAddress(address)) {
            analyzeContract(address);
        } else {
            showStatus('Por favor, insira um endereço de contrato válido.', 'error');
        }
    }
});

// Adicionar event listeners para os botões de exemplo
document.querySelectorAll('.example-button').forEach(button => {
    button.addEventListener('click', () => {
        const address = button.dataset.address;
        contractInput.value = address;
        analyzeContract(address);
    });
}); 