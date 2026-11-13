# Painel da Casa

Aplicativo de **controle financeiro para um casal**, para Windows. Lança gastos e recebimentos, mostra um painel com o resumo do mês, separa por forma de pagamento (débito, crédito, Pix e vale-alimentação), controla compras parceladas e gera uma planilha Excel (`CONTAS_.xlsx`) automaticamente a cada lançamento.

> ## ⚠️ Todos os dados deste repositório são fictícios
> Os nomes (Ana, Bruno e Carla), os valores, as descrições e as datas que aparecem no código, no `seed/dados.json` e neste README são **inventados, apenas para exemplo**. Este repositório **não contém nenhuma informação pessoal ou financeira real**: nenhum nome verdadeiro, conta, saldo, dívida ou lançamento de pessoa alguma.
> Os arquivos com dados de quem usa o app (`dados.json` e `CONTAS_.xlsx`) ficam só no computador do usuário e estão no `.gitignore`, para nunca serem enviados ao GitHub por engano.

O projeto nasceu como uma página web dentro do Claude (artefato) e foi evoluindo até virar um programa de desktop que funciona sem internet e sem depender de nenhuma conta.

## O que ele faz

- **Lançar gastos** com valor, descrição, categoria, forma de pagamento, data, para quem passar (cada pessoa da casa) e situação (já pago ou a pagar).
- **Compras parceladas**: informa o total (ou o valor da parcela) e o número de parcelas; o app cria uma parcela por mês nos meses seguintes. Ao apagar, dá para remover só uma parcela ou todas.
- **Recebimentos lançados manualmente**, porque o valor muda todo mês. Podem ser em dinheiro ou em vale-alimentação.
- **Resumo do mês**: quanto ainda cabe, quanto falta pagar, total por forma de pagamento, por categoria, por pessoa, parcelas dos próximos meses e comparação mês a mês.
- **Conselhos financeiros** baseados em boas práticas (por exemplo, regra 50/30/20, reserva de emergência, peso das parcelas na renda), calculados a partir dos lançamentos.
- **Histórico** com abas por forma de pagamento, filtro "A pagar", marcar como pago e trocar a forma de pagamento sem apagar o lançamento.
- **Planilha Excel automática**: a cada alteração o app regenera o `CONTAS_.xlsx` com todos os lançamentos, resumo mensal por categoria e menus de listas.
- **Uso a dois**: os dados ficam numa pasta sincronizada (por exemplo OneDrive); cada pessoa usa o app no seu computador.

## Tecnologias

