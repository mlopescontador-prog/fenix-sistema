// ════════════════════════════════════════
// FÊNIX CONT — documentos.js
// Recibo de pagamento, boletim mensal
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ RECIBO AUTOMÁTICO DE PAGAMENTO ═══
function gerarReciboPagamento(mensId){
  const m=mens.find(x=>x.id===mensId);
  if(!m||m.status!=='PAGO'){toast('Mensalidade não está paga','warn');return;}
  const c=GC(m.cliente_id);
  const dataPgto=m.data_baixa?m.data_baixa.split('-').reverse().join('/'):new Date().toLocaleDateString('pt-BR');
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Recibo ${c.nome}</title>
    <style>body{font-family:Arial;padding:30px;color:#0f172a;line-height:1.6;font-size:12px;}
    .header{text-align:center;border-bottom:3px solid #059669;padding-bottom:15px;margin-bottom:20px;}
    .h1{font-size:18px;font-weight:700;color:#059669;margin-bottom:3px;}
    .titulo{font-size:20px;font-weight:700;text-align:center;margin:20px 0;text-transform:uppercase;}
    .box{background:#f1f5f9;border-radius:8px;padding:18px;margin:14px 0;}
    .linha{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #cbd5e1;}
    .linha:last-child{border:none;}
    .valor{font-size:24px;font-weight:700;color:#059669;text-align:center;margin:14px 0;}
    .assinatura{margin-top:60px;padding-top:8px;border-top:1px solid #475569;text-align:center;font-size:11px;}
    @media print{body{padding:15px;}}
    </style></head><body>
    <div class="header">
      <div class="h1">FÊNIX SERVIÇOS CONTÁBEIS LTDA</div>
      <div style="font-size:10px;color:#475569;">CNPJ 17.381.348/0001-79 · CRC nº 266853/O-6</div>
    </div>
    <div class="titulo">📄 Recibo de Pagamento</div>
    <div class="box">
      <div class="linha"><strong>Recebido de:</strong> <span>${c.nome}</span></div>
      ${c.cnpj?`<div class="linha"><strong>CNPJ:</strong> <span>${c.cnpj}</span></div>`:''}
      <div class="linha"><strong>Referente:</strong> <span>Mensalidade ${M[m.mes]}/${m.ano}</span></div>
      <div class="linha"><strong>Vencimento:</strong> <span>${m.vencimento?m.vencimento.split('-').reverse().join('/'):'—'}</span></div>
      <div class="linha"><strong>Data do pagamento:</strong> <span>${dataPgto}</span></div>
      ${m.forma_pagamento?`<div class="linha"><strong>Forma:</strong> <span>${m.forma_pagamento}</span></div>`:''}
    </div>
    <div class="valor">${R(m.valor||0)}</div>
    <p style="margin:20px 0;font-size:11px;">Declaro para os devidos fins que recebi do(a) cliente acima identificado(a) o valor de <strong>${R(m.valor||0)}</strong> referente à mensalidade indicada.</p>
    <p style="margin:20px 0;font-size:11px;text-align:right;">São Paulo, ${dataPgto}.</p>
    <div class="assinatura"><strong>Marcos Lopes da Silva</strong><br>Fênix Serviços Contábeis</div>
    <script>setTimeout(()=>window.print(),300);<\/script>
    </body></html>`;
  const w=window.open('','_blank','width=720,height=900');
  w.document.write(html);w.document.close();
  addLog('Recibo gerado: '+c.nome+' '+M[m.mes]+'/'+m.ano);
}

// ═══ BOLETIM MENSAL DO CLIENTE ═══
function gerarBoletimMensal(cid){
  const c=GC(cid);
  if(!c){toast('Cliente não encontrado','err');return;}
  const hj=new Date();
  const mesAtual=hj.getMonth()+1;const anoAtual=hj.getFullYear();
  // Últimos 12 meses
  const cutoff=new Date();cutoff.setFullYear(cutoff.getFullYear()-1);
  const cutoffStr=cutoff.toISOString().slice(0,10);
  const histMens=mens.filter(m=>m.cliente_id===cid).sort((a,b)=>(b.ano*100+b.mes)-(a.ano*100+a.mes)).slice(0,12);
  const totalPago=histMens.filter(m=>m.status==='PAGO').reduce((a,m)=>a+(m.valor||0),0);
  const pendente=histMens.filter(m=>m.status==='VENCIDO'||m.status==='PENDENTE').reduce((a,m)=>a+(m.valor||0),0);
  const linhasMens=histMens.map(m=>{
    const venc=m.vencimento?m.vencimento.split('-').reverse().join('/'):'—';
    const pgto=m.data_baixa?m.data_baixa.split('-').reverse().join('/'):'—';
    const corSt=m.status==='PAGO'?'#16a34a':m.status==='VENCIDO'?'#dc2626':'#2563eb';
    return `<tr>
      <td style="padding:6px 9px;">${M[m.mes]}/${m.ano}</td>
      <td style="padding:6px 9px;text-align:right;">${R(m.valor||0)}</td>
      <td style="padding:6px 9px;">${venc}</td>
      <td style="padding:6px 9px;">${pgto}</td>
      <td style="padding:6px 9px;color:${corSt};font-weight:600;">${m.status}</td>
    </tr>`;
  }).join('');
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Boletim ${c.nome}</title>
    <style>body{font-family:Arial;padding:30px;color:#0f172a;line-height:1.5;font-size:11px;}
    .header{text-align:center;border-bottom:3px solid #059669;padding-bottom:15px;margin-bottom:20px;}
    .h1{font-size:18px;font-weight:700;color:#059669;}
    .titulo{font-size:18px;font-weight:700;text-align:center;margin:18px 0 10px;}
    .sub{text-align:center;font-size:11px;color:#475569;margin-bottom:18px;}
    .kpi-grid{display:flex;gap:10px;margin:15px 0;}
    .kpi{flex:1;background:#f1f5f9;border-radius:8px;padding:11px;text-align:center;}
    .kpi-l{font-size:9px;color:#475569;text-transform:uppercase;letter-spacing:1px;}
    .kpi-v{font-size:18px;font-weight:700;margin-top:4px;}
    table{width:100%;border-collapse:collapse;margin-top:12px;font-size:10px;}
    th{background:#0f172a;color:#fff;padding:7px 9px;text-align:left;}
    tr{border-bottom:1px solid #cbd5e1;}
    @media print{body{padding:15px;}}
    </style></head><body>
    <div class="header">
      <div class="h1">FÊNIX SERVIÇOS CONTÁBEIS LTDA</div>
      <div style="font-size:10px;color:#475569;">CNPJ 17.381.348/0001-79 · CRC nº 266853/O-6</div>
    </div>
    <div class="titulo">📋 Boletim Mensal — ${M[mesAtual]}/${anoAtual}</div>
    <div class="sub"><strong>Cliente:</strong> ${c.nome} ${c.cnpj?'· '+c.cnpj:''}</div>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-l">Pago (12m)</div><div class="kpi-v" style="color:#16a34a;">${R(totalPago)}</div></div>
      <div class="kpi"><div class="kpi-l">Em aberto</div><div class="kpi-v" style="color:#dc2626;">${R(pendente)}</div></div>
      <div class="kpi"><div class="kpi-l">Mensalidades</div><div class="kpi-v">${histMens.length}</div></div>
    </div>
    <h3 style="margin-top:15px;color:#059669;">Histórico de Mensalidades</h3>
    <table>
      <thead><tr><th>Referência</th><th style="text-align:right;">Valor</th><th>Vencimento</th><th>Pagamento</th><th>Status</th></tr></thead>
      <tbody>${linhasMens||'<tr><td colspan="5" style="padding:14px;text-align:center;color:#64748b;">Sem mensalidades</td></tr>'}</tbody>
    </table>
    <div style="margin-top:25px;font-size:9px;color:#64748b;border-top:1px solid #cbd5e1;padding-top:10px;text-align:center;">
      Documento gerado em ${hj.toLocaleString('pt-BR')} · Fênix Serviços Contábeis
    </div>
    <script>setTimeout(()=>window.print(),300);<\/script>
    </body></html>`;
  const w=window.open('','_blank','width=820,height=900');
  w.document.write(html);w.document.close();
  addLog('Boletim mensal: '+c.nome);
}
