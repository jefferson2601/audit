# Smart Contract Auditor

Uma aplicação web para análise e auditoria de smart contracts na blockchain Ethereum.

## 🚀 Funcionalidades

- Análise de vulnerabilidades em smart contracts
- Visualização detalhada de informações do contrato
- Interface intuitiva e responsiva
- Suporte para múltiplas redes Ethereum
- Relatórios detalhados de auditoria

## 🛠️ Tecnologias Utilizadas

- Frontend:
  - HTML5
  - CSS3
  - JavaScript (ES6+)
  - Webpack

- Backend:
  - Node.js
  - Express
  - CORS

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm (gerenciador de pacotes do Node.js)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/smart-contract-auditor.git
cd smart-contract-auditor
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Em outro terminal, inicie o servidor backend:
```bash
npm start
```

## 🌐 Como Usar

1. Acesse a aplicação em `http://localhost:3000`
2. Insira o endereço do smart contract que deseja analisar
3. Clique em "Analisar Contrato"
4. Aguarde o processo de análise
5. Visualize os resultados e recomendações

## 📝 Exemplos de Contratos

- USDT (Tether): `0xdac17f958d2ee523a2206206994597c13d831ec7`
- WBTC (Wrapped Bitcoin): `0x2260fac5e5542a773aa44fbcfedf7c193bc2c599`

## 🔍 Tipos de Vulnerabilidades Detectadas

- Access Control
- Front-Running
- Timestamp Dependence
- Reentrancy
- Integer Overflow/Underflow
- Unchecked External Calls

## 🚀 Deploy

### Backend (Render)

1. Crie uma conta no [Render](https://render.com)
2. Conecte seu repositório GitHub
3. Crie um novo Web Service
4. Selecione o repositório
5. Configure as seguintes variáveis:
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Clique em "Create Web Service"

### Frontend (GitHub Pages)

1. Configure o GitHub Actions no seu repositório
2. O workflow já está configurado para fazer o deploy automaticamente
3. Acesse as configurações do repositório em GitHub > Settings > Pages
4. Selecione a branch `gh-pages` como fonte

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Por favor, leia o guia de contribuição antes de submeter um pull request.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- Jeferson Lopes - Desenvolvimento inicial

## 🙏 Agradecimentos

- Comunidade Ethereum
- Contribuidores do projeto
- Todos que ajudaram com feedback e sugestões 