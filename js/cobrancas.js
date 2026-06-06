// ════════════════════════════════════════
// FÊNIX CONT — cobrancas.js
// Mensagens, inadimplentes, templates
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ COBRANÇAS ═══
function renderCobr(){
  const s=document.getElementById('coCli');
  s.innerHTML='<option value="">— Selecione —</option>'+cli.map(c=>`<option value="${c.id}">${c.cod||''} · ${c.nome}</option>`).join('');
  renderInad();
}
function renderInad(){
  const vc=mens.filter(m=>m.status==='VENCIDO');
  const pr={};vc.forEach(m=>{if(!pr[m.cliente_id])pr[m.cliente_id]=[];pr[m.cliente_id].push(m);});
  document.getElementById('inadC').innerHTML=Object.entries(pr).map(([cid,ms])=>{
    const c=GC(Number(cid));
    const tt=ms.reduce((a,m)=>a+(m.valor||0),0);
    const mS=ms.map(m=>`${M[m.mes]}/${m.ano}`).join(', ');
    return`<div class="ic"><div class="icn">${c.nome||'—'}</div><div class="ici">${c.cnpj||'—'}</div><div class="icv">${R(tt)}</div><div class="icm">⚠ ${ms.length} mês(es): ${mS}</div><div class="ica"><button class="btn bo bxs" onclick="irCobr(${c.id})">✏ Msg</button><button class="btn bg bxs" onclick="abrBaixa(${ms[0].id},'${(c.nome||'').replace(/'/g,'')}')">✓ Baixa</button></div></div>`;
  }).join('')||'<div style="font-size:12px;color:var(--muted);padding:20px;text-align:center;grid-column:1/-1">🎉 Nenhum inadimplente!</div>';
}

function genMsg(){
  const cid=Number(document.getElementById('coCli').value);
  const tp=document.getElementById('coTp').value;
  const cn=document.getElementById('coCan').value;
  const pv=document.getElementById('mPrev');
  if(!cid){pv.textContent='Selecione um cliente.';return;}
  const c=GC(cid);
  const vc=mens.filter(m=>m.cliente_id===cid&&m.status==='VENCIDO');
  const tt=vc.reduce((a,m)=>a+(m.valor||0),0);
  const mS=vc.map(m=>`${MF[m.mes]}/${m.ano}`).join(', ');
  const px=mens.find(m=>m.cliente_id===cid&&m.status==='PENDENTE');
  let msg='';
  if(tp==='lembrete'){const vp=px?R(px.valor):R(c.valor);const dp=px?px.vencimento?.split('-').reverse().join('/'):('dia '+(c.venc_dia||20));msg=cn==='whatsapp'?`Olá, ${c.nome}! 😊\n\nPassando para lembrar que a mensalidade vence em breve.\n\n📅 Vencimento: *${dp}*\n💰 Valor: *${vp}*\n\nQualquer dúvida, estou à disposição!\n\n_Fênix Serviços Contábeis_`:`Assunto: Lembrete de vencimento\n\nPrezado(a) ${c.nome},\n\nMensalidade vencerá em ${dp}, valor ${vp}.\n\nAtenciosamente,\nFênix Serviços Contábeis`;}
  else if(tp==='vencido'){if(!vc.length){pv.textContent='Sem mensalidades vencidas.';return;}msg=cn==='whatsapp'?`Olá, ${c.nome}!\n\nMensalidade(s) em aberto:\n\n📋 *${mS}*\n💰 Total: *${R(tt)}*\n\nRegularize para evitar problemas com a interrupção dos serviços contábeis.\n\nFênix`:`Assunto: Mensalidade em aberto\n\nPrezado(a) ${c.nome},\n\n${mS} em aberto, total ${R(tt)}.\n\nFênix Serviços Contábeis`;}
  else if(tp==='urgente'){msg=cn==='whatsapp'?`Olá, ${c.nome}.\n\n⚠️ *AVISO IMPORTANTE*\n\n*${vc.length} mensalidade(s) em atraso*\nTotal: *${R(tt)}* — Ref.: ${mS}\n\nRegularize urgente para evitar suspensão dos Serviços.\n\n📲 (11) 97464-5012 — Marcos\n\nFênix`:`Assunto: URGENTE — ${c.nome}\n\n${vc.length} mensalidade(s) atrasada(s) — ${R(tt)}.\nSuspensão em 3 dias úteis.\n\nFênix Serviços Contábeis`;}
  else if(tp==='renovacao'){const nv=R((c.valor||0)*1.1);msg=cn==='whatsapp'?`Olá, ${c.nome}! Tudo bem?\n\nFormalizamos a renovação dos serviços contábeis para 2026.\n\n💰 Proposta: *${nv}/mês*\n\nMe dá um *OK*! 😊\n\nFênix`:`Assunto: Renovação 2026\n\nPrezado(a) ${c.nome},\n\nRenovação 2026 no valor de ${nv}/mês.\n\nAguardamos confirmação.\n\nMarcos Lopes — Fênix Serviços Contábeis`;}
  else{msg=cn==='whatsapp'?`Olá, ${c.nome}! 💙\n\nSaldo em aberto: *${R(tt||c.valor||0)}*\n\nPodemos negociar:\n✅ Parcelamento\n✅ Prazo estendido\n\n📲 (11) 97464-5012 — Marcos`:`Assunto: Proposta de regularização\n\nPrezado(a) ${c.nome},\n\nNegociação do saldo ${R(tt||c.valor||0)}.\n\nFênix Serviços Contábeis`;}
  pv.textContent=msg;
}
function cpMsg(){const m=document.getElementById('mPrev').textContent;if(m.length<5)return;navigator.clipboard.writeText(m).then(()=>toast('📋 Copiado!'));}

