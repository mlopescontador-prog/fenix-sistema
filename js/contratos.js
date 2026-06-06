// ════════════════════════════════════════
// FÊNIX CONT — contratos.js
// Contratos, renovação, renegociação
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ CONTRATOS ═══

// ═══ CONTRATOS ═══
function diasRenov(x){return x.renovacao?Math.ceil((new Date(x.renovacao)-new Date())/86400000):999;}
function isInterno(x){return(x.status||'')==='INTERNO';}
function isGrupo(x){return !!x.pagador_id;}

function filtC(){
  const sr=(document.getElementById('srcC')?.value||'').toLowerCase();
  const fst=document.getElementById('fCSt')?.value||'';
  const ftrib=document.getElementById('fCTrib')?.value||'';
  const fprazo=document.getElementById('fCPrazo')?.value||'';
  const fgrp=document.getElementById('fCGrp')?.value||'';
  let fl=contr.filter(x=>{
    const c=GC(x.cliente_id);
    const ge=x.grupo_economico||'';
    if(sr&&!(c.nome||'').toLowerCase().includes(sr)&&!ge.toLowerCase().includes(sr))return false;
    if(fst&&(x.status||'ATIVO')!==fst)return false;
    if(ftrib&&(x.tributacao||'')!==ftrib)return false;
    if(fprazo&&!isInterno(x)){
      const di=diasRenov(x);
      if(fprazo==='vencido'&&di>=0)return false;
      if(fprazo==='30'&&(di<0||di>30))return false;
      if(fprazo==='60'&&(di<0||di>60))return false;
      if(fprazo==='90'&&di<=60)return false;
    }
    if(fgrp==='grupo'&&!isGrupo(x))return false;
    if(fgrp==='normal'&&(isGrupo(x)||isInterno(x)))return false;
    return true;
  });
  // Internos vão pro fim; vencidos primeiro dentro de cada grupo
  fl.sort((a,b)=>{
    const ai=isInterno(a)?1:0,bi=isInterno(b)?1:0;
    if(ai!==bi)return ai-bi;
    return diasRenov(a)-diasRenov(b);
  });
  // KPIs — excluir internos e membros de grupo (evitar dupla contagem)
  const ativos=contr.filter(x=>(x.status||'ATIVO')==='ATIVO'&&!isGrupo(x));
  const vencidos=ativos.filter(x=>diasRenov(x)<0);
  const em30=ativos.filter(x=>{const d=diasRenov(x);return d>=0&&d<=30;});
  const saud=ativos.filter(x=>diasRenov(x)>30);
  const internos=contr.filter(isInterno);
  document.getElementById('cKPIs').innerHTML=`
    <div style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid rgba(239,68,68,.3);background:rgba(239,68,68,.05);cursor:pointer;" onclick="setFiltC('vencido')">
      <div style="font-size:9px;color:var(--red);font-weight:700;letter-spacing:1px;margin-bottom:3px;">🔴 VENCIDOS</div>
      <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--red);">${vencidos.length}</div>
      <div style="font-size:9px;color:var(--muted);">sem renovação</div>
    </div>
    <div style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid rgba(234,179,8,.3);background:rgba(234,179,8,.05);cursor:pointer;" onclick="setFiltC('30')">
      <div style="font-size:9px;color:var(--yellow);font-weight:700;letter-spacing:1px;margin-bottom:3px;">🟡 VENCEM 30D</div>
      <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--yellow);">${em30.length}</div>
      <div style="font-size:9px;color:var(--muted);">requerem atenção</div>
    </div>
    <div style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid rgba(34,197,94,.3);background:rgba(34,197,94,.05);cursor:pointer;" onclick="setFiltC('')">
      <div style="font-size:9px;color:var(--green);font-weight:700;letter-spacing:1px;margin-bottom:3px;">🟢 SAUDÁVEIS</div>
      <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--green);">${saud.length}</div>
      <div style="font-size:9px;color:var(--muted);">ativos e em dia</div>
    </div>
    <div style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid rgba(99,102,241,.3);background:rgba(99,102,241,.05);cursor:pointer;" onclick="document.getElementById('fCSt').value='INTERNO';filtC()">
      <div style="font-size:9px;color:#818cf8;font-weight:700;letter-spacing:1px;margin-bottom:3px;">🏠 INTERNOS</div>
      <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#818cf8;">${internos.length}</div>
      <div style="font-size:9px;color:var(--muted);">fora dos cálculos</div>
    </div>`;
  document.getElementById('cLabel').textContent=fl.length+' contratos';
  // ── Cabeçalho da tabela ───────────────────────────────────────────────────
  const thead=`<div style="position:sticky;top:0;z-index:10;background:var(--s2);border-bottom:2px solid var(--brd);">
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <colgroup>
        <col style="width:58px;">
        <col style="width:auto;">
        <col style="width:145px;">
        <col style="width:110px;">
        <col style="width:90px;">
        <col style="width:75px;">
        <col style="width:195px;">
        <col style="width:115px;">
      </colgroup>
      <thead><tr>
        <th style="padding:8px 6px 8px 12px;text-align:left;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Cód.</th>
        <th style="padding:8px 6px;text-align:left;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Cliente</th>
        <th style="padding:8px 6px;text-align:left;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">CNPJ</th>
        <th style="padding:8px 6px;text-align:left;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Tributação</th>
        <th style="padding:8px 6px;text-align:left;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Início</th>
        <th style="padding:8px 6px;text-align:left;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Tempo</th>
        <th style="padding:8px 6px;text-align:center;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Ações</th>
        <th style="padding:8px 12px 8px 6px;text-align:right;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Valor/mês</th>
      </tr></thead>
    </table>
  </div>`;

  // ── Linhas da tabela ──────────────────────────────────────────────────────
  const rows=fl.map(x=>{
    const c=GC(x.cliente_id);
    const di=diasRenov(x);
    const st=x.status||'ATIVO';
    const enc=st==='ENCERRADO';
    const susp=st==='SUSPENSO';
    const intern=st==='INTERNO';
    const grupo=isGrupo(x);
    const pagador=grupo?GC(x.pagador_id):null;
    const op=enc||intern?'opacity:.6;':'';
    // Cor da borda esquerda da linha
    const brdL=intern?'#6366f1':enc?'#6b7280':grupo?'#06b6d4':di<0?'#ef4444':di<=30?'#eab308':'#2dd4bf';
    const bgRow=intern?'rgba(99,102,241,.04)':susp?'rgba(234,179,8,.03)':grupo?'rgba(6,182,212,.02)':'';
    // Badges
    const bdgSt=intern?'<span class="bdg" style="background:rgba(99,102,241,.15);color:#818cf8;border:1px solid rgba(99,102,241,.3);font-size:7px;padding:1px 4px;">🏠 INT</span>'
      :enc?'<span class="bdg" style="background:rgba(107,114,128,.15);color:var(--muted2);border:1px solid rgba(107,114,128,.2);font-size:7px;padding:1px 4px;">ENC</span>'
      :susp?'<span class="bdg by2" style="font-size:7px;padding:1px 4px;">SUS</span>'
      :'<span class="bdg bg2" style="font-size:7px;padding:1px 4px;">ATIVO</span>';
    const bdgGrp=grupo?`<span class="bdg" style="background:rgba(6,182,212,.12);color:var(--teal);border:1px solid rgba(6,182,212,.25);font-size:7px;padding:1px 4px;">🔗</span>`:''
    // Flags
    const flags=[];
    if(x.reneg_regime)flags.push('R');if(x.reneg_volume)flags.push('V');
    if(x.reneg_socios)flags.push('S');if(x.reneg_func)flags.push('F');
    const reneg=flags.length?`<span title="Renegociar: ${flags.join(',')}" style="color:var(--yellow);font-size:9px;margin-left:3px;">⚠</span>`:'';
    // Prazo
    const prazoCor=intern?'#818cf8':enc?'var(--muted)':di<0?'var(--red)':di<=30?'var(--yellow)':'var(--muted2)';
    const prazoTxt=intern?'Interno':enc?`Enc. ${x.dt_encerramento?new Date(x.dt_encerramento).toLocaleDateString('pt-BR','').slice(3):''}`:di<0?`⚠ ${Math.abs(di)}d vencido`:di===0?'Vence hoje':di<=30?`${di}d p/ renovar`:`${di}d p/ renovar`;
    // Valor
    const valCor=intern?'var(--muted)':grupo&&x.valor===0?'var(--muted)':'var(--acc)';
    const valTxt=intern?'—':grupo&&x.valor===0?`via ${pagador?.cod||'grupo'}`:R(x.valor);
    // Tributação abreviada
    const tribAbr={'Simples Nacional':'Simples','Lucro Presumido':'L. Presumido','Lucro Real':'L. Real','MEI':'MEI'};
    const trib=tribAbr[x.tributacao]||x.tributacao||'—';
    const tc=x.inicio?calcTempo(x.inicio):'—';
    const iniTxt=x.inicio?new Date(x.inicio).toLocaleDateString('pt-BR',{month:'2-digit',year:'numeric'}):'—';
    return`<tr style="border-bottom:1px solid var(--brd);${op}${bgRow?'background:'+bgRow+';':''}border-left:3px solid ${brdL};" onmouseover="this.style.background='var(--s2)'" onmouseout="this.style.background='${bgRow||'transparent'}'">
      <td style="padding:8px 6px 8px 12px;font-size:10px;color:var(--muted);white-space:nowrap;">${c.cod||'—'}</td>
      <td style="padding:8px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0;">
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="font-weight:600;font-size:11px;color:var(--txt);cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" onclick="abrFichaContr(${x.id})" title="${c.nome||''}">${c.nome||'—'}</span>
          ${bdgSt}${bdgGrp}${reneg}
        </div>
        ${grupo&&pagador?`<div style="font-size:9px;color:var(--teal);">💳 ${pagador.nome}</div>`:''}
      </td>
      <td style="padding:8px 6px;font-size:10px;color:var(--muted);white-space:nowrap;">${c.cnpj||'—'}</td>
      <td style="padding:8px 6px;font-size:10px;color:var(--muted2);white-space:nowrap;">${trib}</td>
      <td style="padding:8px 6px;font-size:10px;color:var(--muted);white-space:nowrap;">${iniTxt}</td>
      <td style="padding:8px 6px;font-size:10px;color:var(--muted2);white-space:nowrap;">${tc}</td>
      <td style="padding:6px;text-align:center;">
        <div style="display:flex;gap:3px;justify-content:center;flex-wrap:nowrap;">
          <button class="btn bo bxs" onclick="abrFichaContr(${x.id})" title="Ficha">📋</button>
          ${!enc&&!intern?`<button class="btn ba bxs" onclick="abrRenov(${x.id})" title="Renovar">🔄</button>`:''}
          <button class="btn bo bxs" onclick="abrEditContr(${x.id})" title="Editar">✏</button>
          ${!intern?`<button class="btn bo bxs" onclick="irCobr(${x.cliente_id})" title="Cobrar">💬</button>`:''}
        </div>
        <div style="font-size:9px;color:${prazoCor};margin-top:3px;white-space:nowrap;">${prazoTxt}</div>
      </td>
      <td style="padding:8px 12px 8px 6px;text-align:right;white-space:nowrap;">
        <span style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:${valCor};">${valTxt}</span>
        ${x.motivo_enc?`<div style="font-size:9px;color:var(--muted);">${x.motivo_enc.split(' ').slice(0,2).join(' ')}</div>`:''}
      </td>
    </tr>`;
  }).join('');

  document.getElementById('cList').innerHTML=fl.length
    ?`${thead}
        <div style="max-height:620px;overflow-y:auto;">
          <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
            <colgroup>
              <col style="width:58px;"><col style="width:auto;"><col style="width:145px;">
              <col style="width:110px;"><col style="width:90px;"><col style="width:75px;">
              <col style="width:195px;"><col style="width:115px;">
            </colgroup>
            <tbody>${rows}</tbody>
          </table>
        </div>`
    :'<div style="text-align:center;padding:30px;color:var(--muted);font-size:12px;">Nenhum contrato encontrado</div>';
}

