// ════════════════════════════════════════
// FÊNIX CONT — boletos.js
// Boletos Neofin, XLS import/export, extrato
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ BOLETOS NEOFIN ═══
let boletos=[];
let boletosFilt=[];

// Normalizar CNPJ removendo formatação
function normCNPJ(s){return String(s||'').replace(/\D/g,'');}

// Parse de data: aceita "01/06/2026" ou Date do Excel
function parseDataBn(v){
  if(!v)return null;
  if(v instanceof Date)return v.toISOString().split('T')[0];
  const s=String(v).trim();
  if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);
  const m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if(m)return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

async function carregarBoletos(){
  try{
    const r=await fetch(`${SU}/rest/v1/boletos_neofin?select=*&order=vencimento.desc&limit=2000`,{headers:SH});
    boletos=await r.json();
    addLog('Boletos carregados: '+boletos.length);
    filtBoletos();
  }catch(e){
    document.getElementById('bnTable').innerHTML='<tr><td colspan="8" style="padding:20px;text-align:center;color:var(--red);">Erro: '+e.message+'</td></tr>';
  }
}

async function importarBoletos(event){
  const file=event.target.files[0];
  if(!file)return;
  if(typeof XLSX==='undefined'){toast('Biblioteca XLSX não carregou — recarregue a página','err');return;}
  toast('📥 Lendo arquivo...');
  const reader=new FileReader();
  reader.onload=async(e)=>{
    try{
      const data=new Uint8Array(e.target.result);
      const wb=XLSX.read(data,{type:'array',cellDates:true});
      const sheet=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:null});
      if(rows.length<2){toast('Arquivo vazio','warn');return;}
      // Cabeçalho na linha 0
      const head=rows[0].map(h=>String(h||'').trim());
      // Mapear índices das colunas que importam
      const idx={
        cliente:    head.indexOf('Cliente'),
        cnpj:       head.indexOf('CPF/CNPJ'),
        idCobr:     head.indexOf('ID da Cobrança'),
        emissao:    head.indexOf('Emissão'),
        situacao:   head.indexOf('Situação'),
        substatus:  head.indexOf('Substatus'),
        valorBruto: head.indexOf('Valor Bruto (R$)'),
        valorPago:  head.indexOf('Valor Pago (R$)'),
        jurosMulta: head.indexOf('Valor Juros e Multa (R$)'),
        vencimento: head.indexOf('Vencimento'),
        dataPgto:   head.indexOf('Data de pagamento'),
        parcela:    head.indexOf('Parcela'),
        formaPgto:  head.indexOf('Forma de Pagamento'),
        descricao:  head.indexOf('Descrição'),
        nossoNum:   head.indexOf('Nosso Numero')
      };
      if(idx.idCobr<0||idx.cliente<0){toast('Layout inválido — coluna "ID da Cobrança" ou "Cliente" não encontrada','err');return;}
      
      // Processar linhas (pular cancelados)
      const aImportar=[];
      let pulados=0,cancelados=0;
      for(let i=1;i<rows.length;i++){
        const r=rows[i];
        if(!r||!r[idx.idCobr])continue;
        const sit=String(r[idx.situacao]||'').trim();
        if(sit==='Cancelado'){cancelados++;continue;}
        const cnpjN=normCNPJ(r[idx.cnpj]);
        // Tentar achar cliente
        const c=cli.find(x=>normCNPJ(x.cnpj)===cnpjN);
        aImportar.push({
          id_cobranca:    String(r[idx.idCobr]).trim(),
          cliente_nome:   r[idx.cliente]||'',
          cnpj:           cnpjN,
          cliente_id:     c?c.id:null,
          emissao:        parseDataBn(r[idx.emissao]),
          vencimento:     parseDataBn(r[idx.vencimento]),
          data_pagamento: parseDataBn(r[idx.dataPgto]),
          situacao:       sit,
          substatus:      r[idx.substatus]||null,
          valor_bruto:    Number(r[idx.valorBruto])||0,
          valor_pago:     Number(r[idx.valorPago])||null,
          juros_multa:    Number(r[idx.jurosMulta])||null,
          forma_pagamento:r[idx.formaPgto]||null,
          parcela:        r[idx.parcela]||null,
          nosso_numero:   r[idx.nossoNum]||null,
          descricao:      r[idx.descricao]||null
        });
      }
      
      toast('📊 '+aImportar.length+' boletos preparados ('+cancelados+' cancelados ignorados)');
      addLog('Boletos: lidos '+rows.length+', importar '+aImportar.length+', cancelados '+cancelados);
      
      // Estratégia: TRUNCATE total + INSERT em lote (mais simples e confiável)
      let ok=0,err=0;
      const lote=50;
      toast('🗑️ Limpando boletos anteriores...');
      // 1) Deletar TODOS os boletos — usar filtro id_cobranca=not.is.null (sempre verdadeiro)
      try{
        const r=await fetch(`${SU}/rest/v1/boletos_neofin?id_cobranca=not.is.null`,{
          method:'DELETE',
          headers:{...SH,'Prefer':'return=minimal'}
        });
        const respTxt=r.ok?'':await r.text();
        if(!r.ok){addLog('Falha delete: HTTP '+r.status+' — '+respTxt.slice(0,200));toast('⚠️ Não consegui limpar boletos antigos. Tentando importar mesmo assim...','warn');}
        else addLog('Boletos antigos removidos');
      }catch(e){addLog('Aviso delete: '+e.message);}
      toast('📤 Importando '+aImportar.length+' boletos em lotes de '+lote+'...');
      // 2) UPSERT via Prefer: resolution=merge-duplicates (cria ou atualiza)
      let skip=0;
      for(let i=0;i<aImportar.length;i+=lote){
        const batch=aImportar.slice(i,i+lote);
        try{
          const r=await fetch(`${SU}/rest/v1/boletos_neofin?on_conflict=id_cobranca`,{
            method:'POST',
            headers:{...SH,'Prefer':'resolution=merge-duplicates,return=minimal'},
            body:JSON.stringify(batch)
          });
          if(r.ok){
            ok+=batch.length;
            if(i%500===0&&i>0){addLog('Progresso: '+ok+' / '+aImportar.length);toast('📤 '+ok+' / '+aImportar.length);}
          }else{
            const t=await r.text();
            // 409 = conflito; tentar UPDATE individual de cada
            if(r.status===409||t.includes('duplicate')){
              skip+=batch.length;
              addLog('Lote '+i+': '+batch.length+' duplicados');
            }else{
              err+=batch.length;
              addLog('Erro lote '+i+': HTTP '+r.status+' — '+t.slice(0,150));
            }
          }
        }catch(e){
          err+=batch.length;
          addLog('Erro lote '+i+': '+e.message);
          if(err>200){toast('Muitos erros — interrompendo','err');break;}
        }
      }
      toast('✓ '+ok+' boletos importados'+(skip?' · '+skip+' já existiam':'')+(err?' · '+err+' erros':''));
      addLog('Boletos importados: '+ok+', erros: '+err);
      
      // Recarregar e tentar baixa automática
      await carregarBoletos();
      await tentarBaixasBoletos();
      
      // Limpar input
      event.target.value='';
    }catch(e){toast('Erro: '+e.message,'err');addLog('Erro importar boletos: '+e.message);}
  };
  reader.readAsArrayBuffer(file);
}

