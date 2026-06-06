// ════════════════════════════════════════
// FÊNIX CONT — fluxo.js
// Lançamentos, OFX, conferência
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ FLUXO ═══
let fluxoFiltrado=[];

async function renderFluxo(){
  const elLancs=document.getElementById('fLancs');
  if(!elLancs)return;

  const ano=Number(document.getElementById('fxAn').value)||0;
  const mes=Number(document.getElementById('fxMe').value)||0;
  const grp=document.getElementById('fxGrp').value||'';
  const src=(document.getElementById('fxSrc').value||'').toLowerCase();

  elLancs.innerHTML='<div class="loading"><div class="sp"></div> Carregando...</div>';

  try{
    fluxo=await loadFluxo(ano||null,mes||null);
    addLog('Fluxo: '+fluxo.length+' registros');
  }catch(e){
    elLancs.innerHTML='<div style="padding:20px;color:var(--red);font-size:11px;">Erro: '+e.message+'</div>';
    return;
  }

  fluxoFiltrado=fluxo.filter(f=>{
    if(grp&&f.grupo!==grp)return false;
    if(src&&!((f.descricao||'').toLowerCase().includes(src)||(f.empresa||'').toLowerCase().includes(src)))return false;
    return true;
  });

  const Mn=['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const label=ano?(mes?Mn[mes]+'/'+ano:'Ano '+ano):'Todo o período';
  document.getElementById('fxLabel').textContent=fluxoFiltrado.length+' lançamentos — '+label;

  const en=fluxoFiltrado.filter(f=>f.tipo==='E').reduce((a,f)=>a+(f.valor||0),0);
  const sa=fluxoFiltrado.filter(f=>f.tipo==='S').reduce((a,f)=>a+(f.valor||0),0);
  const sl=en-sa;
  const confCount=fluxoFiltrado.filter(f=>f.conferido).length;
  const pendCount=fluxoFiltrado.length-confCount;
  const pctConf=fluxoFiltrado.length?(confCount/fluxoFiltrado.length*100).toFixed(0):0;

  document.getElementById('fKpis').innerHTML=
    `<div class="kpi g"><div class="kl">Entradas</div><div class="kv g">${R(en)}</div><div class="ks">${fluxoFiltrado.filter(f=>f.tipo==='E').length} lançamentos</div></div>`+
    `<div class="kpi r"><div class="kl">Saídas</div><div class="kv r">${R(sa)}</div><div class="ks">${fluxoFiltrado.filter(f=>f.tipo==='S').length} lançamentos</div></div>`+
    `<div class="kpi ${sl>=0?'g':'r'}"><div class="kl">Saldo Final</div><div class="kv ${sl>=0?'g':'r'}">${R(sl)}</div><div class="ks">${sl>=0?'positivo':'negativo'}</div></div>`+
    `<div class="kpi ${pendCount===0?'g':'y'}"><div class="kl">Conferência</div><div class="kv ${pendCount===0?'g':'y'}">${pctConf}%</div><div class="ks">${confCount} de ${fluxoFiltrado.length} · ${pendCount} pendentes</div></div>`;

  const ord=[...fluxoFiltrado].sort((a,b)=>a.data>b.data?1:-1);
  // Contagem de conferidos
  const totalConf=ord.filter(f=>f.conferido).length;
  const totalPend=ord.length-totalConf;
  const elConf=document.getElementById('fxConf');
  if(elConf)elConf.textContent=totalConf+' conferidos · '+totalPend+' pendentes';
  const gs='display:grid;grid-template-columns:80px 1fr 150px 130px 95px 95px 100px 50px;padding:7px 12px;border-bottom:1px solid var(--brd);font-size:11px;align-items:center;';

  // SALDO ANTERIOR: calcular saldo de todos os lançamentos ANTES do período filtrado
  let saldoAnterior = 0;
  if(ano || mes) {
    // Determinar data de início do período
    let dtCorte = '';
    if(ano && mes) dtCorte = `${ano}-${String(mes).padStart(2,'0')}-01`;
    else if(ano)   dtCorte = `${ano}-01-01`;
    // Somar todos os lançamentos anteriores à data de corte
    const anteriores = fluxo.filter(f => f.data && f.data < dtCorte);
    saldoAnterior = anteriores.reduce((a,f) => a + (f.tipo==='E' ? (f.valor||0) : -(f.valor||0)), 0);
    // Se não temos lançamentos anteriores em memória, buscar do banco
    if(anteriores.length === 0 && dtCorte > '2020-01-01') {
      try {
        // Data fim = dia anterior ao início do período
        const dCorte = new Date(dtCorte);
        dCorte.setDate(dCorte.getDate() - 1);
        const dtFimAnt = dCorte.toISOString().split('T')[0];
        const ant = await loadFluxo(null, null, '2020-01-01', dtFimAnt);
        saldoAnterior = ant.reduce((a,f) => a + (f.tipo==='E' ? (f.valor||0) : -(f.valor||0)), 0);
        addLog('Saldo anterior ao período: '+R(saldoAnterior));
      } catch(e) { addLog('Aviso saldo anterior: '+e.message); }
    }
  }

  let saldoAc = saldoAnterior;
  let primeiroNaoConf = -1;
  elLancs.innerHTML=(saldoAnterior !== 0 ? `<div style="padding:5px 12px;background:rgba(59,130,246,.08);border-bottom:1px solid var(--brd);font-size:10px;color:var(--blue);display:flex;justify-content:space-between;"><span>Saldo anterior ao período</span><span style="font-weight:600;">${R(saldoAnterior)}</span></div>` : '')+
  ord.map((f,idx)=>{
    saldoAc+=f.tipo==='E'?(f.valor||0):-(f.valor||0);
    const cor=saldoAc>=0?'var(--green)':'var(--red)';
    const dt=f.data?f.data.split('-').reverse().join('/'):'—';
    const conf=!!f.conferido;
    if(!conf&&primeiroNaoConf===-1)primeiroNaoConf=idx;
    const bgConf=conf?'background:rgba(34,197,94,.04);opacity:.7;':'';
    const confBtn=conf
      ?`<button class="btn bg bxs" onclick="event.stopPropagation();toggleConf(${f.id},false)" style="font-size:9px;padding:2px 5px;" title="Desfazer conferência">✓</button>`
      :`<button class="btn bo bxs" onclick="event.stopPropagation();toggleConf(${f.id},true)" style="font-size:9px;padding:2px 5px;color:var(--muted);" title="Marcar como conferido">○</button>`;
    return `<div id="fx-${f.id}" style="${gs}${bgConf}" onmouseenter="this.style.background=this.style.background||'var(--s2)'" onmouseleave="this.style.background='${conf?'rgba(34,197,94,.04)':''}'" onclick="abrEditFluxo(${f.id})">
      <span style="color:var(--muted);font-size:10px;white-space:nowrap;">${dt}</span>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--txt);" title="${(f.descricao||'').replace(/"/g,"'")}">${f.descricao||'—'}</span>
      <span style="font-size:9px;color:var(--muted2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${f.empresa||''}">${f.empresa||'—'}</span>
      <span style="font-size:9px;color:var(--teal);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${f.grupo||''}">${f.grupo||'—'}</span>
      <span style="text-align:right;color:var(--green);font-weight:500;white-space:nowrap;">${f.tipo==='E'?R(f.valor):'—'}</span>
      <span style="text-align:right;color:var(--red);font-weight:500;white-space:nowrap;">${f.tipo==='S'?R(f.valor):'—'}</span>
      <span style="text-align:right;color:${cor};font-weight:700;font-family:'Syne',sans-serif;white-space:nowrap;">${R(saldoAc)}</span>
      <span style="text-align:center;">${confBtn}</span>
    </div>`;
  }).join('')||'<div style="padding:24px;text-align:center;color:var(--muted);">Nenhum lançamento</div>';
  // Scroll automático para o primeiro não conferido
  setTimeout(()=>{
    if(primeiroNaoConf>=0&&ord[primeiroNaoConf]){
      const el=document.getElementById('fx-'+ord[primeiroNaoConf].id);
      if(el)el.scrollIntoView({behavior:'smooth',block:'center'});
    }
  },100);
}

// ═══ CONFERÊNCIA ═══
async function toggleConf(id, marcar){
  try{
    const body={conferido:marcar, conferido_em:marcar?new Date().toISOString():null};
    await sbu('fluxo',id,body);
    const f=fluxo.find(x=>x.id===id);
    if(f){f.conferido=marcar;f.conferido_em=body.conferido_em;}
    const f2=fluxoFiltrado.find(x=>x.id===id);
    if(f2){f2.conferido=marcar;f2.conferido_em=body.conferido_em;}
    // Atualizar visual sem recarregar tudo
    const el=document.getElementById('fx-'+id);
    if(el){
      if(marcar){
        el.style.background='rgba(34,197,94,.04)';
        el.style.opacity='.7';
      }else{
        el.style.background='';
        el.style.opacity='';
      }
      // Atualizar botão
      const btn=el.querySelector('span:last-child');
      if(btn)btn.innerHTML=marcar
        ?`<button class="btn bg bxs" onclick="event.stopPropagation();toggleConf(${id},false)" style="font-size:9px;padding:2px 5px;" title="Desfazer conferência">✓</button>`
        :`<button class="btn bo bxs" onclick="event.stopPropagation();toggleConf(${id},true)" style="font-size:9px;padding:2px 5px;color:var(--muted);" title="Marcar como conferido">○</button>`;
    }
    // Atualizar contagem
    const totalConf=fluxoFiltrado.filter(f=>f.conferido).length;
    const totalPend=fluxoFiltrado.length-totalConf;
    const elConf=document.getElementById('fxConf');
    if(elConf)elConf.textContent=totalConf+' conferidos · '+totalPend+' pendentes';
    addLog((marcar?'✓':'↩')+'Lançamento #'+id);
  }catch(e){toast('Erro: '+e.message,'err');}
}

function irNaoConferido(){
  const ord=[...fluxoFiltrado].sort((a,b)=>a.data>b.data?1:-1);
  const f=ord.find(x=>!x.conferido);
  if(f){
    const el=document.getElementById('fx-'+f.id);
    if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.style.background='rgba(249,115,22,.12)';setTimeout(()=>{el.style.background='';},1500);}
  }else{toast('🎉 Todos conferidos!');}
}


