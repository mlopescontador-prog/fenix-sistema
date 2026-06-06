// ════════════════════════════════════════
// FÊNIX CONT — app.js
// Nav, login, busca global, atalhos, init
// Depende de: core.js · helpers.js
// ════════════════════════════════════════

// ═══ NAV ═══

// ═══ LOGIN ═══
const SENHA_HASH = 'a8f4c2e1d9b7f3a6c5e8d2b4f1a9c7e3'; // Lopes@123

function hashSimples(s){
  // Hash simples para não deixar a senha em texto puro
  let h=0;for(let i=0;i<s.length;i++){h=Math.imul(31,h)+s.charCodeAt(i)|0;}
  return Math.abs(h).toString(16).padStart(8,'0');
}

function checkLogin(){
  const ok=sessionStorage.getItem('fenix_auth')==='ok';
  if(ok){document.getElementById('login-screen').classList.add('hidden');}
  else{document.getElementById('login-screen').classList.remove('hidden');}
}

function doLogin(){
  const senha=document.getElementById('loginSenha').value;
  if(senha==='Lopes@123'){
    sessionStorage.setItem('fenix_auth','ok');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('loginErr').textContent='';
    document.getElementById('loginSenha').value='';
    init();
  }else{
    document.getElementById('loginErr').textContent='Senha incorreta. Tente novamente.';
    document.getElementById('loginSenha').value='';
    document.getElementById('loginSenha').focus();
  }
}

function doLogout(){
  sessionStorage.removeItem('fenix_auth');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('loginSenha').value='';
  document.getElementById('loginErr').textContent='';
}

function nav(p,b){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('on'));
  document.querySelectorAll('.nb').forEach(x=>x.classList.remove('on'));
  document.getElementById('page-'+p).classList.add('on');b.classList.add('on');
  if(p==='dash')renderDash();if(p==='clientes')filtCli();if(p==='mens')filtM();if(p==='fluxo')renderFluxo();
  if(p==='contratos'){filtC();}if(p==='cobr')renderCobr();
  if(p==='dre')renderDRE2();if(p==='proposta'){atualizarPreview();renderClienteSugest();}
  if(p==='boletos')carregarBoletos();
  if(p==='recorrentes')carregarRecorrentes();
  if(p==='analises')renderAnalises();

}

// → ver js/clientes.js

