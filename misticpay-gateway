
/**
 * Bot de Integração MisticPay via Supabase Edge Functions - BLUE SHOP ULTIMATE v6.0
 * VERSÃO COM ROTEAMENTO: MisticPay < 1000 | Mercado Pago >= 1000
 */

const SUPABASE_FUNCTION_URL = 'https://xjtkatmixfhxllummglk.supabase.co/functions/v1/misticpay-gateway';
let paymentPollingInterval = null;

// Variável global para garantir que os dados não se percam
window.ultimoPedidoGerado = null;

async function gerarPixMisticPay(pedidoInfo) {
    const payload = {
        amount: Number(pedidoInfo.total),
        payerName: pedidoInfo.clienteNome || 'Cliente Blue Shop',
        payerDocument: '00000000000',
        transactionId: `pedido_${pedidoInfo.numero}_${Date.now()}`,
        description: `Pedido #${pedidoInfo.numero} - Blue Shop`,
        total: pedidoInfo.total // Adicionado para o roteamento na Edge Function
    };

    try {
        const response = await fetch(SUPABASE_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', payload: payload })
        });

        const result = await response.json();
        if (response.ok && result.data) {
            return {
                id: result.data.transactionId,
                qr_code_base64: result.data.qrCodeBase64.includes('base64,') ? result.data.qrCodeBase64.split('base64,')[1] : result.data.qrCodeBase64,
                copy_paste: result.data.copyPaste,
                gateway: result.gateway // Recebe qual gateway foi usado
            };
        }
        throw new Error(result.message || result.error || 'Erro ao gerar Pix');
    } catch (error) {
        console.error('Erro ao chamar Edge Function:', error);
        throw error;
    }
}

async function verificarStatusPagamento(transactionId) {
    try {
        const response = await fetch(SUPABASE_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check', payload: { transactionId } })
        });
        const result = await response.json();
        if (response.ok && result.transaction) {
            return result.transaction.transactionState;
        }
        return null;
    } catch (error) { 
        return null; 
    }
}

window.finalizarPedido = async function() {
    if (!user) { openModal('profile-modal'); return; }
    if (cart.length === 0) { alert("Sua sacola está vazia!"); return; }

    const total = cart.reduce((a, b) => a + b.price, 0);
    const numeroPedido = Math.floor(Math.random() * 9000 + 1000);

    // Salva os dados IMEDIATAMENTE na variável global blindada
    window.ultimoPedidoGerado = {
        numero: numeroPedido,
        total: total,
        clienteNome: user.nome,
        endereco: user.rua,
        numeroEndereco: user.num,
        bairro: user.bairro,
        cidade: user.cidade || '',
        itens: JSON.parse(JSON.stringify(cart)) // Cópia profunda para não perder dados
    };

    const loader = document.createElement('div');
    loader.id = 'pix-full-loader';
    loader.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:#ffffff;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;padding:20px;text-align:center;";
    loader.innerHTML = `
        <div class="shop-loader"></div>
        <h2 style="color:#0047FF;font-weight:900;font-size:20px;margin-top:25px;letter-spacing:-0.5px;">PROCESSANDO...</h2>
        <p style="color:#64748b;font-size:14px;margin-top:8px;font-weight:600;">Gerando seu Pix com segurança</p>
        <style>
            .shop-loader { width: 45px; height: 45px; border: 4px solid #f1f5f9; border-top: 4px solid #0047FF; border-radius: 50%; animation: spin 0.8s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    `;
    document.body.appendChild(loader);

    try {
        const pixData = await gerarPixMisticPay(window.ultimoPedidoGerado);
        document.getElementById('pix-full-loader').remove();
        
        const scrollPos = window.scrollY;
        renderizarPaginaPagamento(pixData, window.ultimoPedidoGerado, scrollPos);
        iniciarMonitoramento(pixData.id, window.ultimoPedidoGerado);

    } catch (error) {
        if (document.getElementById('pix-full-loader')) document.getElementById('pix-full-loader').remove();
        alert("Erro ao processar pagamento: " + error.message);
    }
};

