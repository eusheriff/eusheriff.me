# Future Engineering — OpenPage `eusheriff.me`

## 1. DIAGNÓSTICO ARQUITETURAL

### Família & Stack

**Família:** `app` — site web estático de uma página, com comportamento interativo local.

**Stack observada:** HTML5, CSS inline, JavaScript vanilla, SVG, imagens/vídeo locais, Google Fonts, Cloudflare Pages e `_headers`. Há integração de Cloudflare Web Analytics, JSON-LD, `robots.txt`, `sitemap.xml` e `llms.txt`. Não há backend, banco, API própria, pipeline declarada, package manager, lockfile ou suíte de testes no checkout.

### Nível atual

**Sólido** para um portfólio estático: publicação edge, SEO, acessibilidade e práticas básicas estão acima do padrão. Não é **Avançado** como plataforma de engenharia porque a cadeia de build, validação e proveniência ainda não está formalizada.

### Forças & Fraquezas

**Forças:** superfície pequena e rápida; deploy reproduzível por upload no Cloudflare Pages; CSP e headers de segurança; modais com `role="dialog"`, `aria-labelledby`, `aria-hidden`/`inert` e foco; links externos com `noopener noreferrer`; structured data; `llms.txt`; previews oficiais dos projetos quando disponíveis; layout mobile validado.

**Fraquezas remanescentes:** HTML/CSS/JS ainda é uma superfície monolítica de aproximadamente 2.000 linhas, com handlers inline e `innerHTML` dinâmico; a CSP ainda conserva `unsafe-inline`; o CI valida e gera SBOM/provenance, mas o deploy continua sendo uma operação separada; analytics ainda mede principalmente RUM, não eventos de conversão; dependência de URLs externas para previews; claims de projetos ainda precisam de manifesto de evidências versionado.

### Estado após a execução

Foram implementados o contrato `content/projects.json`, schema JSON, `AGENTS.md`, ADR-001, `package.json`/`package-lock.json`, validação de sitemap/LLM/headers/segredos, seis invariantes automatizadas, workflow de CI, SBOM SPDX, digest SHA-256 e attestation de provenance. O contrato é usado como gate de consistência contra `index.html`; a migração completa da apresentação para projeções geradas permanece deliberadamente separada para não reescrever uma superfície publicada sem necessidade.

### Prontidão 2030 — **Nota: 7,8/10**

A experiência publicada agora tem contrato, checks, instruções para agentes, SBOM e provenance no CI. A nota ainda não é 10 porque a publicação não é totalmente conectada ao pipeline, a CSP ainda tolera inline e não há evidência automatizada de claims nem eventos de conversão próprios.

## 2. TABELA DE GAPS DIA ZERO

| Melhoria | Área | Gap Identificado | Camada | Impacto | Complexidade | Dependência | Ordem Técnica de Execução |
|---|---|---|---|---|---|---|---|
| Extrair CSS e JS para módulos | Arquitetura | Um único HTML mistura conteúdo, estilo e comportamento | Camada 1 | DX, Confiabilidade | Média | Nenhuma | 1 |
| Adicionar `package.json` e lockfile | Build | Não há versão formal do toolchain | Camada 0 | Reprodutibilidade, DX | Baixa | Node/npm | 2 |
| Lint HTML/CSS/JS estrito | Sanidade | Erros estruturais só aparecem no browser | Camada 0 | Confiabilidade, DX | Baixa | Toolchain | 3 |
| Testes de interação | Qualidade | Modais, filtros, links e foco não têm regressão automatizada | Camada 0 | Confiabilidade, Acessibilidade | Média | Browser test runner | 4 |
| Contrato de conteúdo dos projetos | Contratos | Cards podem divergir de `llms.txt`, sitemap e links reais | Camada 2 | Governabilidade, SEO | Média | Schema JSON | 5 |
| ADR-001 de arquitetura estática | Arquitetura | Decisões e limites não estão registrados | Camada 1 | DX, Governabilidade | Baixa | Nenhuma | 6 |
| CSP por nonce/hash | Segurança | `unsafe-inline` e `https:` ampliam superfície | Camada 2 | Segurança | Média | Separação de JS/CSS | 7 |
| SBOM + auditoria de dependências | Supply chain | Não existe inventário de componentes | Camada 2 | Segurança, Governabilidade | Baixa | package manager | 8 |
| Provenance e assinatura do release | Supply chain | Deploy não prova qual fonte gerou o artefato | Camada 3 | Segurança, Governabilidade | Alta | CI/GitHub OIDC | 9 |
| SLO de disponibilidade e freshness | Operação | Não há alvo operacional mensurável | Camada 2 | Confiabilidade | Baixa | Analytics/monitoramento | 10 |
| Eventos de conversão privacy-first | Observabilidade | Pageview não distingue projeto, contato e licenciamento | Camada 2 | Governabilidade, DX | Média | Beacon/endpoint compatível | 11 |
| Manifesto seguro para agentes | Agent readiness | Agentes não têm comandos, invariantes e limites declarados | Camada 3 | Governabilidade, Segurança | Média | Testes + CI | 12 |

