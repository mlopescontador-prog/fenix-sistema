// ══════════════════════════════════
// FÊNIX CONT — clientes.js
// Lista, ficha, filtro, exportação
// Depende de: core.js · helpers.js
// ══════════════════════════════════

// ═══ CLIENTES ═══
let cliSort={col:'cod',dir:1};

function sortCli(col){
  if(cliSort.col===col)cliSort.dir*=-1;
  else{cliSort.col=col;cliSort.dir=1;}
  ['cod','nome','valor'].forEach(c=>{
    const el=document.getElementById('sh-cli-'+c);
    if(el)el.textContent=c===col?(cliSort.dir===1?' ↑':' ↓'):'';
  });
  filtCli();
}

function filtCli(){
  const sr=(document.getElementById('srcCli')?.value||'').toLowerCase();
  const ft=document.getElementById('fCliTrib')?.value||'';
  const fs=document.getElementById('fCliSt')?.value||'';
  let fl=cli.filter(c=>{
    if(sr&&!(c.nome||'').toLowerCase().includes(sr)&&!(c.cnpj||'').includes(sr))return false;
    if(ft&&(c.trib||'').toUpperCase()!==ft)return false;
    if(fs){
      const inad=mens.some(m=>m.cliente_id===c.id&&m.status==='VENCIDO');
      if(fs==='ok'&&inad)return false;
      if(fs==='inad'&&!inad)return false;
    }
    return true;
  });
  // Ordenação
  fl.sort((a,b)=>{
    let va,vb;
    if(cliSort.col==='cod'){va=a.cod||'';vb=b.cod||'';}
    else if(cliSort.col==='nome'){va=(a.nome||'').toLowerCase();vb=(b.nome||'').toLowerCase();}
    else if(cliSort.col==='valor'){va=a.valor||0;vb=b.valor||0;return cliSort.dir===1?va-vb:vb-va;}
    return cliSort.dir===1?va.localeCompare(vb):vb.localeCompare(va);
  });
  document.getElementById('cliLabel').textContent=fl.length+' clientes';
  const tb=document.getElementById('cliTable');
  if(!fl.length){tb.innerHTML=`<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted)">Nenhum resultado</td></tr>`;return;}
  tb.innerHTML=fl.map(c=>{
    const inad=mens.filter(m=>m.cliente_id===c.id&&m.status==='VENCIDO');
    const saldoDev=inad.reduce((a,m)=>a+(m.valor||0),0);
    // Semáforo: 🟢 em dia · 🟡 1 atraso · 🔴 2+ atrasos
    const semaforo=inad.length===0?'🟢':inad.length===1?'🟡':'🔴';
    // Status (pagamento)
    let st=inad.length>0?`<span class="bdg br2">⚠ ${inad.length}x</span>`:'<span class="bdg bg2">Em dia</span>';
    // Status do CONTRATO (ícone — Opção B)
    const cAtivo=contr.find(x=>x.cliente_id===c.id);
    const cSt=(cAtivo&&cAtivo.status)||'—';
    const iconeContr=cSt==='ATIVO'?'<span title="Contrato Ativo" style="font-size:14px;">🟢</span>'
                    :cSt==='SUSPENSO'?'<span title="Contrato Suspenso" style="font-size:14px;">🟡</span>'
                    :cSt==='ENCERRADO'?'<span title="Contrato Encerrado" style="font-size:14px;">⚫</span>'
                    :cSt==='INTERNO'?'<span title="Contrato Interno" style="font-size:14px;">🏠</span>'
                    :'<span title="Sem contrato" style="font-size:12px;color:var(--muted);">—</span>';
    // Tags como mini-badges
    const tagsArr=(c.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
    const tagBadges=tagsArr.slice(0,2).map(t=>{
      const corMap={'VIP':'#a855f7','ATENÇÃO':'#eab308','INDICAÇÃO':'#06b6d4'};
      const cTag=corMap[t.toUpperCase()]||'var(--muted2)';
      return `<span style="display:inline-block;font-size:8px;padding:1px 5px;border-radius:3px;background:${cTag}20;color:${cTag};border:1px solid ${cTag}40;margin-left:3px;">${t}</span>`;
    }).join('');
    const tribs={['SIMPLES NACIONAL']:'var(--green)',['LUCRO PRESUMIDO']:'var(--blue)',['LUCRO REAL']:'var(--purple)',['MEI']:'var(--teal)'};
    const cor=tribs[(c.trib||'').toUpperCase()]||'var(--muted2)';
    // Saldo devedor — Opção B: valor + (Nx)
    const saldoTxt=saldoDev>0?`<span style="color:var(--red);font-weight:600;">${R(saldoDev)}<span style="font-size:9px;color:var(--muted);margin-left:3px;">(${inad.length}x)</span></span>`:'<span style="color:var(--muted);font-size:10px;">—</span>';
    return`<tr>
      <td style="padding:7px 6px 7px 12px;color:var(--muted);font-size:10px;white-space:nowrap;">${c.cod||'—'}</td>
      <td style="padding:7px 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;" class="cn" onclick="abrFichaCli(${c.id})" title="${c.nome||''}"><span style="margin-right:4px;">${semaforo}</span>${c.nome||'—'}${tagBadges}</td>
      <td style="padding:7px 6px;font-size:10px;color:var(--muted);white-space:nowrap;">${c.cnpj||'—'}</td>
      <td style="padding:7px 6px;"><span style="font-size:9px;color:${cor};font-weight:500;">${(c.trib||'—').split(' ')[0]}</span></td>
      <td style="padding:7px 6px;font-weight:500;color:var(--acc);white-space:nowrap;text-align:right;">${R(c.valor||0)}</td>
      <td style="padding:7px 6px;text-align:center;">${st}</td>
      <td style="padding:7px 4px;text-align:center;">${iconeContr}</td>
      <td style="padding:7px 6px;text-align:right;white-space:nowrap;">${saldoTxt}</td>
      <td style="padding:7px 12px 7px 6px;text-align:center;"><div style="display:flex;gap:3px;justify-content:center;">
        <button class="btn bo bxs" onclick="abrFichaCli(${c.id})" title="Ficha completa">👤</button>
        <button class="btn bo bxs" style="color:var(--blue);border-color:rgba(59,130,246,.3);" onclick="abrEditCli(${c.id})" title="Editar cliente">✏️</button>
        <button class="btn bo bxs" style="color:var(--red);border-color:rgba(220,38,38,.3);" onclick="delCli(${c.id})" title="Excluir cliente">🗑️</button>
      </div></td>
    </tr>`;
  }).join('');
}

function abrFichaCli(cid){
  const c=GC(cid);if(!c.id)return;
  const inad=mens.filter(m=>m.cliente_id===cid&&m.status==='VENCIDO');
  const ttInad=inad.reduce((a,m)=>a+(m.valor||0),0);
  const hist=[...mens].filter(m=>m.cliente_id===cid).sort((a,b)=>b.ano-a.ano||b.mes-a.mes).slice(0,24);
  document.getElementById('fc-nome').textContent=c.nome||'—';
  document.getElementById('fc-cnpj').textContent=(c.cnpj||'—')+' · Cód '+( c.cod||'—');
  document.getElementById('fc-valor').textContent=R(c.valor||0);
  document.getElementById('fc-vencdia').textContent='Vence todo dia '+(c.venc_dia||20);
  document.getElementById('fc-tel').textContent=c.tel||'Sem telefone';
  document.getElementById('fc-email').textContent=c.email||'Sem e-mail';
  const cor=inad.length?'var(--red)':'var(--green)';
  document.getElementById('fc-inad').style.color=cor;
  document.getElementById('fc-inad').textContent=inad.length?R(ttInad):'Em dia';
  document.getElementById('fc-inadMeses').textContent=inad.length?inad.length+' mês(es) em atraso':'Nenhuma pendência';
  const tribs={'SIMPLES NACIONAL':'var(--green)','LUCRO PRESUMIDO':'var(--blue)','LUCRO REAL':'var(--purple)','MEI':'var(--teal)'};
  const corT=tribs[(c.trib||'').toUpperCase()]||'var(--muted2)';
  document.getElementById('fc-badgeTrib').innerHTML=`<span style="font-size:10px;color:${corT};font-weight:600;">${c.trib||'—'}</span>`;
  document.getElementById('fc-badgeSt').innerHTML=inad.length?'<span class="bdg br2">Inadimplente</span>':'<span class="bdg bg2">Em dia</span>';
  // Ações
  const tel=(c.tel||'').replace(/\D/g,'');
  document.getElementById('fc-btnWA').onclick=()=>window.open('https://wa.me/'+(tel?'55'+tel:''),'_blank');
  document.getElementById('fc-btnEmail').onclick=()=>{const a=document.createElement('a');a.href='mailto:'+(c.email||'');a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>document.body.removeChild(a),500);};
  document.getElementById('fc-btnCobr').onclick=()=>{closeM('mFichaCli');irCobr(cid);};
  document.getElementById('fc-btnMens').onclick=()=>{closeM('mFichaCli');setTimeout(()=>{openM('mMens');document.getElementById('nm-cli').value=cid;},100);};
  document.getElementById('fc-btnBoletim').onclick=()=>{gerarBoletimMensal(cid);};
  document.getElementById('fc-btnNeofin').onclick=()=>{exportNeofinCliente(cid);};
  // Histórico
  document.getElementById('fc-hist').innerHTML=hist.length?hist.map(m=>`<tr>
    <td style="padding:5px 10px;font-size:10px;color:var(--muted2);">${M[m.mes]}/${m.ano}</td>
    <td style="padding:5px 10px;font-size:10px;font-weight:500;">${R(m.valor||0)}</td>
    <td style="padding:5px 10px;font-size:10px;color:var(--muted);">${m.vencimento?m.vencimento.split('-').reverse().join('/'):'—'}</td>
    <td style="padding:5px 10px;">${bdg(m.status)}</td>
    <td style="padding:5px 10px;font-size:10px;color:var(--muted);">${m.data_baixa?m.data_baixa.split('-').reverse().join('/'):'—'}</td>
  </tr>`).join(''):'<tr><td colspan="5" style="padding:12px;text-align:center;color:var(--muted);font-size:11px;">Sem histórico</td></tr>';
  openM('mFichaCli');
}

function waCli(cid){
  const c=GC(cid);if(!c.id)return;
  const tel=(c.tel||'').replace(/\D/g,'');
  window.open('https://wa.me/'+(tel?'55'+tel:''),'_blank');
}
function emailCli(cid){
  const c=GC(cid);if(!c.id)return;
  const a=document.createElement('a');
  a.href='mailto:'+(c.email||'');
  a.style.display='none';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>document.body.removeChild(a),500);
}
function expCliCSV(){
  if(!cli.length){toast('Sem dados','warn');return;}
  const rows=[['Código','Nome','CNPJ','Telefone','E-mail','Tributação','Mensalidade (R$)','Vencimento (dia)']];
  cli.forEach(c=>rows.push([c.cod||'',c.nome||'',c.cnpj||'',c.tel||'',c.email||'',c.trib||'',c.valor||0,c.venc_dia||20]));
  const csv='\uFEFF'+rows.map(r=>r.map(c=>'"'+String(c||'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));a.download='fenix_clientes_'+new Date().toISOString().split('T')[0]+'.csv';a.click();toast('✓ CSV exportado!');
}