function setFiltC(prazo){
  document.getElementById('fCPrazo').value=prazo;
  filtC();
}

function calcTempo(inicio){
  if(!inicio)return'—';
  const d=Math.floor((new Date()-new Date(inicio))/86400000);
  if(d<30)return d+'d';
  if(d<365)return Math.floor(d/30)+'m';
  const a=Math.floor(d/365);const m=Math.floor((d%365)/30);
  return a+'a'+(m?` ${m}m`:'');
}

function toggleEncerramentoFields(){
  const st=document.getElementById('ct-st').value;
  document.getElementById('ct-encDiv').style.display=st==='ENCERRADO'?'block':'none';
  document.getElementById('ct-internoDiv').style.display=st==='INTERNO'?'block':'none';
}

function updGrpAviso(){
  const pag=document.getElementById('ct-pag')?.value||'';
  const av=document.getElementById('ct-grpAviso');
  if(av)av.style.display=pag?'block':'none';
}

function updReneg(){
  const any=['ct-chkReg','ct-chkVol','ct-chkSoc','ct-chkFun'].some(id=>document.getElementById(id)?.checked);
  document.getElementById('ct-reneg-alerta').style.display=any?'block':'none';
}

function abrEditContr(cid){
  const x=contr.find(c=>c.id===cid);
  if(!x)return;
  const c=GC(x.cliente_id);
  document.getElementById('ct-title').textContent='✏ Editar Contrato';
  document.getElementById('ct-id').value=x.id;
  const optsE=cli.map(cl=>`<option value="${cl.id}" ${cl.id===x.cliente_id?'selected':''}>${cl.cod||''} · ${cl.nome}</option>`).join('');
  document.getElementById('ct-c').innerHTML=optsE;
  document.getElementById('ct-pag').innerHTML='<option value="">— Nenhum (paga direto) —</option>'+optsE;
  document.getElementById('ct-v').value=x.valor??'';
  document.getElementById('ct-i').value=x.inicio||'';
  document.getElementById('ct-r').value=x.renovacao||'';
  document.getElementById('ct-t').value=x.tributacao||'Simples Nacional';
  document.getElementById('ct-st').value=x.status||'ATIVO';
  document.getElementById('ct-ge').value=x.grupo_economico||'';
  document.getElementById('ct-pag').value=x.pagador_id||'';
  document.getElementById('ct-o').value=x.obs||'';
  document.getElementById('ct-denc').value=x.dt_encerramento||'';
  document.getElementById('ct-menc').value=x.motivo_enc||'';
  document.getElementById('ct-chkReg').checked=!!x.reneg_regime;
  document.getElementById('ct-chkVol').checked=!!x.reneg_volume;
  document.getElementById('ct-chkSoc').checked=!!x.reneg_socios;
  document.getElementById('ct-chkFun').checked=!!x.reneg_func;
  toggleEncerramentoFields();updReneg();updGrpAviso();
  document.getElementById('ov-mContr').classList.add('on');
}

