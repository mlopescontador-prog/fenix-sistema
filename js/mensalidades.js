// ════════════════════════════════════════
// FÊNIX CONT — mensalidades.js
// Lista, baixa, editar, estornar, cancelar
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ MENSALIDADES ═══
let mSort={col:'vencimento',dir:1};

function sortM(col){
  if(mSort.col===col)mSort.dir*=-1;
  else{mSort.col=col;mSort.dir=1;}
  ['valor','vencimento','status'].forEach(c=>{
    const el=document.getElementById('sh-'+c);
    if(el)el.textContent=c===col?(mSort.dir===1?' ↑':' ↓'):'';
  });
  filtM();
}

function filtM(){
  const sr=(document.getElementById('srcM')?.value||'').toLowerCase();
  const fs=document.getElementById('fSt')?.value||'';
  const fm=document.getElementById('fMe')?.value||'';
  const fa=document.getElementById('fAno')?.value||'';
  let fl=mens.filter(m=>{
    const c=GC(m.cliente_id);
    if(sr&&!(c.nome||'').toLowerCase().includes(sr))return false;
    if(fs&&m.status!==fs)return false;
    if(fm&&String(m.mes)!==fm)return false;
    if(fa&&String(m.ano)!==fa)return false;
    return true;
  });
  fl=[...fl].sort((a,b)=>{
    let va,vb;
    if(mSort.col==='valor'){va=a.valor||0;vb=b.valor||0;}
    else if(mSort.col==='vencimento'){va=a.vencimento||'';vb=b.vencimento||'';}
    else if(mSort.col==='status'){const o={VENCIDO:0,PENDENTE:1,PAGO:2,BONIFICADO:3};va=o[a.status]??9;vb=o[b.status]??9;}
    else{va=a.vencimento||'';vb=b.vencimento||'';}
    return va<vb?-mSort.dir:va>vb?mSort.dir:0;
  });
  const lbEl=document.getElementById('mLabel');
  if(lbEl)lbEl.textContent=fl.length+' registros';
  const tb=document.getElementById('mTable');
  if(!fl.length){tb.innerHTML='<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted)">Nenhum resultado</td></tr>';renderMResumo([]);return;}
  const hj=new Date().toISOString().split('T')[0];
  tb.innerHTML=fl.map(m=>{
    const c=GC(m.cliente_id);
    const venc=m.vencimento?m.vencimento.split('-').reverse().join('/'):'—';
    const atrasado=m.status==='VENCIDO'||(m.status==='PENDENTE'&&m.vencimento&&m.vencimento<hj);
    return '<tr style="'+(atrasado?'background:rgba(239,68,68,.04);':'')+'">'+'<td style="padding:7px 6px 7px 12px;color:var(--muted);font-size:10px;white-space:nowrap;">'+(c.cod||'—')+'</td>'+'<td style="padding:7px 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" class="cn" title="'+(c.nome||'')+'">'+(c.nome||'—')+'</td>'+'<td style="padding:7px 6px;font-weight:500;white-space:nowrap;">'+R(m.valor)+'</td>'+'<td style="padding:7px 6px;color:var(--muted2);white-space:nowrap;">'+(M[m.mes]||'?')+'/'+m.ano+'</td>'+'<td style="padding:7px 6px;color:'+(atrasado?'var(--red)':'var(--muted2)')+';white-space:nowrap;">'+venc+'</td>'+'<td style="padding:7px 6px;">'+bdg(atrasado&&m.status==="PENDENTE"?"VENCIDO":m.status)+'</td>'+'<td style="padding:7px 12px 7px 6px;"><div style="display:flex;gap:3px;">'+(m.status!=='PAGO'&&m.status!=='BONIFICADO'?'<button class="btn bg bxs" onclick="abrBaixa('+m.id+',&apos;'+(c.nome||'').replace(/'/g,'')+'&apos;)" title="Dar baixa">✓</button><button class="btn bo bxs" onclick="irCobr('+c.id+')" title="Cobrar">💬</button><button class="btn bo bxs" onclick="excluirMensDir('+m.id+')" title="Excluir" style="color:var(--red);border-color:rgba(220,38,38,.3);">🗑</button>':'<span style="font-size:10px;color:var(--green);">✓ pago</span><button class="btn bo bxs" onclick="abrEditMens('+m.id+')" title="Corrigir baixa / dados" style="font-size:9px;padding:2px 4px;margin-left:3px;">✏</button><button class="btn bo bxs" onclick="estornarBaixa('+m.id+')" title="Estornar baixa" style="font-size:9px;padding:2px 4px;color:var(--red);border-color:rgba(220,38,38,.3);">↩</button><button class="btn bo bxs" onclick="gerarReciboPagamento('+m.id+')" title="Gerar recibo" style="font-size:9px;padding:2px 4px;">📄</button><button class="btn bo bxs" onclick="excluirMensDir('+m.id+')" title="Excluir" style="font-size:9px;padding:2px 4px;color:var(--red);border-color:rgba(220,38,38,.3);">🗑</button>')+'</div></td>'+'</tr>';
  }).join('');
  renderMResumo(fl);
  renderMPrevisao();
}

function renderMResumo(fl){
  const el=document.getElementById('mResumo');
  if(!el)return;
  const tots={PAGO:0,PENDENTE:0,VENCIDO:0,BONIFICADO:0};
  const vals={PAGO:0,PENDENTE:0,VENCIDO:0,BONIFICADO:0};
  fl.forEach(m=>{if(tots[m.status]!==undefined){tots[m.status]++;vals[m.status]+=m.valor||0;}});
  const total=fl.reduce((a,m)=>a+(m.valor||0),0);
  const cores={PAGO:'var(--green)',PENDENTE:'var(--yellow)',VENCIDO:'var(--red)',BONIFICADO:'var(--blue)'};
  const labels={PAGO:'Pagos',PENDENTE:'Pendentes',VENCIDO:'Vencidos',BONIFICADO:'Bonificados'};
  el.innerHTML=Object.entries(tots).filter(([,v])=>v>0).map(([st,qt])=>
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--brd);"><div><div style="font-size:10px;color:'+cores[st]+';font-weight:500;">'+labels[st]+'</div><div style="font-size:9px;color:var(--muted);">'+qt+' registro'+( qt>1?'s':'')+'</div></div><div style="font-size:12px;font-weight:700;color:'+cores[st]+';font-family:Syne,sans-serif;">'+R(vals[st])+'</div></div>'
  ).join('')+'<div style="display:flex;justify-content:space-between;padding:7px 0 0;margin-top:3px;"><span style="font-size:10px;color:var(--muted);font-weight:600;">TOTAL</span><span style="font-size:13px;font-weight:700;font-family:Syne,sans-serif;color:var(--txt);">'+R(total)+'</span></div>';
}