// Editar lançamento
function abrEditFluxo(id){
  const f=fluxo.find(x=>x.id===id);if(!f)return;
  document.getElementById('ef-id').value=id;
  document.getElementById('ef-d').value=f.data||'';
  document.getElementById('ef-t').value=f.tipo||'E';
  document.getElementById('ef-desc').value=f.descricao||'';
  document.getElementById('ef-emp').value=f.empresa||'';
  document.getElementById('ef-v').value=f.valor||0;
  document.getElementById('ef-g').value=f.grupo||'RECEITAS';
  // setTimeout evita que o clique na linha feche o modal imediatamente
  setTimeout(()=>openM('mEditFluxo'), 50);
}

// ═══ CSV ═══
function expCSV(){
  const r=[['Cod','Cliente','Mes','Ano','Valor','Vencimento','Status','DataBaixa']];
  mens.forEach(m=>{const c=GC(m.cliente_id);r.push([c.cod||'',c.nome||'',m.mes,m.ano,m.valor,m.vencimento,m.status,m.data_baixa||'']);});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+r.map(x=>x.join(';')).join('\n')],{type:'text/csv;charset=utf-8;'}));a.download=`fenix_${new Date().toISOString().split('T')[0]}.csv`;a.click();
  toast('✓ CSV exportado!');
}

