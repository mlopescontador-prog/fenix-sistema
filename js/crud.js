// ════════════════════════════════════════
// FÊNIX CONT — crud.js
// CRUD clientes, contratos, mensalidades
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ CRUD ═══
async function savCli(){
  const nm=document.getElementById('nc-nome').value.trim();
  if(!nm){toast('Informe o nome','warn');return;}
  const id=Number(document.getElementById('nc-id').value);
  const body={
    cod:      document.getElementById('nc-cod').value,
    nome:     nm.toUpperCase(),
    cnpj:     document.getElementById('nc-cnpj').value,
    tel:      document.getElementById('nc-tel').value,
    email:    document.getElementById('nc-email').value,
    trib:     document.getElementById('nc-trib').value,
    valor:    Number(document.getElementById('nc-valor').value)||0,
    venc_dia: Number(document.getElementById('nc-venc').value)||20,
    tags:     document.getElementById('nc-tags').value||null,
    cep:      document.getElementById('nc-cep').value||null,
    rua:      document.getElementById('nc-rua').value||null,
    numero:   document.getElementById('nc-numero').value||null,
    complemento: document.getElementById('nc-comp').value||null,
    bairro:   document.getElementById('nc-bairro').value||null,
    cidade:   document.getElementById('nc-cidade').value||null,
    estado:   (document.getElementById('nc-estado').value||'').toUpperCase()||null
  };
  try{
    if(id){
      // Edição
      await sbu('clientes',id,body);
      const idx=cli.findIndex(c=>c.id===id);
      if(idx>=0)Object.assign(cli[idx],body);
      addLog('Cliente #'+id+' '+body.nome+' atualizado');
      closeM('mCli');
      toast('✓ Cliente atualizado!');
      filtCli();
      renderDash();
    }else{
      // Novo
      const resp=await sbi('clientes',body);
      const nv=Array.isArray(resp)?resp[0]:resp;
      if(!nv||!nv.id)throw new Error('Banco não retornou o registro criado');
      cli.push(nv);
      addLog('Cliente #'+nv.id+' '+nv.nome+' salvo no banco');
      closeM('mCli');
      toast('✓ Cliente salvo no banco!');
      filtCli();
      renderDash();
    }
  }catch(e){toast('Erro ao salvar cliente: '+e.message,'err');addLog('Erro savCli: '+e.message);}
}

function abrEditCli(cid){
  const c=GC(cid);
  if(!c||!c.id){toast('Cliente não encontrado','err');return;}
  document.getElementById('nc-title').textContent='✏ Editar Cliente';
  document.getElementById('nc-id').value=c.id;
  document.getElementById('nc-cod').value=c.cod||'';
  document.getElementById('nc-nome').value=c.nome||'';
  document.getElementById('nc-cnpj').value=c.cnpj||'';
  document.getElementById('nc-tel').value=c.tel||'';
  document.getElementById('nc-email').value=c.email||'';
  document.getElementById('nc-trib').value=c.trib||'Simples Nacional';
  document.getElementById('nc-valor').value=c.valor||0;
  document.getElementById('nc-venc').value=c.venc_dia||20;
  document.getElementById('nc-tags').value=c.tags||'';
  document.getElementById('nc-cep').value=c.cep||'';
  document.getElementById('nc-rua').value=c.rua||'';
  document.getElementById('nc-numero').value=c.numero||'';
  document.getElementById('nc-comp').value=c.complemento||'';
  document.getElementById('nc-bairro').value=c.bairro||'';
  document.getElementById('nc-cidade').value=c.cidade||'';
  document.getElementById('nc-estado').value=c.estado||'';
  document.getElementById('nc-neoAviso').style.display='none';
  document.getElementById('nc-btnSalvar').textContent='✓ Salvar alterações';
  document.getElementById('ov-mCli').classList.add('on');
}

function abrNovoCli(){
  document.getElementById('nc-title').textContent='+ Novo Cliente';
  document.getElementById('nc-id').value='';
  ['nc-cod','nc-nome','nc-cnpj','nc-tel','nc-email','nc-valor','nc-venc','nc-tags','nc-cep','nc-rua','nc-numero','nc-comp','nc-bairro','nc-cidade','nc-estado'].forEach(id=>{document.getElementById(id).value='';});
  document.getElementById('nc-trib').value='Simples Nacional';
  document.getElementById('nc-neoAviso').style.display='block';
  document.getElementById('nc-btnSalvar').textContent='Salvar + Neofin';
  document.getElementById('ov-mCli').classList.add('on');
}

