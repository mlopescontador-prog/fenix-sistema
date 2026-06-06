// ════════════════════════════════════════
// FÊNIX CONT — dashboard.js
// KPIs, alertas, donut charts
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ DASHBOARD ═══
function renderDash(){
  const hj=new Date(),me=hj.getMonth()+1,an=hj.getFullYear();
  document.getElementById('dmes').textContent=MF[me]+' '+an;
  const mm=mens.filter(m=>m.mes===me&&m.ano===an);
  const pg=mm.filter(m=>m.status==='PAGO');
  const vc=mens.filter(m=>m.status==='VENCIDO');
  const rc=pg.reduce((a,m)=>a+(m.valor||0),0);
  const in2=vc.reduce((a,m)=>a+(m.valor||0),0);
  const e7=new Date();e7.setDate(e7.getDate()+7);
  const av=mens.filter(m=>{if(m.status!=='PENDENTE')return false;const d=new Date(m.vencimento);return d>=hj&&d<=e7;});
  const nab=mens.filter(m=>m.status==='PENDENTE'||m.status==='VENCIDO').length;
  document.getElementById('kR').textContent=R(rc);document.getElementById('kRs').textContent=`${pg.length} pagos`;
  document.getElementById('kI').textContent=R(in2);document.getElementById('kIs').textContent=`${[...new Set(vc.map(m=>m.cliente_id))].length} em atraso`;
  document.getElementById('kA').textContent=R(av.reduce((a,m)=>a+(m.valor||0),0));document.getElementById('kAs').textContent=`${av.length} cobranças`;
  document.getElementById('kC').textContent=R(mm.reduce((a,m)=>a+(m.valor||0),0));document.getElementById('kCs').textContent=`${cli.length} clientes`;
  document.getElementById('kN').textContent=nab;
  // Bar
  const vl=[1,2,3,4,5,6].map(m=>mens.filter(x=>x.mes===m&&x.ano===2026&&x.status==='PAGO').reduce((a,x)=>a+(x.valor||0),0));
  const mx=Math.max(...vl,1);
  document.getElementById('barC').innerHTML=vl.map((v,i)=>`<div class="bw"><div class="bb" style="height:${Math.round(v/mx*100)}%;background:${v>0?'var(--acc)':'var(--brd)'}" title="${M[i+1]}: ${R(v)}"></div><div class="bl">${M[i+1]}</div></div>`).join('');
  // Donut
  const cn={PAGO:0,VENCIDO:0,PENDENTE:0};mm.forEach(m=>{if(cn[m.status]!==undefined)cn[m.status]++;});
  const tt=Object.values(cn).reduce((a,b)=>a+b,0)||1;
  const cl2={PAGO:'var(--green)',VENCIDO:'var(--red)',PENDENTE:'var(--yellow)'};
  const sv=document.getElementById('dnut');
  const r=30,c=40,ci=2*Math.PI*r;let of=0,sg='';
  Object.entries(cn).forEach(([s,ct])=>{if(!ct)return;const p=ct/tt,d=p*ci;sg+=`<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${cl2[s]}" stroke-width="14" stroke-dasharray="${d} ${ci}" stroke-dashoffset="${-of}" transform="rotate(-90 ${c} ${c})"/>`;of+=d;});
  sv.innerHTML=`<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#1a1a26" stroke-width="14"/>${sg}`;
  document.getElementById('dleg').innerHTML=Object.entries(cn).filter(([,v])=>v>0).map(([s,v])=>`<div class="di"><div class="dd" style="background:${cl2[s]}"></div><span style="color:var(--muted2)">${s}</span><span style="color:var(--txt);margin-left:auto">${v}</span></div>`).join('');
  // Fluxo
  const en=fluxo.filter(f=>f.tipo==='E').reduce((a,f)=>a+(f.valor||0),0);
  const sa=fluxo.filter(f=>f.tipo==='S').reduce((a,f)=>a+(f.valor||0),0);
  document.getElementById('fce').textContent=R(en);document.getElementById('fcs').textContent=R(sa);
  document.getElementById('fcb').style.width=(en+sa>0?Math.min(100,Math.round(en/(en+sa)*100)):0)+'%';
  document.getElementById('fcsl').textContent=`Saldo: ${R(en-sa)}`;
  // Contratos — Dashboard
  const atC=contr.filter(x=>(x.status||'ATIVO')==='ATIVO'&&!x.pagador_id);
  const vencC=atC.filter(x=>diasRenov(x)<0);
  const em30C=atC.filter(x=>{const d=diasRenov(x);return d>=0&&d<=30;});
  const criticos=[...vencC,...em30C].sort((a,b)=>diasRenov(a)-diasRenov(b)).slice(0,4);
  document.getElementById('dContr').innerHTML=`
    <div style="display:flex;gap:10px;margin-bottom:8px;">
      <div style="flex:1;text-align:center;padding:6px;background:rgba(239,68,68,.08);border-radius:6px;cursor:pointer;" onclick="nav('contratos',document.querySelectorAll(\'.nb\')[4]);setFiltC('vencido')">
        <div style="font-size:16px;font-weight:800;color:var(--red);">${vencC.length}</div>
        <div style="font-size:9px;color:var(--muted);">Vencidos</div>
      </div>
      <div style="flex:1;text-align:center;padding:6px;background:rgba(234,179,8,.08);border-radius:6px;cursor:pointer;" onclick="nav('contratos',document.querySelectorAll(\'.nb\')[4]);setFiltC('30')">
        <div style="font-size:16px;font-weight:800;color:var(--yellow);">${em30C.length}</div>
        <div style="font-size:9px;color:var(--muted);">Em 30d</div>
      </div>
      <div style="flex:1;text-align:center;padding:6px;background:rgba(34,197,94,.08);border-radius:6px;">
        <div style="font-size:16px;font-weight:800;color:var(--green);">${atC.length-vencC.length-em30C.length}</div>
        <div style="font-size:9px;color:var(--muted);">Saudáveis</div>
      </div>
    </div>
    ${criticos.map(x=>{const c=GC(x.cliente_id);const di=diasRenov(x);return`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--brd);font-size:11px;"><div><div style="color:var(--txt)">${c.nome||'—'}</div><div style="font-size:9px;color:var(--muted)">${R(x.valor)}/mês</div></div><span style="font-size:9px;font-weight:600;color:${di<0?'var(--red)':'var(--yellow)'};">${di<0?`Vencido ${Math.abs(di)}d`:`${di}d`}</span></div>`;}).join('')}
    ${criticos.length===0?'<div style="font-size:11px;color:var(--green);padding:8px;text-align:center;">🎉 Todos os contratos em dia!</div>':''}
  `;
  // Neo log
  document.getElementById('nRec').innerHTML=log.slice(0,4).map(l=>`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--brd);font-size:10px;"><span style="color:var(--muted2);flex:1">${l.m}</span><span style="color:var(--muted);white-space:nowrap;margin-left:8px">${l.t}</span></div>`).join('')||'<div style="font-size:11px;color:var(--muted);padding:8px">Clique em "Sincronizar Neofin"</div>';
  // ── KPIs de Carteira ──────────────────────────────────────────────────────
  const ctrAtivos=contr.filter(x=>(x.status||'ATIVO')==='ATIVO'&&!x.pagador_id); // exclui membros de grupo
  const ctrEnc=contr.filter(x=>x.status==='ENCERRADO'||x.status==='SUSPENSO');
  const rmr=ctrAtivos.reduce((a,x)=>a+(x.valor||0),0);
  const nAtivos=ctrAtivos.length;
  const tm=nAtivos?rmr/nAtivos:0;
  const hoje2=new Date();
  const temposMedio=ctrAtivos.map(x=>{if(!x.inicio)return 12;const d=Math.floor((hoje2-new Date(x.inicio))/86400000/30);return Math.max(d,1);});
  const tmMedio=temposMedio.length?temposMedio.reduce((a,b)=>a+b,0)/temposMedio.length:12;
  const ltv=tm*tmMedio;
  const churnPct=contr.length?((ctrEnc.length/contr.length)*100):0;
  if(document.getElementById('kRMR')){
    document.getElementById('kRMR').textContent=R(rmr);
    document.getElementById('kTM').textContent=R(tm);
    document.getElementById('kTMs').textContent=nAtivos+' clientes ativos';
    document.getElementById('kCA').textContent=nAtivos;
    document.getElementById('kLTV').textContent=R(ltv);
    document.getElementById('kLTVs').textContent='tempo médio: '+Math.round(tmMedio)+'m';
    document.getElementById('kChurn').textContent=churnPct.toFixed(1)+'%';
    document.getElementById('kChurns').textContent=ctrEnc.length+' encerrados de '+contr.length;
  }
  // ── Gráficos de Pizza ─────────────────────────────────────────────────────
  const anoAtual=new Date().getFullYear();
  if(document.getElementById('pizzaAno')){
    document.getElementById('pizzaAno').textContent=anoAtual;
    document.getElementById('pizzaAno2').textContent=anoAtual;
  }
  const cores=['#a855f7','#3b82f6','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16','#f97316','#8b5cf6','#10b981','#64748b'];
  function mkPizza(divId,items){
    const div=document.getElementById(divId);if(!div)return;
    if(!items.length){div.innerHTML='<div style="font-size:11px;color:var(--muted);padding:20px;">Sem dados no período</div>';return;}
    const total=items.reduce((a,x)=>a+x.v,0);
    const r=70,cx=80,cy=80;let angulo=-Math.PI/2;let paths='';
    items.forEach((item,i)=>{
      const frac=item.v/total;const ang=frac*2*Math.PI;
      const x1=cx+r*Math.cos(angulo);const y1=cy+r*Math.sin(angulo);
      angulo+=ang;
      const x2=cx+r*Math.cos(angulo);const y2=cy+r*Math.sin(angulo);
      const large=ang>Math.PI?1:0;const cor=cores[i%cores.length];
      if(frac>0.001)paths+=`<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${cor}" stroke="var(--bg)" stroke-width="1.5"><title>${item.k}: ${R(item.v)} (${(frac*100).toFixed(1)}%)</title></path>`;
      item.cor=cor;
    });
    const svg=`<svg width="160" height="160" viewBox="0 0 160 160">${paths}<circle cx="80" cy="80" r="28" fill="var(--bg)"/><text x="80" y="84" text-anchor="middle" fill="var(--muted2)" font-size="9">${R(total)}</text></svg>`;
    const leg=items.slice(0,8).map(x=>`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;font-size:10px;"><div style="width:8px;height:8px;border-radius:2px;background:${x.cor};flex-shrink:0;"></div><span style="color:var(--muted2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x.k}</span><span style="color:var(--txt);font-weight:500;white-space:nowrap;">${(x.v/total*100).toFixed(0)}%</span></div>`).join('');
    div.innerHTML=`<div>${svg}</div><div style="flex:1;min-width:140px;">${leg}</div>`;
  }
  loadFluxo(anoAtual,null).then(dados=>{
    const mapRec={};
    dados.filter(d=>d.tipo==='E'||d.tipo==='ENTRADA').forEach(d=>{const k=d.grupo_dre||'Outros';mapRec[k]=(mapRec[k]||0)+(d.valor||0);});
    const recItems=Object.entries(mapRec).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v);
    const mapGas={};
    dados.filter(d=>d.tipo==='S'||d.tipo==='SAIDA').forEach(d=>{const k=d.grupo_dre||'Outros';mapGas[k]=(mapGas[k]||0)+(d.valor||0);});
    const gasItems=Object.entries(mapGas).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v);
    mkPizza('pizzaRec',recItems);mkPizza('pizzaGas',gasItems);
  }).catch(()=>{
    if(document.getElementById('pizzaRec'))document.getElementById('pizzaRec').innerHTML='<div style="font-size:11px;color:var(--muted);">Carregue o Fluxo de Caixa primeiro</div>';
    if(document.getElementById('pizzaGas'))document.getElementById('pizzaGas').innerHTML='<div style="font-size:11px;color:var(--muted);">Carregue o Fluxo de Caixa primeiro</div>';
  });
  // ── Alertas inteligentes ──────────────────────────────────────────────────
  renderAlertasDash();
  // ── Tabela recente ────────────────────────────────────────────────────────
}

