---
name: protocolo-seguranca
description: Aplica um protocolo rígido de validação antes de qualquer ação destrutiva ou impulsiva. Impede o uso de comandos como git reset --hard, git push --force ou deleções de arquivos sem revisão de histórico e aprovação explícita do usuário em 3 etapas.
---

# Protocolo de Segurança (Anti-Impulsividade)

Esta skill foi criada para garantir a integridade do código e evitar que o agente tome decisões precipitadas que resultem em perda de trabalho ou quebra de funcionalidades estáveis.

## Gatilhos de Ativação
- Comandos destrutivos de Git (`reset --hard`, `push --force`, `revert`).
- Deleção de arquivos ou pastas.
- Refatoração de componentes marcados como "estáveis" ou "funcionais".
- Pedidos de "Reset" ou "Voltar atrás" que envolvam mais de um commit.

## Fluxo de Trabalho (MANDATÓRIO)

### Fase 1: Análise de Histórico (Traceability)
- [ ] Executar `git log -n 10 --format="%h %ad %s" --date=iso` para mapear todos os commits do dia.
- [ ] Identificar quem fez cada alteração (ex: IA anterior vs IA atual).
- [ ] Listar quais funcionalidades específicas serão perdidas ou mantidas com a ação.

### Fase 2: Validação Socrática
- [ ] Apresentar ao usuário o resumo da análise da Fase 1.
- [ ] Perguntar explicitamente: "Você tem certeza que deseja apagar o trabalho de [NOME DA IA / HORÁRIO]? Isso removerá as funções [LISTA DE FUNÇÕES]".
- [ ] Propor uma alternativa não-destrutiva (ex: `git revert` específico ou correção manual).

### Fase 3: Execução Assistida
- [ ] Somente após o "SIM" explícito do usuário, executar o comando.
- [ ] Criar um backup ou branch temporário (`backup-seguranca-[data]`) antes de rodar o comando final.

## Regras de Ouro
1. **Nunca assumir**: Se o usuário disser "reset tudo de hoje", pergunte "Incluindo o trabalho feito pela IA anterior às 08:30?".
2. **Prioridade Visual**: Se uma tela estiver funcional, qualquer mudança nela deve ser validada visualmente elemento por elemento.
3. **Não-Destruição**: Prefira sempre o commit e a correção manual ao reset de histórico.

## Checklist de Erros
- [ ] Verifiquei se o commit de destino é realmente o que o usuário quer.
- [ ] Confirmei se há trabalho de terceiros (outras IAs ou o Usuário) entre o estado atual e o destino do reset.
- [ ] Avisei o usuário sobre EXATAMENTE o que ele vai perder.
