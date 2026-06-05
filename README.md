# Sistema de Automação de Fluxo de Criadores

![React](https://img.shields.io/badge/ReactJS-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge\&logo=vite\&logoColor=FFFFFF)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=000000)
![PocketBase](https://img.shields.io/badge/PocketBase-B8DBE4?style=for-the-badge\&logo=pocketbase\&logoColor=000000)
![n8n](https://img.shields.io/badge/n8n-EA4B71?style=for-the-badge\&logo=n8n\&logoColor=FFFFFF)
![WhatsApp API](https://img.shields.io/badge/WhatsApp%20Cloud%20API-25D366?style=for-the-badge\&logo=whatsapp\&logoColor=FFFFFF)

Sistema web para importação de relatórios do TikTok, gestão de criadores e automação de envio de mensagens via WhatsApp Cloud API.

---

## Visão geral

O **Sistema de Automação de Fluxo de Criadores** foi desenvolvido para automatizar uma rotina real de gestão de criadores de conteúdo.

A aplicação permite importar relatórios em Excel, organizar dados de desempenho, identificar cadastros incompletos, gerar mensagens personalizadas e automatizar o envio via WhatsApp utilizando n8n e a API oficial da Meta.

Este projeto foi construído com foco em aplicação prática, integração entre sistemas e automação de processos.

---

## Problema resolvido

Agências e gestores que trabalham com criadores precisam acompanhar métricas como horas de live, batalhas, diamantes e desempenho individual. Fazer esse processo manualmente consome tempo, aumenta a chance de erro e dificulta o envio individualizado das informações.

Este sistema resolve esse problema ao permitir:

* importar relatórios reais do TikTok;
* atualizar automaticamente a base de criadores;
* identificar criadores sem telefone cadastrado;
* gerar mensagens individuais com dados personalizados;
* automatizar o envio dessas mensagens pelo WhatsApp.

---

## Principais funcionalidades

* Autenticação de usuários
* Dashboard administrativo
* Importação de planilhas `.xlsx`, `.xls` e `.csv`
* Leitura de relatórios de desempenho do TikTok
* Cadastro e atualização automática de criadores
* Identificação de cadastros incompletos
* Edição manual de telefone e dados dos criadores
* Listagem, busca, filtros e exclusão de registros
* Geração de mensagens personalizadas
* Fila de mensagens pendentes
* Integração com PocketBase
* Automação de envio com n8n
* Integração com WhatsApp Cloud API
* Atualização de status após envio

---

## Tecnologias utilizadas

| Tecnologia         | Uso no projeto                         |
| ------------------ | -------------------------------------- |
| ReactJS            | Construção da interface web            |
| Vite               | Ambiente de desenvolvimento front-end  |
| JavaScript         | Lógica da aplicação                    |
| PocketBase         | Backend, banco de dados e autenticação |
| n8n                | Automação do fluxo de envio            |
| WhatsApp Cloud API | Envio de mensagens via WhatsApp        |
| XLSX               | Leitura e processamento de planilhas   |
| Tailwind CSS       | Estilização da interface               |
| shadcn/ui          | Componentes visuais                    |
| Radix UI           | Componentes acessíveis                 |
| Lucide React       | Ícones da interface                    |

---

## Arquitetura do sistema

```text
Front-end React/Vite
        ↓
PocketBase
        ↓
n8n
        ↓
WhatsApp Cloud API
```

### Front-end

Responsável pelas telas do sistema, autenticação, importação de planilhas, exibição de criadores, edição de cadastros e geração das mensagens.

### PocketBase

Utilizado como backend e banco de dados, armazenando usuários, criadores, histórico de importações, mensagens e status dos envios.

### n8n

Responsável por buscar mensagens pendentes no PocketBase, preparar os dados de envio, chamar a API da Meta e atualizar o status da mensagem.

### WhatsApp Cloud API

Utilizada para realizar o envio das mensagens personalizadas para os criadores via WhatsApp.

---

## Fluxo de funcionamento

```text
Importação da planilha
        ↓
Leitura dos dados dos criadores
        ↓
Cadastro ou atualização no PocketBase
        ↓
Identificação de cadastros pendentes
        ↓
Geração de mensagens personalizadas
        ↓
Fila de mensagens pendentes
        ↓
Envio automatizado pelo n8n
        ↓
WhatsApp Cloud API
        ↓
Atualização do status no banco
```

---

## Exemplo de uso

1. O usuário importa uma planilha de desempenho do TikTok.
2. O sistema identifica os criadores e suas métricas.
3. Criadores sem telefone ficam marcados como pendentes.
4. O usuário edita os cadastros incompletos.
5. O sistema gera mensagens personalizadas.
6. O n8n busca mensagens pendentes.
7. A mensagem é enviada via WhatsApp Cloud API.
8. O status do envio é atualizado no PocketBase.

---

## Estrutura do projeto

```text
creator-manager/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── contexts/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── pages/
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── pocketbase/
│       ├── pb_hooks/
│       ├── pb_migrations/
│       └── package.json
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

## Como rodar localmente

### Pré-requisitos

Antes de iniciar, é necessário ter instalado:

* Node.js
* Git
* PocketBase
* n8n

---

### 1. Clonar o repositório

```bash
git clone https://github.com/catanozi/sistema-automacao-fluxo-criadores.git
cd sistema-automacao-fluxo-criadores
```

---

### 2. Instalar dependências

Na raiz do projeto:

```bash
npm install
```

---

### 3. Rodar o PocketBase

Entre na pasta do PocketBase:

```bash
cd apps/pocketbase
```

Configure as variáveis locais:

```bash
set PB_ENCRYPTION_KEY=your_32_character_key_here_123456
set PB_SUPERUSER_EMAIL=admin@example.com
set PB_SUPERUSER_PASSWORD=change_this_password
```

Inicie o PocketBase:

```bash
pocketbase.exe serve --http=127.0.0.1:8090 --encryptionEnv=PB_ENCRYPTION_KEY --hooksWatch=false
```

Acesse o painel administrativo:

```text
http://127.0.0.1:8090/_/
```

---

### 4. Rodar o front-end

Em outro terminal, na raiz do projeto:

```bash
npm run dev --prefix apps/web
```

Acesse a URL exibida no terminal.

---

### 5. Rodar o n8n

Em outro terminal:

```bash
npx n8n
```

Acesse:

```text
http://localhost:5678
```

Depois, importe o workflow do n8n e configure as credenciais necessárias para PocketBase e WhatsApp Cloud API.

---

## Variáveis de ambiente

Crie um arquivo `.env` local baseado no `.env.example`.

Exemplo:

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090

PB_ENCRYPTION_KEY=your_32_character_key_here_123456
PB_SUPERUSER_EMAIL=admin@example.com
PB_SUPERUSER_PASSWORD=change_this_password

META_WHATSAPP_TOKEN=your_meta_whatsapp_token_here
META_PHONE_NUMBER_ID=your_phone_number_id_here
```

---

## Segurança

Este repositório não deve conter dados sensíveis.

Não devem ser versionados:

```text
.env
node_modules/
apps/pocketbase/pb_data/
apps/pocketbase/pb_data_backup/
tokens reais
senhas reais
bancos locais
workflows do n8n com credenciais
```

Caso algum token tenha sido exposto durante testes, gere um novo token no painel da Meta antes de utilizar o projeto novamente.

---

## Status do projeto

Projeto funcional em ambiente local.

Fluxo principal validado:

* Front-end rodando
* PocketBase rodando
* Importação de planilhas funcionando
* Cadastro e edição de criadores funcionando
* Fila de mensagens pendentes funcionando
* n8n integrado ao PocketBase
* Envio via WhatsApp Cloud API testado
* Mensagens dinâmicas enviadas com quebra de linha

---

## Aprendizados aplicados

Durante o desenvolvimento deste projeto, foram aplicados conceitos de:

* desenvolvimento front-end com ReactJS;
* consumo e integração com APIs;
* automação de processos com n8n;
* autenticação e persistência de dados com PocketBase;
* leitura e tratamento de planilhas Excel;
* integração com WhatsApp Cloud API;
* organização de fluxo assíncrono de mensagens;
* boas práticas de versionamento e segurança no GitHub.

---

## Próximos passos

* Criar template oficial aprovado no WhatsApp Manager
* Configurar número real de produção no WhatsApp Business
* Gerar token permanente da Meta
* Melhorar tratamento de erros no n8n
* Criar tela de configuração da API no painel
* Publicar aplicação em ambiente de produção
* Adicionar prints e demonstração em vídeo ao README

---

## Autor

Desenvolvido por **Luiz Eduardo Catanozi de Andrade**.

Projeto criado como estudo prático de desenvolvimento web, automação de processos, integração com APIs e gerenciamento de dados.
