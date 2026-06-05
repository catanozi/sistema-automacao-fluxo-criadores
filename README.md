# Sistema de Automação de Fluxo de Criadores

Sistema web para importação de relatórios do TikTok, gestão de criadores e automação de envio de mensagens via WhatsApp Cloud API.

## Sobre o projeto

O **Sistema de Automação de Fluxo de Criadores** foi desenvolvido para facilitar o acompanhamento de criadores de conteúdo a partir de planilhas de desempenho.

A aplicação permite importar relatórios em formato Excel, organizar dados dos criadores, identificar cadastros pendentes de telefone e gerar mensagens personalizadas para envio automatizado via WhatsApp.

O projeto integra front-end web, banco de dados, automação com n8n e a API oficial da Meta.

## Funcionalidades

- Login e autenticação de usuários
- Dashboard administrativo
- Importação de planilhas `.xlsx`, `.xls` e `.csv`
- Leitura de relatórios de desempenho do TikTok
- Cadastro e atualização automática de criadores
- Identificação de cadastros incompletos
- Edição manual de telefone e dados dos criadores
- Listagem, busca e exclusão de registros
- Geração de mensagens personalizadas
- Fila de mensagens pendentes
- Automação de envio com n8n
- Integração com WhatsApp Cloud API
- Atualização de status após envio

## Tecnologias utilizadas

- ReactJS
- Vite
- JavaScript
- PocketBase
- n8n
- WhatsApp Cloud API
- XLSX
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide React

## Arquitetura

```text
Front-end React/Vite
↓
PocketBase
↓
n8n
↓
WhatsApp Cloud API
Front-end

Responsável pelas telas do sistema, autenticação, importação de planilhas, exibição dos criadores, edição de cadastros e geração das mensagens.

PocketBase

Utilizado como backend e banco de dados, armazenando usuários, criadores, importações, mensagens e status dos envios.

n8n

Responsável pela automação do fluxo:

Buscar mensagens pendentes
↓
Separar mensagens
↓
Preparar dados do WhatsApp
↓
Enviar mensagem pela API da Meta
↓
Atualizar status no PocketBase
Fluxo principal
O usuário importa uma planilha de desempenho.
O sistema lê os dados dos criadores.
Criadores sem telefone ficam como cadastro pendente.
O usuário edita os cadastros pendentes.
O sistema gera mensagens personalizadas.
O n8n busca mensagens pendentes no PocketBase.
A mensagem é enviada via WhatsApp Cloud API.
O status do envio é atualizado no banco.
Estrutura do projeto
creator-manager/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── contexts/
│   │   │   ├── lib/
│   │   │   └── pages/
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── pocketbase/
│       ├── pb_hooks/
│       └── pb_migrations/
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
Como rodar localmente
Pré-requisitos
Node.js
Git
PocketBase
n8n
Instalar dependências

Na raiz do projeto:

npm install
Rodar o PocketBase

Entre na pasta do PocketBase:

cd apps/pocketbase

Configure as variáveis locais:

set PB_ENCRYPTION_KEY=your_32_character_key_here_123456
set PB_SUPERUSER_EMAIL=admin@example.com
set PB_SUPERUSER_PASSWORD=change_this_password

Inicie o PocketBase:

pocketbase.exe serve --http=127.0.0.1:8090 --encryptionEnv=PB_ENCRYPTION_KEY --hooksWatch=false

Painel administrativo:

http://127.0.0.1:8090/_/
Rodar o front-end

Em outro terminal, na raiz do projeto:

npm run dev --prefix apps/web

Acesse a URL exibida no terminal.

Rodar o n8n

Em outro terminal:

npx n8n

Acesse:

http://localhost:5678

Importe o workflow e configure as credenciais necessárias para PocketBase e WhatsApp Cloud API.

Variáveis de ambiente

Crie um arquivo .env local baseado no .env.example.

Exemplo:

VITE_POCKETBASE_URL=http://127.0.0.1:8090

PB_ENCRYPTION_KEY=your_32_character_key_here_123456
PB_SUPERUSER_EMAIL=admin@example.com
PB_SUPERUSER_PASSWORD=change_this_password

META_WHATSAPP_TOKEN=your_meta_whatsapp_token_here
META_PHONE_NUMBER_ID=your_phone_number_id_here
Segurança

Este repositório não deve conter:

.env
node_modules/
apps/pocketbase/pb_data/
apps/pocketbase/pb_data_backup/
tokens reais
senhas reais
bancos locais
workflows do n8n com credenciais

Caso algum token tenha sido exposto durante testes, gere um novo token no painel da Meta antes de utilizar o projeto novamente.

Status do projeto

Projeto funcional em ambiente local.

Fluxo validado:

Front-end rodando
PocketBase rodando
Importação de planilhas funcionando
Fila de mensagens pendentes funcionando
n8n integrado ao PocketBase
Envio via WhatsApp Cloud API testado
Mensagens dinâmicas enviadas com quebra de linha
Próximos passos
Criar template oficial aprovado no WhatsApp Manager
Configurar número real de produção no WhatsApp Business
Gerar token permanente da Meta
Melhorar tratamento de erros no n8n
Criar tela de configuração da API no painel
Publicar aplicação em ambiente de produção
Adicionar prints e demonstração em vídeo ao README
Autor

Desenvolvido por Luiz Eduardo Catanozi de Andrade.

Projeto criado como estudo prático de desenvolvimento web, automação de processos, integração com APIs e gerenciamento de dados.