// ═══ PESQUISA GLOBAL (Ctrl+K) ═══
function abrirPesqGlobal(){openM('mPesqGlobal');setTimeout(()=>{document.getElementById('pg-input').focus();},100);}
function pesquisarTudo(){
  const q=(document.getElementById('pg-input').value||'').toLowerCase().trim();
  if(q.length<2){document.getElementById('pg-resultados').innerHTML='<div style="padding:14px;color:var(--muted);font-size:11px;text-align:center;">Digite pelo menos 2 caracteres...</div>';return;}
  const res=[];
  // Clientes
  cli.filter(c=>(c.nome||'').toLowerCase().includes(q)||(c.cnpj||'').includes(q)||(c.cod||'').includes(q)).slice(0,8).forEach(c=>{
    res.push({tipo:'👥 Cliente',titulo:c.nome,desc:c.cnpj+' · '+c.cod,acao:"closeM('mPesqGlobal');abrFichaCli("+c.id+")"});
  });
  // Contratos
  contr.filter(x=>{const c=GC(x.cliente_id);return(c.nome||'').toLowerCase().includes(q)||(x.grupo_economico||'').toLowerCase().includes(q);}).slice(0,5).forEach(x=>{
    const c=GC(x.cliente_id);
    res.push({tipo:'📋 Contrato',titulo:c.nome,desc:R(x.valor)+'/mês · '+(x.status||'ATIVO'),acao:"closeM('mPesqGlobal');abrFichaContr("+x.id+")"});
  });
  // Mensalidades (busca por nome do cliente)
  mens.filter(m=>{const c=GC(m.cliente_id);return(c.nome||'').toLowerCase().includes(q);}).slice(0,5).forEach(m=>{
    const c=GC(m.cliente_id);
    res.push({tipo:'💰 Mensalidade',titulo:c.nome+' · '+M[m.mes]+'/'+m.ano,desc:R(m.valor)+' · '+m.status,acao:"closeM('mPesqGlobal');abrEditMens("+m.id+")"});
  });
  // Fluxo
  fluxo.filter(f=>(f.descricao||'').toLowerCase().includes(q)||(f.empresa||'').toLowerCase().includes(q)).slice(0,5).forEach(f=>{
    res.push({tipo:'💳 Fluxo',titulo:f.descricao,desc:R(f.valor)+' · '+(f.empresa||'—')+' · '+(f.data||''),acao:"closeM('mPesqGlobal');nav('fluxo',document.querySelectorAll('.nb')[3]);setTimeout(()=>abrEditFluxo("+f.id+"),200)"});
  });
  document.getElementById('pg-resultados').innerHTML=res.length?res.map(r=>`<div style="padding:9px 12px;border-bottom:1px solid var(--brd);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onmouseenter="this.style.background='var(--s2)'" onmouseleave="this.style.background=''" onclick="${r.acao}">
    <div style="flex:1;overflow:hidden;">
      <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">${r.tipo}</div>
      <div style="font-weight:600;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.titulo}</div>
      <div style="font-size:10px;color:var(--muted2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.desc}</div>
    </div>
    <span style="font-size:14px;color:var(--muted);margin-left:10px;">→</span>
  </div>`).join(''):'<div style="padding:14px;color:var(--muted);font-size:11px;text-align:center;">Nada encontrado</div>';
}

// ═══ ATALHOS DE TECLADO ═══
let _atalhoStack='';
let _atalhoTimer=null;
document.addEventListener('keydown',(e)=>{
  // Ignorar se estiver digitando em input/textarea/select
  const t=e.target.tagName;
  if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT')return;
  // Ctrl+K — pesquisa global
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
    e.preventDefault();
    abrirPesqGlobal();
    return;
  }
  // Esc — fechar modal aberto
  if(e.key==='Escape'){
    document.querySelectorAll('.ov.on').forEach(o=>o.classList.remove('on'));
    return;
  }
  // Atalhos de 2 letras
  const k=e.key.toLowerCase();
  if(['g','n'].includes(k)&&!_atalhoStack){
    _atalhoStack=k;
    if(_atalhoTimer)clearTimeout(_atalhoTimer);
    _atalhoTimer=setTimeout(()=>{_atalhoStack='';},900);
    return;
  }
  if(_atalhoStack==='g'){
    const map={d:0,c:1,m:2,f:3,t:4,b:5};
    if(map[k]!==undefined){
      e.preventDefault();
      const btn=document.querySelectorAll('.nb')[map[k]];
      if(btn)btn.click();
    }
    _atalhoStack='';
  }else if(_atalhoStack==='n'){
    if(k==='l'){e.preventDefault();openM('mNovo');}
    else if(k==='c'){e.preventDefault();abrNovoCli();}
    else if(k==='m'){e.preventDefault();openM('mMens');}
    _atalhoStack='';
  }
});

// ═══ INIT ═══
async function init(){
  try{
    await loadAll();
    // Carregar dados adicionais em paralelo
    await Promise.all([
      carregarRecorrentes().catch(e=>addLog('Aviso recorrentes: '+e.message)),
      carregarTemplates().catch(e=>addLog('Aviso templates: '+e.message))
    ]);
    renderDash();


    addLog('Sistema iniciado — '+new Date().toLocaleString('pt-BR'));
  }catch(e){toast('Erro: '+e.message,'err');}
}

// Bootstrap: verificar login antes de iniciar
(function(){
  checkLogin();
  if(sessionStorage.getItem('fenix_auth')==='ok'){
    init();
  }
})();