## 3. TOP 5 DEEP DIVE

### 1. Contrato único de conteúdo

**Área e conceito:** transformar cada projeto em um registro validável (`id`, nome, URL, categoria, evidência, métricas e preview). HTML, `llms.txt`, JSON-LD e sitemap passam a ser projeções do mesmo contrato.

**Estado da arte (2026/2030):** hoje sites pessoais duplicam texto em vários arquivos. A exigência futura é evitar drift semântico e permitir que ferramentas humanas e agentes validem a publicação por dados, não por inspeção visual. JSON Schema é a base formal para validar documentos JSON.

**Plano:** (1) criar `content/projects.json` e schema; (2) gerar/verificar as projeções no CI; (3) falhar o build se URL, categoria ou métrica divergirem.

**Métrica:** zero projetos órfãos ou URLs divergentes; validação em menos de 2 segundos.

### 2. Pipeline determinístico com provenance

**Área e conceito:** toda publicação deve ser resultado de uma revisão e de uma fonte identificável, com hash do artefato e metadados de build.

**Estado da arte (2026/2030):** deploy manual é funcional, mas não demonstra quem produziu o artefato nem quais verificações passaram. SLSA define níveis e requisitos para aumentar a confiança na cadeia de software; Sigstore/Cosign permite assinatura sem depender de chave estática.

**Plano:** (1) adicionar CI para lint, testes, links e checksum; (2) gerar SBOM e provenance no pipeline; (3) publicar apenas artefatos aprovados e anexar o digest ao release.

**Métrica:** build idêntico a partir do mesmo commit; 100% dos releases com commit, digest e resultado de checks.

### 3. CSP estrita e isolamento de conteúdo

**Área e conceito:** reduzir execução inline e permissões de rede ao mínimo necessário.

**Estado da arte (2026/2030):** a política atual protege contra vários vetores, mas `unsafe-inline` e `https:` são concessões largas. CSP Level 3 recomenda nonce/hash e diretivas específicas; Trusted Types pode reduzir sinks DOM perigosos.

**Plano:** (1) mover JS/CSS para arquivos locais; (2) restringir `script-src`, `connect-src`, fontes e imagens a domínios usados; (3) eliminar `innerHTML` não necessário ou sanitizar entradas do contrato.

**Métrica:** nenhum `unsafe-inline` em scripts; zero violações CSP em navegação normal; zero URL não declarada.

### 4. Testes de interação e acessibilidade como contrato

**Área e conceito:** tratar abertura/fechamento de modais, foco, `Esc`, filtros, links externos e viewport mobile como invariantes.

**Estado da arte (2026/2030):** testes manuais são frágeis. WCAG 2.2, axe e testes de browser permitem bloquear regressões antes do deploy.

**Plano:** (1) testar cada comando e card; (2) testar foco, `aria-hidden` e `inert`; (3) executar Lighthouse/axe em desktop e mobile no CI.

**Métrica:** Lighthouse ≥95 em todas as categorias; zero erros de console; cobertura de 100% dos fluxos críticos.

### 5. Readiness para agentes com fail-closed

**Área e conceito:** agentes devem operar por comandos documentados, mudanças pequenas, checks obrigatórios e limites explícitos — sem receber autonomia irrestrita sobre publicação.

**Estado da arte (2026/2030):** muitos repositórios fornecem apenas README e deixam o agente inferir invariantes. Para esta OpenPage, OPA/Kyverno/WASM no runtime do site seriam desproporcionais; o equivalente correto é policy-as-code no CI e proteção do ambiente de deploy.

**Plano:** (1) criar `AGENTS.md` com comandos permitidos, arquivos sensíveis e invariantes; (2) validar diff, links, CSP, HTML e acessibilidade antes do deploy; (3) exigir aprovação para publicação e manter rollback por deployment.

**Métrica:** nenhuma publicação sem checks verdes; nenhuma alteração em headers/analytics sem revisão explícita; rollback em menos de 5 minutos.