function iniciarMonitoramento(transactionId, pedidoInfo) {
    if (paymentPollingInterval) clearInterval(paymentPollingInterval);
    paymentPollingInterval = setInterval(async () => {
        const status = await verificarStatusPagamento(transactionId);
        if (status === 'COMPLETO') {
            clearInterval(paymentPollingInterval);

            try {
                // ENVIO DOS DADOS COMPLETOS PARA O PAINEL (TABELA PEDIDOS)
                await _supabase.from('pedidos').insert([{
                    usuario_id: user.id,
                    itens: pedidoInfo.itens,
                    total: pedidoInfo.total,
                    pago: true,
                    entregue: false, // Inicia como pendente para o painel de entregas
                    endereco: pedidoInfo.endereco,
                    numeroEndereco: pedidoInfo.numeroEndereco,
                    bairro: pedidoInfo.bairro,
                    cidade: pedidoInfo.cidade
                }]);
            } catch (err) {
                console.error('Erro ao salvar pedido:', err);
            }
            
            const mainContent = document.getElementById('checkout-main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div style="text-align:center;animation:fadeIn 0.5s ease-out;padding:20px 0;">
                        <div style="width:80px;height:80px;background:#00C853;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 25px;box-shadow:0 10px 25px rgba(0,200,83,0.3);">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h2 style="color:#000;font-weight:900;font-size:26px;margin-bottom:12px;letter-spacing:-1px;">PAGAMENTO APROVADO!</h2>
                        <p style="color:#00C853;font-size:16px;margin-bottom:25px;font-weight:800;">Recebemos seu pagamento com sucesso.</p>
                        
                        <div style="background:#F0FFF4;padding:25px;border-radius:20px;border:1px solid #C6F6D5;margin-bottom:30px;text-align:center;">
                            <p style="font-size:15px;color:#22543D;font-weight:700;line-height:1.6;margin:0;">
                                Nosso time já foi notificado e seu pedido entrará em separação em breve! Ja ja está na sua casa.
                            </p>
                        </div>

                        <button onclick="location.reload()" style="width:100%;padding:18px;background:#0047FF;color:white;border:none;border-radius:15px;font-weight:900;font-size:16px;cursor:pointer;box-shadow:0 10px 20px rgba(0,71,255,0.2);">
                             VOLTAR PARA A LOJA
                        </button>
                    </div>
                `;
            }
        } else if (status === 'FALHA') {
            clearInterval(paymentPollingInterval);
            alert("O pagamento falhou. Por favor, tente novamente.");
            fecharPaginaPagamento(window.scrollY);
        }
    }, 4000);
}

function renderizarPaginaPagamento(pixData, pedidoInfo, scrollPos) {
    const page = document.createElement('div');
    page.id = 'checkout-page-container';
    page.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:#ffffff;z-index:9999999;overflow-y:auto;font-family:'Plus Jakarta Sans', sans-serif;";
    
    const itensHTML = pedidoInfo.itens.map(item => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <div style="flex:1;padding-right:10px;">
                <p style="font-size:13px;font-weight:800;color:#000;margin:0;line-height:1.2;">${item.name}</p>
                <p style="font-size:11px;font-weight:600;color:#666;margin:4px 0 0 0;">
                    ${item.color ? `Cor: ${item.color}` : ''} ${item.size ? ` | Tam: ${item.size}` : ''}
                </p>
            </div>
            <p style="font-size:13px;font-weight:800;color:#0047FF;margin:0;white-space:nowrap;">R$ ${item.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
        </div>
    `).join('');

    page.innerHTML = `
        <div style="width:100%;max-width:500px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:#ffffff;">
            <header style="padding:15px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9;position:sticky;top:0;background:white;z-index:10;">
                <button onclick="fecharPaginaPagamento(${scrollPos})" style="background:none;border:none;font-size:20px;color:#000;cursor:pointer;padding:5px;">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div style="text-align:center;">
                    <h1 style="font-size:18px;font-weight:900;color:#0047FF;margin:0;letter-spacing:-1px;">BLUE SHOP EXPRESS</h1>
                </div>
                <div style="width:30px;"></div>
            </header>

            <div id="checkout-main-content" style="padding:20px;animation:fadeIn 0.4s ease-out;">
                <div style="text-align:center;margin-bottom:25px;">
                    <div style="background:#F0F4FF;color:#0047FF;padding:8px 15px;border-radius:100px;font-size:11px;font-weight:800;display:inline-flex;align-items:center;gap:8px;border:1px solid #D0E0FF;">
                        <div class="dot-blink"></div> AGUARDANDO PAGAMENTO
                    </div>
                </div>

                <div style="margin-bottom:25px;">
                    <p style="font-size:14px;font-weight:900;color:#000;margin-bottom:15px;">Escolha a forma de pagamento:</p>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <div id="option-pix" onclick="selecionarMetodo('pix')" style="padding:15px;border:2px solid #0047FF;border-radius:15px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;background:#F5F8FF;">
                            <div style="display:flex;align-items:center;gap:12px;">
                                <div style="width:24px;height:24px;background:#0047FF;border-radius:50%;display:flex;align-items:center;justify-content:center;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <span style="font-size:14px;font-weight:800;color:#000;">Pagar com Pix</span>
                            </div>
                            <img src="https://logopng.com.br/logos/pix-106.png" style="height:18px;">
                        </div>

                        <div id="option-card" onclick="selecionarMetodo('card')" style="padding:15px;border:1px solid #E2E8F0;border-radius:15px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;background:#FFF;">
                            <div style="display:flex;align-items:center;gap:12px;">
                                <div id="card-check" style="width:24px;height:24px;border:2px solid #E2E8F0;border-radius:50%;"></div>
                                <span style="font-size:14px;font-weight:800;color:#000;">Pagar com Cartão</span>
                            </div>
                            <div style="display:flex;gap:4px;">
                                <i class="fa-brands fa-cc-visa" style="color:#1A1F71;font-size:20px;"></i>
                                <i class="fa-brands fa-cc-mastercard" style="color:#EB001B;font-size:20px;"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="payment-area-pix">
                    <div style="background:#ffffff;border-radius:25px;padding:25px;margin-bottom:25px;border:1px solid #f1f5f9;box-shadow:0 10px 30px rgba(0,0,0,0.03);text-align:center;">
                        <div style="background:#f8fafc;padding:15px;border-radius:20px;display:inline-block;margin-bottom:15px;border:1px solid #f1f5f9;">
                            <img src="data:image/png;base64,${pixData.qr_code_base64}" style="width:180px;height:180px;display:block;">
                        </div>
                        <div>
                            <p style="font-size:11px;font-weight:700;color:#666;text-transform:uppercase;margin-bottom:5px;">Total do Pedido</p>
                            <p style="font-size:28px;font-weight:900;color:#000;margin:0;letter-spacing:-1px;">R$ ${pedidoInfo.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                        </div>
                    </div>

                    <div style="margin-bottom:25px;">
                        <p style="font-size:12px;font-weight:800;color:#666;margin-bottom:10px;text-align:center;">Código Pix Copia e Cola</p>
                        <div style="display:flex;gap:8px;">
                            <input type="text" id="pix-copy-paste" value="${pixData.copy_paste}" readonly style="flex:1;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:13px;color:#000;outline:none;font-weight:700;text-overflow:ellipsis;">
                            <button onclick="copiarPix()" style="padding:0 20px;background:#0047FF;color:white;border:none;border-radius:12px;font-weight:800;font-size:13px;cursor:pointer;">COPIAR</button>
                        </div>
                    </div>
                </div>

                <div id="payment-area-card" style="display:none;">
                    <div style="background:#F5F8FF;padding:25px;border-radius:25px;border:1px solid #D0E0FF;text-align:center;margin-bottom:25px;">
                        <div style="width:60px;height:60px;background:#0047FF;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                            <i class="fa-solid fa-credit-card" style="color:white;font-size:24px;"></i>
                        </div>
                        <h3 style="font-size:18px;font-weight:900;color:#000;margin-bottom:10px;">Pagar com Cartão</h3>
                        <p style="font-size:13px;color:#64748b;font-weight:600;line-height:1.5;margin-bottom:20px;">
                            Para pagar com cartão de crédito, você será redirecionado para o nosso atendimento no WhatsApp para receber o link de pagamento seguro.
                        </p>
                        <button onclick="window.solicitarPagamentoCartao()" style="width:100%;padding:18px;background:#25D366;color:white;border:none;border-radius:15px;font-weight:900;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 8px 15px rgba(37,211,102,0.2);">
                            <i class="fa-brands fa-whatsapp" style="font-size:20px;"></i> SOLICITAR NO WHATSAPP
                        </button>
                    </div>
                </div>

                <div style="margin-bottom:25px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <h4 style="font-size:14px;font-weight:900;color:#000;margin:0;">Resumo do Pedido</h4>
                        <span style="font-size:11px;font-weight:700;color:#666;background:#f1f5f9;padding:2px 8px;border-radius:5px;">${pedidoInfo.itens.length} itens</span>
                    </div>
                    <div style="background:#f8fafc;padding:5px 15px;border-radius:20px;border:1px solid #f1f5f9;">
                        ${itensHTML}
                    </div>
                </div>
            </div>
        </div>
        <style>
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .dot-blink { width: 8px; height: 8px; background: #0047FF; border-radius: 50%; animation: blink 1s infinite; }
            @keyframes blink { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
        </style>
    `;
    document.body.appendChild(page);
}

window.selecionarMetodo = function(metodo) {
    const optPix = document.getElementById('option-pix');
    const optCard = document.getElementById('option-card');
    const areaPix = document.getElementById('payment-area-pix');
    const areaCard = document.getElementById('payment-area-card');
    const cardCheck = document.getElementById('card-check');

    if (metodo === 'pix') {
        optPix.style.border = "2px solid #0047FF"; optPix.style.background = "#F5F8FF";
        optCard.style.border = "1px solid #E2E8F0"; optCard.style.background = "#FFF";
        cardCheck.innerHTML = ""; cardCheck.style.background = "transparent";
        areaPix.style.display = "block"; areaCard.style.display = "none";
    } else {
        optCard.style.border = "2px solid #0047FF"; optCard.style.background = "#F5F8FF";
        optPix.style.border = "1px solid #E2E8F0"; optPix.style.background = "#FFF";
        cardCheck.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        cardCheck.style.background = "#0047FF"; cardCheck.style.display = "flex";
        cardCheck.style.alignItems = "center"; cardCheck.style.justifyContent = "center";
        areaPix.style.display = "none"; areaCard.style.display = "block";
    }
};

window.fecharPaginaPagamento = function(scrollPos) {
    const container = document.getElementById('checkout-page-container');
    if (container) container.remove();
    if (paymentPollingInterval) clearInterval(paymentPollingInterval);
    window.scrollTo(0, scrollPos);
};

const WHATSAPP_NUMERO_LOJA = '5596991557184';

window.solicitarPagamentoCartao = function() {
    const info = window.ultimoPedidoGerado || { numero: 'N/A', total: 0, itens: [] };
    const link = `https://wa.me/${WHATSAPP_NUMERO_LOJA}?text=Olá! Gostaria de realizar o pagamento do meu pedido utilizando cartão de crédito #${info.numero} Poderia me enviar o link para pagamento, por favor?
.`;
    window.open(link, '_blank');
};

window.copiarPix = function() {
    const input = document.getElementById('pix-copy-paste');
    input.select();
    navigator.clipboard.writeText(input.value);
    const btn = event.target;
    btn.innerText = "COPIADO!";
    setTimeout(() => { btn.innerText = "COPIAR"; }, 2000);
};
