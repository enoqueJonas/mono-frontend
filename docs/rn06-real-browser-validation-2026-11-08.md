# RN06 — Ensaio browser real com cinco identidades

**Data:** 8 de Novembro de 2026  
**Origem:** PR frontend #1 (`feat/rn06-member-voting-ui`) e PR backend #26 (`feat/rn06-independent-disbursement-approval`)  
**Backend da execução inicial:** `62758edef4297eb22b9641dd29e003555ffd5157`  
**Backend da suite ampliada:** `a669916c6fcadd934d4aa3ef830c68adbbfbf9cc`  
**Frontend da execução inicial:** `07fafa4fb691b4191a1ffdac58edb054790fe5eb`  
**Frontend da suite ampliada:** `e881c6f710745d00004bc8a09e79db03c66a08f7`  
**Primeira execução aprovada:** https://github.com/enoqueJonas/mono-frontend/actions/runs/42467051633  
**Execução ampliada aprovada (5/5):** https://github.com/enoqueJonas/mono-frontend/actions/runs/42468814148  
**Artefacto visual/logs:** `rn06-live-e2e-evidence` (ID 13611991756; screenshot do estado concluído e logs da API/frontend).

## Ambiente e garantia de independência

A workflow `.github/workflows/rn06-live-e2e.yml` descarrega *um commit explícito* do backend ainda não integrado, inicializa PostgreSQL 16 efémero, instala Django e Next.js, cria dados sintéticos apenas nesta base e abre Chromium com Playwright.

O ficheiro `backend/integration_tests/seed_rn06_ui.py` prepara cinco grupos independentes, com quatro participantes activos no cenário principal e nos casos de reversão, alteração de membros e configuração legada; no cenário de quórum insuficiente, são três participantes. Há cinco contas sintéticas e um utilizador externo inicialmente fora dos grupos. O teste exige **cinco logins via formulário** e cria um `browser.newContext()` diferente por conta. Cada conta recebe o seu JWT, que é verificado pelo endpoint `GET /api/v1/accounts/me/` com o respectivo ID. Não se interceptam rotas nem se devolvem respostas falsas no browser.

## Operações testadas e aprovadas

1. O gestor cria a proposta na interface, `AWAITING_CONSENSUS`, 0/2, com os montantes e o ciclo preparados.
2. A tentativa REST de concluir sem quórum é rejeitada.
3. Gestor, beneficiário e utilizador externo têm as tentativas REST de aprovação rejeitadas, além de não terem o botão de voto.
4. Votante A vota na interface; o estado mantém-se pendente com 1/2. Uma repetição via REST é rejeitada.
5. Votante B, numa sessão de browser independente, vota; estado 2/2, `APPROVED`.
6. Gestor conclui a operação na interface; API retorna `COMPLETED` e a rotação é marcada como `COMPLETED`.

**Resultado:** Playwright **1/1 passed (8.2s)**, CI global de browser **success**. A validação TypeScript e o build Next.js do mesmo commit também tiveram sucesso.


## Suite ampliada e cenários adversariais — 8 de Novembro de 2026

A execução de GitHub Actions [42468814148](https://github.com/enoqueJonas/mono-frontend/actions/runs/42468814148) validou **5/5 testes Playwright (17,8 segundos)**, sem respostas falsas nas chamadas HTTP utilizadas pelos browsers. O frontend foi validado também com TypeScript e build Next.js. As três workflows do backend no commit fixado terminaram com sucesso.

| Cenário | Critério demonstrado |
|---|---|
| Fluxo principal | Dois votos independentes e conclusão administrativa; rotação concluída |
| Reversão de contribuição após votos | Uma alteração `CONFIRMED → REVERSED` efectuada por comando guardado na base PostgreSQL de testes faz a conclusão falhar na UI; desembolso não é concluído e rotação não avança |
| Entrada tardia de membro | Gestor adiciona membro por endpoint REST real; nova conta não vota na proposta anterior; conclusão é bloqueada pelo instantâneo de participantes |
| Grupo com três participantes | Não existem dois votantes elegíveis independentes: criação da proposta rejeitada |
| Configuração legada `requires_consensus=false` | A proposta mantém `AWAITING_CONSENSUS` e é impossível concluir sem votos |

A reversão foi **injecção de falha em base de teste efémera** com `integration_tests/inject_rn06_ui_fault.py`, não execução de reembolso, reversão por operador M-Pesa/e-Mola ou integração bancária. A adesão tardia foi efectuada através da API real, autenticada como gestor. Os cenários usam bases de registos distintas para evitar dependência entre testes; `browser.newContext()` mantém sessões independentes para os papéis envolvidos.

## Repetição

O teste requer o ambiente efémero equivalente ao da workflow, e não deve correr contra instalações reais. Para executar manualmente, utilizar o backend do SHA indicado, PostgreSQL de teste, `DJANGO_SETTINGS_MODULE=config.settings_integration`, `DEBUG=1`, configurar `RN06_E2E_PASSWORD` (sintética), `RN06_E2E_FIXTURE_PATH`, `RN06_LIVE_E2E_SEED=1`, fazer `migrate`, executar o script seed via `python manage.py shell -c 'exec(open("integration_tests/seed_rn06_ui.py").read())'`, iniciar API na porta 8000 e o Next.js compilado na porta 3000 com `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`.

Depois:

```bash
npx playwright test --config=e2e/playwright.config.ts
```

O comando mais fiável para repetir todo o processo é o botão **Re-run jobs** no workflow indicado.

## Falhas de segurança e limitações remanescentes

- Foram aprovados **cinco cenários de browser** na suite ampliada; não houve ensaio de concorrência entre pedidos financeiros, de usurpação de identidade, de acesso comprometido ou de novas regras de recuperação de aprovação revogada.
- Os registos de contribuições foram **criados directamente na base de dados de teste**. Os pagamentos são sintéticos; não existe comprovação de liquidação por M-Pesa/e-Mola/banco.
- Os votos são autorizações de contas no backend, sem assinaturas autocustodiadas.
- O blockchain do protótipo possui operador centralizado; esta CI não valida consenso independente de múltiplos nós. Uma afirmação de 'governação distribuída' no ecrã de login foi removida no mesmo PR após o ensaio inicial.
- A base de teste inclui grupos de **quatro e três membros activos**; o de três bloqueia por falta de votantes elegíveis. O modelo de participação no início do ciclo e a política para ex-membros não estão definidos.
- Frontend PR #1 e backend PR #26 continuam **draft** e dependem da cadeia de PRs backend #22 e #14; a execução da CI não demonstra deploy em master nem em produção.

**Conclusão defensável:** evidência de funcionamento integrado, com contas autenticadas e cenários negativos de verificação do quórum administrativo RN06, num ambiente experimental restrito. Não é evidência de prevenção de desvios financeiros reais, nem de execução de pagamentos por operadores externos. Os cinco testes são uma suite de validação, não um estudo de eficácia contra fraude.
