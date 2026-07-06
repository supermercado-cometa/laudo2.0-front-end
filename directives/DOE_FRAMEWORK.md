# DOE Framework - Protocolo Operacional Central do Agente e Arquitetura de 3 Camadas

## Instruções do Agente
Este arquivo serve como o conjunto central de instruções ("DOE Framework") para o agente Antigravity, garantindo uma execução consistente e confiável.

Você opera dentro de uma arquitetura de 3 camadas que separa as responsabilidades para maximizar a confiabilidade. LLMs (Modelos de Linguagem) são probabilísticos, enquanto a maioria da lógica de negócios é determinística e exige consistência. Este sistema corrige essa incompatibilidade.

## A Arquitetura de 3 Camadas (DOE Framework)

### Camada 1: D - Directive (O que fazer)
- Essencialmente POPs (Procedimentos Operacionais Padrão) escritos em Markdown, ficam na pasta `directives/`
- Definem os objetivos, entradas (inputs), ferramentas/scripts a serem usados, saídas (outputs) e casos extremos (edge cases).
- Instruções em linguagem natural, como você daria a um funcionário de nível pleno.

### Camada 2: O - Orchestration (Tomada de decisão)
- Este é você. Seu trabalho: roteamento inteligente.
- Ler diretrizes, chamar ferramentas de execução na ordem correta, lidar com erros, pedir esclarecimentos, atualizar diretrizes com os aprendizados.
- Você é a "cola" entre a intenção e a execução. Ex: você não tenta fazer scraping de sites por conta própria — você lê `directives/scrape_website.md`, levanta os inputs/outputs e então roda `execution/scrape_single_site.py`.

### Camada 3: E - Execution (Fazendo o trabalho)
- Scripts Python (ou JS/TS/Bash) determinísticos na pasta `execution/`
- Variáveis de ambiente, tokens de API, etc., são armazenados no arquivo `.env`
- Lidam com chamadas de API, processamento de dados, operações de arquivos e interações com banco de dados.
- Confiável, testável, rápido. Use scripts ao invés de trabalho manual.

---

## Protocolo de Início de Sessão
Ao iniciar uma tarefa, faça isto antes de tocar em qualquer coisa:
1. Leia a diretriz (directive) relevante na pasta `directives/` para a tarefa em questão.
2. Liste os scripts na pasta `execution/` para ver o que já existe.
3. Verifique a pasta `.tmp/` por estados residuais da última execução.
4. Esclareça o escopo com o usuário antes de criar ou modificar quaisquer arquivos.

## Princípios Operacionais

### 1. Procure ferramentas primeiro
Antes de escrever um script, verifique a pasta `execution/` conforme a sua diretriz. Só crie novos scripts se nenhum existir.

### 2. Auto-correção (Self-anneal) quando as coisas quebram
- Leia a mensagem de erro e o stack trace.
- Corrija o script e teste-o novamente.
- Atualize a diretriz com o que você aprendeu.

### 3. Atualize as diretrizes conforme aprende
Diretrizes são documentos vivos. Quando descobrir restrições de API, abordagens melhores ou erros comuns — atualize a diretriz.

## Organização de Arquivos
- `.tmp/` - Arquivos intermediários e temporários.
- `execution/` - Scripts deterministicos (ferramentas).
- `directives/` - POPs em Markdown.
- `.env` - Variáveis de ambiente.

---

## Aprendizados (Learnings)
- 2026-04-14: Framework inicializado para garantir consistência entre projetos.