function irCobr(cid){
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById('page-cobr').classList.add('on');
  document.querySelectorAll('.nb').forEach(b=>{if((b.getAttribute('onclick')||'').includes("'cobr'"))b.classList.add('on');});
  renderCobr();
  setTimeout(()=>{document.getElementById('coCli').value=cid;genMsg();},100);
}

// ═══ BAIXA ═══
function abrBaixa(mid,nome){bId=mid;document.getElementById('bNome').textContent=nome;document.getElementById('bData').value=new Date().toISOString().split('T')[0];openM('mBaixa');}
async function confBaixa(){
  const dataBaixa=document.getElementById('bData').value;
  const fmt=document.getElementById('bFmt').value;
  const obs=document.getElementById('bObs').value;
  if(!dataBaixa){toast('Informe a data do pagamento','warn');return;}
  try{
    await sbu('mensalidades',bId,{status:'PAGO',data_baixa:dataBaixa,formato:fmt,obs:obs});
    // Atualizar local
    const idx=mens.findIndex(m=>m.id===bId);
    if(idx>=0){
      mens[idx].status='PAGO';
      mens[idx].data_baixa=dataBaixa;
      mens[idx].formato=fmt;
    }
    addLog('Baixa mensalidade #'+bId+' registrada no banco');
    closeM('mBaixa');
    toast('✓ Pagamento salvo no banco!');
    const ac=document.querySelector('.page.on').id.replace('page-','');
    if(ac==='dash')renderDash();
    if(ac==='mens')filtM();
    if(ac==='cobr')renderCobr();
  }catch(e){toast('Erro ao registrar baixa: '+e.message,'err');addLog('Erro confBaixa: '+e.message);}
}

// ═══ TEMPLATES DE MENSAGEM ═══
let templatesMsg=[];

async function carregarTemplates(){
  try{
    const r=await fetch(`${SU}/rest/v1/templates_msg?select=*&ativo=eq.true&order=nome.asc`,{headers:SH});
    templatesMsg=await r.json();
  }catch(e){addLog('Erro templates: '+e.message);templatesMsg=[];}
}

function aplicarTemplate(template, c, extras={}){
  let txt=template.conteudo||'';
  // Substituir variáveis
  const vars={
    '{nome}': c.nome||'',
    '{cnpj}': c.cnpj||'',
    '{valor}': R(extras.valor||c.valor||0),
    '{valor_total}': R(extras.valor_total||0),
    '{valor_atual}': R(extras.valor_atual||0),
    '{valor_novo}': R(extras.valor_novo||0),
    '{dia_venc}': c.venc_dia||20,
    '{mes_ano}': extras.mes_ano||'',
    '{meses}': extras.meses||'',
    '{data_pgto}': extras.data_pgto||'',
    '{dias_renov}': extras.dias_renov||'',
    '{data_renov}': extras.data_renov||''
  };
  Object.entries(vars).forEach(([k,v])=>{txt=txt.replaceAll(k,String(v));});
  return txt;
}

// ═══ EXPORTAR COBRANÇAS → EXCEL NEOFIN ═══
let _expCobrPeriodo={mes:null,ano:null};

function abrExportCobrancas(){
  const hj=new Date();
  document.getElementById('exp-mes').value=hj.getMonth()+1;
  document.getElementById('exp-ano').value=hj.getFullYear();
  document.getElementById('exp-tipo').value='BILLET_AND_PIX';
  openM('mExpCobr');
}