function renderMPrevisao(){
  const el=document.getElementById('mPrevisao');
  if(!el)return;
  const hj=new Date();
  const prev=[];
  for(let i=0;i<6;i++){
    const d=new Date(hj.getFullYear(),hj.getMonth()+i,1);
    const ano=d.getFullYear(),mes=d.getMonth()+1;
    const mm=mens.filter(m=>m.ano===ano&&m.mes===mes);
    const pago=mm.filter(m=>m.status==='PAGO').reduce((a,m)=>a+(m.valor||0),0);
    const previsto=mm.filter(m=>m.status!=='PAGO'&&m.status!=='BONIFICADO').reduce((a,m)=>a+(m.valor||0),0);
    const total=pago+previsto;
    if(total>0)prev.push({mes,ano,pago,previsto,total,label:M[mes]+'/'+ano});
  }
  if(!prev.length){el.innerHTML='<div style="font-size:11px;color:var(--muted);padding:8px;">Sem dados futuros</div>';return;}
  el.innerHTML=prev.map(p=>{
    const pctPago=p.total>0?Math.round(p.pago/p.total*100):0;
    const isAtual=p.mes===hj.getMonth()+1&&p.ano===hj.getFullYear();
    return '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;"><span style="color:'+( isAtual?'var(--acc)':'var(--muted2)')+';font-weight:'+( isAtual?'600':'400')+';">'+p.label+( isAtual?' ◀':'')+'</span><span style="color:var(--txt);font-weight:600;">'+R(p.total)+'</span></div><div style="background:var(--brd);border-radius:3px;height:6px;overflow:hidden;"><div style="height:100%;width:'+pctPago+'%;background:var(--green);border-radius:3px;"></div></div><div style="display:flex;justify-content:space-between;font-size:9px;margin-top:2px;"><span style="color:var(--green);">✓ '+R(p.pago)+'</span><span style="color:var(--yellow);">⏳ '+R(p.previsto)+'</span></div></div>';
  }).join('');
}