async function tentarBaixasBoletos(){
  // Para cada boleto Recebido sem mensalidade_id, tentar match
  const candidatos=boletos.filter(b=>b.situacao==='Recebido'&&!b.mensalidade_id&&b.cliente_id);
  if(!candidatos.length)return;
  let baixadas=0;
  for(const b of candidatos){
    // Match: cliente + valor bruto + mês/ano do vencimento
    if(!b.vencimento)continue;
    const [ano,mes]=b.vencimento.split('-').map(Number);
    const pendentes=mens.filter(m=>
      m.cliente_id===b.cliente_id&&
      m.mes===mes&&m.ano===ano&&
      (m.status==='PENDENTE'||m.status==='VENCIDO')&&
      Number(m.valor).toFixed(2)===Number(b.valor_bruto).toFixed(2)
    );
    if(pendentes.length===1){
      try{
        const m=pendentes[0];
        const body={status:'PAGO',data_baixa:b.data_pagamento||b.vencimento,forma_pagamento:'Boleto Neofin '+(b.forma_pagamento||'')};
        await sbu('mensalidades',m.id,body);
        const idx=mens.findIndex(x=>x.id===m.id);
        if(idx>=0)Object.assign(mens[idx],body);
        // Vincular boleto à mensalidade via sb()
        await sb('boletos_neofin',{method:'PATCH',body:{mensalidade_id:m.id},query:`&id_cobranca=eq.${b.id_cobranca}`});
        b.mensalidade_id=m.id;
        baixadas++;
      }catch(e){addLog('Erro baixa auto boleto: '+e.message);}
    }
  }
  if(baixadas>0){
    toast('✓ '+baixadas+' mensalidades baixadas automaticamente!');
    addLog('Baixas automáticas via boletos: '+baixadas);
  }
}