function abrRenov(cid){
  const x=contr.find(c=>c.id===cid);
  if(!x)return;
  const cl=GC(x.cliente_id);
  document.getElementById('rv-id').value=x.id;
  document.getElementById('rv-cli').textContent=cl.nome+' · '+R(x.valor)+'/mês';
  document.getElementById('rv-vatual').value=x.valor||0;
  document.getElementById('rv-vnovo').value=x.valor||0;
  const sug=((x.valor||0)*1.1).toFixed(2);
  document.getElementById('rv-sug').textContent=R(Number(sug));
  // Nova data: +1 ano da renovação atual ou hoje +1 ano
  const base=x.renovacao?new Date(x.renovacao):new Date();
  base.setFullYear(base.getFullYear()+1);
  document.getElementById('rv-data').value=base.toISOString().split('T')[0];
  openM('mRenov');
}

function apSug(){
  const va=Number(document.getElementById('rv-vatual').value)||0;
  document.getElementById('rv-vnovo').value=(va*1.1).toFixed(2);
}

async function execRenov(){
  const cid=Number(document.getElementById('rv-id').value);
  const x=contr.find(c=>c.id===cid);
  if(!x)return;
  const vnovo=Number(document.getElementById('rv-vnovo').value)||x.valor;
  const ndata=document.getElementById('rv-data').value;
  const motivo=document.getElementById('rv-motivo').value;
  const gerarM=document.getElementById('rv-gerarMens').checked;
  const envwa=document.getElementById('rv-envWA').checked;
  // Salvar histórico de valor se mudou
  const hist=x.hist_valores?JSON.parse(x.hist_valores):[];
  if(vnovo!==x.valor)hist.push({data:new Date().toISOString().split('T')[0],valor:x.valor,motivo});
  try{
    const upd={valor:vnovo,renovacao:ndata,hist_valores:JSON.stringify(hist),status:'ATIVO'};
    await sbu('contratos',cid,upd);
    const idx=contr.findIndex(c=>c.id===cid);
    if(idx>=0)Object.assign(contr[idx],upd);
    if(gerarM){
      const cl=GC(x.cliente_id);const hj=new Date();const me=hj.getMonth()+1;const an=hj.getFullYear();
      const vn=`${an}-${String(me).padStart(2,'0')}-${String(cl.venc_dia||20).padStart(2,'0')}`;
      const nm=await sbi('mensalidades',{cliente_id:x.cliente_id,valor:vnovo,mes:me,ano:an,vencimento:vn,status:'PENDENTE'});
      if(Array.isArray(nm)&&nm[0])mens.push(nm[0]);
    }
    if(envwa){const cl=GC(x.cliente_id);const tel=(cl.tel||'').replace(/\D/g,'');window.open('https://wa.me/'+(tel?'55'+tel:'')+'?text='+encodeURIComponent(`Olá, ${cl.nome}! Seguem os dados da renovação do contrato 2026.

💰 Novo valor: *${R(vnovo)}/mês*
📅 Próx. renovação: *${ndata.split('-').reverse().join('/')}*

Fênix`),'_blank');}
    toast('✓ Contrato renovado!');
    closeM('mRenov');filtC();
  }catch(e){toast('Erro: '+e.message,'err');}
}