// ═══ OFX IMPORTADOR ═══
let ofxTransacoes = [];

function ofxDrag(e, over) {
  e.preventDefault();
  const z = document.getElementById('ofxDrop');
  z.style.borderColor = over ? 'var(--acc)' : 'var(--brd)';
  z.style.background = over ? 'rgba(249,115,22,.05)' : '';
}

function ofxDrop(e) {
  e.preventDefault();
  ofxDrag(e, false);
  const f = e.dataTransfer.files[0];
  if (f) ofxFile(f);
}

function ofxFile(f) {
  if (!f) return;
  const r = new FileReader();
  r.onload = e => processOFX(e.target.result, f.name);
  r.readAsText(f, 'UTF-8');
}

function classificarOFX(memo, valor) {
  const m = memo.toUpperCase();
  if (valor > 0) {
    if (m.includes('NEOFIN')) return ['RECEITAS', 'Neofin Repasse'];
    if (m.includes('APLICACAO') || m.includes('RESGATE') || m.includes('RDB')) return ['INVESTIMENTOS', 'Aplicação RDB'];
    return ['RECEITAS', 'Transferência recebida'];
  } else {
    if (m.includes('MARCOS LOPES')) return ['DESPESAS C/ PESSOAL', 'Pro-labore Marcos'];
    if (m.includes('CAMILA')) return ['DESPESAS C/ PESSOAL', 'Salário Camila'];
    if (m.includes('BRENO')) return ['DESPESAS C/ PESSOAL', 'Salário Breno'];
    if (m.includes('SHALOM') || m.includes('COWORK')) return ['DESPESAS C/ ADMINISTRATIVO', 'Aluguel Shalom'];
    if (m.includes('DOMINIO')) return ['DESPESAS C/ SUPORTE', 'Domínio Sistemas'];
    if (m.includes('ECONET')) return ['DESPESAS C/ SUPORTE', 'Econet'];
    if (m.includes('NEWFORCE') || m.includes('TOMAZ')) return ['DESPESAS C/ TERCEIROS', 'Newforce DP'];
    if (m.includes('SIMPLES') || m.includes('PGMEI') || m.includes('DAS-')) return ['IMPOSTOS S/ RECEITA', 'Simples Nacional'];
    if (m.includes('APLICACAO')) return ['INVESTIMENTOS', 'Aplicação RDB'];
    if (m.includes('NEOFIN')) return ['DESPESAS C/ SUPORTE', 'Neofin'];
    if (m.includes('IUGU')) return ['DESPESAS C/ SUPORTE', 'Iugu'];
    return ['DESPESAS C/ ADMINISTRATIVO', 'Saída Pix'];
  }
}