async function delCli(cid){
  const c=GC(cid);
  if(!c||!c.id){toast('Cliente não encontrado','err');return;}
  // Verificar dependências
  const temMens=mens.filter(m=>m.cliente_id===cid).length;
  const temContr=contr.filter(x=>x.cliente_id===cid).length;
  let aviso='Tem certeza que deseja excluir o cliente:\n\n"'+c.nome+'"?\n\n';
  if(temMens>0||temContr>0){
    aviso+='⚠️ ATENÇÃO: este cliente possui:\n';
    if(temContr>0)aviso+='• '+temContr+' contrato(s)\n';
    if(temMens>0)aviso+='• '+temMens+' mensalidade(s)\n';
    aviso+='\nExcluir o cliente NÃO removerá esses registros, mas eles ficarão órfãos.\n\n';
  }
  aviso+='Esta ação não poderá ser desfeita.';
  if(!confirm(aviso))return;
  try{
    const url=`${SU}/rest/v1/clientes?id=eq.${cid}`;
    const r=await fetch(url,{method:'DELETE',headers:SH});
    if(!r.ok)throw new Error('HTTP '+r.status);
    cli=cli.filter(x=>x.id!==cid);
    addLog('Cliente #'+cid+' '+c.nome+' excluído');
    toast('✓ Cliente excluído!');
    filtCli();
    renderDash();
  }catch(e){toast('Erro ao excluir: '+e.message,'err');}
}
async function savMens(){
  const cid=Number(document.getElementById('nm-cli').value);
  if(!cid){toast('Selecione o cliente','warn');return;}
  const valor=Number(document.getElementById('nm-valor').value)||0;
  if(!valor){toast('Informe o valor','warn');return;}
  try{
    const resp=await sbi('mensalidades',{
      cliente_id: cid,
      mes:        Number(document.getElementById('nm-mes').value),
      ano:        Number(document.getElementById('nm-ano').value),
      valor:      valor,
      vencimento: document.getElementById('nm-venc').value,
      status:     document.getElementById('nm-st').value,
      formato:    'Manual'
    });
    const nv=Array.isArray(resp)?resp[0]:resp;
    if(!nv||!nv.id)throw new Error('Banco não retornou o registro criado');
    mens.unshift(nv);
    addLog('Mensalidade #'+nv.id+' salva no banco');
    closeM('mMens');
    toast('✓ Mensalidade salva no banco!');
    if(document.getElementById('page-mens').classList.contains('on'))filtM();
    if(document.getElementById('page-dash').classList.contains('on'))renderDash();
  }catch(e){toast('Erro ao salvar mensalidade: '+e.message,'err');addLog('Erro savMens: '+e.message);}
}
async function savFluxo(){
  const body={
    data:document.getElementById('fl-d').value,
    tipo:document.getElementById('fl-t').value,
    descricao:document.getElementById('fl-desc').value,
    empresa:document.getElementById('fl-e').value,
    valor:Number(document.getElementById('fl-v').value)||0,
    grupo:document.getElementById('fl-g').value
  };
  if(!body.data){toast('Informe a data','warn');return;}
  if(!body.valor){toast('Informe o valor','warn');return;}
  try{
    const resp=await sbi('fluxo',body);
    const nv=Array.isArray(resp)?resp[0]:resp;
    if(nv&&nv.id){
      fluxo.push(nv);
      fluxoFiltrado.push(nv);
      addLog('Novo lançamento #'+nv.id+' salvo no banco');
    }
    closeM('mFluxo');
    // Limpar campos
    ['fl-d','fl-desc','fl-e','fl-v'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    toast('✓ Lançamento salvo no banco!');
    // Recarregar do banco para garantir consistência
    if(document.getElementById('page-fluxo').classList.contains('on'))renderFluxo();
  }catch(e){toast('Erro ao salvar: '+e.message,'err');addLog('Erro savFluxo: '+e.message);}
}
async function savContr(){
  const cid=Number(document.getElementById('ct-c').value);
  if(!cid){toast('Selecione o cliente','warn');return;}
  const valor=Number(document.getElementById('ct-v').value)||0;
  if(!valor){toast('Informe o valor do contrato','warn');return;}
  const st=document.getElementById('ct-st').value;
  const pagId=Number(document.getElementById('ct-pag').value)||null;
  const body={
    cliente_id: cid, valor, status: st,
    inicio:     document.getElementById('ct-i').value,
    renovacao:  document.getElementById('ct-r').value,
    tributacao: document.getElementById('ct-t').value,
    obs:        document.getElementById('ct-o').value,
    grupo_economico: document.getElementById('ct-ge').value||null,
    pagador_id: pagId,
    reneg_regime: document.getElementById('ct-chkReg').checked,
    reneg_volume: document.getElementById('ct-chkVol').checked,
    reneg_socios: document.getElementById('ct-chkSoc').checked,
    reneg_func:   document.getElementById('ct-chkFun').checked,
  };
  if(st==='ENCERRADO'){
    body.dt_encerramento=document.getElementById('ct-denc').value;
    body.motivo_enc=document.getElementById('ct-menc').value;
  }
  try{
    const ctId=document.getElementById('ct-id').value;
    let nv;
    if(ctId){
      // Edição
      await sbu('contratos',ctId,body);
      const idx=contr.findIndex(c=>c.id===Number(ctId));
      if(idx>=0)Object.assign(contr[idx],body);
      nv=contr[idx];
      toast('✓ Contrato atualizado!');
    }else{
      // Novo
      const resp=await sbi('contratos',body);
      nv=Array.isArray(resp)?resp[0]:resp;
      if(!nv||!nv.id)throw new Error('Banco não retornou o registro criado');
      contr.push(nv);
      toast('✓ Contrato salvo!');
    }
    addLog('Contrato #'+nv.id+' salvo');
    closeM('mContr');
    // Limpar ct-id para próximo uso
    document.getElementById('ct-id').value='';
    document.getElementById('ct-title').textContent='+ Novo Contrato';
    if(document.getElementById('page-contratos').classList.contains('on'))filtC();
  }catch(e){toast('Erro ao salvar contrato: '+e.message,'err');addLog('Erro savContr: '+e.message);}
}


// ═══ BUSCA CEP AUTOMÁTICA ═══
async function buscaCEP(cep){
  const c=cep.replace(/\D/g,'');
  if(c.length!==8)return;
  try{
    const r=await fetch(`https://viacep.com.br/ws/${c}/json/`);
    const d=await r.json();
    if(d.erro)return;
    document.getElementById('nc-rua').value=d.logradouro||'';
    document.getElementById('nc-bairro').value=d.bairro||'';
    document.getElementById('nc-cidade').value=d.localidade||'';
    document.getElementById('nc-estado').value=d.uf||'';
    document.getElementById('nc-numero').focus();
    toast('✓ Endereço preenchido automaticamente!');
  }catch(e){}
}