// ═══ ALERTAS INTELIGENTES NO DASHBOARD ═══
function gerarAlertas(){
  const alertas=[];
  const hj=new Date();
  // 1. Inadimplentes 60+ dias
  cli.forEach(c=>{
    const ms=mens.filter(m=>m.cliente_id===c.id&&m.status==='VENCIDO');
    if(ms.length>=2){
      alertas.push({tipo:'critico',icone:'🔴',titulo:c.nome,desc:ms.length+' meses em atraso — considerar suspensão',acao:'irCobr('+c.id+')',acaoLabel:'💬 Cobrar'});
    }
  });
  // 2. Contratos vencendo em 30 dias
  contr.filter(x=>(x.status||'ATIVO')==='ATIVO'&&!x.pagador_id).forEach(x=>{
    const c=GC(x.cliente_id);
    const di=x.renovacao?Math.ceil((new Date(x.renovacao)-hj)/86400000):999;
    if(di>=0&&di<=30){
      alertas.push({tipo:'atencao',icone:'🟡',titulo:c.nome,desc:'Contrato renova em '+di+' dias',acao:'abrRenov('+x.id+')',acaoLabel:'🔄 Renovar'});
    }else if(di<0&&di>=-365){
      alertas.push({tipo:'critico',icone:'🔴',titulo:c.nome,desc:'Contrato vencido há '+Math.abs(di)+' dias',acao:'abrRenov('+x.id+')',acaoLabel:'🔄 Renovar'});
    }
  });
  // 3. Contratos sem mensalidade no mês atual
  const mesAt=hj.getMonth()+1,anoAt=hj.getFullYear();
  contr.filter(x=>(x.status||'ATIVO')==='ATIVO'&&!x.pagador_id&&Number(x.valor)>0).forEach(x=>{
    const c=GC(x.cliente_id);
    const tem=mens.some(m=>m.cliente_id===x.cliente_id&&m.mes===mesAt&&m.ano===anoAt);
    if(!tem){
      alertas.push({tipo:'info',icone:'🔵',titulo:c.nome,desc:'Sem mensalidade para '+M[mesAt]+'/'+anoAt,acao:"openM('mMens');setTimeout(()=>{document.getElementById('nm-cli').value="+c.id+";},150)",acaoLabel:'+ Mensalidade'});
    }
  });
  // Recorrentes próximos do vencimento (próximos 7 dias)
  if(typeof recorrentes!=='undefined'&&recorrentes.length){
    recorrentesProximos().forEach(r=>{
      const cor=r.diasAte<=3?'critico':'atencao';
      const ic=r.diasAte<=3?'🔴':'🟡';
      const tipo=r.tipo==='E'?'Entrada':'Despesa';
      alertas.push({tipo:cor,icone:ic,titulo:r.descricao,desc:tipo+' '+R(r.valor)+' · vence em '+r.diasAte+'d (dia '+r.dia_vencimento+')',acao:"nav('recorrentes',document.querySelectorAll('.nb')[7])",acaoLabel:'🔁 Ver'});
    });
  }
  return alertas.slice(0,15);
}
function renderAlertasDash(){
  const el=document.getElementById('alertasBox');
  if(!el)return;
  const alertas=gerarAlertas();
  if(!alertas.length){
    el.innerHTML='<div style="padding:14px;text-align:center;color:var(--green);font-size:11px;">🎉 Nenhum alerta no momento!</div>';
    return;
  }
  el.innerHTML=alertas.map(a=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 11px;border-bottom:1px solid var(--brd);font-size:11px;gap:8px;">
    <div style="flex:1;overflow:hidden;">
      <div style="font-weight:600;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.icone} ${a.titulo}</div>
      <div style="font-size:9px;color:var(--muted);">${a.desc}</div>
    </div>
    <button class="btn bo bxs" style="font-size:9px;white-space:nowrap;" onclick="${a.acao}">${a.acaoLabel}</button>
  </div>`).join('');
}