// ═══ BAIXA AUTOMÁTICA DE MENSALIDADE ═══
// Tenta vincular entrada do fluxo com mensalidade pendente do cliente
async function tentarBaixaAutomatica(empresa, valor, dataLanc, fluxoId){
  if(!empresa||!empresa.trim())return false;
  const empN=empresa.trim().toUpperCase();
  // Buscar cliente por nome (match flexível)
  const cliente=cli.find(c=>{
    const n=(c.nome||'').toUpperCase();
    return n===empN||n.includes(empN)||empN.includes(n);
  });
  if(!cliente){addLog('Baixa auto: cliente "'+empresa+'" não encontrado');return false;}
  // Buscar mensalidades pendentes/vencidas
  const pendentes=mens.filter(m=>m.cliente_id===cliente.id&&(m.status==='PENDENTE'||m.status==='VENCIDO'));
  if(!pendentes.length){addLog('Baixa auto: '+cliente.nome+' sem pendências');return false;}
  // Regra C — Inteligente
  const matchExato=pendentes.filter(m=>Number(m.valor).toFixed(2)===Number(valor).toFixed(2));
  if(pendentes.length===1&&matchExato.length===1){
    // Caso simples: 1 mensalidade pendente E valor bate → baixa direta
    return await executarBaixa(matchExato[0],dataLanc,fluxoId,cliente);
  }
  // Caso complexo: várias pendências ou valor não bate → mostrar modal
  abrModalBaixa(cliente,pendentes,valor,dataLanc,fluxoId);
  return 'modal';
}

async function executarBaixa(mensalidade,dataLanc,fluxoId,cliente){
  try{
    const body={
      status:'PAGO',
      data_baixa:dataLanc||new Date().toISOString().split('T')[0],
      forma_pagamento:'Identificação automática via fluxo de caixa'
    };
    await sbu('mensalidades',mensalidade.id,body);
    const idx=mens.findIndex(m=>m.id===mensalidade.id);
    if(idx>=0)Object.assign(mens[idx],body);
    addLog('✓ Baixa automática: '+cliente.nome+' '+M[mensalidade.mes]+'/'+mensalidade.ano+' — '+R(mensalidade.valor));
    toast('✓ Baixa automática: '+cliente.nome+' '+M[mensalidade.mes]+'/'+mensalidade.ano);
    return true;
  }catch(e){
    addLog('Erro baixa auto: '+e.message);
    return false;
  }
}

let _baixaCtx=null;
function abrModalBaixa(cliente,pendentes,valor,dataLanc,fluxoId){
  _baixaCtx={cliente,pendentes,valor,dataLanc,fluxoId};
  const lista=pendentes.sort((a,b)=>(a.ano*100+a.mes)-(b.ano*100+b.mes)).map(m=>{
    const venc=m.vencimento?m.vencimento.split('-').reverse().join('/'):'—';
    const match=Number(m.valor).toFixed(2)===Number(valor).toFixed(2);
    return`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 11px;border:1px solid ${match?'var(--green)':'var(--brd)'};border-radius:8px;margin-bottom:6px;background:${match?'rgba(34,197,94,.06)':'transparent'};cursor:pointer;" onclick="execBaixaSel(${m.id})">
      <div>
        <div style="font-weight:600;font-size:12px;">${M[m.mes]}/${m.ano} ${match?'<span style=\'color:var(--green);font-size:9px;margin-left:6px;\'>✓ valor bate</span>':''}</div>
        <div style="font-size:10px;color:var(--muted);">Vencimento: ${venc} · ${m.status}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700;color:var(--acc);">${R(m.valor)}</div>
        <button class="btn ba bxs" style="margin-top:4px;font-size:9px;">✓ Dar baixa</button>
      </div>
    </div>`;
  }).join('');
  document.getElementById('mbx-cli').textContent=cliente.nome;
  document.getElementById('mbx-val').textContent=R(valor);
  document.getElementById('mbx-lista').innerHTML=lista;
  openM('mBaixaAuto');
}