## 4. ANÁLISE POR ÁREAS DE ENGENHARIA

### Performance/Build

O site tem baixa complexidade de runtime, mas baixa formalização de build. O maior ganho não é adicionar frameworks: é separar conteúdo, CSS e JS, comprimir imagens/vídeo, definir orçamento de bytes e testar o caminho crítico. Fixar versões e usar lockfile elimina drift do toolchain. O vídeo de fundo deve continuar opcional em `prefers-reduced-motion` e conexões lentas.

### Arquitetura/Contratos

A arquitetura correta é um monólito estático modular. Microsserviços, Protobuf, AsyncAPI, D1 ou WASM não agregam valor ao runtime desta página. O contrato necessário é de conteúdo e publicação: schema dos projetos, URLs canônicas, claims, previews e links. ADRs devem registrar essa decisão e o limite: produtos como ABS Core e CORTEX têm seus próprios runtimes.

### Observabilidade

Cloudflare Web Analytics cobre RUM e desempenho básico. Falta uma camada de conversão sem PII: eventos como `project_open`, `external_project_click`, `contact_intent` e `licensing_email`. Devem ser agregados, sem texto livre, telefone ou identificadores pessoais. SLO inicial razoável: disponibilidade ≥99,9% mensal, erro JS igual a zero e freshness de conteúdo ≤7 dias após release.

### Segurança/Supply Chain

Os headers são bons para um site estático, mas a CSP ampla e o JavaScript inline dificultam uma política de menor privilégio. O próximo ciclo deve introduzir SBOM, Dependabot/Renovate caso dependências sejam adicionadas, secret scanning, link checking, provenance e assinatura. Nenhum segredo deve entrar em HTML, `llms.txt`, analytics ou logs.

## 5. ROTEIRO DE EXECUÇÃO DIA ZERO

### Passo 1 — Fundações e rigor (Camadas 0 e 1)

1. Fixar Node/toolchain com `package.json` e lockfile.
2. Extrair `src/content`, `src/styles` e `src/app` sem mudar a experiência.
3. Adicionar lint HTML/CSS/JS, formatador e testes de browser.
4. Criar `AGENTS.md`, `CONTRIBUTING.md` e ADR-001.
5. Definir budgets de HTML, JS, CSS, imagem e vídeo.

### Passo 2 — Contratos e isolamento (Camada 2)

1. Criar schema de projetos e gerar/verificar HTML, `llms.txt` e sitemap.
2. Adicionar OpenAPI somente se surgir endpoint; não fabricar uma API para o site.
3. Restringir CSP, remover inline scripts e validar URLs externas.
4. Gerar SBOM, checksum e relatório de links no CI.
5. Definir SLOs, alertas de disponibilidade e validação de Web Analytics.

### Passo 3 — Políticas e prontidão de agentes (Camada 3)

1. Especificar políticas fail-closed no CI: lint, testes, CSP, links, schema e acessibilidade.
2. Usar provenance/assinatura do artefato e ambiente de deploy protegido.
3. Separar telemetria de página de eventos de conversão, sem PII.
4. Permitir que agentes proponham patches, mas exigir checks e aprovação humana para release.
5. Reservar OPA/Kyverno/WASM para os produtos que realmente executam agentes, não para a camada de apresentação.

## 6. O VEREDITO

**Nota geral:** 7,8/10 para nascer à frente do tempo; 9,5/10 como portfólio estático já publicado.

**GAP mais crítico remanescente:** a cadeia validada ainda não é a única cadeia de publicação: o CI verifica o conteúdo e gera evidências, mas o deploy Cloudflare precisa ser ligado ao release aprovado. A CSP e a prova dos claims são os próximos controles de maior valor.

### “Só uma coisa para esta semana”

Conectar o deploy Cloudflare ao workflow `quality.yml` somente após `npm run check` e a attestation passarem. Isso fecha o caminho entre fonte validada, artefato atestado e produção.

## Referências técnicas

- [JSON Schema](https://json-schema.org/specification)
- [SLSA — Supply-chain Levels for Software Artifacts](https://slsa.dev/spec/v1.0/)
- [Sigstore](https://www.sigstore.dev/)
- [W3C Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [OpenTelemetry](https://opentelemetry.io/docs/)
- [Cloudflare Web Analytics RUM beacon](https://developers.cloudflare.com/speed/observatory/rum-beacon/)
- [Cloudflare Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/)
- [OPA](https://www.openpolicyagent.org/docs)
- [llms.txt specification](https://llmstxt.org/)