// Gerar hash único para lançamento OFX
function gerarHashOFX(data, valor, descricao, tipo){
  const norm=(descricao||'').trim().toUpperCase().replace(/\s+/g,' ').slice(0,80);
  const str=data+'|'+Number(valor).toFixed(2)+'|'+norm+'|'+tipo;
  // Hash simples mas determinístico
  let h=0;
  for(let i=0;i<str.length;i++){h=Math.imul(31,h)+str.charCodeAt(i)|0;}
  return Math.abs(h).toString(16).padStart(8,'0')+'_'+str.length;
}

function processOFX(txt, nome) {
  // Parser OFX simples
  const getTag = (str, tag) => { const m = str.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i')); return m ? m[1].trim() : ''; };
  const getTrns = str => [...str.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)].map(m => m[1]);

  const trns = getTrns(txt);
  if (!trns.length) { toast('Arquivo OFX inválido ou sem transações', 'err'); return; }

  // Período
  const dtStart = txt.match(/<DTSTART>(\d{8})/i)?.[1] || '';
  const dtEnd = txt.match(/<DTEND>(\d{8})/i)?.[1] || '';
  const fmtDt = d => d ? `${d.slice(6,8)}/${d.slice(4,6)}/${d.slice(0,4)}` : '—';

  ofxTransacoes = [];
  let totalEnt = 0, totalSai = 0;

  for (const t of trns) {
    const dtRaw = (t.match(/<DTPOSTED>(\d{8})/i)?.[1] || '');
    if (!dtRaw) continue;
    const data = `${dtRaw.slice(0,4)}-${dtRaw.slice(4,6)}-${dtRaw.slice(6,8)}`;
    const valorStr = getTag(t, 'TRNAMT');
    const valor = parseFloat(valorStr);
    if (isNaN(valor)) continue;
    const memo = getTag(t, 'MEMO') || getTag(t, 'NAME') || 'Sem descrição';
    const fitid = getTag(t, 'FITID');
    const tipo = valor > 0 ? 'E' : 'S';
    const [grupo, empresa] = classificarOFX(memo, valor);

    if (valor > 0) totalEnt += valor; else totalSai += Math.abs(valor);

    const hash=gerarHashOFX(data,Math.abs(valor),memo,tipo);
    ofxTransacoes.push({ data, tipo, descricao: memo.slice(0, 200), valor: Math.abs(valor), grupo, empresa, fitid, hash_ofx: hash });
  }

  // Atualizar UI
  document.getElementById('ofxNomeArq').textContent = nome;
  document.getElementById('ofxPeriodo').textContent = `${fmtDt(dtStart)} → ${fmtDt(dtEnd)}`;
  document.getElementById('ofxTotal').textContent = ofxTransacoes.length + ' transações';
  document.getElementById('ofxEnt').textContent = R(totalEnt);
  document.getElementById('ofxSai').textContent = R(totalSai);

  // Tabela preview
  const tb = document.getElementById('ofxTableBody');
  tb.innerHTML = ofxTransacoes.slice(0, 30).map(t => `
    <tr style="border-bottom:1px solid var(--brd);">
      <td style="padding:6px 10px;font-size:10px;color:var(--muted);white-space:nowrap;">${t.data.split('-').reverse().join('/')}</td>
      <td style="padding:6px 10px;font-size:10px;color:var(--muted3);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${t.descricao}">${t.descricao.slice(0,60)}</td>
      <td style="padding:6px 10px;font-size:9px;color:var(--muted);">${t.grupo}</td>
      <td style="padding:6px 10px;font-size:11px;font-weight:500;text-align:right;color:${t.tipo==='E'?'var(--green)':'var(--red)'};">${t.tipo==='E'?'+':'-'}${R(t.valor)}</td>
    </tr>`).join('') + (ofxTransacoes.length > 30 ? `<tr><td colspan="4" style="padding:8px;text-align:center;font-size:10px;color:var(--muted)">... mais ${ofxTransacoes.length - 30} transações</td></tr>` : '');

  document.getElementById('ofxPreview').style.display = 'block';
  document.getElementById('ofxImportBtn').style.display = 'inline-flex';
}

