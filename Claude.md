# ConduzX - Contexto do Produto
## Nome da Plataforma

ConduzX - Gestao Inteligente para Escolas de Conducao

## Descricao Curta

ConduzX e um sistema interno para escolas de conducao em Mocambique controlarem alunos, inscricoes, pagamentos, documentos e pendencias relacionadas ao registo no INATRO.

O produto nao substitui o INATRO. Ele funciona como um sistema espelho interno da escola, garantindo que a secretaria tenha controlo mesmo quando o INATRO esta indisponivel, lento ou quando o processo oficial ainda nao foi concluido.

## Problema

As escolas de conducao registam os candidatos no sistema oficial do INATRO, mas muitas nao possuem um sistema proprio para organizar o processo internamente. Quando o INATRO falha, a escola continua a receber alunos e pagamentos, mas passa a depender de papel, mensagens, memoria dos funcionarios ou ficheiros soltos.

Isso causa:

- Perda de informacao dos alunos.
- Dificuldade para saber quem ja pagou e quanto falta pagar.
- Falta de controlo sobre inscricoes que ainda precisam ser registadas no INATRO.
- Duplicacao de dados.
- Pouca rastreabilidade sobre quem criou, alterou ou anulou registos.
- Gestao manual e fraca de documentos e comprovativos.

## Solucao

O ConduzX centraliza o fluxo interno da escola:

1. Cadastrar aluno.
2. Criar inscricao para uma categoria de carta.
3. Guardar o preco da categoria no momento da inscricao.
4. Registar pagamento total ou parcial.
5. Calcular automaticamente valor pago, saldo e percentagem.
6. Guardar o estado manual do processo no INATRO.
7. Listar pendencias para concluir mais tarde.
8. Manter historico de acoes.

## Posicionamento

ConduzX e:

- Sistema interno da escola.
- Espelho operacional do processo de inscricao.
- Ferramenta de controlo financeiro e administrativo.
- Fonte interna de verdade quando o INATRO nao esta disponivel.

ConduzX nao e:

- Substituto do INATRO.
- Integracao automatica com o INATRO.
- Plataforma de pagamento online.
- Sistema oficial governamental.

## Utilizadores

### Atendente

Usuario diario da secretaria. Precisa de fluxos simples, rapidos e com poucos cliques.

Pode:

- Cadastrar e editar alunos.
- Criar inscricoes.
- Registar pagamentos.
- Marcar inscricoes como pendentes no INATRO.

### Gestor

Acompanha operacao, pagamentos e pendencias.

Pode:

- Consultar listas e detalhes.
- Ver pagamentos e saldos.
- Ver pendencias do INATRO.
- Anular pagamentos com motivo.

### Admin

Gere configuracoes da escola.

Pode:

- Gerir utilizadores.
- Gerir categorias de carta.
- Executar todas as acoes do gestor e atendente.

## Entidades Principais

- Escola
- Utilizador
- Aluno
- Categoria de carta
- Inscricao
- Pagamento
- Documento
- Historico

## Regras Importantes

### Multi-escola

O sistema deve suportar varias escolas desde o inicio. Toda informacao operacional deve estar associada a uma escola. Consultas e operacoes devem ser sempre limitadas a `escola_id` do utilizador autenticado.

### Dinheiro

Valores monetarios devem ser guardados em centavos como inteiros. Nunca usar `float`.

### Pagamentos

Pagamentos sao registos imutaveis. Nao editar nem apagar pagamentos. Quando houver erro, anular com motivo obrigatorio e guardar quem anulou.

O estado financeiro da inscricao e derivado dos pagamentos nao anulados:

- `sem_pagamento`
- `parcial`
- `pago`

### INATRO

Estado do INATRO e manual e independente do pagamento:

- `nao_registado`
- `pendente`
- `registado`

Ao marcar como `registado`, deve existir numero de processo quando aplicavel.

### Historico

Toda criacao, atualizacao, anulacao e mudanca de estado relevante deve gerar historico.

## Fora do Ambito do MVP

- Integracao com INATRO.
- Submissao automatica ao INATRO.
- WhatsApp.
- Chatbot ou IA operacional.
- Pagamentos online.
- App mobile nativa.
- Relatorios avancados.
- Modo offline completo.

## Direcao de UX

A interface deve ser simples, clara e operacional. O foco e secretaria de escola de conducao, nao pagina de marketing.

Prioridades:

- Formularios curtos e diretos.
- Botoes grandes e claros.
- Linguagem em Portugues de Mocambique.
- Listas filtraveis.
- Mensagens de erro amigaveis.
- Poucos cliques para cadastrar aluno, criar inscricao e registar pagamento.
