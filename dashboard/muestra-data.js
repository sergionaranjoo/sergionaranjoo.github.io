/* All records below are generated from invented rules. No source data is used. */
'use strict';
window.Muestra = (() => {
  let seed=47291;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const pick=xs=>xs[Math.floor(random()*xs.length)];
  const iso=d=>d.toISOString().slice(0,10);
  const day=86400000, cutoff='2026-10-25', updated='2026-10-25T12:00:00Z';
  const ages=['6 meses','1 año','2 años','> 2 años'];
  function ageAt(created){const n=(Date.parse(cutoff)-Date.parse(created))/day;return n<=180?ages[0]:n<=365?ages[1]:n<=730?ages[2]:ages[3]}
  function week(date){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const y=d.getUTCFullYear();return y+String(Math.ceil(((d-new Date(Date.UTC(y,0,1)))/day+1)/7)).padStart(2,'0')}
  const period=(date,mode)=>mode==='month'?date.slice(0,7).replace('-',''):week(date);
  const categories=['Acceso a la cuenta','Conexión','Configuración','Notificaciones','Uso del producto'];
  const clients=[], records=[];
  for(const kind of ['Aplicación','Cámaras'])for(let i=0;i<(kind==='Aplicación'?1600:1000);i++){
    const isNew=kind==='Cámaras'&&i<240;
    const created=iso(new Date(Date.UTC(isNew?2026:2023,0,1)+Math.floor(random()*(isNew?210:1250))*day));
    clients.push({id:`MUESTRA-${kind==='Aplicación'?'A':'C'}-${String(i+1).padStart(4,'0')}`,kind,created,activity:random()<.7?'Particulares':'Negocios',platform:pick(['Móvil','Ordenador']),panel:pick(['Equipo básico','Equipo avanzado']),age:ageAt(created),version:isNew?'v4':'v3'});
  }
  for(let date=new Date('2025-01-01T00:00:00Z');iso(date)<=cutoff;date=new Date(+date+day)){
    const created=iso(date);
    for(const kind of ['Aplicación','Cámaras']){
      const pool=clients.filter(c=>c.kind===kind&&c.created<=created);
      const count=Math.floor(3+random()*8+(date.getUTCMonth()===0?2:0));
      for(let j=0;j<count;j++){
        const c=pick(pool),category=pick(categories);
        records.push({...c,client:c.id,id:`MUESTRA-Q-${String(records.length+1).padStart(5,'0')}`,created,category,type:pick(['Duda de uso','Problema técnico']),comment:pick({
          'Acceso a la cuenta':['Ejemplo ficticio: no recuerdo la contraseña.','Ejemplo ficticio: necesito ayuda para iniciar sesión.'],
          'Conexión':['Ejemplo ficticio: el dispositivo se desconecta del wifi.','Ejemplo ficticio: la aplicación tarda en conectar.'],
          'Configuración':['Ejemplo ficticio: quiero cambiar los ajustes iniciales.','Ejemplo ficticio: necesito ayuda para añadir un dispositivo.'],
          'Notificaciones':['Ejemplo ficticio: no recibo las notificaciones.','Ejemplo ficticio: quiero elegir qué avisos recibir.'],
          'Uso del producto':['Ejemplo ficticio: cómo consultar el historial.','Ejemplo ficticio: dónde encuentro la opción de compartir.']
        }[category])});
      }
    }
  }
  const calendar=mode=>{const m=new Map();for(let d=new Date('2025-01-01T00:00:00Z');iso(d)<=cutoff;d=new Date(+d+day)){const key=period(iso(d),mode);if(!m.has(key))m.set(key,{period:key,from:iso(d),to:iso(d)});m.get(key).to=iso(d)}return [...m.values()]};
  function selection(p){return {kind:p.get('kind')||'Aplicación',mode:p.get('mode')||'week'}}
  function cohort(p){return clients.filter(c=>c.kind===selection(p).kind&&['activity','platform','age','panel'].every(f=>!p.get(f)||c[f]===p.get(f)))}
  function chosenRecords(p,ignoreDates=false){const ids=new Set(cohort(p).map(c=>c.id));return records.filter(r=>ids.has(r.client)&&['category','type'].every(f=>!p.get(f)||r[f]===p.get(f))&&(ignoreDates||validPeriod(period(r.created,selection(p).mode),p)))}
  function validPeriod(k,p){return (!p.get('year')||k.startsWith(p.get('year')))&&(!p.get('from')||k>=p.get('from'))&&(!p.get('to')||k<=p.get('to'))}
  function summarize(p,extraGroup=null,allDates=false){
    let customers=cohort(p);if(extraGroup)customers=customers.filter(c=>c.activity===extraGroup);
    const ids=new Set(customers.map(c=>c.id));
    const rs=chosenRecords(p,allDates).filter(r=>ids.has(r.client));
    const periods=calendar(selection(p).mode).filter(t=>allDates||validPeriod(t.period,p));
    const buckets=new Map(periods.map(t=>[t.period,[]]));
    rs.forEach(r=>buckets.get(period(r.created,selection(p).mode))?.push(r));
    const trend=periods.map(t=>{const items=buckets.get(t.period),base=customers.filter(c=>c.created<=t.to).length;return {...t,rows:items.length,cases:items.length,contracts:new Set(items.map(r=>r.client)).size,base,rate:base?items.length/base:null}});
    const matrix=trend.flatMap(t=>categories.map(category=>({category,period:t.period,rows:buckets.get(t.period).filter(r=>r.category===category).length})));
    return {trend,matrix,records:rs};
  }
  function dashboard(p){
    const result=summarize(p),rs=result.records,last=result.trend.at(-1);
    const pool=clients.filter(c=>c.kind===selection(p).kind);
    const options={years:['2025','2026'],periods:calendar(selection(p).mode).map(t=>t.period).filter(k=>!p.get('year')||k.startsWith(p.get('year'))),category:categories,type:['Duda de uso','Problema técnico']};
    for(const f of ['activity','platform','age','panel'])options[f]=[...new Set(pool.map(c=>c[f]))];
    return {...result,records:undefined,options,totals:{rows:rs.length,cases:rs.length,contracts:new Set(rs.map(r=>r.client)).size,base:last?.base??0,rate:last?.rate??null,period:last?.period},categories:categories.map(category=>({category,rows:rs.filter(r=>r.category===category).length})),age_matrix:ages.flatMap(age=>categories.map(category=>({age,category,rows:rs.filter(r=>r.age===age&&r.category===category).length}))),meta:{updated},state:{running:false}};
  }
  function presentation(p){return {groups:[{name:'Total',...summarize(p)},...['Particulares','Negocios'].map(name=>({name,...summarize(p,name)}))],comparison:summarize(p,null,true).trend}}
  let excluded=new Set();try{excluded=new Set(JSON.parse(localStorage.getItem('portfolio-muestra-excluded')||'[]'))}catch{}
  const save=()=>{try{localStorage.setItem('portfolio-muestra-excluded',JSON.stringify([...excluded]))}catch{}};
  const pilotClients=clients.filter(c=>c.kind==='Cámaras');
  const pilotRecords=records.filter(r=>r.kind==='Cámaras'&&r.created>='2026-01-01');
  function pilot(mode){
    const trend=calendar(mode).filter(t=>t.period.startsWith('2026')).map(t=>{
      const row={...t,covered:true,partial:mode==='month'&&t.period==='202610'};
      for(const v of ['v4','v3']){const base=pilotClients.filter(c=>c.version===v&&c.created<=t.to).length,cases=pilotRecords.filter(r=>r.version===v&&!excluded.has(r.id)&&r.created>=t.from&&r.created<=t.to).length;row[v]={base,cases,rate:base?cases/base:null}}
      return row;
    });
    return {selection:{mode},trend,meta:{updated,v4_cameras_total:360,sources:[],warnings:[]},state:{running:false}};
  }
  function cases(){return {updated,cases:pilotRecords.filter(r=>r.version==='v4').map(r=>({caseid:r.id,created:r.created+'T12:00:00',comment:r.comment,included:!excluded.has(r.id)}))}}
  function csv(name,rows){const content='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  const method=`<p><b>Datos 100 % ficticios:</b> los clientes, las fechas, las consultas y los comentarios se generan con reglas inventadas en este navegador. No proceden de archivos ni servicios de ninguna empresa. Se repite el mismo escenario al abrir la muestra.</p><p><b>Consultas recibidas:</b> número de consultas del intervalo seleccionado, cada una contada una vez. <b>Clientes con consultas:</b> personas o negocios distintos que han enviado al menos una consulta en ese intervalo. <b>Clientes:</b> clientes del producto dados de alta hasta el último periodo seleccionado. <b>Consultas / clientes:</b> consultas del último periodo divididas entre sus clientes. En las gráficas, la tasa se calcula de nuevo para cada periodo.</p><p><b>Filtros:</b> tipo de cliente, plataforma, antigüedad y equipo delimitan tanto las consultas como los clientes. Motivo y tipo de consulta filtran únicamente consultas. Las fechas delimitan el intervalo de consultas y el cierre de la base de clientes. No se simulan bajas. La antigüedad se calcula respecto al 25/10/2026.</p><p><b>Tiempo y comparaciones:</b> las semanas van de lunes a domingo según el calendario ISO; los meses son naturales. El escenario termina el 25/10/2026: octubre es incompleto y no se debe comparar como un mes cerrado. Los dos años se comparan usando el mismo número de semana o mes. Mostrar solo recorta los gráficos; la tabla y los totales conservan todo el intervalo filtrado.</p><p><b>Exportación:</b> el CSV incluye exclusivamente las cifras ficticias que cumplen los filtros, con una indicación de muestra. No se conecta con fuentes externas.</p>`;
  return {dashboard,presentation,pilot,cases,csv,method,setIncluded(id,included){included?excluded.delete(id):excluded.add(id);save()},resetPilot(){excluded.clear();save()}};
})();
