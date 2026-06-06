// ═══════════════════════════════════════════════
// FÊNIX CONT — helpers.js
// Formatação, estado UI, toast, modal, log
// Depende de: core.js (cli, log)
// ═══════════════════════════════════════════════

function addLog(msg){log.unshift({t:new Date().toLocaleTimeString('pt-BR'),m:msg});const el=document.getElementById('nLog');if(el)el.innerHTML=log.slice(0,20).map(l=>`<div style="padding:2px 0;border-bottom:1px solid var(--brd)">[${l.t}] ${l.m}</div>`).join('');}

function R(v){return'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2});}

function GC(id){return cli.find(c=>c.id===id)||{};}

function bdg(s){const m={PAGO:'bg2',VENCIDO:'br2',PENDENTE:'by2',BONIFICADO:'bb2',CANCELADO:'bk2'};return`<span class="bdg ${m[s]||'bk2'}">${s||'—'}</span>`;}

function toast(m,t){const el=document.getElementById('toast');el.textContent=m;el.className='toast on'+(t?' '+t:'');setTimeout(()=>el.classList.remove('on'),3500);}

function openM(n){
  if(n==='mMens'){document.getElementById('nm-cli').innerHTML=cli.map(c=>`<option value="${c.id}">${c.cod||''} · ${c.nome}</option>`).join('');}
  if(n==='mContr'){
    const opts=cli.map(c=>`<option value="${c.id}">${c.cod||''} · ${c.nome}</option>`).join('');
    document.getElementById('ct-c').innerHTML=opts;
    document.getElementById('ct-pag').innerHTML='<option value="">— Nenhum (paga direto) —</option>'+opts;
    document.getElementById('ct-id').value='';
    document.getElementById('ct-title').textContent='+ Novo Contrato';
    document.getElementById('ct-st').value='ATIVO';
    document.getElementById('ct-ge').value='';
    document.getElementById('ct-pag').value='';
    document.getElementById('ct-v').value='';
    toggleEncerramentoFields();
    ['ct-chkReg','ct-chkVol','ct-chkSoc','ct-chkFun'].forEach(id=>{document.getElementById(id).checked=false;});
    document.getElementById('ct-reneg-alerta').style.display='none';
    document.getElementById('ct-grpAviso').style.display='none';
  }
  if(n==='mBoletos'){document.getElementById('gb-c').innerHTML=cli.map(c=>`<option value="${c.id}">${c.cod||''} · ${c.nome}</option>`).join('');}
  document.getElementById('ov-'+n).classList.add('on');
}

function closeM(n){document.getElementById('ov-'+n).classList.remove('on');}