async function importarOFX() {
  if (!ofxTransacoes.length) return;
  document.getElementById('ofxPreview').style.display = 'none';
  document.getElementById('ofxProgress').style.display = 'block';
  document.getElementById('ofxImportBtn').style.display = 'none';

  let ok = 0, skip = 0, err = 0;
  const total = ofxTransacoes.length;

  // Buscar hashes existentes no banco para controle de duplicata
  let hashExist = new Set();
  try {
    const datas = ofxTransacoes.map(t=>t.data);
    const dtIni = datas.reduce((a,b)=>a<b?a:b);
    const dtFim = datas.reduce((a,b)=>a>b?a:b);
    const ex = await loadFluxo(null, null, dtIni, dtFim);
    ex.forEach(f => {
      if(f.hash_ofx) hashExist.add(f.hash_ofx);
      // Fallback: gerar hash dos existentes que não têm hash ainda
      else hashExist.add(gerarHashOFX(f.data, f.valor, f.descricao, f.tipo));
    });
    addLog('Checagem duplicatas: '+hashExist.size+' hashes no período');
  } catch(e) { addLog('Aviso duplicata: '+e.message); }

  // Filtrar novos (não duplicados por hash)
  const novos = ofxTransacoes.filter(t => !hashExist.has(t.hash_ofx));
  skip = total - novos.length;

  // Importar um por um para garantir persistência
  for (let i = 0; i < novos.length; i++) {
    const t = novos[i];
    document.getElementById('ofxProgTxt').textContent = `Importando ${i+1} de ${novos.length}...`;
    try {
      const body = {
        data:      t.data,
        tipo:      t.tipo,
        descricao: t.descricao,
        empresa:   t.empresa || '',
        grupo:     t.grupo || 'RECEITAS',
        valor:     t.valor,
        hash_ofx:  t.hash_ofx || null
      };
      const resp = await sbi('fluxo', body);
      const nv = Array.isArray(resp) ? resp[0] : resp;
      if (nv && nv.id) {
        fluxo.push(nv);
        ok++;
        addLog('OFX #'+nv.id+' '+t.data+' '+t.tipo+' R$'+t.valor);
      } else {
        err++;
        addLog('OFX sem retorno: '+t.data+' '+t.descricao);
      }
    } catch(e) {
      err++;
      addLog('Erro OFX: '+e.message.slice(0,60));
    }
    await new Promise(r => setTimeout(r, 100));
  }

  document.getElementById('ofxProgress').style.display = 'none';
  closeM('mOFX');
  resetOFX();

  toast(`✓ OFX: ${total} lidos · ${ok} novos · ${skip} duplicatas ignoradas${err?' · '+err+' erros':''}`);
  addLog(`OFX finalizado: ${total} lidos, ${ok} novos importados, ${skip} duplicatas ignoradas, ${err} erros`);
  if (document.getElementById('page-fluxo').classList.contains('on')) renderFluxo();
  renderDash();
}

function resetOFX() {
  ofxTransacoes = [];
  document.getElementById('ofxPreview').style.display = 'none';
  document.getElementById('ofxProgress').style.display = 'none';
  document.getElementById('ofxImportBtn').style.display = 'none';
  document.getElementById('ofxInput').value = '';
  const z = document.getElementById('ofxDrop');
  z.style.borderColor = '';z.style.background = '';
}
