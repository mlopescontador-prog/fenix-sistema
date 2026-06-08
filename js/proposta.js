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
function setTipoProposta(tipo){
  document.getElementById('prp-tipo').value=tipo;
  ['prospeccao','renovacao','distrato'].forEach(t=>{
    const b=document.getElementById('prp-tipo-'+t);
    if(b)b.className='btn '+(t===tipo?'ba':'bo')+' bsm';
  });
  const df=document.getElementById('prp-distrato-fields');
  if(df)df.style.display=(tipo==='distrato')?'block':'none';
  atualizarPreview();
}

function tituloProposta(){
  const t=document.getElementById('prp-tipo')?.value||'prospeccao';
  return t==='distrato'?'DISTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS'
        :t==='renovacao'?'PROPOSTA DE RENOVAÇÃO DE CONTRATO'
        :'PROPOSTA COMERCIAL — SERVIÇOS CONTÁBEIS';
}

function atualizarPreview(){
  const tipo=document.getElementById('prp-tipo')?.value||'prospeccao';
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
  const dataEncRaw=document.getElementById('prp-dataEnc')?.value||'';
  const dataEnc=dataEncRaw?dataEncRaw.split('-').reverse().join('/'):'__DATA__';
  const motivo=document.getElementById('prp-motivo')?.value||'';
  const hoje=new Date().toLocaleDateString('pt-BR');
  const escopoLista=escopo.split('\n').filter(l=>l.trim()).map(l=>`<li style="margin-bottom:3px;">${l.replace(/^-\s*/,'')}</li>`).join('');

  const cab=`<div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #059669;padding-bottom:12px;">
      <div style="font-size:18px;font-weight:700;color:#059669;">FÊNIX SERVIÇOS CONTÁBEIS LTDA</div>
      <div style="font-size:9px;color:#475569;">CNPJ 17.381.348/0001-79 · CRC nº 266853/O-6</div>
    </div>
    <div style="text-align:center;font-size:14px;font-weight:700;margin-bottom:16px;">${tituloProposta()}</div>`;
  const rodape=`<div style="font-size:9px;color:#64748b;margin-top:24px;padding-top:12px;border-top:1px solid #cbd5e1;">
      São Paulo, ${hoje}<br><strong>Marcos Lopes da Silva</strong> — Fênix Serviços Contábeis</div>`;

  let corpo;
  if(tipo==='distrato'){
    corpo=`<div style="margin-bottom:14px;line-height:1.7;">
      Pelo presente instrumento particular, as partes abaixo identificadas:
      <div style="margin:10px 0;padding:10px;background:#f1f5f9;border-radius:6px;">
        <strong>CONTRATADA:</strong> Fênix Serviços Contábeis Ltda, CNPJ 17.381.348/0001-79.<br>
        <strong>CONTRATANTE:</strong> ${nome}${cnpj?', CNPJ '+cnpj:''}.
      </div>
      resolvem, de comum acordo, <strong>DAR POR ENCERRADO</strong> o contrato de prestação de serviços contábeis,
      com efeitos a partir de <strong>${dataEnc}</strong>, mediante as condições abaixo:
    </div>
    <div style="margin-bottom:14px;line-height:1.7;">
      <strong>1.</strong> A CONTRATADA entregará à CONTRATANTE toda a documentação contábil e fiscal sob sua guarda, referente ao período de vigência do contrato.<br>
      <strong>2.</strong> As obrigações acessórias e guias com competência até ${dataEnc} permanecem de responsabilidade da CONTRATADA.<br>
      <strong>3.</strong> A partir da data de encerramento, cessam as obrigações de ambas as partes quanto à prestação dos serviços.<br>
      <strong>4.</strong> As partes dão mútua, geral e irrevogável quitação, nada mais tendo a reclamar uma da outra a qualquer título.${motivo?'<br><strong>5.</strong> Motivo: '+motivo:''}
    </div>
    <div style="margin-bottom:14px;">E, por estarem assim justas e acordadas, firmam o presente distrato em duas vias de igual teor.</div>
    <div style="display:flex;justify-content:space-between;margin-top:40px;gap:20px;">
      <div style="flex:1;text-align:center;border-top:1px solid #334155;padding-top:6px;font-size:10px;">Fênix Serviços Contábeis<br>(CONTRATADA)</div>
      <div style="flex:1;text-align:center;border-top:1px solid #334155;padding-top:6px;font-size:10px;">${nome}<br>(CONTRATANTE)</div>
    </div>`;
  } else if(tipo==='renovacao'){
    corpo=`<div style="margin-bottom:14px;">
        <strong>Cliente:</strong> ${nome}<br>
        ${cnpj?'<strong>CNPJ:</strong> '+cnpj+'<br>':''}
        <strong>Regime:</strong> ${trib}
      </div>
      <div style="margin-bottom:14px;line-height:1.7;">
        Em continuidade à parceria estabelecida, a Fênix Serviços Contábeis tem a satisfação de apresentar a proposta de
        <strong>renovação</strong> do contrato de prestação de serviços contábeis, mantendo o padrão de qualidade e atendimento.
      </div>
      <div style="background:#f1f5f9;padding:12px;border-radius:6px;margin-bottom:14px;">
        <div style="font-weight:700;color:#059669;margin-bottom:6px;">CONDIÇÕES DA RENOVAÇÃO</div>
        <strong>Mensalidade:</strong> ${R(valor)}<br>
        <strong>Forma de pagamento:</strong> ${pgto}<br>
        <strong>Dia de vencimento:</strong> ${venc}<br>
        <strong>Nova vigência:</strong> ${vig} meses, renovável automaticamente
      </div>
      <div style="margin-bottom:14px;">
        <div style="font-weight:700;color:#059669;margin-bottom:6px;">SERVIÇOS MANTIDOS</div>
        <ul style="margin:0;padding-left:18px;">${escopoLista}</ul>
      </div>
      ${obs?'<div style="margin-bottom:14px;"><strong>Observações:</strong><br>'+obs.replace(/\n/g,'<br>')+'</div>':''}`;
  } else {
    corpo=`<div style="margin-bottom:14px;">
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
      ${obs?'<div style="margin-bottom:14px;"><strong>Observações:</strong><br>'+obs.replace(/\n/g,'<br>')+'</div>':''}`;
  }
  const cont=document.getElementById('prp-preview');
  if(cont)cont.innerHTML=cab+corpo+rodape;
}
function gerarPropostaPDF(){
  const nome=document.getElementById('prp-nome')?.value;
  if(!nome||!nome.trim()){toast('Informe o nome do cliente','warn');return;}
  atualizarPreview();
  const html=document.getElementById('prp-preview').innerHTML;
  const w=window.open('','_blank','width=820,height=900');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${tituloProposta()} — ${nome}</title>
    <style>body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;line-height:1.5;padding:30px;color:#0f172a;}@media print{body{padding:15px;}}</style>
    </head><body>${html}<script>setTimeout(()=>window.print(),300);<\/script></body></html>`);
  w.document.close();
  addLog(tituloProposta()+' gerada: '+nome);
}
// Listener para atualizar preview ao digitar
document.addEventListener('input',(e)=>{
  if(e.target&&e.target.id&&e.target.id.startsWith('prp-'))atualizarPreview();
});