| Parte | Tecnologia |
|---|---|
| Aplicativo desktop | [Electron](https://www.electronjs.org/) (processo principal, `preload` e `contextBridge`) |
| Interface | HTML, CSS e JavaScript puro (sem framework), SVG para os gráficos |
| Empacotamento | [electron-builder](https://www.electron.build/) (executável portátil `.exe`) |
| Armazenamento | Arquivo JSON local (`dados.json`) com escrita atômica |
| Planilha | Gerador próprio de `.xlsx` em JavaScript (Office Open XML + ZIP), sem bibliotecas |
| Plataforma | Node.js e Windows |

## Como funciona

```
┌────────────── Janela (renderer) ──────────────┐
│  app/index.html  (telas Resumo / Lançar /     │
│                   Histórico)                  │
│  app/shim.js     (banco de dados "de mentira" │
│                   que fala com o app)         │
└──────────────┬────────────────────────────────┘
               │ preload.js (contextBridge)  load / apply
┌──────────────▼────────────────────────────────┐
│  main.js  (janela, menu, escolha da pasta)    │
│  store.js (lê e grava dados.json,             │
│            regenera CONTAS_.xlsx)             │
│  xlsx.js  (gerador de planilha .xlsx)         │
└──────────────┬────────────────────────────────┘
               ▼
   <pasta de dados>/dados.json   ← banco de dados
   <pasta de dados>/CONTAS_.xlsx ← gerada automaticamente
```

### Decisões de projeto

- **Reaproveitar a interface original.** A tela foi escrita para o ambiente do Claude, que oferece um banco de documentos (`collection`, `doc`, `onSnapshot`). Em vez de reescrever, o `app/shim.js` implementa essa mesma interface em cima do armazenamento local. Assim a tela funciona igual nos dois ambientes.
- **Operações em vez de "salvar tudo".** Cada alteração é enviada como uma operação (`set`, `update`, `delete`). O `store.js` relê o arquivo antes de aplicar, para não apagar o que a outra pessoa lançou enquanto o app estava aberto. A janela também relê os dados ao voltar ao foco e a cada 30 segundos.
- **Escrita atômica.** O arquivo é gravado em um temporário e renomeado, para não corromper os dados se o computador desligar no meio.
- **Planilha sem biblioteca.** O `xlsx.js` monta o arquivo Office Open XML e o ZIP à mão (tabela do Excel, validações de lista, formatação condicional, fórmulas `SUMIFS` com o valor já calculado). O resultado foi conferido recalculando no LibreOffice.
- **Sem sobrescrever nada à mão.** O `dados.json` é a fonte da verdade e a planilha é sempre gerada a partir dele.

### Modelo de dados (`dados.json`)

```json
{
  "versao": 1,
  "gastos": {
    "<id>": {
      "valor": 324, "descricao": "Celular", "categoria": "Outros",
      "meio": "credito", "data": "2026-12-08", "pago": false,
      "para": "Ana", "parcela": 1, "parcelas": 10, "grupo": "<id do parcelamento>"
    }
  },
  "receitas": {
    "<id>": { "valor": 1400, "descricao": "Salário", "tipo": "din", "data": "2026-11-05" }
  },
  "config": { "base": { "reserva": 0 } }
}
```

`meio` pode ser `debito`, `credito`, `pix` ou `va`. Um lançamento com `tipo: "ajuste"` é um abatimento (valor negativo) que não entra nas categorias.

## Estrutura do projeto

```
main.js       processo principal do Electron
preload.js    ponte segura entre a janela e o processo principal
store.js      leitura/escrita do dados.json e geração da planilha
xlsx.js       gerador de .xlsx
app/          interface (index.html e shim.js)
seed/         dados de exemplo (fictícios), copiados na primeira execução
package.json  scripts e configuração do electron-builder
```

## Como usar

Requisitos: [Node.js](https://nodejs.org/) (LTS) no Windows.

```bash
npm install
npm start          # abre o app em modo de teste
npm run build      # gera dist/Painel-da-Casa.exe (portátil, não precisa instalar)
```

Os dados ficam em `C:\Users\<usuário>\OneDrive\Documentos\Contas a Pagar` (ou em `Documentos\Contas a Pagar`, se não houver OneDrive). O caminho aparece na barra de título, e o menu **Arquivo > Escolher outra pasta de dados** permite trocar.

### Problemas comuns

- **Erro de link simbólico ou permissão no `npm run build`:** ative o Modo de Desenvolvedor do Windows ou rode o terminal como administrador.
- **Aviso do SmartScreen ao abrir o `.exe`:** é esperado, o programa não tem assinatura digital. Clique em "Mais informações" e "Executar assim mesmo".
- **Planilha aberta no Excel:** o lançamento é salvo, mas a planilha só é atualizada depois que você fechar o arquivo e lançar de novo.

## Limitações

- Alterações feitas direto no Excel **não voltam** para o app: a planilha é só para consulta.
- Duas pessoas lançando ao mesmo tempo em computadores diferentes podem gerar conflito de sincronização do OneDrive.
- Os nomes do campo "Passar para" estão fixos no código (`Ana`, `Bruno` e `Carla`, nomes fictícios). Para usar os nomes da sua casa, troque a constante `PARA` em `app/index.html` e a lista `PARAL` em `xlsx.js` (e, se já tiver dados, o campo `para` no `dados.json`).
- Sem assinatura digital e sem atualização automática.

## Privacidade

Os dados de exemplo do `seed/dados.json` são fictícios. Para começar com o app vazio, troque o conteúdo desse arquivo por `{"versao":1,"gastos":{},"receitas":{},"config":{}}` antes de gerar o `.exe`, ou apague os exemplos pelo próprio app.

Os dados não saem do computador: não há servidor, conta nem telemetria. O `.gitignore` impede que `dados.json` e `CONTAS_.xlsx` sejam enviados ao repositório.

## Histórico do projeto

1. Planilha de Excel simples para gastos do casal.
2. Página web privada com painel, categorias e conselhos.
3. Parcelamentos, formas de pagamento separadas e importação da planilha existente.
4. Recebimentos manuais e exportação para `.xlsx`.
5. Este aplicativo desktop, com armazenamento local e planilha automática.

Desenvolvido com apoio do Claude (Anthropic).