// ═══ EXPORTAR COBRANÇAS EM ABERTO DE UM CLIENTE (botão da ficha) ═══
function exportNeofinCliente(cid){
  const c=GC(cid);
  if(!c||!c.id){toast('Cliente não encontrado','err');return;}
  if(!c.cnpj){toast('Cliente sem CNPJ/CPF — não é possível exportar','warn');return;}
  if(typeof XLSX==='undefined'){toast('Recarregue a página','err');return;}
  const abertas=mens.filter(m=>m.cliente_id===cid&&(m.status==='PENDENTE'||m.status==='VENCIDO'));
  if(!abertas.length){toast('Nenhuma mensalidade em aberto para '+(c.nome||'cliente'),'warn');return;}
  // anti-duplicidade: pula mensalidades cujo cnpj+mês+ano já tem boleto gerado
  const cnpjN=(c.cnpj||'').replace(/\D/g,'');
  const jaTem=new Set(boletos.filter(b=>(b.cnpj||'').replace(/\D/g,'')===cnpjN&&b.vencimento).map(b=>{const[ba,bm]=b.vencimento.split('-').map(Number);return ba+'-'+bm;}));
  const rows=[NEOFIN_HEADER.slice()];
  let pulados=0;
  abertas.slice().sort((a,b)=>(a.ano-b.ano)||(a.mes-b.mes)).forEach(m=>{
    if(jaTem.has(m.ano+'-'+m.mes)){pulados++;return;}
    rows.push(linhaNeofin(c,m,'Bolepix'));
  });
  if(rows.length<=1){toast('Todas as mensalidades em aberto deste cliente já possuem boleto ('+pulados+' duplicata(s) evitada(s))','warn');return;}
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=NEOFIN_COLS;
  XLSX.utils.book_append_sheet(wb,ws,'Cobranca_Lote');
  const slug=(c.nome||'cliente').replace(/[^a-zA-Z0-9]+/g,'_').slice(0,30);
  const fname='neofin_'+(c.cod?c.cod+'_':'')+slug+'.xlsx';
  XLSX.writeFile(wb,fname);
  const geradas=rows.length-1;
  addLog('Exportação Neofin (cliente '+(c.nome||'')+'): '+geradas+' cobrança(s)'+(pulados?' — '+pulados+' duplicata(s) evitada(s)':''));
  toast('✓ '+geradas+' cobrança(s) exportada(s)'+(pulados?' · '+pulados+' duplicata(s) evitada(s)':''));
}

async function gerarExcelCobrancas(){
  const mes=Number(document.getElementById('exp-mes').value);
  const ano=Number(document.getElementById('exp-ano').value);
  const tipo=document.getElementById('exp-tipo').value;
  if(!mes||!ano){toast('Selecione mês e ano','warn');return;}
  if(typeof XLSX==='undefined'){toast('Recarregue a página','err');return;}

  // Mensalidades PENDENTE ou VENCIDO do período selecionado
  const fl=mens.filter(m=>m.mes===mes&&m.ano===ano&&(m.status==='PENDENTE'||m.status==='VENCIDO'));
  if(!fl.length){toast('Nenhuma mensalidade em aberto para '+M[mes]+'/'+ano,'warn');closeM('mExpCobr');return;}

  // Anti-duplicidade: verificar boletos já existentes no mesmo período
  const jaExiste=boletos.filter(b=>{
    if(!b.vencimento)return false;
    const[ba,bm]=b.vencimento.split('-').map(Number);
    return ba===ano&&bm===mes;
  });
  const cnpjsJaGerados=new Set(jaExiste.map(b=>b.cnpj));

  const rows=[NEOFIN_HEADER.slice()];
  let pulados=0;
  fl.forEach(m=>{
    const c=GC(m.cliente_id);
    if(!c||!c.cnpj){pulados++;return;}
    const cnpjN=(c.cnpj||'').replace(/\D/g,'');
    // Anti-duplicidade: pular se já tem boleto neste período para este cliente
    if(cnpjsJaGerados.has(cnpjN)){pulados++;return;}
    rows.push(linhaNeofin(c,m,tipoNeofin(tipo)));
  });

  if(rows.length<=1){toast('Todas as cobranças deste período já foram geradas ('+pulados+' duplicatas evitadas)','warn');return;}

  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=NEOFIN_COLS;
  XLSX.utils.book_append_sheet(wb,ws,'Cobranca_Lote');
  const fname=`cobrancas_neofin_${M[mes].toLowerCase()}_${ano}.xlsx`;
  XLSX.writeFile(wb,fname);
  const geradas=rows.length-1;
  addLog(`Exportação cobranças Neofin ${M[mes]}/${ano}: ${geradas} geradas, ${pulados} puladas`);
  toast(`✓ ${geradas} cobranças exportadas${pulados?' · '+pulados+' duplicatas evitadas':''}`);
  closeM('mExpCobr');
}
