// ════════════════════════════════════════
// FÊNIX CONT — dre.js
// Demonstrativo de resultado gerencial
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ DRE GERENCIAL ═══
async function renderDRE2(){
  const ano=Number(document.getElementById('dreAno')?.value||new Date().getFullYear());
  const mes=document.getElementById('dreMes')?.value;
  const mesNum=mes?Number(mes):null;
  const cont=document.getElementById('dre2');
  if(!cont)return;
  cont.innerHTML='<div class="loading"><div class="sp"></div>Carregando lançamentos...</div>';
  try{
    const dados=await loadFluxo(ano,mesNum);
    const grp={};
    dados.forEach(d=>{const k=d.grupo||'OUTROS';grp[k]=(grp[k]||0)+(d.valor||0)*(d.tipo==='E'?1:-1);});
    // Estrutura DRE
    const v=k=>grp[k]||0;
    const recBruta=v('RECEITAS')+v('CERTIFICAÇÃO')+v('IRPF');
    const impostos=Math.abs(v('IMPOSTOS SIMPLES'));
    const recLiq=recBruta-impostos;
    const despPessoal=Math.abs(v('DESP. PESSOAL'));
    const impPessoal=Math.abs(v('IMPOSTOS PESSOAL'));
    const custoServ=Math.abs(v('CUSTO SERVIÇOS'));
    const margBruta=recLiq-despPessoal-impPessoal-custoServ;
    const suporte=Math.abs(v('SUPORTE'));
    const admin=Math.abs(v('ADMINISTRATIVO'));
    const terc=Math.abs(v('TERCEIROS'));
    const fin=Math.abs(v('FINANCEIRAS'));
    const margOp=margBruta-suporte-admin-terc-fin;
    const recNaoOp=v('REC. NÃO OPERACIONAL');
    const distSoc=Math.abs(v('DISTRIBUIÇÃO SÓCIOS'));
    const margLiq=margOp+recNaoOp-distSoc;
    const pctLucro=recBruta>0?((margLiq/recBruta)*100).toFixed(1):'0';
    // Render
    const linha=(label,valor,bold,cor,indent)=>`<div style="display:flex;justify-content:space-between;padding:${bold?'9px 0':'5px 0'};${bold?'border-top:2px solid var(--brd);border-bottom:1px solid var(--brd);font-weight:700;':'border-bottom:1px dashed var(--brd);'}${indent?'padding-left:18px;':''}font-size:${bold?'13px':'12px'};">
      <span style="color:${bold?'var(--txt)':'var(--muted2)'};">${label}</span>
      <span style="color:${cor||'var(--txt)'};font-family:'Syne',sans-serif;${bold?'font-weight:800;':'font-weight:500;'}">${R(valor)}</span>
    </div>`;
    cont.innerHTML=`<div style="padding:18px;">
      <div style="margin-bottom:14px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--acc);">DRE — ${mes?M[mesNum]+'/'+ano:'Acumulado '+ano}</div>
      ${linha('Receita Bruta',recBruta,true,'var(--green)')}
      ${linha('(−) Impostos Simples',-impostos,false,'var(--red)',true)}
      ${linha('Receita Líquida',recLiq,true,'var(--green)')}
      ${linha('(−) Desp. Pessoal',-despPessoal,false,'var(--red)',true)}
      ${linha('(−) Impostos Pessoal',-impPessoal,false,'var(--red)',true)}
      ${linha('(−) Custo Serviços',-custoServ,false,'var(--red)',true)}
      ${linha('Margem Bruta',margBruta,true,margBruta>=0?'var(--green)':'var(--red)')}
      ${linha('(−) Suporte',-suporte,false,'var(--red)',true)}
      ${linha('(−) Administrativo',-admin,false,'var(--red)',true)}
      ${linha('(−) Terceiros',-terc,false,'var(--red)',true)}
      ${linha('(−) Financeiras',-fin,false,'var(--red)',true)}
      ${linha('Margem Operacional',margOp,true,margOp>=0?'var(--green)':'var(--red)')}
      ${linha('(+) Rec. Não Operacional',recNaoOp,false,'var(--green)',true)}
      ${linha('(−) Distribuição Sócios',-distSoc,false,'var(--red)',true)}
      ${linha('Margem Líquida Final',margLiq,true,margLiq>=0?'var(--green)':'var(--red)')}
      <div style="text-align:right;margin-top:10px;font-size:11px;color:var(--muted);">% Lucro: <strong style="color:${pctLucro>=0?'var(--green)':'var(--red)'};">${pctLucro}%</strong></div>
    </div>`;
    // Salva último para export
    _dreUltimo={ano,mes:mesNum,recBruta,impostos,recLiq,despPessoal,impPessoal,custoServ,margBruta,suporte,admin,terc,fin,margOp,recNaoOp,distSoc,margLiq,pctLucro};
  }catch(e){cont.innerHTML='<div style="padding:20px;color:var(--red);">Erro: '+e.message+'</div>';}
}
let _dreUltimo=null;
function exportDRECsv(){
  if(!_dreUltimo){toast('Gere a DRE primeiro','warn');return;}
  const d=_dreUltimo;
  const linhas=[
    ['DRE',d.mes?M[d.mes]+'/'+d.ano:'Acumulado '+d.ano],
    ['',''],
    ['Receita Bruta',d.recBruta],
    ['(-) Impostos Simples',-d.impostos],
    ['Receita Líquida',d.recLiq],
    ['(-) Desp. Pessoal',-d.despPessoal],
    ['(-) Impostos Pessoal',-d.impPessoal],
    ['(-) Custo Serviços',-d.custoServ],
    ['Margem Bruta',d.margBruta],
    ['(-) Suporte',-d.suporte],
    ['(-) Administrativo',-d.admin],
    ['(-) Terceiros',-d.terc],
    ['(-) Financeiras',-d.fin],
    ['Margem Operacional',d.margOp],
    ['(+) Rec. Não Operacional',d.recNaoOp],
    ['(-) Distribuição Sócios',-d.distSoc],
    ['Margem Líquida Final',d.margLiq],
    ['% Lucro',d.pctLucro+'%']
  ];
  const csv='\uFEFF'+linhas.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.download='dre_fenix_'+(d.mes?M[d.mes]+'_'+d.ano:d.ano)+'.csv';a.click();toast('✓ CSV exportado!');
}
