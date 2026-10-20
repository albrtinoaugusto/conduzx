AGENTS.md

## Nome da Plataforma

ConduzX - Gestao Inteligente para Escolas de Conducao

## Contexto Atualizado

O ConduzX e um sistema interno para escolas de conducao em Mocambique. O objetivo nao e substituir o INATRO, nem fazer integracao automatica com ele nesta fase. O produto funciona como um sistema espelho da escola: guarda internamente tudo o que a secretaria precisa controlar sobre alunos, inscricoes, categorias, pagamentos, documentos e o estado manual do processo no INATRO.

As escolas continuam a usar o INATRO como sistema oficial. O problema e que, quando o INATRO falha, fica lento, nao permite concluir o registo, ou quando a escola precisa continuar o atendimento antes de finalizar o processo oficial, a informacao passa a ser controlada em papel, mensagens ou ficheiros soltos. Isso gera perda de dados, pagamentos sem rastreio, duplicacao de alunos e dificuldade para saber quais inscricoes ainda precisam ser registadas.

O ConduzX deve permitir que a escola continue a operar mesmo nesses momentos: o atendente regista o aluno, cria a inscricao, escolhe a categoria de carta, regista pagamentos totais ou parciais, marca o estado do INATRO manualmente e deixa pendencias organizadas para resolver depois.

## Principio Central

ConduzX e o sistema interno da escola. INATRO e o sistema oficial externo.

Neste MVP, nao existe integracao com o INATRO. O estado do INATRO e registado manualmente pelo utilizador.

## Entidades Principais

- Escola
- Utilizador
- Aluno
- Inscricao
- Categoria de carta
- Pagamento
- Documento
- Historico / audit log

## Aluno

O aluno deve guardar os dados essenciais para a secretaria:

- Nome completo
- Data de nascimento
- Numero de BI, quando existir
- Telefone
- Email, quando existir
- Endereco, quando existir
- Estado interno do aluno atraves da inscricao: ativo, desistiu ou concluido

## Inscricao

A inscricao liga um aluno a uma categoria de carta. Um aluno pode ter mais de uma inscricao ao longo do tempo.

Cada inscricao deve guardar:

- Escola
- Aluno
- Categoria
- Preco total em centavos no momento da inscricao
- Estado do aluno
- Estado manual no INATRO
- Numero de processo do INATRO quando registado
- Nota sobre tentativa ou falha de registo
- Data da inscricao
- Utilizador que criou

## Estados do INATRO

O estado do INATRO e independente do estado de pagamento e do estado do aluno.

Valores permitidos:

- `nao_registado`
- `pendente`
- `registado`

Regras:

- `nao_registado`: ainda nao houve registo ou tentativa relevante no INATRO.
- `pendente`: o processo ficou por resolver, por exemplo porque o INATRO estava indisponivel, lento ou a escola ainda precisa completar a submissao.
- `registado`: o processo foi registado no INATRO e deve ter numero de processo quando aplicavel.

## Pagamentos

- Cada inscricao tem um valor total vindo do preco da categoria no momento da inscricao.
- O preco da categoria pode mudar no futuro sem alterar inscricoes antigas.
- O aluno pode pagar tudo de uma vez ou em varias parcelas.
- Cada pagamento e um registo separado.
- Saldo, total pago e percentagem paga sao sempre calculados.
- Nunca guardar saldo ou percentagem digitados a mao.
- Valores monetarios devem ser inteiros em centavos, nunca `float`.
- Pagamentos nao devem ser editados nem apagados; quando necessario, devem ser anulados com motivo obrigatorio.

## Historico

Toda acao importante deve gerar historico:

- Criacao de aluno
- Atualizacao de aluno
- Criacao de inscricao
- Alteracao de estado do INATRO
- Registo de pagamento
- Anulacao de pagamento
- Alteracao de categoria ou configuracao relevante

O historico deve indicar quem fez, quando fez, qual entidade foi afetada e qual foi a acao.

## Multi-escola

O sistema deve estar preparado para varias escolas desde o inicio.

Toda tabela de negocio deve ter `escola_id`. Toda consulta deve ser filtrada pela escola do utilizador autenticado. Nunca retornar dados de outra escola.

## Utilizadores e Permissoes

Papeis previstos:

- `atendente`: usa o sistema no dia a dia, cadastra alunos, cria inscricoes e regista pagamentos.
- `gestor`: acompanha dados, pagamentos, pendencias e pode anular pagamentos.
- `admin`: gere utilizadores, categorias e configuracoes.

## Fora do Ambito do MVP

Nao construir nesta fase:

- Integracao com INATRO.
- Automatizacao de submissao oficial.
- Pagamentos online.
- WhatsApp.
- Chatbot ou camada de IA operacional.
- App mobile nativa.
- Relatorios avancados.
- Modo offline completo.

## Diretriz de Produto

Priorizar telas simples, rapidas e claras para a secretaria. O utilizador principal pode ter baixo nivel tecnico, entao os fluxos devem exigir poucos cliques, mensagens em Portugues de Mocambique e botoes com acoes obvias.

O MVP deve focar no controle confiavel do processo interno: aluno, inscricao, pagamento, pendencia no INATRO e historico.