function filtBoletos(){
  const sr=(document.getElementById('bnSrc')?.value||'').toLowerCase();
  const fst=document.getElementById('bnSt')?.value||'';
  const ano=document.getElementById('bnAno')?.value||'';
  const mes=document.getElementById('bnMes')?.value||'';
  boletosFilt=boletos.filter(b=>{
    if(sr&&!(b.cliente_nome||'').toLowerCase().includes(sr)&&!(b.cnpj||'').includes(sr.replace(/\D/g,'')))return false;
    if(fst&&b.situacao!==fst)return false;
    if(b.vencimento){
      const [a,m]=b.vencimento.split('-');
      if(ano&&a!==ano)return false;
      if(mes&&String(Number(m))!==mes)return false;
    }else if(ano||mes)return false;
    return true;
  });
  // KPIs
  const totalRec=boletosFilt.filter(b=>b.situacao==='Recebido').reduce((a,b)=>a+(b.valor_pago||0),0);
  const totalAb=boletosFilt.filter(b=>b.situacao==='Em aberto').reduce((a,b)=>a+(b.valor_bruto||0),0);
  const totalVenc=boletosFilt.filter(b=>b.situacao==='Vencido').reduce((a,b)=>a+(b.valor_bruto||0),0);
  document.getElementById('bnKpis').innerHTML=
    `<div class="kpi g"><div class="kl">Recebido</div><div class="kv g">${R(totalRec)}</div><div class="ks">${boletosFilt.filter(b=>b.situacao==='Recebido').length} boletos</div></div>`+
    `<div class="kpi b"><div class="kl">Em aberto</div><div class="kv b">${R(totalAb)}</div><div class="ks">${boletosFilt.filter(b=>b.situacao==='Em aberto').length} boletos</div></div>`+
    `<div class="kpi r"><div class="kl">Vencido</div><div class="kv r">${R(totalVenc)}</div><div class="ks">${boletosFilt.filter(b=>b.situacao==='Vencido').length} boletos</div></div>`+
    `<div class="kpi p"><div class="kl">Total filtrado</div><div class="kv p">${boletosFilt.length}</div><div class="ks">de ${boletos.length} boletos</div></div>`;
  document.getElementById('bnLabel').textContent=boletosFilt.length+' boletos';
  // Render tabela
  if(!boletosFilt.length){
    document.getElementById('bnTable').innerHTML='<tr><td colspan="8" style="padding:20px;text-align:center;color:var(--muted);">Nenhum boleto encontrado</td></tr>';
    return;
  }
  const ordenado=[...boletosFilt].sort((a,b)=>(b.vencimento||'').localeCompare(a.vencimento||''));
  document.getElementById('bnTable').innerHTML=ordenado.slice(0,500).map(b=>{
    const venc=b.vencimento?b.vencimento.split('-').reverse().join('/'):'—';
    const pgto=b.data_pagamento?b.data_pagamento.split('-').reverse().join('/'):'—';
    const bdgs={
      'Recebido':'<span class="bdg bg2" style="font-size:9px;">✓ Recebido</span>',
      'Em aberto':'<span class="bdg" style="background:rgba(59,130,246,.15);color:var(--blue);border:1px solid rgba(59,130,246,.3);font-size:9px;">⏳ Em aberto</span>',
      'Vencido':'<span class="bdg br2" style="font-size:9px;">⚠ Vencido</span>',
      'Em acordo':'<span class="bdg" style="background:rgba(168,85,247,.15);color:var(--purple);font-size:9px;">🤝 Acordo</span>'
    };
    const bdg=bdgs[b.situacao]||`<span class="bdg" style="font-size:9px;">${b.situacao}</span>`;
    const semCliente=!b.cliente_id?'<span style="font-size:9px;color:var(--yellow);" title="Cliente não encontrado pelo CNPJ"> ⚠</span>':'';
    return`<tr>
      <td style="padding:7px 6px 7px 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;" title="${b.cliente_nome||''}">${b.cliente_nome||'—'}${semCliente}</td>
      <td style="padding:7px 6px;font-size:10px;color:var(--muted);white-space:nowrap;">${b.cnpj?(b.cnpj.length===14?b.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5'):b.cnpj):'—'}</td>
      <td style="padding:7px 6px;font-size:10px;color:var(--muted2);white-space:nowrap;">${venc}</td>
      <td style="padding:7px 6px;font-size:10px;color:var(--muted2);white-space:nowrap;">${pgto}</td>
      <td style="padding:7px 6px;text-align:right;font-weight:500;color:var(--txt);white-space:nowrap;">${R(b.valor_bruto||0)}</td>
      <td style="padding:7px 6px;text-align:right;font-weight:500;color:${b.valor_pago?'var(--green)':'var(--muted)'};white-space:nowrap;">${b.valor_pago?R(b.valor_pago):'—'}</td>
      <td style="padding:7px 6px;text-align:center;">${bdg}</td>
      <td style="padding:7px 12px 7px 6px;text-align:center;">
        ${b.cliente_id?`<button class="btn bo bxs" onclick="abrFichaCli(${b.cliente_id})" title="Ver cliente">👤</button>`:'—'}
        ${b.mensalidade_id?'<span style="font-size:11px;color:var(--green);" title="Mensalidade vinculada">🔗</span>':''}
      </td>
    </tr>`;
  }).join('');
}

