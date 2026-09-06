# BLUEFlix no GitHub Pages

Este pacote separa a interface pública do acesso à API IPTV. O arquivo `index.html` deve ser publicado no GitHub Pages. O arquivo `worker.js` deve ser publicado como Cloudflare Worker para que usuário e senha não fiquem expostos no navegador.

## 1. Criar o Worker

1. Entre em [dash.cloudflare.com](https://dash.cloudflare.com/), abra **Workers & Pages** e crie um Worker.
2. Substitua o código do Worker pelo conteúdo de `worker.js`.
3. Em **Settings > Variables and Secrets**, adicione os seguintes secrets:

| Nome | Valor |
|---|---|
| `UPSTREAM_SERVER` | URL do servidor IPTV, com `http://` ou `https://`, sem barra final |
| `IPTV_USERNAME` | usuário IPTV |
| `IPTV_PASSWORD` | senha IPTV |

4. Publique o Worker e copie a URL, por exemplo:

```text
https://blueflix-api.seu-subdominio.workers.dev
```

## 2. Configurar o site

Abra `index.html` e substitua:

```js
const SERVER = "https://SEU-WORKER.workers.dev";
```

pela URL real do Worker. Não coloque usuário ou senha no `index.html`.

## 3. Publicar no GitHub

Envie somente estes arquivos para o repositório:

```text
index.html
README.md
```

Não publique o `worker.js` se ele tiver sido editado com credenciais reais. O Worker deve ficar publicado na Cloudflare, com as credenciais armazenadas como secrets.

No GitHub, abra **Settings > Pages**, selecione **Deploy from a branch**, escolha a branch principal e a pasta `/root`. Depois de alguns minutos, o site ficará disponível no endereço do Pages.

## 4. Teste obrigatório

Abra no navegador:

```text
https://SEU-WORKER.workers.dev/player_api.php?action=get_vod_categories
```

O resultado esperado é JSON. Se aparecer `403`, o servidor IPTV bloqueou o Worker ou as credenciais/URL estão incorretas. Se aparecer erro de CORS, confirme que está usando o `worker.js` deste pacote.

Depois abra o site do GitHub Pages e confira o console do navegador. O site precisa carregar categorias e imagens via HTTPS.

## Importante

O servidor IPTV usado anteriormente respondeu `403 Forbidden` nos testes. Portanto, mesmo com o pacote pronto, será necessário usar uma URL IPTV válida e acessível pelo Cloudflare Worker. O GitHub Pages sozinho não consegue corrigir um servidor que bloqueia requisições.

Também confirme que você tem autorização para utilizar e distribuir o conteúdo do servidor IPTV. O pacote não fornece conteúdo nem contorna bloqueios de acesso.
