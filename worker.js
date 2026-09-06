const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (!env.UPSTREAM_SERVER || !env.IPTV_USERNAME || !env.IPTV_PASSWORD) {
      return withCors(new Response("Configure UPSTREAM_SERVER, IPTV_USERNAME e IPTV_PASSWORD nos secrets.", { status: 500 }));
    }

    const incoming = new URL(request.url);
    const upstream = env.UPSTREAM_SERVER.replace(/\/$/, "");
    let targetPath = incoming.pathname;
    let targetUrl;

    if (targetPath === "/player_api.php" || targetPath === "/player_api.php/") {
      const params = new URLSearchParams(incoming.search);
      params.set("username", env.IPTV_USERNAME);
      params.set("password", env.IPTV_PASSWORD);
      targetUrl = `${upstream}/player_api.php?${params.toString()}`;
    } else if (targetPath.startsWith("/movie/") || targetPath.startsWith("/series/")) {
      const parts = targetPath.split("/").filter(Boolean);
      if (parts.length < 2 || parts.length > 3) return withCors(new Response("Caminho inválido.", { status: 400 }));
      targetUrl = `${upstream}/${parts[0]}/${encodeURIComponent(env.IPTV_USERNAME)}/${encodeURIComponent(env.IPTV_PASSWORD)}/${parts.slice(1).join("/")}${incoming.search}`;
    } else {
      return withCors(new Response("Endpoint não encontrado.", { status: 404 }));
    }

    try {
      const upstreamResponse = await fetch(targetUrl, {
        method: request.method,
        headers: { "User-Agent": "BLUEFlix/1.0" },
        redirect: "follow",
      });
      return withCors(upstreamResponse);
    } catch (error) {
      return withCors(new Response("Falha ao acessar o servidor de conteúdo.", { status: 502 }));
    }
  },
};