async function execBaixaSel(mensId){
  if(!_baixaCtx)return;
  const m=_baixaCtx.pendentes.find(x=>x.id===mensId);
  if(!m)return;
  await executarBaixa(m,_baixaCtx.dataLanc,_baixaCtx.fluxoId,_baixaCtx.cliente);
  closeM('mBaixaAuto');
  _baixaCtx=null;
  renderFluxo();
}

async function savEditFluxo(){
  const id=Number(document.getElementById('ef-id').value);
  if(!id){toast('ID inválido','err');return;}
  const body={
    data:      document.getElementById('ef-d').value,
    tipo:      document.getElementById('ef-t').value,
    descricao: document.getElementById('ef-desc').value,
    empresa:   document.getElementById('ef-emp').value,
    valor:     Number(document.getElementById('ef-v').value)||0,
    grupo:     document.getElementById('ef-g').value
  };
  try{
    await sbu('fluxo',id,body);
    // Atualizar na lista local também
    const idx=fluxo.findIndex(x=>x.id===id);
    if(idx>=0)Object.assign(fluxo[idx],body);
    const idx2=fluxoFiltrado.findIndex(x=>x.id===id);
    if(idx2>=0)Object.assign(fluxoFiltrado[idx2],body);
    addLog('Lançamento #'+id+' atualizado no banco');
    closeM('mEditFluxo');
    toast('✓ Alteração salva no banco!');
    // Tentar baixa automática se for entrada com empresa preenchida
    if(body.tipo==='E'&&body.empresa&&body.empresa.trim()){
      const r=await tentarBaixaAutomatica(body.empresa,body.valor,body.data,id);
      if(r===true)renderFluxo(); // já renderizou
      else if(r!=='modal')renderFluxo();
    }else{
      renderFluxo();
    }
  }catch(e){toast('Erro ao salvar: '+e.message,'err');addLog('Erro savEditFluxo: '+e.message);}
}

// Excluir lançamento
async function delFluxo(){
  const id=Number(document.getElementById('ef-id').value);
  if(!id)return;
  const desc=document.getElementById('ef-desc').value||'este lançamento';
  if(!confirm('Tem certeza que deseja excluir este lançamento?\n\n"'+desc+'"\n\nEsta ação não poderá ser desfeita.'))return;
  try{
    const url=`${SU}/rest/v1/fluxo?id=eq.${id}`;
    const r=await fetch(url,{method:'DELETE',headers:SH});
    if(!r.ok)throw new Error('HTTP '+r.status);
    fluxo=fluxo.filter(x=>x.id!==id);
    fluxoFiltrado=fluxoFiltrado.filter(x=>x.id!==id);
    addLog('Lançamento #'+id+' excluído');
    closeM('mEditFluxo');
    toast('✓ Lançamento excluído!');
    renderFluxo();
  }catch(e){toast('Erro ao excluir: '+e.message,'err');addLog('Erro delFluxo: '+e.message);}
}

