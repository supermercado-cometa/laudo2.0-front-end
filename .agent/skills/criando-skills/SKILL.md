---
name: criando-skills
description: Especialista na criação de habilidades baseadas em diretórios para o ambiente Antigravity. Use quando o usuário mencionar a criação de novas capacidades, automações estruturadas ou "skills" para o agente.
---

# Criador de Skills (Antigravity)

Você é um desenvolvedor especialista focado na criação de "Skills" (Habilidades) para os ambientes de agentes IA (como o Antigravity). Seu objetivo é gerar diretórios de `.agent/skills/` que sejam de alta qualidade, previsíveis e eficientes, com base nos requisitos do usuário.

## Quando usar esta skill
- Quando o usuário pedir para criar uma nova funcionalidade ou "skill".
- Quando for necessário automatizar tarefas repetitivas com instruções estruturadas.
- Quando houver necessidade de padronizar o comportamento do agente em um projeto.

## Fluxo de Trabalho (Workflow)
- [ ] **Planejamento**: Definir o nome (gerúndio) e a descrição (3ª pessoa) da skill.
- [ ] **Criação de Estrutura**: Criar a pasta `.agent/skills/[nome-da-skill]/`.
- [ ] **Escrita do SKILL.md**: Implementar o frontmatter e as seções de Workflow e Instruções.
- [ ] **Scripts e Recursos**: Criar subpastas `scripts/`, `examples/` ou `resources/` se a lógica exigir arquivos externos.
- [ ] **Revisão**: Validar se os caminhos usam `/`, se é conciso e se contém checklists de feedback.

## Instruções

### 1. Requisitos Estruturais
Toda skill gerada DEVE seguir esta hierarquia:
- `<nome-da-skill>/`
  - `SKILL.md` (Obrigatório: Lógica principal e instruções)
  - `scripts/` (Opcional)
  - `examples/` (Opcional)
  - `resources/` (Opcional)

### 2. Padrões do YAML Frontmatter
O arquivo `SKILL.md` deve começar com:
- **name**: Ação no gerúndio (ex: `revisando-codigo`). Máx 64 caracteres, minúsculas, números e hifens.
- **description**: 3ª pessoa, incluindo gatilhos específicos. Máx 1024 caracteres.

### 3. Princípios de Escrita
- **Concisão**: Assuma que o leitor é inteligente.
- **Divulgação Progressiva**: `SKILL.md` < 500 linhas. Use arquivos secundários para detalhes.
- **Barras**: Sempre use `/`.
- **Graus de Liberdade**:
  - Bullet Points: Alta liberdade (heurísticas).
  - Blocos de Código: Média liberdade (templates).
  - Comandos Bash: Baixa liberdade (operações frágeis).

### 4. Loops de Feedback
- Incluir **Checklists** markdown para rastreamento.
- Implementar padrão **Planejar-Validar-Executar**.
- Instruções de erro: diga para rodar scripts com `--help`.

## Recursos
- `scripts/`: Local para ferramentas auxiliares.
- `examples/`: Casos de uso de referência.
- `resources/`: Templates e ativos estáticos.
