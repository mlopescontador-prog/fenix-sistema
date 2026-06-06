// ═══════════════════════════════════════════
// FÊNIX CONT — core.js
// Constantes, estado global, funções Supabase
// ═══════════════════════════════════════════

// ═══ CONFIG ═══
const SU='https://uebkiofwviphfozhrjno.supabase.co';
const SK='sb_publishable_kEzEro8_9_TQy3rwOCMFhQ_8TEpqs9f';
const SH={'Content-Type':'application/json','apikey':SK,'Authorization':'Bearer '+SK};
// Neofin API removida — integração via Excel


const M=['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MF=['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
let cli=[],mens=[],fluxo=[],contr=[],log=[];
let bId=null;

// ═══ SUPABASE ═══
async function sb(t,o={}){
  const opts = typeof o==='string' ? {select:o} : o;
  const method = opts.method || 'GET';
  const b = opts.body || null;
  const q = opts.query || '';
  const s = opts.select || '*';
  // PATCH/DELETE: não incluir select na URL para evitar conflito
  const url = (method==='PATCH'||method==='DELETE')
    ? `${SU}/rest/v1/${t}?${q.replace(/^&/,'')}`
    : `${SU}/rest/v1/${t}?select=${s}${q}`;
  const prefer = (method==='POST'||method==='PATCH') ? {'Prefer':'return=representation'} : {};
  const r=await fetch(url,{method,headers:{...SH,...prefer},body:b?JSON.stringify(b):undefined});
  if(!r.ok)throw new Error(await r.text());
  if(method==='DELETE'||r.status===204)return[];
  const txt=await r.text();
  return txt?JSON.parse(txt):[];
}
async function sbi(t,b){return sb(t,{method:'POST',body:b});}
async function sbu(t,id,b){return sb(t,{method:'PATCH',body:b,query:`&id=eq.${id}`});}

async function loadAll(){
  [cli,mens,contr]=await Promise.all([
    sb('clientes',{select:'*',query:'&order=nome'}),
    sb('mensalidades',{select:'*',query:'&order=ano.desc,mes.desc'}),
    sb('contratos',{select:'*',query:'&order=renovacao.asc'})
  ]);
  fluxo=[];
}

async function loadFluxo(ano, mes, dtIni, dtFim){
  let filtro='';
  if(dtIni && dtFim){
    // Datas arbitrárias (usado pelo OFX para checagem de duplicatas)
    filtro=`&data=gte.${dtIni}&data=lte.${dtFim}`;
  } else if(ano){
    const di=mes?`${ano}-${String(mes).padStart(2,'0')}-01`:`${ano}-01-01`;
    const df=mes?`${ano}-${String(mes).padStart(2,'0')}-31`:`${ano}-12-31`;
    filtro=`&data=gte.${di}&data=lte.${df}`;
  }
  let todos=[],offset=0,limit=1000;
  while(true){
    const url=`${SU}/rest/v1/fluxo?select=*${filtro}&order=data.asc&limit=${limit}&offset=${offset}`;
    try{
      const r=await fetch(url,{headers:SH});
      if(!r.ok){addLog('Erro fluxo HTTP '+r.status);break;}
      const lote=await r.json();
      if(!Array.isArray(lote)||lote.length===0)break;
      todos=todos.concat(lote);
      if(lote.length<limit)break;
      offset+=limit;
    }catch(e){addLog('Erro loadFluxo: '+e.message);break;}
  }
  return todos;
}
