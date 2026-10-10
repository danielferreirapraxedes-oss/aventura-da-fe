# Como colocar o jogo online (passo a passo)

## O que tem nesta pasta

```
jogo-online/
├── server.js        ← o servidor (não precisa mexer)
├── package.json     ← diz ao Render como ligar o servidor
├── .gitignore
└── public/
    └── index.html   ← o jogo
```

## PARTE 0 — Coloque os outros arquivos do jogo na pasta `public`

Dentro da pasta `public`, coloque junto do `index.html`:

- a pasta **sprites** (com todas as imagens)
- o arquivo **perguntas.js**
- o arquivo **perguntas2.js**

Ficou assim:

```
public/
├── index.html
├── perguntas.js
├── perguntas2.js
└── sprites/
```

Sem isso o jogo abre sem imagens e sem perguntas.

---

## PARTE 1 — GitHub (guarda os arquivos)

O Render pega os arquivos do GitHub.

1. Entre em **https://github.com** e clique em **Sign up** (= Criar conta).
2. Depois de entrar, clique no **+** no canto de cima e em **New repository** (= Novo repositório).
3. Em **Repository name** (= nome do repositório), escreva: `aventura-da-fe`
4. Deixe marcado **Public** (= público) e clique em **Create repository** (= Criar repositório).
5. Na página que abrir, clique em **uploading an existing file** (= enviar um arquivo existente).
6. Arraste para a janela **tudo que está dentro da pasta `jogo-online`**:
   `server.js`, `package.json`, `.gitignore` e a pasta `public`.
   (Se o seu navegador não deixar arrastar pasta, tente pelo computador, ou me avise.)
7. Espere terminar e clique no botão verde **Commit changes** (= Salvar alterações).

## PARTE 2 — Render (liga o servidor)

1. Entre em **https://render.com** e crie a conta com **GitHub** (botão **GitHub**).
   Se ele pedir, clique em **Authorize** (= Autorizar).
2. No painel (**Dashboard**), clique em **+ New** (= Novo) no canto de cima e escolha **Web Service** (= Serviço Web).
3. Escolha **Build and deploy from a Git repository** (= Construir a partir de um repositório Git) e clique em **Next** (= Próximo), se aparecer.
4. Na lista, ache `aventura-da-fe` e clique em **Connect** (= Conectar).
   Se não aparecer, clique em **Configure account** (= Configurar conta) e libere o repositório.
5. Preencha assim:

| Campo (inglês)      | O que escrever / escolher        |
|---------------------|----------------------------------|
| **Name** (Nome)     | `aventura-da-fe`                 |
| **Region** (Região) | a mais perto do Brasil que tiver (ex.: **Virginia** ou **Ohio**) |
| **Branch** (Ramo)   | `main` (já vem escrito)          |
| **Runtime** / **Language** | **Node**                  |
| **Build Command** (Comando de construção) | `npm install` |
| **Start Command** (Comando de início)     | `npm start`   |
| **Instance Type** (Tipo de instância)     | **Free** (Grátis) |

6. Clique em **Create Web Service** (= Criar Serviço Web) lá embaixo.
7. Espere alguns minutos. Quando aparecer **Live** (= No ar) em verde, o jogo está pronto.
8. O endereço fica no alto da página, algo como `https://aventura-da-fe.onrender.com`.
   **Esse é o link para mandar aos amigos.**

## Lembretes importantes

- **Plano grátis dorme:** depois de uns 15 minutos sem ninguém, o servidor dorme. O primeiro a entrar espera cerca de 1 minuto. É normal.
- **Os dados podem sumir:** no plano grátis o arquivo `dados.json` (contas e acertos) **pode ser apagado** quando o servidor reinicia ou você atualiza o jogo. Para os dados ficarem para sempre, o Render tem disco pago (**Disks**) ou um banco de dados. Se quiser, eu adapto o servidor para isso.
- **Mudou algo no jogo?** Troque o arquivo no GitHub (**Add file → Upload files**, enviando de novo). O Render atualiza sozinho.
- **Deu erro?** No Render, clique em **Logs** (= Registros), copie a mensagem e me mande.
