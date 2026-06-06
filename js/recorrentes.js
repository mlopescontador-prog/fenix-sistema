// ════════════════════════════════════════
// FÊNIX CONT — recorrentes.js
// Lançamentos recorrentes
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ LANÇAMENTOS RECORRENTES ═══
let recorrentes=[];

async function carregarRecorrentes(){
  try{
    const r=await fetch(`${SU}/rest/v1/lancamentos_recorrentes?select=*&order=dia_vencimento.asc`,{headers:SH});
    recorrentes=await r.json();
    renderRecorrentes();
  }catch(e){
    document.getElementById('recTable').innerHTML='<tr><td colspan="8" style="padding:20px;text-align:center;color:var(--red);">Erro: '+e.message+'</td></tr>';
  }
}

function renderRecorrentes(){
  if(!recorrentes.length){
    document.getElementById('recTable').innerHTML='<tr><td colspan="8" style="padding:30px;text-align:center;color:var(--muted);">Nenhum lançamento recorrente cadastrado. Clique em + Novo Recorrente.</td></tr>';
    return;
  }
  document.getElementById('recTable').innerHTML=recorrentes.map(r=>{
    const tipoColor=r.tipo==='E'?'var(--green)':'var(--red)';
    const tipoTxt=r.tipo==='E'?'Entrada':'Saída';
    const stColor=r.ativo?'var(--green)':'var(--muted)';
    const stTxt=r.ativo?'✓ Ativo':'⏸ Inativo';
    return `<tr>
      <td style="padding:8px 6px 8px 12px;font-weight:500;">${r.descricao||'—'}</td>
      <td style="padding:8px 6px;color:var(--muted2);font-size:11px;">${r.empresa||'—'}</td>
      <td style="padding:8px 6px;text-align:center;color:${tipoColor};font-weight:600;font-size:11px;">${tipoTxt}</td>
      <td style="padding:8px 6px;color:var(--teal);font-size:11px;">${r.grupo||'—'}</td>
      <td style="padding:8px 6px;text-align:right;font-weight:600;color:${tipoColor};">${R(r.valor||0)}</td>
      <td style="padding:8px 6px;text-align:center;">dia ${r.dia_vencimento}</td>
      <td style="padding:8px 6px;text-align:center;color:${stColor};font-size:11px;font-weight:500;">${stTxt}</td>
      <td style="padding:8px 12px 8px 6px;text-align:center;">
        <button class="btn bo bxs" onclick="abrEditRec(${r.id})" title="Editar">✏️</button>
        <button class="btn bo bxs" onclick="delRec(${r.id})" title="Excluir" style="color:var(--red);border-color:rgba(220,38,38,.3);">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

function abrNovoRec(){
  document.getElementById('rc-title').textContent='+ Novo Recorrente';
  document.getElementById('rc-id').value='';
  ['rc-desc','rc-empresa','rc-valor','rc-obs'].forEach(id=>{document.getElementById(id).value='';});
  document.getElementById('rc-tipo').value='S';
  document.getElementById('rc-grupo').value='';
  document.getElementById('rc-dia').value='5';
  document.getElementById('rc-ativo').checked=true;
  openM('mRec');
}

function abrEditRec(id){
  const r=recorrentes.find(x=>x.id===id);
  if(!r)return;
  document.getElementById('rc-title').textContent='✏ Editar Recorrente';
  document.getElementById('rc-id').value=r.id;
  document.getElementById('rc-desc').value=r.descricao||'';
  document.getElementById('rc-empresa').value=r.empresa||'';
  document.getElementById('rc-tipo').value=r.tipo||'S';
  document.getElementById('rc-valor').value=r.valor||0;
  document.getElementById('rc-grupo').value=r.grupo||'';
  document.getElementById('rc-dia').value=r.dia_vencimento||5;
  document.getElementById('rc-obs').value=r.observacoes||'';
  document.getElementById('rc-ativo').checked=!!r.ativo;
  openM('mRec');
}

async function savRec(){
  const desc=document.getElementById('rc-desc').value.trim();
  if(!desc){toast('Informe a descrição','warn');return;}
  const body={
    descricao:desc,
    empresa:document.getElementById('rc-empresa').value||null,
    tipo:document.getElementById('rc-tipo').value,
    valor:Number(document.getElementById('rc-valor').value)||0,
    grupo:document.getElementById('rc-grupo').value||null,
    dia_vencimento:Number(document.getElementById('rc-dia').value)||5,
    ativo:document.getElementById('rc-ativo').checked,
    observacoes:document.getElementById('rc-obs').value||null
  };
  try{
    const id=Number(document.getElementById('rc-id').value);
    if(id){
      await sbu('lancamentos_recorrentes',id,body);
      const i=recorrentes.findIndex(r=>r.id===id);
      if(i>=0)Object.assign(recorrentes[i],body);
      toast('✓ Recorrente atualizado!');
    }else{
      const r=await sbi('lancamentos_recorrentes',body);
      if(Array.isArray(r)&&r[0])recorrentes.push(r[0]);
      toast('✓ Recorrente criado!');
    }
    closeM('mRec');renderRecorrentes();
  }catch(e){toast('Erro: '+e.message,'err');}
}

async function delRec(id){
  if(!confirm('Excluir este lançamento recorrente?'))return;
  try{
    const r=await fetch(`${SU}/rest/v1/lancamentos_recorrentes?id=eq.${id}`,{method:'DELETE',headers:SH});
    if(!r.ok)throw new Error('HTTP '+r.status);
    recorrentes=recorrentes.filter(x=>x.id!==id);
    renderRecorrentes();
    toast('✓ Excluído!');
  }catch(e){toast('Erro: '+e.message,'err');}
}

// Lembretes de recorrentes para o Dashboard
function recorrentesProximos(){
  const hj=new Date();
  const diaAtual=hj.getDate();
  const result=[];
  recorrentes.filter(r=>r.ativo).forEach(r=>{
    let diasAte=r.dia_vencimento-diaAtual;
    if(diasAte<0)diasAte+=30; // mês seguinte
    if(diasAte<=7){
      result.push({...r,diasAte});
    }
  });
  return result.sort((a,b)=>a.diasAte-b.diasAte);
}
