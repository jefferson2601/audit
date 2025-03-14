import './styles.css';

// Elementos do DOM
const contractInput = document.getElementById('contractInput');
const analyzeButton = document.getElementById('analyzeButton');
const statusMessage = document.getElementById('statusMessage');
const resultsContainer = document.getElementById('resultsContainer');

// Configuração da API
const API_BASE_URL = '/.netlify/functions';

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
    },
    'Delegatecall Injection': {
        description: 'Vulnerabilidade que ocorre quando um contrato usa delegatecall de forma insegura, permitindo que um contrato malicioso execute código no contexto do contrato alvo.',
        impact: 'Execução de código malicioso, manipulação de estado do contrato, roubo de fundos.',
        recommendation: 'Evitar uso de delegatecall quando possível, implementar verificações rigorosas de endereços, usar bibliotecas seguras.',
        technicalDetails: 'O delegatecall executa código de outro contrato no contexto do contrato atual, incluindo acesso ao storage e balance.',
        codeExample: `// Vulnerável
function execute(address target, bytes memory data) {
    target.delegatecall(data);
}

// Seguro
function execute(address target, bytes memory data) {
    require(target != address(0), "Invalid target");
    require(target.code.length > 0, "Target is not a contract");
    (bool success, ) = target.delegatecall(data);
    require(success, "Delegatecall failed");
}`,
        references: [
            {
                title: 'Solidity Documentation - Delegatecall',
                url: 'https://docs.soliditylang.org/en/v0.8.0/introduction-to-smart-contracts.html#delegatecall-callcode-and-libraries'
            }
        ]
    },
    'Denial of Service': {
        description: 'Vulnerabilidade que permite que um atacante cause falha ou interrupção do serviço do contrato.',
        impact: 'Interrupção do serviço, perda de funcionalidade, prejuízos financeiros.',
        recommendation: 'Implementar limites de gas, evitar loops infinitos, usar padrões de pull payment.',
        technicalDetails: 'Pode ocorrer através de loops infinitos, operações que excedem o limite de gas, ou bloqueio de recursos.',
        codeExample: `// Vulnerável
function distribute() {
    for(uint i = 0; i < users.length; i++) {
        users[i].transfer(amount);
    }
}

// Seguro
function distribute() {
    uint256 i = 0;
    while(i < users.length && gasleft() > 50000) {
        users[i].transfer(amount);
        i++;
    }
}`,
        references: [
            {
                title: 'Consensys Denial of Service',
                url: 'https://consensys.github.io/smart-contract-best-practices/attacks/denial-of-service/'
            }
        ]
    },
    'Weak Random Number Generation': {
        description: 'Vulnerabilidade que ocorre quando o contrato usa métodos previsíveis para gerar números aleatórios.',
        impact: 'Previsibilidade de resultados, manipulação de jogos de azar, roubo de fundos.',
        recommendation: 'Usar VRF (Verifiable Random Function), implementar commit-reveal, usar fontes externas de entropia.',
        technicalDetails: 'Métodos como block.timestamp, blockhash, ou keccak256 são previsíveis e não devem ser usados para aleatoriedade.',
        codeExample: `// Vulnerável
function random() public view returns (uint) {
    return uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty)));
}

// Seguro (usando VRF)
function random() public returns (uint) {
    bytes32 requestId = COORDINATOR.requestRandomWords(
        keyHash,
        subscriptionId,
        REQUEST_CONFIRMATIONS,
        CALLBACK_GAS_LIMIT,
        NUM_WORDS
    );
}`,
        references: [
            {
                title: 'Chainlink VRF',
                url: 'https://docs.chain.link/docs/chainlink-vrf/'
            }
        ]
    },
    'Gas Limit Issues': {
        description: 'Vulnerabilidade relacionada a operações que podem exceder o limite de gas ou causar problemas de custo.',
        impact: 'Falha de transações, custos excessivos, comportamento inesperado.',
        recommendation: 'Implementar limites de gas, otimizar operações, usar padrões de pull payment.',
        technicalDetails: 'Operações que consomem muito gas podem falhar ou causar problemas de custo.',
        codeExample: `// Vulnerável
function processArray(uint[] memory data) {
    for(uint i = 0; i < data.length; i++) {
        // Operações complexas
    }
}

// Seguro
function processArray(uint[] memory data) {
    uint256 i = 0;
    while(i < data.length && gasleft() > 50000) {
        // Operações complexas
        i++;
    }
}`,
        references: [
            {
                title: 'Solidity Gas Optimization',
                url: 'https://docs.soliditylang.org/en/v0.8.0/gas-optimizations.html'
            }
        ]
    },
    'Signature Replay': {
        description: 'Vulnerabilidade que permite que uma assinatura válida seja reutilizada em diferentes contextos.',
        impact: 'Execução não autorizada de operações, roubo de fundos, manipulação de estado.',
        recommendation: 'Implementar nonce único para cada assinatura, verificar o contexto da assinatura, usar padrões seguros de assinatura.',
        technicalDetails: 'Assinaturas podem ser reutilizadas se não houver um mecanismo para invalidá-las após o uso.',
        codeExample: `// Vulnerável
function transferWithSignature(address to, uint amount, bytes memory signature) {
    bytes32 hash = keccak256(abi.encodePacked(to, amount));
    address signer = ecrecover(hash, v, r, s);
    require(signer == owner);
    transfer(to, amount);
}

// Seguro
mapping(bytes32 => bool) public usedSignatures;

function transferWithSignature(address to, uint amount, bytes memory signature, uint nonce) {
    bytes32 hash = keccak256(abi.encodePacked(to, amount, nonce));
    require(!usedSignatures[hash], "Signature already used");
    address signer = ecrecover(hash, v, r, s);
    require(signer == owner);
    usedSignatures[hash] = true;
    transfer(to, amount);
}`,
        references: [
            {
                title: 'OpenZeppelin ECDSA',
                url: 'https://docs.openzeppelin.com/contracts/4.x/api/utils#ECDSA'
            }
        ]
    },
    'Unprotected Initialization': {
        description: 'Vulnerabilidade que ocorre quando funções de inicialização podem ser chamadas múltiplas vezes ou por usuários não autorizados.',
        impact: 'Manipulação de estado inicial, execução não autorizada, comportamento inesperado.',
        recommendation: 'Implementar modificadores de inicialização única, usar padrões de proxy, verificar permissões.',
        technicalDetails: 'Funções de inicialização devem ser protegidas contra chamadas múltiplas e não autorizadas.',
        codeExample: `// Vulnerável
function initialize() {
    owner = msg.sender;
}

// Seguro
bool private initialized;

function initialize() {
    require(!initialized, "Already initialized");
    owner = msg.sender;
    initialized = true;
}`,
        references: [
            {
                title: 'OpenZeppelin Initializable',
                url: 'https://docs.openzeppelin.com/contracts/4.x/api/proxy#Initializable'
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
async function showVulnerabilityDetails(vulnerabilityName) {
    const vulnerability = vulnerabilityDatabase[vulnerabilityName];
    if (!vulnerability) return;

    const modal = document.getElementById('vulnerabilityModal');
    const modalTitle = modal.querySelector('.modal-header h2');
    const modalBody = modal.querySelector('.modal-body');
    const closeButton = modal.querySelector('.close');

    modalTitle.textContent = vulnerabilityName;

    // Se tiver um endereço de contrato, buscar o código-fonte
    let sourceCodeSection = '';
    const contractAddress = document.getElementById('contractInput').value;
    
    if (contractAddress) {
        try {
            const sourceCode = await fetchContractSource(contractAddress);
            if (sourceCode.isVerified) {
                // Procurar por padrões relacionados à vulnerabilidade no código
                const vulnPattern = getVulnerabilityPattern(vulnerabilityName);
                const hasVulnerability = vulnPattern && sourceCode.sourceCode.match(vulnPattern);
                
                sourceCodeSection = `
                    <div class="source-code-section">
                        <h3>Análise do Código do Contrato</h3>
                        <div class="source-code-analysis">
                            <p><strong>Status:</strong> ${hasVulnerability ? '⚠️ Vulnerabilidade Potencial Detectada' : '✅ Padrão Não Encontrado'}</p>
                            <button onclick="toggleSourceCode()" class="source-code-button">Ver Código-fonte</button>
                            <div id="sourceCodeContainer" style="display: none;">
                                <pre><code class="language-solidity">${escapeHtml(sourceCode.sourceCode)}</code></pre>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Erro ao buscar código-fonte:', error);
        }
    }

    modalBody.innerHTML = `
        <div class="vulnerability-details">
            <div class="modal-section">
                <h3>Descrição</h3>
                <p>${vulnerability.description}</p>
            </div>
            
            <div class="modal-section">
                <h3>Impacto</h3>
                <p>${vulnerability.impact}</p>
            </div>
            
            <div class="modal-section">
                <h3>Recomendações</h3>
                <p>${vulnerability.recommendation}</p>
            </div>
            
            <div class="modal-section">
                <h3>Detalhes Técnicos</h3>
                <p>${vulnerability.technicalDetails}</p>
            </div>
            
            <div class="modal-section">
                <h3>Exemplo de Código Vulnerável</h3>
                <pre class="code-example"><code>${vulnerability.codeExample}</code></pre>
            </div>
            
            ${sourceCodeSection}
            
            <div class="reference-links">
                <h3>Referências</h3>
                <ul>
                    ${vulnerability.references.map(ref => `
                        <li><a href="${ref.url}" target="_blank">${ref.title}</a></li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;

    modal.style.display = 'block';

    // Event listeners para fechar o modal
    function closeModal() {
        modal.style.display = 'none';
    }

    closeButton.onclick = closeModal;
    
    // Fechar ao clicar fora do modal
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

// Função para buscar o código-fonte do contrato
async function fetchContractSource(address) {
    try {
        const response = await fetch('/.netlify/functions/contract-source', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address })
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar código-fonte');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

// Função para obter o padrão de vulnerabilidade
function getVulnerabilityPattern(vulnerabilityName) {
    const patterns = {
        'Reentrancy': /(\.(call|transfer|send)\{.*value:.*\}|\.call\{.*\}.*\(.*\).*)/i,
        'Integer Overflow': /([\+\-\*](?!=)|=[\+\-\*])/,
        'Access Control': /onlyOwner|require\s*\(\s*msg\.sender\s*==\s*owner\s*\)/i,
        'Unchecked External Call': /\.call\{.*\}\(.*\)/i,
        'Timestamp Dependence': /block\.timestamp|now/i,
        'Front-Running': /tx\.gasprice|block\.number/i,
        'Denial of Service': /require\s*\(\s*msg\.value\s*[>=]+/i,
        'Weak Random': /block\.timestamp|blockhash|block\.difficulty/i,
        'Delegatecall Injection': /\.delegatecall/i,
        'Signature Replay': /ecrecover|ECDSA\.recover/i,
        'Unprotected Initialization': /initialize|init(?!ialize)/i
    };
    
    return patterns[vulnerabilityName];
}

// Função para alternar a visibilidade do código-fonte
window.toggleSourceCode = function() {
    const container = document.getElementById('sourceCodeContainer');
    if (container) {
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
    }
}

// Função para escapar HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
        <button class="details-button" data-vulnerability="${vulnerability.name}">Ver Detalhes</button>
    `;

    // Adicionar event listener para o botão de detalhes
    const detailsButton = card.querySelector('.details-button');
    detailsButton.addEventListener('click', () => {
        const vulnerabilityName = detailsButton.getAttribute('data-vulnerability');
        showVulnerabilityDetails(vulnerabilityName);
    });
    
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
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ address })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Formatar os dados recebidos
        return {
            name: data.name || 'Desconhecido',
            compilerVersion: data.compilerVersion || 'Desconhecida',
            network: data.network || 'Desconhecida',
            creationDate: data.creationDate ? new Date(data.creationDate).toLocaleDateString() : 'Desconhecida',
            balance: data.balance ? `${data.balance} ETH` : '0 ETH',
            transactionCount: data.transactionCount || '0'
        };
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
        setLoading(true);
        showStatus('Iniciando análise...', 'info');
        startTimer();
        clearResults();

        // Buscar detalhes do contrato
        const contractDetails = await fetchContractDetails(address);

        // Adicionar informações do contrato
        const contractInfoCard = createContractInfoCard(address, contractDetails);
        resultsContainer.appendChild(contractInfoCard);

        // Fazer requisição para o servidor
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                address,
                sourceCode: `// Código fonte do contrato ${address}`
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Erro na análise do contrato');
        }
        
        // Exibir resultados
        if (data.vulnerabilities && data.vulnerabilities.length > 0) {
            const vulnerabilitiesHeader = document.createElement('h2');
            vulnerabilitiesHeader.textContent = 'Vulnerabilidades Encontradas';
            resultsContainer.appendChild(vulnerabilitiesHeader);

            data.vulnerabilities.forEach(vulnerability => {
                const card = createVulnerabilityCard(vulnerability);
                resultsContainer.appendChild(card);
            });
            showStatus(`Análise concluída. ${data.vulnerabilities.length} vulnerabilidades encontradas.`, 'success');
        } else {
            const noVulnsCard = document.createElement('div');
            noVulnsCard.className = 'vulnerability-card low';
            noVulnsCard.innerHTML = `
                <h3>Nenhuma Vulnerabilidade Encontrada</h3>
                <p class="description">O contrato parece estar seguro em relação às vulnerabilidades mais comuns.</p>
            `;
            resultsContainer.appendChild(noVulnsCard);
            showStatus('Nenhuma vulnerabilidade encontrada.', 'success');
        }
    } catch (error) {
        console.error('Erro:', error);
        showStatus(`Erro ao analisar contrato: ${error.message}`, 'error');
    } finally {
        setLoading(false);
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