function exportBoletosCSV(){
  if(!boletosFilt.length){toast('Sem dados','warn');return;}
  const rows=[['Cliente','CNPJ','Vencimento','Pagamento','Valor Bruto','Valor Pago','Situação','Forma','Parcela']];
  boletosFilt.forEach(b=>rows.push([
    b.cliente_nome||'',b.cnpj||'',
    b.vencimento?b.vencimento.split('-').reverse().join('/'):'',
    b.data_pagamento?b.data_pagamento.split('-').reverse().join('/'):'',
    b.valor_bruto||0,b.valor_pago||'',
    b.situacao||'',b.forma_pagamento||'',b.parcela||''
  ]));
  const csv='\uFEFF'+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(';')).join('\r\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.download='boletos_neofin_'+new Date().toISOString().split('T')[0]+'.csv';
  a.click();
  toast('✓ CSV exportado!');
}

// ═══ EXPORTAR CLIENTES → EXCEL NEOFIN ═══
function exportClientesNeofin(){
  if(!cli.length){toast('Sem clientes','warn');return;}
  if(typeof XLSX==='undefined'){toast('Recarregue a página','err');return;}
  const wb=XLSX.utils.book_new();
  // Cabeçalho igual ao template Neofin
  const rows=[['CNPJ / CPF *','Razão Social / Nome Completo *','Nome Fantasia','E-mail(s) *','WhatsApp','Telefone','CEP *','Rua *','Número *','Complemento','Bairro *','Cidade *','Estado (UF) *','Tag(s) de Cliente','Responsável']];
  cli.forEach(c=>{
    rows.push([
      c.cnpj||'',
      c.nome||'',
      '',
      c.email||'',
      c.tel||'',
      c.tel||'',
      c.cep||'',
      c.rua||'',
      c.numero||'',
      c.complemento||'',
      c.bairro||'',
      c.cidade||'',
      c.estado||'',
      c.tags||'',
      'Marcos Lopes'
    ]);
  });
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[{wch:20},{wch:35},{wch:20},{wch:30},{wch:18},{wch:18},{wch:12},{wch:30},{wch:10},{wch:15},{wch:20},{wch:20},{wch:8},{wch:20},{wch:20}];
  XLSX.utils.book_append_sheet(wb,ws,'Cadastro_Cliente_Lote');
  XLSX.writeFile(wb,'clientes_neofin_'+new Date().toISOString().split('T')[0]+'.xlsx');
  addLog('Exportação clientes Neofin: '+cli.length+' registros');
  toast('✓ Excel de clientes gerado!');
}

