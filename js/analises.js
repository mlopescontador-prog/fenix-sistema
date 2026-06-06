// ════════════════════════════════════════
// FÊNIX CONT — analises.js
// Churn, sazonalidade, projeção
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ ANÁLISES AVANÇADAS ═══
async function renderAnalises(){
  renderSazonalidade();
  renderInadimplencia();
  renderProjecao();
  renderChurnRisco();
}

// Sazonalidade — receitas por mês do ano corrente
async function renderSazonalidade(){
  const cont=document.getElementById('anSazon');
  try{
    const ano=new Date().getFullYear();
    const dados=await loadFluxo(ano,null);
    const porMes=Array(12).fill(0);
    dados.filter(d=>d.tipo==='E').forEach(d=>{
      if(d.data){
        const m=Number(d.data.slice(5,7))-1;
        porMes[m]+=(d.valor||0);
      }
    });
    const max=Math.max(...porMes,1);
    const bars=porMes.map((v,i)=>{
      const h=(v/max*120).toFixed(0);
      const cor=v===max?'var(--green)':v===0?'var(--muted)':'var(--acc)';
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
        <div style="font-size:9px;color:${cor};font-weight:600;">${v>=1000?(v/1000).toFixed(0)+'k':R(v).replace('R$ ','')}</div>
        <div style="width:100%;height:${h}px;background:${cor};border-radius:3px 3px 0 0;transition:height .5s;"></div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;">${M[i+1].slice(0,3)}</div>
      </div>`;
    }).join('');
    const totalAno=porMes.reduce((a,b)=>a+b,0);
    const mediaMes=totalAno/12;
    cont.innerHTML=`<div style="display:flex;align-items:flex-end;gap:4px;height:160px;padding:5px;">${bars}</div>
      <div style="margin-top:9px;padding:8px;background:var(--s2);border-radius:6px;font-size:10px;color:var(--muted2);">
        Total ${ano}: <strong style="color:var(--green);">${R(totalAno)}</strong> · Média mensal: <strong>${R(mediaMes)}</strong>
      </div>`;
  }catch(e){cont.innerHTML='<div style="padding:14px;color:var(--red);font-size:11px;">'+e.message+'</div>';}
}

// Inadimplência por cliente
function renderInadimplencia(){
  const cont=document.getElementById('anInad');
  // Para cada cliente, contar mensalidades VENCIDAS e PAGAS com atraso nos últimos 12 meses
  const hj=new Date();
  const cutoff=new Date();cutoff.setMonth(cutoff.getMonth()-12);
  const cutoffStr=cutoff.toISOString().slice(0,10);
  const stats={};
  mens.filter(m=>m.vencimento&&m.vencimento>=cutoffStr).forEach(m=>{
    if(!stats[m.cliente_id])stats[m.cliente_id]={vencidos:0,atrasados:0,total:0,diasAtraso:0};
    stats[m.cliente_id].total++;
    if(m.status==='VENCIDO'){stats[m.cliente_id].vencidos++;}
    else if(m.status==='PAGO'&&m.data_baixa&&m.vencimento&&m.data_baixa>m.vencimento){
      stats[m.cliente_id].atrasados++;
      const dias=Math.floor((new Date(m.data_baixa)-new Date(m.vencimento))/86400000);
      stats[m.cliente_id].diasAtraso+=dias;
    }
  });
  const lista=Object.entries(stats).map(([cid,s])=>{
    const c=GC(Number(cid));
    return {...s,cliente:c.nome,cid:Number(cid),
            score:s.vencidos*3+s.atrasados,
            mediaDias:s.atrasados?Math.round(s.diasAtraso/s.atrasados):0};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,15);
  if(!lista.length){
    cont.innerHTML='<div style="padding:20px;text-align:center;color:var(--green);font-size:11px;">🎉 Nenhum cliente com histórico de atraso!</div>';
    return;
  }
  cont.innerHTML=lista.map(x=>{
    const cor=x.score>=10?'var(--red)':x.score>=5?'var(--yellow)':'var(--muted2)';
    return `<div style="padding:9px 11px;border-bottom:1px solid var(--brd);font-size:11px;cursor:pointer;" onclick="abrFichaCli(${x.cid})">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;">${x.cliente}</div>
        <div style="color:${cor};font-weight:700;font-size:13px;">${x.score}pts</div>
      </div>
      <div style="font-size:9px;color:var(--muted);margin-top:2px;">
        ${x.vencidos>0?x.vencidos+' vencidos · ':''}${x.atrasados>0?x.atrasados+' pagos atrasados (média '+x.mediaDias+'d)':''}
      </div>
    </div>`;
  }).join('');
}

// Projeção próximos 12 meses
function renderProjecao(){
  const cont=document.getElementById('anProj');
  const hj=new Date();
  const recRec=contr.filter(x=>(x.status||'ATIVO')==='ATIVO'&&!x.pagador_id).reduce((a,x)=>a+(x.valor||0),0);
  const despRec=recorrentes.filter(r=>r.ativo&&r.tipo==='S').reduce((a,r)=>a+(r.valor||0),0);
  const receitaRec=recorrentes.filter(r=>r.ativo&&r.tipo==='E').reduce((a,r)=>a+(r.valor||0),0);
  const resultadoMensal=recRec+receitaRec-despRec;
  const projecao=[];
  for(let i=0;i<12;i++){
    const dt=new Date(hj.getFullYear(),hj.getMonth()+i,1);
    projecao.push({
      label:M[dt.getMonth()+1].slice(0,3)+'/'+String(dt.getFullYear()).slice(2),
      receitas:recRec+receitaRec,
      despesas:despRec,
      resultado:resultadoMensal
    });
  }
  cont.innerHTML=`
    <div style="background:var(--s2);padding:11px;border-radius:7px;margin-bottom:9px;font-size:11px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div><span style="color:var(--muted);">Receita mensal:</span> <strong style="color:var(--green);">${R(recRec+receitaRec)}</strong></div>
        <div><span style="color:var(--muted);">Despesa mensal:</span> <strong style="color:var(--red);">${R(despRec)}</strong></div>
        <div style="grid-column:1/-1;border-top:1px solid var(--brd);padding-top:6px;margin-top:3px;"><span style="color:var(--muted);">Resultado mensal estimado:</span> <strong style="color:${resultadoMensal>=0?'var(--green)':'var(--red)'};font-family:'Syne',sans-serif;font-size:14px;">${R(resultadoMensal)}</strong></div>
      </div>
    </div>
    <div style="max-height:260px;overflow-y:auto;">
      <table style="width:100%;font-size:10px;">
        <thead><tr style="border-bottom:1px solid var(--brd);">
          <th style="padding:6px;text-align:left;color:var(--muted);">Mês</th>
          <th style="padding:6px;text-align:right;color:var(--muted);">Receita</th>
          <th style="padding:6px;text-align:right;color:var(--muted);">Despesa</th>
          <th style="padding:6px;text-align:right;color:var(--muted);">Resultado</th>
        </tr></thead>
        <tbody>
          ${projecao.map(p=>`<tr style="border-bottom:1px solid var(--brd);">
            <td style="padding:5px 6px;">${p.label}</td>
            <td style="padding:5px 6px;text-align:right;color:var(--green);">${R(p.receitas)}</td>
            <td style="padding:5px 6px;text-align:right;color:var(--red);">${R(p.despesas)}</td>
            <td style="padding:5px 6px;text-align:right;color:${p.resultado>=0?'var(--green)':'var(--red)'};font-weight:600;">${R(p.resultado)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:9px;font-size:9px;color:var(--muted);"><em>Projeção baseada em: contratos ativos + recorrentes. Não inclui receitas/despesas variáveis.</em></div>`;
}

// Risco de Churn — cruza inadimplência + dias de casa + último pagamento
function calcularChurnRisco(){
  const hj=new Date();
  const cutoff90=new Date();cutoff90.setDate(cutoff90.getDate()-90);
  const cutoff90Str=cutoff90.toISOString().slice(0,10);
  const lista=[];
  cli.forEach(c=>{
    const x=contr.find(ct=>ct.cliente_id===c.id&&(ct.status||'ATIVO')==='ATIVO');
    if(!x)return;
    if(x.pagador_id)return; // ignora membros de grupo
    let pontos=0;
    const motivos=[];
    // 1. Vencidos
    const vencidos=mens.filter(m=>m.cliente_id===c.id&&m.status==='VENCIDO').length;
    if(vencidos>=2){pontos+=30;motivos.push(vencidos+' meses em atraso');}
    else if(vencidos===1){pontos+=15;motivos.push('1 mês em atraso');}
    // 2. Atrasos recorrentes nos últimos 6 meses
    const recentes=mens.filter(m=>m.cliente_id===c.id&&m.vencimento>=cutoff90Str&&m.status==='PAGO'&&m.data_baixa&&m.data_baixa>m.vencimento);
    if(recentes.length>=3){pontos+=20;motivos.push(recentes.length+' atrasos em 90d');}
    // 3. Sem pagamento recente
    const ultimoPgto=mens.filter(m=>m.cliente_id===c.id&&m.status==='PAGO'&&m.data_baixa).sort((a,b)=>b.data_baixa.localeCompare(a.data_baixa))[0];
    if(ultimoPgto&&ultimoPgto.data_baixa<cutoff90Str){pontos+=25;motivos.push('Sem pgto há 90+ dias');}
    if(!ultimoPgto&&mens.filter(m=>m.cliente_id===c.id).length>0){pontos+=20;motivos.push('Nunca pagou');}
    // 4. Contrato sem renovação ou vencido
    if(x.renovacao){
      const dias=Math.ceil((new Date(x.renovacao)-hj)/86400000);
      if(dias<0){pontos+=15;motivos.push('Contrato vencido há '+Math.abs(dias)+'d');}
    }
    if(pontos>0)lista.push({c,pontos,motivos});
  });
  return lista.sort((a,b)=>b.pontos-a.pontos);
}

function renderChurnRisco(){
  const cont=document.getElementById('anChurn');
  const lista=calcularChurnRisco().slice(0,20);
  if(!lista.length){
    cont.innerHTML='<div style="padding:20px;text-align:center;color:var(--green);font-size:11px;">🎉 Nenhum cliente em risco!</div>';
    return;
  }
  cont.innerHTML=lista.map(x=>{
    const nivel=x.pontos>=50?{cor:'var(--red)',label:'🔴 ALTO',bg:'rgba(220,38,38,.08)'}:
                x.pontos>=25?{cor:'var(--yellow)',label:'🟡 MÉDIO',bg:'rgba(202,138,4,.08)'}:
                {cor:'var(--blue)',label:'🔵 BAIXO',bg:'rgba(37,99,235,.06)'};
    return `<div style="padding:9px 11px;border-bottom:1px solid var(--brd);background:${nivel.bg};cursor:pointer;" onclick="abrFichaCli(${x.c.id})">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;font-size:11px;">${x.c.nome}</div>
        <div style="font-size:9px;color:${nivel.cor};font-weight:700;">${nivel.label} · ${x.pontos}pts</div>
      </div>
      <div style="font-size:9px;color:var(--muted2);margin-top:3px;">${x.motivos.join(' · ')}</div>
    </div>`;
  }).join('');
}
