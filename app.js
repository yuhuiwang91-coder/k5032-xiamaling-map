(() => {
const API_KEY_STORE='k5032_amap_key_v51', SEC_STORE='k5032_amap_security_v51', SAMPLE_STORE='k5032_field_samples_v51';
const defs=[
 ['D01D','沉积地层/火山沉积地层','#d8bd82',false],
 ['D01B','变质岩系地层','#b9b09b',false],
 ['D04N','侵入岩年代单位','#d99f83',false],
 ['D05M','脉岩','#ac82b6',false],
 ['D13B','附加面图元','#a0a0a0',false],
 ['D01J','地质界线','#685650',false],
 ['D08D','断层','#b52f2f',false],
 ['D13P','地质剖面线','#446daa',false],
 ['L01J','图幅属性/图框','#2e4148',false],
 ['D11K','矿产地','#b7791f',false],
 ['D12C','产状符号','#435663',false],
 ['sample_point','既有12处夏马岭组采样点','#c93c32',true]
];
const defMap=Object.fromEntries(defs.map(x=>[x[0],{name:x[1],color:x[2],defaultOn:x[3]}]));
const fieldLabels={
ID:'要素ID',面积:'面积（源数据）',周长:'周长（源数据）',CHFCAC:'图元编号',CHFCAA:'图素类型',CHFCAD:'图素名称',DSN:'地层/岩组名称',DSO:'地层代号',DSP:'时代/层级代号',QDHN:'岩体名称',QDHAH:'岩体/岩性代号',QDHAA:'超单元/谱系字段',QDHAB:'超单元/岩体名称',QDHAC:'单元名称',YSEAGE:'岩性符号',GZEAB:'断层名称',GZECA:'走向',GZECD:'倾向',GZECE:'倾角/参数',JJDAJ:'矿产地名称',GZBBAC:'产状方位',GZBBAD:'产状倾角',CHAMAC:'图幅号',CHAMAA:'图名',CHAMDB:'比例尺',QDAE:'调查单位',QDYGG:'资料单位',QDYH:'年月',QDAF:'调查年份',DDAEED:'地形底图资料',source_sheet:'源图幅',source_file:'源MapGIS文件',layer_code:'图层代码',layer_meaning:'图层含义',distance_to_sample_m:'距夏马岭组采样点（m）',mg_pattern:'MapGIS填充图案号',mg_pattern_color_index:'MapGIS图案颜色索引',mg_linetype:'MapGIS线型号',mg_aux_linetype:'MapGIS辅助线型号',mg_width_mm:'MapGIS线宽(mm)',mg_symbol_no:'MapGIS子图符号号',mg_angle_deg:'MapGIS符号角度',source_layer:'源图层'};
let map, normalLayer, satelliteLayer, roadLayer, infoWindow, currentData=window.K5032_LOCAL_DATA, currentScope='local';
let featuresByCode={}, overlaysByCode={}, featureOverlays=new WeakMap(), polygonOpacity=.06, rasterOpacity=.72, rasterLayers={}, addingSample=false, pendingLngLat=null;
let mySampleOverlays=[];

function esc(s){return String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function showStatus(msg,ms=2800){const e=document.getElementById('status');e.textContent=msg;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',ms)}
function openModal(id){document.getElementById(id).style.display='flex'} function closeModal(id){document.getElementById(id).style.display='none'}
document.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>closeModal(x.dataset.close));
function creds(){return {key:localStorage.getItem(API_KEY_STORE)||localStorage.getItem('k5032-field-map-api')||'',sec:localStorage.getItem(SEC_STORE)||localStorage.getItem('k5032-field-map-security')||''}}
function ensureCreds(){let c=creds();document.getElementById('amapKey').value=c.key;document.getElementById('securityCode').value=c.sec;if(!c.key||!c.sec){openModal('setupModal');return false}return true}
document.getElementById('btnSetup').onclick=()=>{let c=creds();document.getElementById('amapKey').value=c.key;document.getElementById('securityCode').value=c.sec;openModal('setupModal')};
document.getElementById('btnSaveSetup').onclick=()=>{let k=document.getElementById('amapKey').value.trim(),s=document.getElementById('securityCode').value.trim();if(!k||!s)return showStatus('Key 和 securityJsCode 都需要填写');localStorage.setItem(API_KEY_STORE,k);localStorage.setItem(SEC_STORE,s);location.reload()};
function loadAmap(){if(!ensureCreds())return;let c=creds();window._AMapSecurityConfig={securityJsCode:c.sec};let s=document.createElement('script');s.src=`https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(c.key)}&plugin=AMap.Scale,AMap.Geolocation`;s.onload=initMap;s.onerror=()=>showStatus('高德 API 加载失败，请检查 Key / securityJsCode / 网络',6000);document.head.appendChild(s)}
function initMap(){normalLayer=new AMap.TileLayer();satelliteLayer=new AMap.TileLayer.Satellite();roadLayer=new AMap.TileLayer.RoadNet();map=new AMap.Map('map',{center:[115.278,40.468],zoom:12,layers:[normalLayer],viewMode:'2D',resizeEnable:true});map.addControl(new AMap.Scale({position:'RB'}));infoWindow=new AMap.InfoWindow({offset:new AMap.Pixel(0,-12)});initRasterLayers();indexData();buildLayerUI();applyDefaultLayers();buildLegend();loadMySamples();bindUI();map.on('click',onMapClick);document.getElementById('offlinePreview').style.display='none';showStatus('宣化幅 v5.1 已加载：12处采样点可点击')}
function initRasterLayers(){
 rasterLayers={};for(const [id,d] of Object.entries(window.K5032_RASTER_LAYERS||{})){
  let b=d.bounds;
  let l=new AMap.ImageLayer({url:d.url,bounds:new AMap.Bounds([b[0],b[1]],[b[2],b[3]]),opacity:rasterOpacity,visible:id===currentScope,zIndex:5,zooms:[3,20]});
  rasterLayers[id]=l;map.add(l);
 }
 updateRasterDisplay();
}
function updateRasterDisplay(){const enabled=document.getElementById('rasterK5032').checked;for(const [id,l] of Object.entries(rasterLayers)){if(enabled&&id===currentScope)l.show();else l.hide()}
 document.getElementById('rasterScopeName').textContent=currentScope==='local'?'宣化幅原版图 · 12点采样区':'宣化幅原版图 · 整幅K5032'}
function setRasterOpacity(v){rasterOpacity=v;for(const l of Object.values(rasterLayers))l.setOpacity?.(v)}
function focusRaster(){let d=window.K5032_RASTER_LAYERS?.[currentScope];if(!d)return;let b=d.bounds;map.setBounds(new AMap.Bounds([b[0],b[1]],[b[2],b[3]]),false,[20,20,20,20])}
function restoreRasterLayers(){for(const l of Object.values(rasterLayers)){try{map.add(l)}catch(e){}}updateRasterDisplay()}
function indexData(){featuresByCode={};for(const f of currentData.features||[]){const c=f.properties?.layer_code||'unknown';(featuresByCode[c]||=[]).push(f)}}
function clearGeology(){for(const arr of Object.values(overlaysByCode))for(const o of arr)map.remove(o);overlaysByCode={};featureOverlays=new WeakMap()}
function getTitle(f){let p=f.properties||{},c=p.layer_code; if(c==='sample_point')return p.name||'夏马岭组采样点';if(['D01B','D01D','D03D'].includes(c))return p.DSN||p.DSO||defMap[c]?.name;if(c==='D04N')return p.QDHN||p.QDHAH||'侵入岩年代单位';if(c==='D04P')return [p.QDHAB,p.QDHAC].filter(Boolean).join(' · ')||p.QDHAH||'侵入岩谱系单位';if(c==='D05M')return p.YSEAGE||p.QDHAH||'脉岩';if(c==='D08D')return p.GZEAB||'断层';if(c==='D11K')return p.JJDAJ||'矿产地';if(c==='L01J')return p.CHAMAA||p.CHAMAC||'图幅';if(c==='D12C')return '产状点';if(c==='D13P')return p.QDYGK||p.QDYGL||'剖面线';return p.CHFCAD||p.DSN||p.QDHN||defMap[c]?.name||c}
function hashColor(label){let pal=['#d8b07a','#e1c58a','#d9a6a6','#cbb98d','#d2a77e','#c9bd78','#d7b49a','#c5a989','#e4c896'];let h=0;for(let ch of String(label||''))h=(h*31+ch.charCodeAt(0))>>>0;return pal[h%pal.length]}
function polygonColor(f){let p=f.properties||{},c=p.layer_code,title=getTitle(f);if(title.includes('宣化幅'))return '#e59a5b';if(c==='D01B'||c==='D01D')return hashColor(title);return defMap[c]?.color||'#b8a78f'}
function lineStyle(c){if(c==='D08D')return {strokeColor:'#c62828',strokeWeight:2.5,strokeStyle:'dashed',strokeOpacity:.95,zIndex:40};if(c==='D04J')return {strokeColor:'#c026d3',strokeWeight:1.8,strokeStyle:'solid',strokeOpacity:.9,zIndex:32};if(c==='D03J')return {strokeColor:'#7c3aed',strokeWeight:1.4,strokeStyle:'dashed',strokeOpacity:.8,zIndex:30};if(c==='D13P')return {strokeColor:'#2563eb',strokeWeight:2,strokeStyle:'dashed',strokeOpacity:.9,zIndex:35};if(c==='L01J')return {strokeColor:'#111827',strokeWeight:2,strokeStyle:'solid',strokeOpacity:.8,zIndex:20};return {strokeColor:'#5f5954',strokeWeight:1,strokeStyle:'solid',strokeOpacity:.65,zIndex:22}}
function addOverlay(c,o,f){(overlaysByCode[c]||=[]).push(o);let list=featureOverlays.get(f)||[];list.push(o);featureOverlays.set(f,list);map.add(o);o.on('click',e=>showFeature(f,e.lnglat))}
function renderCode(c){if(overlaysByCode[c]){for(const o of overlaysByCode[c])o.show();return}overlaysByCode[c]=[];for(const f of featuresByCode[c]||[])renderFeature(f)}
function renderFeature(f){
 let c=f.properties?.layer_code,g=f.geometry;if(!g)return;
 // Raster retains source MAPGIS style. Vectors provide click query/hit regions only.
 if(g.type.includes('Polygon')){
  let polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;
  for(const path of polys){let o=new AMap.Polygon({path,fillColor:'#ffffff',fillOpacity:Math.min(polygonOpacity,.06),strokeColor:'#000000',strokeWeight:1,strokeOpacity:.03,zIndex:9});addOverlay(c,o,f)}
 }else if(g.type.includes('LineString')){
  let paths=g.type==='LineString'?[g.coordinates]:g.coordinates;
  for(const path of paths){let o=new AMap.Polyline({path,strokeColor:'#000000',strokeWeight:8,strokeOpacity:.01,zIndex:35});addOverlay(c,o,f)}
 }else if(g.type==='Point'){
  let pos=g.coordinates;
  if(c==='sample_point'){
   let p=f.properties||{},n=+p.site_no||0, cls=n===1?'main':(n>=9?'zjs':'');
   let o=new AMap.Marker({position:pos,content:`<div class="site-number ${cls}" title="${esc(p.name||'采样点')}">${n}</div>`,offset:new AMap.Pixel(-13,-13),zIndex:110});addOverlay(c,o,f)
  }else{
   let o=new AMap.Marker({position:pos,content:'<div style="width:22px;height:22px;background:transparent"></div>',offset:new AMap.Pixel(-11,-11),zIndex:60});addOverlay(c,o,f)
  }
 }
}
function setCodeVisible(c,on){if(on)renderCode(c);else for(const o of overlaysByCode[c]||[])o.hide()}
function buildLayerUI(){
  let host=document.getElementById('layerSwitches');host.innerHTML='<div class="native-hit-note">这些是查询/点击图层。颜色和符号不再由网页重新绘制，视觉样式以原版地质图栅格为准。</div>';
  for(const [c,name,color,on] of defs){
    let count=(featuresByCode[c]||[]).length,row=document.createElement('label');row.className='layer-row';
    row.innerHTML=`<input type="checkbox" data-code="${c}" ${on&&count?'checked':''} ${count?'':'disabled'}><span><span class="layer-code-chip">${esc(c)}</span>${esc(name)}</span><span class="count">${count}</span>`;
    host.appendChild(row)
  }
  host.querySelectorAll('input[data-code]').forEach(x=>x.onchange=()=>setCodeVisible(x.dataset.code,x.checked))
}
function applyDefaultLayers(){for(const [c,,,on] of defs)if(on&&(featuresByCode[c]||[]).length)renderCode(c);let visible=[];for(const [c,,,on] of defs)if(on)visible.push(...(overlaysByCode[c]||[]));if(currentScope==='local'&&visible.length)map.setFitView(visible)}
function buildLegend(){
 const host=document.getElementById('legend');
 const srcs=[
 ['K5032 原始右侧地质图例','data/legend/K5032_原始右侧地质图例.png'],
 ['原始地层柱状图','data/legend/K5032_原始地层柱状图.png'],
 ['原始地质剖面','data/legend/K5032_原始地质剖面.png']
 ];
 host.innerHTML=srcs.map(([title,src],i)=>`<div class="native-legend-card"><div class="native-legend-title">${esc(title)} · 直接来自原始TIF</div><img class="native-legend-thumb" data-legend="${i}" src="${src}" alt="${esc(title)}"><div class="native-legend-actions"><button type="button" data-legend="${i}">放大查看</button></div></div>`).join('');
 host.querySelectorAll('[data-legend]').forEach(el=>el.onclick=()=>{let [title,src]=srcs[Number(el.dataset.legend)];document.getElementById('legendModalImg').src=src;document.getElementById('legendModalTitle').textContent=title;openModal('legendModal')});
}
function propRows(f){let p=f.properties||{};let rows=[];for(const [k,v] of Object.entries(p)){if(v===null||v===undefined||String(v).trim()==='')continue;rows.push([fieldLabels[k]||k,v,k])}return rows}
function showFeature(f,lnglat){let title=getTitle(f),p=f.properties||{},c=p.layer_code,summary=[['图层',`${defMap[c]?.name||p.layer_meaning||c} (${c})`],['源图幅',p.source_sheet||''],['源文件',p.source_file||''],['距采样点',p.distance_to_sample_m!=null?`${p.distance_to_sample_m} m`:'' ]];if(p.DSO)summary.push(['地质代号',p.DSO]);if(p.QDHAH)summary.push(['岩体/岩性代号',p.QDHAH]);if(p.YSEAGE)summary.push(['岩性符号',p.YSEAGE]);let rows=propRows(f);let html=`<div class="feature-title">${esc(title)}</div><table class="summary-table">${summary.filter(x=>x[1]).map(x=>`<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td></tr>`).join('')}</table><details class="attr-block" open><summary>全部原始属性（${rows.length}项）</summary><table class="attr-table">${rows.map(r=>`<tr><td>${esc(r[0])}<br><small>${esc(r[2])}</small></td><td>${esc(r[1])}</td></tr>`).join('')}</table></details><button class="primary wide" onclick="window.k5032Navigate(${lnglat.lng},${lnglat.lat},'${String(title).replace(/'/g,"\\'")}')">高德导航</button>`;document.getElementById('featureInfo').innerHTML=html;activateTab('info');infoWindow.setContent(`<div style="min-width:210px"><b>${esc(title)}</b><br><small>${esc(defMap[c]?.name||c)}</small></div>`);infoWindow.open(map,lnglat)}
window.k5032Navigate=(lng,lat,name)=>window.open(`https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(name||'目标点')}&mode=car&policy=1&src=K5032FieldMap&callnative=1`,'_blank');
function activateTab(name){document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));document.querySelectorAll('.tabbody').forEach(x=>x.classList.toggle('active',x.id===`tab-${name}`))}
function featureSearchText(f){return Object.values(f.properties||{}).filter(v=>v!=null).join(' ').toLowerCase()}
function doSearch(){let q=document.getElementById('searchInput').value.trim().toLowerCase(),host=document.getElementById('searchResults');if(!q){host.innerHTML='';return}let hits=(currentData.features||[]).filter(f=>featureSearchText(f).includes(q)).slice(0,100);host.innerHTML=`<div class="hint">找到 ${hits.length}${hits.length===100?'（仅显示前100）':''} 个结果</div>`+hits.map((f,i)=>`<div class="result" data-i="${i}"><b>${esc(getTitle(f))}</b><small>${esc(f.properties?.source_sheet||'')} · ${esc(f.properties?.layer_code||'')} · ${esc(defMap[f.properties?.layer_code]?.name||'')}</small></div>`).join('');host.querySelectorAll('.result').forEach((e,i)=>e.onclick=()=>focusFeature(hits[i]))}
function focusFeature(f){let c=f.properties?.layer_code,cb=document.querySelector(`input[data-code="${c}"]`);if(cb&&!cb.checked){cb.checked=true;setCodeVisible(c,true)}else renderCode(c);let ovs=featureOverlays.get(f)||[];if(ovs.length)map.setFitView(ovs);let g=f.geometry,coord=g.type==='Point'?g.coordinates:null;if(coord)showFeature(f,{lng:coord[0],lat:coord[1]});else{let o=ovs[0];if(o){let b=o.getBounds?.();let ctr=b?.getCenter?.()||map.getCenter();showFeature(f,ctr)}}}
async function switchScope(scope){
 if(scope===currentScope)return;
 document.getElementById('loadState').textContent='加载中…';
 if(scope==='full'&&!window.K5032_FULL_DATA){
  try{await new Promise((resolve,reject)=>{let s=document.createElement('script');s.src='data/full_data.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}catch(e){showStatus('全图幅数据加载失败',5000);document.getElementById('loadState').textContent='失败';return}
 }
 clearGeology();currentScope=scope;currentData=scope==='full'?window.K5032_FULL_DATA:window.K5032_LOCAL_DATA;
 indexData();buildLayerUI();applyDefaultLayers();buildLegend();renderSampleList();updateRasterDisplay();
 document.getElementById('searchResults').innerHTML='';
 document.getElementById('loadState').textContent=scope==='full'?'全图幅 · 6637要素':'采样区 · 654要素';
 focusRaster();showStatus(scope==='full'?'宣化幅全部6637个要素可查询（矢量查询层按需开启）':'已切回12点采样区',4600);
}
function onMapClick(e){if(!addingSample)return;pendingLngLat=[e.lnglat.lng,e.lnglat.lat];document.getElementById('sampleCoord').textContent=`GCJ-02：${e.lnglat.lng.toFixed(6)}, ${e.lnglat.lat.toFixed(6)}`;document.getElementById('sampleCode').value=nextCode();['sampleLithology','sampleAttitude','sampleDistance','sampleRelation','sampleNote'].forEach(id=>document.getElementById(id).value='');addingSample=false;document.getElementById('btnAddSample').classList.remove('primary');openModal('sampleModal')}
function samples(){try{return JSON.parse(localStorage.getItem(SAMPLE_STORE)||'[]')}catch{return []}}
function saveSamples(a){localStorage.setItem(SAMPLE_STORE,JSON.stringify(a))}
function nextCode(){let a=samples(),n=1;for(const s of a){let m=String(s.code||'').match(/K5032-(\d+)/);if(m)n=Math.max(n,+m[1]+1)}return `K5032-${String(n).padStart(3,'0')}`}
function loadMySamples(){for(const o of mySampleOverlays)map.remove(o);mySampleOverlays=[];for(const s of samples()){let o=new AMap.Marker({position:[s.lng,s.lat],label:{content:s.code,direction:'right'},content:'<div style="width:13px;height:13px;background:#0f766e;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px #0007"></div>',offset:new AMap.Pixel(-6,-6),zIndex:110});o.on('click',()=>showMySample(s));map.add(o);mySampleOverlays.push(o)}renderSampleList()}
function showMySample(s){document.getElementById('featureInfo').innerHTML=`<div class="feature-title">${esc(s.code)}</div><table class="summary-table"><tr><td>岩性</td><td>${esc(s.lithology)}</td></tr><tr><td>产状</td><td>${esc(s.attitude)}</td></tr><tr><td>距脉体/反应带</td><td>${esc(s.distance)}</td></tr><tr><td>流体/构造</td><td>${esc(s.relation)}</td></tr><tr><td>备注</td><td>${esc(s.note)}</td></tr><tr><td>GCJ-02</td><td>${s.lng.toFixed(6)}, ${s.lat.toFixed(6)}</td></tr></table>`;activateTab('info')}
function renderSampleList(){
 const host=document.getElementById('sampleList');
 const features=(currentData.features||[]).filter(f=>f.properties?.layer_code==='sample_point');
 host.innerHTML='<h3>既有12处采样点（高德GCJ-02）</h3>'+features.map((f,i)=>{let p=f.properties,n=p.site_no;return `<div class="point-card" data-site="${i}"><div class="point-head"><span class="point-tag">${n}</span><b>${esc(p.name)}</b></div><small>${esc(p.site_code||'')} · ${f.geometry.coordinates[0].toFixed(6)}, ${f.geometry.coordinates[1].toFixed(6)} · ${esc(p.group||'')}</small><small>${esc(p.remarks||'')}</small><div class="point-actions"><button data-focus="${i}">定位及属性</button><a target="_blank" rel="noopener" href="https://uri.amap.com/marker?position=${f.geometry.coordinates.join(',')}&name=${encodeURIComponent(p.name)}&coordinate=gaode&callnative=1&src=K5032FieldMap">高德APP点位</a></div></div>`}).join('');
 host.querySelectorAll('[data-focus]').forEach(el=>el.onclick=()=>{let f=features[+el.dataset.focus];focusFeature(f)});
 const a=samples();let div=document.createElement('div');div.innerHTML='<h3>本机新增采样点（'+a.length+'）</h3>'+(a.length?a.map(s=>`<div class="sample-card"><b>${esc(s.code)}</b><br><small>${esc(s.lithology||'')} · ${s.lng.toFixed(6)}, ${s.lat.toFixed(6)}</small></div>`).join(''):'<div class="hint">尚未新增样点。点击上方“新增样点”，再点击地图记录。</div>');host.appendChild(div);
}
function download(name,text,type='text/plain'){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function exportCSV(){let a=samples(),heads=['code','lng_gcj02','lat_gcj02','lithology','attitude','distance','relation','note','time'],q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';download('K5032_new_samples.csv','\ufeff'+heads.join(',')+'\n'+a.map(s=>heads.map(h=>q(h==='lng_gcj02'?s.lng:h==='lat_gcj02'?s.lat:s[h])).join(',')).join('\n'),'text/csv')}
function exportGeoJSON(){let a=samples(),gj={type:'FeatureCollection',name:'K5032 Xuanhua field samples GCJ-02',features:a.map(s=>({type:'Feature',geometry:{type:'Point',coordinates:[s.lng,s.lat]},properties:{...s,lng:undefined,lat:undefined}}))};download('K5032_new_samples_GCJ02.geojson',JSON.stringify(gj,null,2),'application/geo+json')}
function bindUI(){
  document.getElementById('btnMenu').onclick=()=>document.getElementById('panel').classList.toggle('open');
  document.getElementById('btnClosePanel').onclick=()=>document.getElementById('panel').classList.remove('open');
  document.querySelectorAll('.tab').forEach(x=>x.onclick=()=>activateTab(x.dataset.tab));
  document.getElementById('scopeSelect').onchange=e=>switchScope(e.target.value);
  document.getElementById('rasterK5032').onchange=updateRasterDisplay;
  document.getElementById('focusK5032').onclick=e=>{e.preventDefault();focusRaster()};
  document.getElementById('rasterOpacitySlider').oninput=e=>{setRasterOpacity(+e.target.value);document.getElementById('rasterOpacityValue').textContent=Math.round(+e.target.value*100)+'%'};
  document.getElementById('opacitySlider').oninput=e=>{
    polygonOpacity=+e.target.value;
    document.getElementById('opacityValue').textContent=Math.round(polygonOpacity*100)+'%';
    for(const [c,arr] of Object.entries(overlaysByCode)){
      if(['D01B','D01D','D02H','D03D','D04N','D04P','D05M','D06S','D07B','D07H','D13B'].includes(c)){
        for(const o of arr) o.setOptions?.({fillOpacity:polygonOpacity});
      }
    }
  };
  document.getElementById('btnSearch').onclick=doSearch;
  document.getElementById('searchInput').onkeydown=e=>{if(e.key==='Enter')doSearch()};
  document.getElementById('btnBase').onclick=()=>{
    let b=document.getElementById('btnBase');
    if(b.dataset.sat==='1'){
      map.setLayers([normalLayer]); restoreRasterLayers(); b.dataset.sat='0'; b.textContent='卫星图';
    }else{
      map.setLayers([satelliteLayer,roadLayer]); restoreRasterLayers(); b.dataset.sat='1'; b.textContent='普通图';
    }
  };
  document.getElementById('btnLocate').onclick=()=>{
    AMap.plugin('AMap.Geolocation',()=>{
      let g=new AMap.Geolocation({enableHighAccuracy:true,timeout:12000,zoomToAccuracy:true});
      g.getCurrentPosition((st,r)=>{
        if(st!=='complete'){
          showStatus('定位失败：手机请使用 HTTPS 并允许定位权限',4500);
          return;
        }
        map.setZoomAndCenter(15,r.position);
        showStatus(`定位成功${r.accuracy?`，精度约${Math.round(r.accuracy)} m`:''}`);
      });
    });
  };
  document.getElementById('btnAddSample').onclick=()=>{
    addingSample=!addingSample;
    document.getElementById('btnAddSample').classList.toggle('primary',addingSample);
    showStatus(addingSample?'请在地图上点击采样位置':'已取消新增样点');
  };
  document.getElementById('btnSaveSample').onclick=()=>{
    if(!pendingLngLat)return;
    let s={
      code:document.getElementById('sampleCode').value.trim()||nextCode(),
      lng:pendingLngLat[0], lat:pendingLngLat[1],
      lithology:document.getElementById('sampleLithology').value.trim(),
      attitude:document.getElementById('sampleAttitude').value.trim(),
      distance:document.getElementById('sampleDistance').value.trim(),
      relation:document.getElementById('sampleRelation').value.trim(),
      note:document.getElementById('sampleNote').value.trim(),
      time:new Date().toISOString()
    };
    let a=samples(); a.push(s); saveSamples(a); closeModal('sampleModal'); loadMySamples(); showStatus('样点已保存');
  };
  document.getElementById('btnExportCSV').onclick=exportCSV;
  document.getElementById('btnExportGeoJSON').onclick=exportGeoJSON;
  document.getElementById('btnClearSamples').onclick=()=>{
    if(confirm('确定清空本浏览器保存的全部自采点？')){saveSamples([]);loadMySamples();}
  };
}
loadAmap();
})();