// ═══ FORMATO PADRÃO DE EXPORTAÇÃO NEOFIN (16 colunas) ═══
const NEOFIN_HEADER=['CNPJ/CPF*','Tipo de Cobrança*','Valor Total*','Data do 1º Vencimento*','Parcelamento*','Intervalo de Parcelamento','Desconto antes do 1º Vencimento (%)','Multa (%)','Juros a.m. (%)','Descrição','Número da NF','ID da Cobrança','Situação da Cobrança','Linha Digitável do Boleto','Link para o PDF do boleto','Data do Vencimento Original'];
const NEOFIN_COLS=[{wch:20},{wch:14},{wch:12},{wch:18},{wch:12},{wch:18},{wch:14},{wch:8},{wch:10},{wch:48},{wch:12},{wch:16},{wch:18},{wch:24},{wch:24},{wch:18}];
function tipoNeofin(code){return code==='PIX'?'Pix':code==='BILLET'?'Boleto':'Bolepix';}
function linhaNeofin(c,m,tipoDisplay){
  const venc=m.vencimento||`${m.ano}-${String(m.mes).padStart(2,'0')}-${String(c.venc_dia||20).padStart(2,'0')}`;
  const vencFmt=venc.split('-').reverse().join('/');
  return [c.cnpj||'',tipoDisplay||'Bolepix',m.valor||0,vencFmt,'1 Parcela','Mensal',0,0,0,`Honorários contábeis ${M[m.mes]}/${m.ano} — ${c.nome}`,'',`fenix-${m.id}`,'','','',''];
}

