let presentationData=null,historyData=null,presentationRequest=0;
const rateColors=['#b89508','#176785','#946183'];
function visiblePoints(points){const n=$('window').value;return n==='all'?points:points.slice(-Number(n))}
function reportLegend(id,names,colors,means=[]){$(id).innerHTML=names.map((name,i)=>`<span><i style="background:${colors[i]}"></i>${esc(name)}${means[i]==null?'':` · media ${pct(means[i])}`}</span>`).join('')}
function reportEmpty(id,message='Sin datos para los filtros seleccionados'){$(id).innerHTML=`<div class="empty">${esc(message)}</div>`}
async function loadPresentation(seq){
 const id=++presentationRequest;presentationData=null;$('reportStatus').textContent='Calculando gráficas…';$('reportStatus').classList.add('busy');$('reportCharts').setAttribute('aria-busy','true');
 $('ageCard').hidden=kind!=='Aplicación';
 try{
  const result=Muestra.presentation(params());
  if(id!==presentationRequest||seq!==request)return;
  
  presentationData=result;drawPresentation();$('reportStatus').textContent='';
 }catch(e){if(id===presentationRequest&&seq===request)$('reportStatus').textContent=e.message}
 finally{if(id===presentationRequest){$('reportCharts').setAttribute('aria-busy','false');$('reportStatus').classList.remove('busy')}}
}
function stackReport(plotId,legendId,labels,names,columns,{normalized=false,colors=null,label='Consultas por motivo y periodo',full=false}={}){
 colors=colors||names.map((name,i)=>{const at=data.categories.findIndex(c=>c.category===name);return color(at<0?i:at)});
 reportLegend(legendId,names,colors);
 if(!labels.length){reportEmpty(plotId);return}
 const el=$(plotId),w=Math.max(360,el.clientWidth,full?0:labels.length*80+70),h=el.clientHeight||540,left=54,right=18,top=28,bottom=30,ph=h-top-bottom,slot=(w-left-right)/labels.length,bw=Math.min(70,slot*.7);
 const totals=labels.map((_,i)=>columns.reduce((sum,values)=>sum+(values[i]||0),0)),max=normalized?1:Math.max(1,...totals)*1.06,y=v=>h-bottom-v/max*ph;
 let svg=[];
 for(let g=0;g<=4;g++){const val=max*g/4,yy=y(val);svg.push(`<line x1="${left}" x2="${w-right}" y1="${yy}" y2="${yy}" stroke="#e8ebee"/><text x="${left-8}" y="${yy+4}" text-anchor="end" class="legend">${normalized?Math.round(val*100)+'%':fmt(Math.round(val))}</text>`)}
 labels.forEach((label,i)=>{let base=h-bottom;const x=left+slot*i+slot/2-bw/2;columns.forEach((values,j)=>{const count=values[i]||0,v=normalized?(totals[i]?count/totals[i]:0):count,sh=v/max*ph;if(!count)return;
  svg.push(`<rect x="${x}" y="${base-sh}" width="${bw}" height="${sh}" fill="${colors[j]}" data-tooltip="${esc(names[j])} · ${esc(label)}: ${fmt(count)} consultas${normalized?' · '+pct(v):''}" aria-label="${esc(names[j])} · ${esc(label)}: ${fmt(count)} consultas${normalized?' · '+pct(v):''}"></rect>`);
  if(sh>=23&&bw>=25)svg.push(`<text x="${x+bw/2}" y="${base-sh/2+4}" text-anchor="middle" class="stack-label" fill="${['#d4d6d8','#a0b4d0'].includes(colors[j])?'#20252b':'white'}">${normalized?Math.round(v*100)+'%':fmt(count)}</text>`);if(sh>=48&&i%Math.max(1,Math.ceil(labels.length/14))===0)svg.push(`<text x="${x+bw/2}" y="${base-sh/2+16}" text-anchor="middle" class="stack-category" fill="${['#d4d6d8','#a0b4d0'].includes(colors[j])?'#20252b':'white'}"><title>${esc(names[j])}</title>${esc(names[j].length>10?names[j].slice(0,9)+'…':names[j])}</text>`);base-=sh;
 });svg.push(`<text x="${x+bw/2}" y="${Math.max(17,base-8)}" text-anchor="middle" class="stack-total">${fmt(totals[i])}</text>`);
 const stride=Math.max(1,Math.ceil(labels.length/Math.max(2,Math.floor((w-left-right)/90))));if((i%stride===0&&labels.length-1-i>=stride)||i===labels.length-1)svg.push(`<text x="${x+bw/2}" y="${h-22}" text-anchor="middle" class="legend">${esc(label)}</text>`)
 });el.innerHTML=`<svg viewBox="0 0 ${w} ${h}" style="min-width:${w}px" role="img" aria-label="${esc(label)}">${svg.join('')}</svg>`;
}
function lineReport(plotId,legendId,labels,series,label){
 const means=series.map(s=>{const values=s.values.filter(v=>v!=null);return values.length?values.reduce((a,b)=>a+b,0)/values.length:null});
 reportLegend(legendId,series.map(s=>s.name),series.map((s,i)=>s.color||rateColors[i%3]),means);
 if(!labels.length||!series.some(s=>s.values.some(v=>v!=null))){reportEmpty(plotId);return}
 const el=$(plotId),w=Math.max(360,el.clientWidth),h=el.clientHeight||540,left=65,right=36,top=25,bottom=30,max=Math.max(.0001,...series.flatMap(s=>s.values.filter(v=>v!=null)))*1.02,x=i=>left+i*(w-left-right)/Math.max(1,labels.length-1),y=v=>h-bottom-v/max*(h-top-bottom);
 let svg=[];for(let g=0;g<=4;g++){const v=max*g/4,yy=y(v);svg.push(`<line x1="${left}" x2="${w-right}" y1="${yy}" y2="${yy}" stroke="#e8ebee"/><text x="${left-8}" y="${yy+4}" text-anchor="end" class="legend">${pct(v)}</text>`)}
 series.forEach((s,j)=>{let path='',started=false;const col=s.color||rateColors[j%3];s.values.forEach((v,i)=>{if(v==null){started=false;return}path+=`${started?'L':'M'}${x(i)},${y(v)} `;started=true});svg.push(`<path d="${path}" fill="none" stroke="${col}" stroke-width="2.5"/>`);
  s.values.forEach((v,i)=>{if(v!=null)svg.push(`<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${col}"><title>${esc(s.name)} · ${esc(labels[i])}: ${pct(v)}</title></circle>`)})
 });const stride=Math.max(1,Math.ceil(labels.length/Math.max(2,Math.floor((w-left-right)/95))));labels.forEach((label,i)=>{if((i%stride===0&&labels.length-1-i>=stride)||i===labels.length-1)svg.push(`<text x="${x(i)}" y="${h-22}" text-anchor="middle" class="legend">${esc(label)}</text>`)});
 el.innerHTML=`<svg viewBox="0 0 ${w} ${h}" style="min-width:${w}px" role="img" aria-label="${esc(label)}">${svg.join('')}</svg>`;
}
function drawPresentation(){
 if(!presentationData||!data)return;
 const freq=$('mode').value==='week'?'semanal':'mensual',groups=presentationData.groups,categories=data.categories.map(c=>c.category),points=visiblePoints(data.trend),keys=points.map(p=>p.period),labels=keys.map(period);
 for(const [name,id] of [['Particulares','b2c'],['Negocios','b2b']]){
  const group=groups.find(g=>g.name===name),cells=new Map(group.matrix.map(c=>[c.category+'|'+c.period,c.rows]));$(id+'Title').textContent=`${kind} · ${name} ${freq}`;
  if(!group.trend.length){$(id+'Legend').innerHTML='';reportEmpty(id+'Plot');continue}
  stackReport(id+'Plot',id+'Legend',labels,categories,categories.map(c=>keys.map(k=>cells.get(c+'|'+k)||0)),{label:`${kind} ${name}: consultas por motivo, ${freq}`});
 }
 $('ratesTitle').textContent=`${kind} · Consultas por cliente ${freq}`;
 const rateSeries=groups.map(g=>{const rates=new Map(g.trend.map(t=>[t.period,t.rate]));return {name:g.name,values:keys.map(k=>rates.has(k)?rates.get(k):null)}});
 lineReport('ratesPlot','ratesLegend',labels,rateSeries,`${kind}: consultas por cliente, ${freq}`);
 const latest=data.trend.at(-1)?.period,year=$('year').value||latest?.slice(0,4),prior=year?String(Number(year)-1):'',comparison=new Map(presentationData.comparison.map(t=>[t.period,t.rate]));
 $('comparisonTitle').textContent=`${kind} · Consultas por cliente ${year||''} vs ${prior} · ${freq}`;
 const compareKeys=keys.filter(k=>k.startsWith(year||'----')).map(k=>k.slice(4)),compareLabels=compareKeys.map(k=>$('mode').value==='week'?'S'+k:k);
 lineReport('comparisonPlot','comparisonLegend',compareLabels,[{name:year||'Año seleccionado',values:compareKeys.map(k=>comparison.get(year+k)??null)},{name:prior,values:compareKeys.map(k=>comparison.get(prior+k)??null)}],`${kind}: comparativa entre ${year} y ${prior}`);
 if(kind==='Aplicación'){
  const order=['6 meses','1 año','2 años','> 2 años','Sin dato'],available=new Set(data.age_matrix.map(a=>a.age)),ages=order.filter(a=>available.has(a)),cells=new Map(data.age_matrix.map(a=>[a.category+'|'+a.age,a.rows]));
  stackReport('agePlot','ageLegend',ages,categories,categories.map(c=>ages.map(a=>cells.get(c+'|'+a)||0)),{normalized:true,full:true,label:'Aplicación: distribución de motivos por antigüedad del cliente'});
 }

}
window.addEventListener('resize',()=>{if(data){drawTrend();drawPresentation()}});