function abrGerarMens(cid){
  toast('Geração de boletos em lote por contrato — em desenvolvimento','warn');
}

function renderMensContr(cid){
  const ms=mens.filter(m=>m.cliente_id===cid).sort((a,b)=>(b.ano-a.ano)||(b.mes-a.mes));
  const pagas=ms.filter(m=>m.status==='PAGO'||m.status==='BONIFICADO').length;
  const abertas=ms.filter(m=>m.status==='PENDENTE'||m.status==='VENCIDO').length;
  const rEl=document.getElementById('fctr-mens-resumo');
  if(rEl)rEl.textContent=`${ms.length} mensalidade(s) · ${pagas} paga(s) · ${abertas} em aberto`;
  const tb=document.getElementById('fctr-mens-table');
  if(!tb)return;
  if(!ms.length){tb.innerHTML='<tr><td colspan="6" style="padding:14px;text-align:center;color:var(--muted);">Nenhuma mensalidade</td></tr>';return;}
  const nome=(GC(cid).nome||'').replace(/'/g,'');
  tb.innerHTML=ms.map(m=>{
    const venc=m.vencimento?m.vencimento.split('-').reverse().join('/'):'—';
    const pag=m.data_baixa?m.data_baixa.split('-').reverse().join('/'):'—';
    const paga=m.status==='PAGO'||m.status==='BONIFICADO';
    const acao=paga
      ?`<button class="btn bo bxs" onclick="estornarBaixa(${m.id})" title="Estornar baixa" style="color:var(--red);border-color:rgba(220,38,38,.3);">↩</button>`
      :`<button class="btn bg bxs" onclick="abrBaixa(${m.id},'${nome}')" title="Dar baixa">✓</button>`;
    return `<tr style="border-bottom:1px solid var(--brd);">
      <td style="padding:6px 10px;color:var(--muted2);">${M[m.mes]}/${m.ano}</td>
      <td style="padding:6px 10px;text-align:right;font-weight:500;">${R(m.valor||0)}</td>
      <td style="padding:6px 10px;color:var(--muted);">${venc}</td>
      <td style="padding:6px 10px;">${bdg(m.status)}</td>
      <td style="padding:6px 10px;color:var(--muted);">${pag}</td>
      <td style="padding:6px 10px;text-align:center;"><div style="display:flex;gap:3px;justify-content:center;">
        <button class="btn bo bxs" onclick="abrEditMens(${m.id})" title="Editar / corrigir">✏</button>
        ${acao}
        <button class="btn bo bxs" onclick="excluirMensDir(${m.id})" title="Excluir mensalidade" style="color:var(--red);border-color:rgba(220,38,38,.3);">🗑</button>
      </div></td>
    </tr>`;
  }).join('');
}

function abrFichaContr(cid){
  const x=contr.find(c=>c.id===cid);
  if(!x)return;
  const c=GC(x.cliente_id);
  const di=diasRenov(x);
  const st=x.status||'ATIVO';
  document.getElementById('fctr-nome').textContent=c.nome||'—';
  document.getElementById('fctr-sub').textContent=(c.cnpj||'—')+' · '+(x.tributacao||'—');
  const stCor={ATIVO:'bg2',SUSPENSO:'by2',ENCERRADO:''}[st]||'';
  document.getElementById('fctr-badge').innerHTML=`<span class="bdg ${stCor}" style="${st==='ENCERRADO'?'background:rgba(107,114,128,.15);color:var(--muted2);':''}">${st}</span>`;
  document.getElementById('fctr-valor').textContent=R(x.valor||0)+'/mês';
  document.getElementById('fctr-tempo').textContent=x.inicio?calcTempo(x.inicio):'—';
  const renovTxt=di<0?`Vencido há ${Math.abs(di)}d`:di===0?'Hoje':di+'d';
  document.getElementById('fctr-renov').textContent=renovTxt;
  document.getElementById('fctr-renov').style.color=di<0?'var(--red)':di<=30?'var(--yellow)':'var(--green)';
  // Total recebido
  const tot=mens.filter(m=>m.cliente_id===x.cliente_id&&m.status==='PAGO').reduce((a,m)=>a+(m.valor||0),0);
  document.getElementById('fctr-total').textContent=R(tot);
  // Histórico de valores
  const hist=x.hist_valores?JSON.parse(x.hist_valores):[];
  const histRows=[{data:x.inicio||'—',valor:x.valor,motivo:'Valor atual'},...hist].reverse();
  document.getElementById('fctr-hist').innerHTML=histRows.length?
    `<table style="width:100%;border-collapse:collapse;">${histRows.map((h,i)=>`<tr style="${i%2===0?'background:var(--s2);':''}"><td style="padding:5px 10px;font-size:10px;color:var(--muted);">${h.data?h.data.split('-').reverse().join('/'):'—'}</td><td style="padding:5px 10px;font-size:10px;font-weight:600;">${R(h.valor||0)}</td><td style="padding:5px 10px;font-size:10px;color:var(--muted2);">${h.motivo||'—'}</td></tr>`).join('')}</table>`
    :'<div style="padding:10px;font-size:11px;color:var(--muted);text-align:center;">Sem histórico de reajustes</div>';
  // Renegociação
  const flags=[];
  if(x.reneg_regime)flags.push('Mudança de regime tributário');
  if(x.reneg_volume)flags.push('Aumento de volume');
  if(x.reneg_socios)flags.push('Mudança societária');
  if(x.reneg_func)flags.push('Aumento de funcionários');
  document.getElementById('fctr-reneg').style.display=flags.length?'block':'none';
  document.getElementById('fctr-reneg-txt').textContent=flags.join(', ');
  // Botões
  const tel=(c.tel||'').replace(/\D/g,'');
  document.getElementById('fctr-btnWA').onclick=()=>window.open('https://wa.me/'+(tel?'55'+tel:''),'_blank');
  document.getElementById('fctr-btnEmail').onclick=()=>{window.location.href='mailto:'+(c.email||'');};
  document.getElementById('fctr-btnRenov').onclick=()=>{closeM('mFichaContr');abrRenov(cid);};
  document.getElementById('fctr-btnEdit').onclick=()=>{closeM('mFichaContr');abrEditContr(cid);};
  document.getElementById('fctr-btnRenov').style.display=st==='ENCERRADO'?'none':'inline-flex';
  document.getElementById('fctr-btnGerarMens').style.display=st==='ENCERRADO'?'none':'inline-flex';
  document.getElementById('fctr-btnGerarMens').onclick=()=>abrGerarMens(cid);
  renderMensContr(x.cliente_id);
  openM('mFichaContr');
}