// ═══ IMPORTAR EXTRATO NEOFIN ═══
async function importarExtratoNeofin(event){
  const file=event.target.files[0];
  if(!file)return;
  if(typeof XLSX==='undefined'){toast('Recarregue a página','err');return;}
  toast('📊 Lendo extrato Neofin...');
  const reader=new FileReader();
  reader.onload=async(e)=>{
    try{
      const data=new Uint8Array(e.target.result);
      const wb=XLSX.read(data,{type:'array',cellDates:false});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:false});

      // Encontrar linha do cabeçalho (busca "Data" na coluna A)
      let hdrRow=-1;
      for(let i=0;i<rows.length;i++){
        if(rows[i][0]==='Data'){hdrRow=i;break;}
      }
      if(hdrRow<0){toast('Formato inválido — cabeçalho não encontrado','err');return;}

      // Índices das colunas
      const hdr=rows[hdrRow];
      const iData=0,iId=1,iPagador=3,iNomeCli=4,iTipo=6,iDetalhe=7,iValor=8;

      // Agrupar linhas por ID da cobrança
      const grupos={};
      for(let i=hdrRow+1;i<rows.length;i++){
        const r=rows[i];
        if(!r||!r[iId]||!r[iTipo])continue;
        const id=String(r[iId]).trim();
        if(!grupos[id])grupos[id]={pgto:null,tarifas:[]};
        const tipo=String(r[iTipo]).trim();
        if(tipo.startsWith('Pagamento')){
          grupos[id].pgto=r;
        }else if(tipo.startsWith('Tarifa')){
          grupos[id].tarifas.push(r);
        }
      }

      // Processar cada grupo
      let baixas=0,taxas=0,semMatch=0,erros=0;
      const taxasParaLancar=[];
      const hoje=new Date().toISOString().split('T')[0];

      for(const[id,g] of Object.entries(grupos)){
        // ── PAGAMENTO → Dar baixa na mensalidade ──────────────────────────
        if(g.pgto){
          const r=g.pgto;
          const nomePag=String(r[iPagador]||r[iNomeCli]||'').trim();
          const valStr=String(r[iValor]||'').replace(/\./g,'').replace(',','.');
          const val=Math.abs(parseFloat(valStr)||0);
          const dataStr=r[iData]?String(r[iData]).trim():hoje;
          // Converter data DD/MM/AAAA → AAAA-MM-DD
          let dataPgto=hoje;
          const dm=dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if(dm)dataPgto=`${dm[3]}-${dm[2]}-${dm[1]}`;

          // Tentar match 1: pelo ID da cobrança (fenix-{mensalidade_id})
          const idMatch=id.replace(/-\d+$/,''); // remove sufixo -9, -10 etc
          let mens_match=null;

          // Buscar no módulo de boletos pelo id_cobranca
          const boleto=boletos.find(b=>
            String(b.id_cobranca||'').replace(/-\d+$/,'')=== idMatch ||
            b.id_cobranca===id
          );
          if(boleto&&boleto.mensalidade_id){
            mens_match=mens.find(m=>m.id===boleto.mensalidade_id);
          }

          // Tentar match 2: pelo ID fenix-{N} na descrição/id
          if(!mens_match){
            const fenixMatch=id.match(/fenix-(\d+)/i);
            if(fenixMatch)mens_match=mens.find(m=>m.id===Number(fenixMatch[1]));
          }

          // Tentar match 3: pelo nome do pagador + valor + mês/ano
          if(!mens_match&&nomePag&&val>0){
            const nomeLow=nomePag.toLowerCase();
            const candidatos=mens.filter(m=>{
              if(m.status==='PAGO')return false;
              const c=GC(m.cliente_id);
              const nomeC=(c.nome||'').toLowerCase();
              const nomeMatch=nomeC.includes(nomeLow.slice(0,10))||nomeLow.includes(nomeC.slice(0,10));
              const valMatch=Math.abs(Number(m.valor)-val)<0.05;
              return nomeMatch&&valMatch;
            });
            if(candidatos.length===1)mens_match=candidatos[0];
          }

          if(mens_match&&mens_match.status!=='PAGO'){
            try{
              const body={status:'PAGO',data_baixa:dataPgto,forma_pagamento:'Neofin — '+String(r[iTipo])};
              await sbu('mensalidades',mens_match.id,body);
              const idx=mens.findIndex(m=>m.id===mens_match.id);
              if(idx>=0)Object.assign(mens[idx],body);
              baixas++;
            }catch(e){erros++;addLog('Erro baixa extrato: '+e.message);}
          }else if(!mens_match){
            semMatch++;
            addLog('Extrato sem match: '+nomePag+' R$'+val+' ID:'+id);
          }
        }

        // ── TARIFAS → Lançar no Fluxo de Caixa como Despesa Financeira ───
        for(const t of g.tarifas){
          const dataStr=String(t[iData]||'').trim();
          let dataLanc=hoje;
          const dm=dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if(dm)dataLanc=`${dm[3]}-${dm[2]}-${dm[1]}`;
          const valStr=String(t[iValor]||'').replace(/\./g,'').replace(',','.');
          const val=Math.abs(parseFloat(valStr)||0);
          if(val<=0)continue;
          const tipoTarifa=String(t[iTipo]||'').trim();
          const desc='Taxa Neofin — '+tipoTarifa.replace('Tarifa (','').replace(')','');
          taxasParaLancar.push({
            data:dataLanc,tipo:'S',descricao:desc,
            empresa:'Neofin',grupo:'FINANCEIRAS',valor:val
          });
        }
      }

      // Inserir taxas no fluxo de caixa em lote
      if(taxasParaLancar.length>0){
        try{
          const inseridos=await sbi('fluxo',taxasParaLancar);
          if(Array.isArray(inseridos))inseridos.forEach(f=>{if(f&&f.id)fluxo.push(f);});
          taxas=taxasParaLancar.length;
        }catch(e){addLog('Erro inserir taxas: '+e.message);}
      }

      // Resumo final
      const msg=`✓ Extrato processado:
• ${baixas} baixas automáticas
• ${taxas} taxas lançadas no fluxo
• ${semMatch} pagamentos sem match
• ${erros} erros`;
      addLog(msg);
      toast(`✓ ${baixas} baixas · ${taxas} taxas · ${semMatch} sem match`);

      // Mostrar detalhes se houver sem match
      if(semMatch>0){
        setTimeout(()=>toast(`⚠️ ${semMatch} pagamentos não identificados — veja o log`,'warn'),2500);
      }

      // Recarregar dados
      await carregarBoletos();
      filtM();
      event.target.value='';

    }catch(e){toast('Erro: '+e.message,'err');addLog('Erro importar extrato: '+e.message);}
  };
  reader.readAsArrayBuffer(file);
}

