# MONO Frontend

Interface web do **MONO**, um sistema de segurança baseado em blockchain e identidade descentralizada para cooperativas financeiras informais.

O sistema foi desenvolvido no âmbito de um projecto académico e procura apoiar a gestão de grupos de **Xitique**, oferecendo mecanismos para gestão de membros, contribuições, rotação de beneficiários, desembolsos, penalizações, identidade descentralizada (DID) e Credenciais Verificáveis.

Este repositório contém exclusivamente o **frontend** da solução. A lógica de negócio e a persistência de dados são tratadas pelo backend MONO.

## Funcionalidades

A aplicação disponibiliza as seguintes áreas:

- Autenticação e registo de utilizadores;
- Dashboard;
- Criação e gestão de grupos de Xitique;
- Gestão de membros;
- Registo e consulta de contribuições;
- Visualização e geração da rotação dos beneficiários;
- Gestão de desembolsos;
- Registo e resolução de penalizações;
- Configuração dos grupos;
- Emissão, consulta, verificação e revogação de Credenciais Verificáveis;
- Consulta da identidade descentralizada (DID) do utilizador e respectivo DID Document.

A aplicação segue uma abordagem **mobile-first**, mantendo-se responsiva para tablets e desktop.

## Tecnologias

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Hook Form
- Zod
- Lucide React

## Arquitectura

O frontend funciona como cliente da API REST do MONO.

```text
Utilizador
    |
    v
MONO Frontend
Next.js / React
    |
    | HTTP + JWT
    v
MONO Backend
Django REST Framework
    |
    +--> PostgreSQL
    |
    +--> Identidade descentralizada / DID
    |
    +--> Blockchain privada Ethereum
```

O backend é a fonte de verdade para as regras de negócio. O frontend não calcula a ordem de rotação, beneficiários, penalizações, elegibilidade de Credenciais Verificáveis, hashes ou assinaturas criptográficas.

## Pré-requisitos

Para executar o frontend localmente é necessário ter instalado:

- Node.js
- npm
- Git
- MONO Backend em execução

O backend encontra-se num repositório separado e, no ambiente local padrão, é executado em `http://localhost:8000`.

## Instalação

Clone o repositório:

```bash
git clone https://github.com/enoqueJonas/mono-frontend.git
cd mono-frontend
```

Instale as dependências:

```bash
npm install
```

## Configuração

Crie um ficheiro `.env.local` na raiz do projecto:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Esta variável indica ao frontend o endereço da API REST do MONO.

> O frontend não necessita de uma chave Gemini ou de qualquer configuração do Google AI Studio para ser executado.

## Executar em desenvolvimento

Certifique-se primeiro de que o backend MONO está disponível em `http://localhost:8000` ou ajuste `NEXT_PUBLIC_API_BASE_URL` para o endereço utilizado.

Depois execute:

```bash
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:3000
```

## Build de produção

Para verificar e gerar o build da aplicação:

```bash
npm run build
```

Para executar o build produzido:

```bash
npm run start
```

## Verificação TypeScript

O projecto disponibiliza o comando:

```bash
npm run lint
```

Actualmente este script executa `tsc --noEmit`, verificando erros de TypeScript sem gerar ficheiros JavaScript.

## Integração com o backend

A comunicação com o backend é centralizada na camada `lib/api`.

As requisições autenticadas utilizam JWT através do cabeçalho:

```text
Authorization: Bearer <access_token>
```

Entre os principais recursos consumidos encontram-se:

```text
/api/v1/accounts/
/api/v1/groups/
/api/v1/identity/
/api/v1/credentials/
/api/v1/wallets/
```

As contribuições provenientes de carteiras móveis são recebidas pelo backend através da integração externa correspondente. O frontend não simula uma carteira móvel nem expõe uma interface de pagamento por M-Pesa.

## Estrutura principal

```text
mono-frontend/
├── app/                 # Rotas e páginas Next.js (App Router)
├── components/          # Componentes reutilizáveis da interface
├── context/             # Contextos React, incluindo autenticação
├── lib/
│   ├── api/             # Cliente e serviços da API REST
│   └── utils.ts         # Funções auxiliares
├── schemas/             # Schemas de validação Zod
├── types/               # Tipos TypeScript
├── public/              # Recursos estáticos
├── next.config.mjs
├── package.json
└── tsconfig.json
```

## Princípios da implementação

Algumas decisões importantes da solução são:

- O backend é responsável pelas regras de negócio;
- A identidade DID é criada e gerida pela plataforma, não manualmente pelo utilizador;
- As Credenciais Verificáveis são emitidas e assinadas pelo backend;
- A rotação de beneficiários é determinada pelo backend;
- Os desembolsos utilizam o beneficiário e o valor calculados pelo backend;
- As penalizações seguem as regras definidas no domínio e não são calculadas automaticamente pelo frontend;
- Não existe integração com MetaMask ou outras carteiras de criptomoedas no frontend;
- A blockchain é uma componente interna da arquitectura e não uma interface directa para o utilizador final.

## Estado do projecto

O MVP inclui os principais fluxos funcionais definidos para o projecto. A integração completa frontend/backend deve ser validada localmente antes da preparação da versão final.

## Autor

**Enoque Jonas Macanda**

Projecto desenvolvido no âmbito da monografia sobre segurança baseada em blockchain e identidade descentralizada aplicada a cooperativas financeiras informais.