// Export CSV
function expFluxoCSV(){
  if(!fluxoFiltrado.length){toast('Nenhum dado para exportar','warn');return;}
  const rows=[['Data','Tipo','Descrição','Empresa','Grupo DRE','Valor']];
  fluxoFiltrado.forEach(f=>rows.push([f.data,f.tipo,f.descricao||'',f.empresa||'',f.grupo||'',f.valor]));
  const csv='\uFEFF'+rows.map(r=>r.map(c=>'"'+String(c||'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.download='fenix_fluxo_'+new Date().toISOString().split('T')[0]+'.csv';
  a.click();toast('✓ CSV exportado!');
}

// ═══ EDITAR MENSALIDADE ═══
function abrEditMens(id){
  const m=mens.find(x=>x.id===id);
  if(!m)return;
  const sc=document.getElementById('em-cli');
  sc.innerHTML=cli.map(c=>`<option value="${c.id}">${c.cod||''} · ${c.nome}</option>`).join('');
  sc.value=m.cliente_id;
  document.getElementById('em-id').value=id;
  document.getElementById('em-mes').value=m.mes||1;
  document.getElementById('em-ano').value=m.ano||2026;
  document.getElementById('em-valor').value=m.valor||0;
  document.getElementById('em-venc').value=m.vencimento||'';
  document.getElementById('em-st').value=m.status||'PENDENTE';
  document.getElementById('em-baixa').value=m.data_baixa||'';
  setTimeout(()=>openM('mEditMens'),50);
}
async function savEditMens(){
  const id=Number(document.getElementById('em-id').value);
  if(!id){toast('ID inválido','err');return;}
  const body={
    cliente_id:Number(document.getElementById('em-cli').value),
    mes:Number(document.getElementById('em-mes').value),
    ano:Number(document.getElementById('em-ano').value),
    valor:Number(document.getElementById('em-valor').value)||0,
    vencimento:document.getElementById('em-venc').value||null,
    status:document.getElementById('em-st').value,
    data_baixa:document.getElementById('em-baixa').value||null
  };
  try{
    await sbu('mensalidades',id,body);
    const idx=mens.findIndex(x=>x.id===id);
    if(idx>=0)Object.assign(mens[idx],body);
    addLog('Mensalidade #'+id+' atualizada');
    closeM('mEditMens');
    toast('✓ Mensalidade salva no banco!');
    filtM();
  }catch(e){toast('Erro: '+e.message,'err');}
}
async function delMens(){
  const id=Number(document.getElementById('em-id').value);
  if(!id)return;
  const m=mens.find(x=>x.id===id);
  const c=m?GC(m.cliente_id):{};
  if(!confirm('Excluir mensalidade de '+(c.nome||'cliente')+' '+( m?M[m.mes]+'/'+m.ano:'')+' ? Não pode ser desfeito.'))return;
  try{
    const r=await fetch(`${SU}/rest/v1/mensalidades?id=eq.${id}`,{method:'DELETE',headers:SH});
    if(!r.ok)throw new Error('HTTP '+r.status);
    mens=mens.filter(x=>x.id!==id);
    addLog('Mensalidade #'+id+' excluída');
    closeM('mEditMens');
    toast('✓ Mensalidade excluída!');
    filtM();
  }catch(e){toast('Erro: '+e.message,'err');}
}

// ═══ EXCLUIR MENSALIDADE (duplicada ou criada errada) ═══
async function excluirMensDir(id){
  const m=mens.find(x=>x.id===id);
  if(!m){toast('Mensalidade não encontrada','err');return;}
  const c=GC(m.cliente_id);
  if(!confirm('Excluir a mensalidade de '+(c.nome||'cliente')+' '+M[m.mes]+'/'+m.ano+' ('+R(m.valor||0)+')?\n\nEsta ação NÃO pode ser desfeita.'))return;
  try{
    const r=await fetch(`${SU}/rest/v1/mensalidades?id=eq.${id}`,{method:'DELETE',headers:SH});
    if(!r.ok)throw new Error('HTTP '+r.status);
    mens=mens.filter(x=>x.id!==id);
    addLog('Mensalidade #'+id+' excluída ('+(c.nome||'')+' '+M[m.mes]+'/'+m.ano+')');
    toast('✓ Mensalidade excluída!');
    filtM();renderDash();
    const ov=document.getElementById('ov-mFichaContr');
    if(ov&&ov.classList.contains('on')&&typeof renderMensContr==='function')renderMensContr(m.cliente_id);
  }catch(e){toast('Erro ao excluir: '+e.message,'err');addLog('Erro excluirMens: '+e.message);}
}

// ═══ ESTORNAR BAIXA DE MENSALIDADE (corrige baixa lançada errada) ═══
async function estornarBaixa(id){
  const m=mens.find(x=>x.id===id);
  if(!m){toast('Mensalidade não encontrada','err');return;}
  const c=GC(m.cliente_id);
  if(!confirm('Estornar a baixa de '+(c.nome||'cliente')+' '+M[m.mes]+'/'+m.ano+'?\n\nO status volta para PENDENTE e a data de baixa é apagada.'))return;
  try{
    await sbu('mensalidades',id,{status:'PENDENTE',data_baixa:null,formato:null});
    const idx=mens.findIndex(x=>x.id===id);
    if(idx>=0){mens[idx].status='PENDENTE';mens[idx].data_baixa=null;mens[idx].formato=null;}
    addLog('Baixa estornada: mensalidade #'+id+' ('+(c.nome||'')+')');
    toast('✓ Baixa estornada — mensalidade voltou a PENDENTE');
    filtM();renderDash();
  }catch(e){toast('Erro ao estornar: '+e.message,'err');addLog('Erro estornarBaixa: '+e.message);}
}

// ═══ ATUALIZAR PENDENTE → VENCIDO (datas já vencidas) ═══
async function sincStatusVencidos(){
  const hoje=new Date();hoje.setHours(0,0,0,0);
  const alvo=mens.filter(m=>m.status==='PENDENTE'&&m.vencimento&&new Date(m.vencimento+'T00:00:00')<hoje);
  if(!alvo.length){toast('Nenhuma mensalidade pendente vencida — tudo em dia');return;}
  if(!confirm('Atualizar '+alvo.length+' mensalidade(s) de PENDENTE para VENCIDO?'))return;
  let ok=0;
  for(const m of alvo){
    try{
      await sbu('mensalidades',m.id,{status:'VENCIDO'});
      const idx=mens.findIndex(x=>x.id===m.id);
      if(idx>=0)mens[idx].status='VENCIDO';
      ok++;
    }catch(e){addLog('Erro sincStatusVencidos #'+m.id+': '+e.message);}
  }
  addLog('✓ '+ok+' mensalidade(s) marcada(s) como VENCIDO');
  toast('✓ '+ok+' mensalidade(s) atualizada(s) para VENCIDO');
  filtM();renderDash();
}

// ═══ IMPORTAÇÃO EM LOTE DE MENSALIDADES ═══
function abrirImportLote(){openM('mImportLote');}
async function processarImportLote(){
  const txt=document.getElementById('imp-csv').value.trim();
  if(!txt){toast('Cole o CSV','warn');return;}
  const linhas=txt.split('\n').filter(l=>l.trim()).slice(1); // pula cabeçalho
  let ok=0,err=0,skip=0;
  for(const ln of linhas){
    const [cod,mes,ano,valor,venc]=ln.split(/[;,\t]/).map(s=>s.trim().replace(/^"|"$/g,''));
    if(!cod||!mes||!ano||!valor){err++;continue;}
    const c=cli.find(x=>String(x.cod).trim()===cod.trim());
    if(!c){err++;addLog('Lote: cod '+cod+' não encontrado');continue;}
    // Verificar duplicata
    const ja=mens.some(m=>m.cliente_id===c.id&&m.mes===Number(mes)&&m.ano===Number(ano));
    if(ja){skip++;continue;}
    try{
      const vn=venc||(ano+'-'+String(mes).padStart(2,'0')+'-'+String(c.venc_dia||20).padStart(2,'0'));
      const r=await sbi('mensalidades',{cliente_id:c.id,mes:Number(mes),ano:Number(ano),valor:Number(valor.replace(',','.')),vencimento:vn,status:'PENDENTE'});
      if(Array.isArray(r)&&r[0])mens.push(r[0]);
      ok++;
    }catch(e){err++;addLog('Erro lote: '+e.message);}
  }
  toast('✓ Lote: '+ok+' criadas, '+skip+' duplicadas, '+err+' erros');
  closeM('mImportLote');
  filtM();
}

// ═══ CANCELAMENTO DE MENSALIDADE ═══
function abrCancelarMens(mid){
  const m=mens.find(x=>x.id===mid);
  if(!m)return;
  const c=GC(m.cliente_id);
  document.getElementById('cm-id').value=mid;
  document.getElementById('cm-info').innerHTML=
    `<strong>${c.nome||'—'}</strong> · ${M[m.mes]}/${m.ano} · ${R(m.valor||0)} · venc. ${m.vencimento?m.vencimento.split('-').reverse().join('/'):'—'}`;
  document.getElementById('cm-motivo').value='';
  openM('mCancelarMens');
}

async function execCancelarMens(){
  const mid=Number(document.getElementById('cm-id').value);
  const motivo=document.getElementById('cm-motivo').value.trim();
  if(!motivo){toast('Informe o motivo','warn');return;}
  try{
    await sbu('mensalidades',mid,{status:'CANCELADO',motivo_cancelamento:motivo});
    const idx=mens.findIndex(m=>m.id===mid);
    if(idx>=0){mens[idx].status='CANCELADO';mens[idx].motivo_cancelamento=motivo;}
    closeM('mCancelarMens');
    toast('✓ Mensalidade cancelada');
    filtM();
    addLog('Mensalidade #'+mid+' cancelada: '+motivo);
  }catch(e){toast('Erro: '+e.message,'err');}
}