// ═══ FERIADOS NACIONAIS ═══
const FERIADOS_FIXOS=[
  '01-01','21-04','01-05','07-09','12-10','02-11','15-11','20-11','25-12'
];
// Feriados móveis por ano (Sexta da Paixão, Carnaval, Corpus Christi)
function feriadosMoveis(ano){
  // Calcular Páscoa (algoritmo de Meeus/Jones/Butcher)
  const a=ano%19,b=Math.floor(ano/100),c=ano%100;
  const d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25);
  const g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30;
  const i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7;
  const m=Math.floor((a+11*h+22*l)/451);
  const mes=Math.floor((h+l-7*m+114)/31);
  const dia=(h+l-7*m+114)%31+1;
  const pascoa=new Date(ano,mes-1,dia);
  // Sexta da Paixão = Páscoa - 2 dias
  const sextaP=new Date(pascoa);sextaP.setDate(sextaP.getDate()-2);
  // Carnaval = Páscoa - 47 dias (terça)
  const carnaval=new Date(pascoa);carnaval.setDate(carnaval.getDate()-47);
  const carnavalSeg=new Date(pascoa);carnavalSeg.setDate(carnavalSeg.getDate()-48);
  // Corpus Christi = Páscoa + 60 dias
  const corpus=new Date(pascoa);corpus.setDate(corpus.getDate()+60);
  return [sextaP,carnaval,carnavalSeg,corpus].map(d=>{
    return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
}

function ehFeriado(data){
  const d=new Date(data+'T12:00:00');
  const chave=`${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const moveis=feriadosMoveis(d.getFullYear());
  return FERIADOS_FIXOS.includes(chave)||moveis.includes(chave);
}

// Ajustar data de vencimento respeitando sábado/domingo/feriados
function ajustarVencimento(dataStr){
  // dataStr = 'YYYY-MM-DD'
  let d=new Date(dataStr+'T12:00:00');
  // Máximo 10 tentativas para evitar loop infinito
  for(let i=0;i<10;i++){
    const dow=d.getDay(); // 0=Dom, 6=Sab
    if(dow===6){
      // Sábado → antecipa para Sexta
      d.setDate(d.getDate()-1);continue;
    }
    if(dow===0){
      // Domingo → posterga para Segunda
      d.setDate(d.getDate()+1);continue;
    }
    if(ehFeriado(d.toISOString().split('T')[0])){
      // Feriado → antecipa para dia anterior
      d.setDate(d.getDate()-1);continue;
    }
    break; // Dia útil encontrado
  }
  return d.toISOString().split('T')[0];
}
