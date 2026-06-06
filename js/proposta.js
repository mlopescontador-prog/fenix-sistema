// ════════════════════════════════════════
// FÊNIX CONT — proposta.js
// Gerador de propostas PDF
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ PROPOSTA COMERCIAL ═══
function renderClienteSugest(){
  // Autocomplete simples — opcional, lista clientes em datalist
  const input=document.getElementById('prp-nome');
  if(!input||document.getElementById('cliDatalist'))return;
  const dl=document.createElement('datalist');dl.id='cliDatalist';
  dl.innerHTML=cli.map(c=>`<option value="${c.nome}">`).join('');
  input.setAttribute('list','cliDatalist');
  input.parentNode.appendChild(dl);
}
function atualizarPreview(){
  const nome=document.getElementById('prp-nome')?.value||'__NOME DO CLIENTE__';
  const cnpj=document.getElementById('prp-cnpj')?.value||'';
  const trib=document.getElementById('prp-trib')?.value||'';
  const vig=document.getElementById('prp-vig')?.value||'12';
  const soc=document.getElementById('prp-soc')?.value||'1';
  const fun=document.getElementById('prp-fun')?.value||'0';
  const ramo=document.getElementById('prp-ramo')?.value||'__RAMO__';
  const valor=Number(document.getElementById('prp-valor')?.value||0);
  const pgto=document.getElementById('prp-pgto')?.value||'';
  const venc=document.getElementById('prp-venc')?.value||'20';
  const escopo=document.getElementById('prp-escopo')?.value||'';
  const obs=document.getElementById('prp-obs')?.value||'';
  const hoje=new Date().toLocaleDateString('pt-BR');
  const escopoLista=escopo.split('\n').filter(l=>l.trim()).map(l=>`<li style="margin-bottom:3px;">${l.replace(/^-\s*/,'')}</li>`).join('');
  const prev=`
    <div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #059669;padding-bottom:12px;">
      <div style="font-size:18px;font-weight:700;color:#059669;">FÊNIX SERVIÇOS CONTÁBEIS LTDA</div>
      <div style="font-size:9px;color:#475569;">CNPJ 17.381.348/0001-79 · CRC nº 266853/O-6</div>
    </div>
    <div style="text-align:center;font-size:14px;font-weight:700;margin-bottom:16px;">PROPOSTA COMERCIAL — SERVIÇOS CONTÁBEIS</div>
    <div style="margin-bottom:14px;">
      <strong>Cliente:</strong> ${nome}<br>
      ${cnpj?'<strong>CNPJ:</strong> '+cnpj+'<br>':''}
      <strong>Ramo:</strong> ${ramo}<br>
      <strong>Regime:</strong> ${trib} · <strong>Sócios:</strong> ${soc} · <strong>Funcionários:</strong> ${fun}
    </div>
    <div style="background:#f1f5f9;padding:12px;border-radius:6px;margin-bottom:14px;">
      <div style="font-weight:700;color:#059669;margin-bottom:6px;">VALORES E CONDIÇÕES</div>
      <strong>Mensalidade:</strong> ${R(valor)}<br>
      <strong>Forma de pagamento:</strong> ${pgto}<br>
      <strong>Dia de vencimento:</strong> ${venc}<br>
      <strong>Vigência:</strong> ${vig} meses, renovável automaticamente
    </div>
    <div style="margin-bottom:14px;">
      <div style="font-weight:700;color:#059669;margin-bottom:6px;">ESCOPO DOS SERVIÇOS</div>
      <ul style="margin:0;padding-left:18px;">${escopoLista}</ul>
    </div>
    ${obs?'<div style="margin-bottom:14px;"><strong>Observações:</strong><br>'+obs.replace(/\n/g,'<br>')+'</div>':''}
    <div style="font-size:9px;color:#64748b;margin-top:24px;padding-top:12px;border-top:1px solid #cbd5e1;">
      São Paulo, ${hoje}<br>
      <strong>Marcos Lopes da Silva</strong> — Fênix Serviços Contábeis
    </div>`;
  const cont=document.getElementById('prp-preview');
  if(cont)cont.innerHTML=prev;
}
function gerarPropostaPDF(){
  const nome=document.getElementById('prp-nome')?.value;
  if(!nome||!nome.trim()){toast('Informe o nome do cliente','warn');return;}
  atualizarPreview();
  const html=document.getElementById('prp-preview').innerHTML;
  const w=window.open('','_blank','width=820,height=900');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Proposta — ${nome}</title>
    <style>body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;line-height:1.5;padding:30px;color:#0f172a;}@media print{body{padding:15px;}}</style>
    </head><body>${html}<script>setTimeout(()=>window.print(),300);<\/script></body></html>`);
  w.document.close();
  addLog('Proposta gerada: '+nome);
}
// Listener para atualizar preview ao digitar
document.addEventListener('input',(e)=>{
  if(e.target&&e.target.id&&e.target.id.startsWith('prp-'))atualizarPreview();
});
