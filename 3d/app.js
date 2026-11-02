import * as THREE from 'three';
import { Reflector } from './vendor/Reflector.js';
import { createMirrorChallenge } from './mirror-game.js';

const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' }); }
catch { $('#loading').hidden=true; $('#title').textContent='这里需要浏览器的 3D 支持'; $('#message').textContent='请使用支持 WebGL 的浏览器打开本页。'; $('#action').textContent='重新加载'; $('#action').disabled=false; $('#action').onclick=()=>location.reload(); throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
$('#world').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background=new THREE.Color('#e1e4d6');
const camera = new THREE.PerspectiveCamera(44,innerWidth/innerHeight,.06,45);
scene.add(camera);
const farPos=new THREE.Vector3(3.3,2.45,5.7);
const nearPos=new THREE.Vector3(1.1,1.90,2.7);
const farLook=new THREE.Vector3(-.18,1.1,-.45);
const nearLook=new THREE.Vector3(.35,1.43,-.95);
let look=farLook.clone();camera.position.copy(farPos);camera.lookAt(look);
const mat=(color,roughness=.75,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const cream=mat('#ece5d3'), grout=mat('#becbbc'), tile=mat('#cbd8c8'), wood=mat('#b98c61'), darkwood=mat('#8d6547'), oak=mat('#d4ac7c'), porcelain=mat('#faf2df',.24), metal=mat('#bbaa7b',.25,.7), leafmat=mat('#738958');
function mesh(geo,material,parent=scene){const m=new THREE.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,x,y,z,m,parent){const o=mesh(new THREE.BoxGeometry(w,h,d),m,parent);o.position.set(x,y,z);return o;}
function cyl(rt,rb,h,x,y,z,m,parent,segments=40){const o=mesh(new THREE.CylinderGeometry(rt,rb,h,segments),m,parent);o.position.set(x,y,z);return o;}
function ball(x,y,z,sx,sy,sz,m,parent){const o=mesh(new THREE.SphereGeometry(1,24,16),m,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;}
function tube(points,r,m,parent=scene){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),32,r,10,false),m,parent);}
function roundedRect(w,h,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
// The room is open toward the viewer; all objects are real meshes.
box(6.4,.12,7.3,0,-.07,1.5,mat('#d8ceb8'));
for(let x=-3;x<=3;x+=.6)for(let z=-1.8;z<5;z+=.6){box(.585,.012,.585,x,.002,z,mat((Math.round((x+3)/.6)+Math.round((z+1.8)/.6))%2?'#d6cfb9':'#e3dcc8'));}
box(6.4,3.7,.12,0,1.8,-1.75,cream);
box(.12,3.7,7.3,-3.15,1.8,1.5,cream);
// Low green tile wainscoting with actual shallow seams.
for(let x=-3;x<3.2;x+=.4)for(let y=.18;y<1.65;y+=.28)box(.392,.272,.025,x,y,-1.674,tile).castShadow=false;
box(6.3,.04,.06,0,1.71,-1.65,grout);
for(let z=-1.6;z<5;z+=.4)for(let y=.18;y<1.65;y+=.28)box(.025,.272,.392,-3.074,y,z,tile).castShadow=false;
box(.06,.04,6.9,-3.05,1.71,1.5,grout);
// Window, translucent light, oak sill, and a few quiet details.
box(.07,1.65,1.35,-3.04,2.55,.6,oak);
box(.08,1.47,1.18,-2.99,2.55,.6,mat('#f2f0cd'));
box(.09,1.5,.045,-2.93,2.55,.6,cream);
box(.09,.045,1.22,-2.93,2.55,.6,cream);
box(.3,.08,1.58,-2.94,1.68,.6,oak);
const windowGlow=new THREE.MeshBasicMaterial({color:'#fff2c2'});
box(.012,1.39,1.1,-2.94,2.55,.6,windowGlow).castShadow=false;
box(.09,1.5,.045,-2.88,2.55,.6,cream);box(.09,.045,1.22,-2.88,2.55,.6,cream);
// Vanity and door panels.
box(2.9,.86,.92,-.12,.54,-1.05,wood);
box(3.06,.12,1.04,-.12,1.04,-1.02,porcelain);
for(const x of [-1.12,-.15,.82]){
 box(.91,.71,.05,x,.57,-.565,oak);
 box(.91,.025,.025,x,.24,-.532,darkwood);
 box(.24,.025,.035,x,.79,-.52,metal);
 for(let i=0;i<5;i++)box(.006,.63,.003,x-.37+i*.17,.55,-.537,mat('#c2986c'));
}
box(2.7,.1,.77,-.12,.08,-1.08,darkwood);
// Porcelain vessel basin: open inner bowl formed as one curved lathe profile.
const basinPoints=[[0,0],[.07,0],[.22,.025],[.34,.09],[.41,.19],[.43,.25],[.42,.265],[.40,.26],[.37,.20],[.31,.12],[.2,.07],[.07,.055],[0,.055]].map(p=>new THREE.Vector2(...p));
const basin=mesh(new THREE.LatheGeometry(basinPoints,72),porcelain);basin.position.set(-.45,1.10,-.98);basin.scale.z=.78;
cyl(.045,.045,.005,-.45,1.158,-.98,metal);
tube([[-.45,1.1,-1.43],[-.45,1.44,-1.43],[-.45,1.52,-1.35],[-.45,1.51,-1.19],[-.45,1.43,-1.17]],.028,metal);
cyl(.07,.07,.018,-.45,1.11,-1.43,metal);box(.14,.025,.035,-.25,1.17,-1.43,metal);
// Rounded oak mirror and real planar reflection.
const frame=mesh(new THREE.ExtrudeGeometry(roundedRect(1.8,1.65,.37),{depth:.075,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.025}),oak);frame.position.set(-.42,2.21,-1.63);
const mirror=new Reflector(new THREE.ShapeGeometry(roundedRect(1.65,1.5,.32)),{clipBias:.003,textureWidth:768,textureHeight:768,color:0xb9c9bc});mirror.position.set(-.42,2.21,-1.515);scene.add(mirror);
// Toothbrush and its ceramic holder.
cyl(.085,.07,.18,-1.16,1.19,-1.15,mat('#789b8c'));
const brush=new THREE.Group();scene.add(brush);brush.position.set(-1.17,1.38,-1.15);
box(.021,.32,.018,0,0,0,mat('#cf9476'),brush).rotation.z=-.13;
box(.03,.065,.025,-.022,.17,0,porcelain,brush);
// Soap bottle, pump and label.
const soap=new THREE.Group();scene.add(soap);soap.position.set(1.03,1.23,-1.25);
box(.16,.24,.13,0,0,0,mat('#b58768'),soap);
box(.12,.095,.004,0,0,.068,cream,soap);
cyl(.024,.024,.055,0,.15,0,metal,soap);box(.13,.025,.035,.04,.18,0,metal,soap);
// Towel rail and gently curved cloth.
tube([[1.2,2.14,-1.6],[1.2,2.14,-1.48],[1.9,2.14,-1.48],[1.9,2.14,-1.6]],.018,metal);
const towelGeo=new THREE.PlaneGeometry(.52,.72,18,24);const pv=towelGeo.attributes.position;
for(let i=0;i<pv.count;i++)pv.setZ(i,.024*Math.cos(pv.getX(i)*58));towelGeo.computeVertexNormals();
const towel=mesh(towelGeo,new THREE.MeshStandardMaterial({color:'#d8ac73',roughness:1,side:THREE.DoubleSide}));towel.position.set(1.54,1.81,-1.42);
for(let i=0;i<3;i++)box(.48,.009,.009,1.54,1.48+i*.025,-1.38,mat('#e5c496'));
// Plant in the corner, toilet and woven bath mat.
cyl(.22,.16,.36,-2.54,.2,-.83,mat('#b99172'));cyl(.2,.2,.013,-2.54,.385,-.83,mat('#675c42'));
for(let i=0;i<9;i++){const a=i*2.4;const x=-2.54+Math.cos(a)*.22,z=-.83+Math.sin(a)*.22;const h=.65+(i%3)*.18;tube([[-2.54,.35,-.83],[x,h,z]],.012,leafmat);const l=ball(x,h,z,.1,.23,.04,leafmat);l.rotation.set(.3,a,.5);}
box(.54,.67,.24,-2.58,.6,1.65,porcelain);ball(-2.45,.4,2.0,.34,.22,.47,porcelain);cyl(.19,.24,.32,-2.45,.18,1.98,porcelain);const seat=mesh(new THREE.TorusGeometry(.265,.035,12,48),cream);seat.rotation.x=Math.PI/2;seat.scale.y=1.35;seat.position.set(-2.45,.56,2.0);box(.12,.018,.045,-2.58,.945,1.66,metal);
const rug=box(1.7,.018,.8,-.1,.028,.45,mat('#a2ad89'));for(let i=0;i<34;i++)box(.018,.004,.75,-.9+i*.05,.041,.45,mat(i%2?'#b6bd9b':'#959f7d'));
// Small framed botanical drawing, handmade from geometry.
box(.52,.65,.045,2.3,2.75,-1.66,oak);box(.44,.57,.012,2.3,2.75,-1.63,porcelain);
tube([[2.3,2.52,-1.61],[2.3,2.88,-1.61]],.008,leafmat);
for(let i=0;i<4;i++){const l=ball(2.3+(i%2?.065:-.065),2.62+i*.055,-1.60,.075,.025,.008,leafmat);l.rotation.z=i%2?.5:-.5;}
// Pendant.
tube([[.8,3.65,.2],[.8,3.1,.2]],.008,metal);cyl(.17,.3,.22,.8,3.0,.2,cream);cyl(.27,.27,.008,.8,2.885,.2,windowGlow);
// Hero object: hollow glazed mug with open top and a real handle.
const cup=new THREE.Group();scene.add(cup);
const mugmat=mat('#e6bd7c',.24);const inner=mat('#f2d4a0',.3);
const mugPoints=[[0,0],[.07,0],[.09,.018],[.105,.19],[.103,.205],[.091,.205],[.088,.19],[.075,.025],[0,.025]].map(p=>new THREE.Vector2(...p));
mesh(new THREE.LatheGeometry(mugPoints,56),mugmat,cup);
const handle=mesh(new THREE.TorusGeometry(.066,.018,14,40),mugmat,cup);handle.position.set(.112,.112,0);handle.scale.y=1.15;
const rim=mesh(new THREE.TorusGeometry(.097,.006,10,56),inner,cup);rim.rotation.x=Math.PI/2;rim.position.y=.202;
const cupHome=new THREE.Vector3(.62,1.105,-.9);cup.position.copy(cupHome);cup.rotation.y=-.3;
const cupHomeQ=cup.quaternion.clone();
const coaster=cyl(.16,.16,.008,.62,1.105,-.9,mat('#ad9470'));
// A simple, stylized hand and sleeve accompany the held mug.
const hand=new THREE.Group();scene.add(hand);
const skin=mat('#d9ad8a');const sleeve=mat('#789687');
ball(.045,-.018,.04,.065,.045,.055,skin,hand);
for(let i=0;i<4;i++){const finger=ball(.075+i*.012,.025+i*.007,-.007,.013,.043,.014,skin,hand);finger.rotation.z=-.2;}
ball(-.005,.034,.066,.025,.046,.022,skin,hand).rotation.z=.5;
const arm=cyl(.053,.07,.32,.065,-.18,.05,sleeve,hand);arm.rotation.z=-.12;hand.visible=false;
// Lighting: sun from the left, soft fill, and a warm practical light.
const hemisphere=new THREE.HemisphereLight('#fff6dd','#a5b39c',2.0);scene.add(hemisphere);
const sun=new THREE.DirectionalLight('#fff0c9',3.2);sun.position.set(-3.5,5.0,3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=4;scene.add(sun);
const fill=new THREE.PointLight('#ffdb99',10,5,2);fill.position.set(.8,2.8,.2);scene.add(fill);
// Subtle window-light rectangles falling onto the floor.
const patchmat=new THREE.MeshBasicMaterial({color:'#fff0b8',transparent:true,opacity:.17,depthWrite:false});
for(let i=0;i<2;i++)for(let j=0;j<2;j++){const patch=new THREE.Mesh(new THREE.PlaneGeometry(.7,1.05),patchmat);patch.rotation.x=-Math.PI/2;patch.rotation.z=-.35;patch.position.set(-1.6+i*.82,.018,1.1+j*1.2);scene.add(patch);}

// Color studies change material and light colors only; the camera, geometry,
// exposure, light intensities and interaction state remain identical.
const paletteMaterials = new Map();
scene.traverse(object => {
  if (!object.isMesh) return;
  for (const material of (Array.isArray(object.material) ? object.material : [object.material])) {
    if (material.color && !paletteMaterials.has(material)) paletteMaterials.set(material, '#' + material.color.getHexString());
  }
});
const palettes = {
 A: { note:'米白 · 浅木 · 金色晨光', background:'#e1e4d6', sky:'#fff6dd', ground:'#a5b39c', sun:'#fff0c9', lamp:'#ffdb99', mirror:'#b9c9bc', colors:{
  '#ece5d3':'#eee9dc', '#faf2df':'#faf7ed', '#cbd8c8':'#c8d5bf', '#d4ac7c':'#cda476', '#e6bd7c':'#e2b976', '#d6cfb9':'#d0c7b3', '#e3dcc8':'#e2dac8'
 }},
 B: { note:'自然白 · 灰蓝 · 浅木，保留一束暖阳', background:'#dde7e7', sky:'#eef7ff', ground:'#9eafb1', sun:'#fff2d7', lamp:'#ffe5b4', mirror:'#c5d5d9', colors:{
  '#ece5d3':'#e9efeb', '#faf2df':'#f5faf8', '#becbbc':'#a8bec2', '#cbd8c8':'#a6c3ce',
  '#b98c61':'#b6a087', '#8d6547':'#86745f', '#d4ac7c':'#c8b395', '#bbaa7b':'#b8b5a2',
  '#d8ceb8':'#d4dcd7', '#d6cfb9':'#c9d5d3', '#e3dcc8':'#e1e8e2', '#f2f0cd':'#e9f5f4',
  '#fff2c2':'#fff5df', '#c2986c':'#b09c7f', '#789b8c':'#719cac', '#cf9476':'#d39a7f',
  '#b58768':'#a7b7b3', '#d8ac73':'#a6bac0', '#e5c496':'#cddce0', '#b99172':'#bba890',
  '#a2ad89':'#9fb4b6', '#b6bd9b':'#c0cfd0', '#959f7d':'#8da6aa', '#e6bd7c':'#83afbf',
  '#f2d4a0':'#c4dfe5', '#ad9470':'#b6a486', '#789687':'#7f9ba6', '#fff0b8':'#fff2ce'
 }}
};
let cupStyle = new URLSearchParams(location.search).get('cup') === 'cool' ? 'cool' : 'warm';
function setCupStyle(value) {
  cupStyle=value==='cool'?'cool':'warm';
  mugmat.color.set(cupStyle==='warm'?'#c98970':'#83afbf');
  inner.color.set(cupStyle==='warm'?'#f2d7c1':'#c4dfe5');
  document.querySelectorAll('.cup-picker button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.cup===cupStyle)));
  const url=new URL(location.href);url.searchParams.set('cup',cupStyle);history.replaceState(null,'',url);
}
document.querySelectorAll('.cup-picker button').forEach(button=>button.onclick=()=>setCupStyle(button.dataset.cup));
function setPalette(key) {
  const p=palettes[key] || palettes.A;
  const selected=palettes[key]?key:'A';
  for (const [material,original] of paletteMaterials) material.color.set(p.colors[original] || original);
  scene.background.set(p.background);hemisphere.color.set(p.sky);hemisphere.groundColor.set(p.ground);
  sun.color.set(p.sun);fill.color.set(p.lamp);mirror.material.uniforms.color.value.set(p.mirror);
  document.body.dataset.palette=selected;
  document.querySelectorAll('[data-palette]').forEach(button=>{if(button.tagName==='BUTTON')button.setAttribute('aria-pressed',String(button.dataset.palette===selected));});
  $('#palette-note').textContent=p.note;
  const url=new URL(location.href);url.searchParams.set('palette',selected);history.replaceState(null,'',url);
  setCupStyle(cupStyle);
}
document.querySelectorAll('.palette-buttons button').forEach(button=>button.onclick=()=>setPalette(button.dataset.palette));
setPalette(new URLSearchParams(location.search).get('palette') || 'B');

let state='far',transition=null,sound=false,audio;
const clock=new THREE.Clock();
const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();
// Larger invisible target prevents small geometry from becoming a dexterity test.
const target=mesh(new THREE.SphereGeometry(.23,16,12),new THREE.MeshBasicMaterial({visible:false}));target.position.copy(cupHome).add(new THREE.Vector3(0,.1,0));
const states={far:['去盥洗台看看','晨光落在水杯上。点击按钮，走近一点。','走近盥洗台'],approaching:['慢慢走近…','脚步轻一点，清晨还很安静。','正在走近…'],near:['摸摸这只温暖的水杯','点击台面上的水杯，或按下「拿起水杯」。','拿起水杯'],picking:['轻轻拿起…','指尖碰到杯柄，水杯离开台面。','正在拿起…'],held:['拿在手里，看一看','空杯在手中轻轻倾斜。准备好后，把它放回杯垫。','放下水杯'],placing:['稳稳放回去…','让杯底轻轻落在杯垫上。','正在放下…'],done:['镜子下方，亮起了一束微光','水杯放好了。按下发光按钮，看看镜中的自己想做什么。','按下镜子按钮']};
function sync(){if(state==='memory')return;document.body.dataset.playing='false';$('#memory-steps').hidden=true;$('#leave-memory').hidden=true;$('#assist').hidden=true;document.querySelectorAll('.progress span').forEach((s,i)=>s.textContent=['01 走近','02 拿起','03 放下'][i]);const [title,message,action]=states[state];$('#title').textContent=title;$('#message').textContent=message;$('#action').textContent=action;$('#action').disabled=!!transition;$('#hotspot').hidden=!!transition;$('#hotspot-label').textContent=state==='far'?'走近盥洗台':state==='held'?'放回杯垫':state==='done'?'✦ 镜中的小秘密':'拿起水杯';document.querySelectorAll('.progress span').forEach((s,i)=>{const step=state==='far'||state==='approaching'?0:state==='near'||state==='picking'?1:2;s.className=state==='done'||i<step?'done':i===step?'active':'';});$('.chapter').style.opacity=state==='far'||state==='approaching'?'1':'0';}
function chime(kind){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=({place:720,step:150,brush:620,cup:820,soap:370,towel:490,wrong:310,win:980})[kind]||530;g.gain.setValueAtTime(kind==='step'?.025:.06,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.22);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.23);}catch{}}
function begin(next,duration){state=next;transition={elapsed:0,duration:reduced?.15:duration,fromPos:camera.position.clone(),fromLook:look.clone(),fromCup:cup.position.clone(),fromQ:cup.quaternion.clone(),lastStep:-1};sync();}
function act(){if(state==='memory'){memory.action();return;}if(transition)return;if(state==='far')begin('approaching',2.3);else if(state==='done'){state='memory';hand.visible=false;memory.start();}else if(state==='near'){chime('pick');begin('picking',1.25);}else if(state==='held')begin('placing',1.25);}
function reset(){memory.reset();transition=null;state='far';camera.position.copy(farPos);look.copy(farLook);camera.lookAt(look);cup.position.copy(cupHome);cup.quaternion.copy(cupHomeQ);hand.visible=false;sync();}
$('#action').onclick=act;$('#hotspot').onclick=act;$('#reset').onclick=reset;
$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent=`声音 · ${sound?'开':'关'}`;$('#sound').setAttribute('aria-pressed',String(sound));if(sound)chime('pick');};
function hit(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObject(target).length>0;}
let pointerDown;
renderer.domElement.addEventListener('pointerdown',e=>pointerDown={x:e.clientX,y:e.clientY});
renderer.domElement.addEventListener('pointerup',e=>{if(state==='memory'){if(pointerDown&&Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)<=12)memory.pick(e);pointerDown=null;return;}if(!pointerDown||Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>12)return;pointerDown=null;if(!transition&&(state==='far'||state==='held'||(state==='done'?memory.hitTrigger(e):hit(e))))act();});
renderer.domElement.addEventListener('pointermove',e=>renderer.domElement.style.cursor=!transition&&(state==='far'||state==='held'||(state==='done'?memory.hitTrigger(e):hit(e)))?'pointer':'default');
function heldPose(time){const p=new THREE.Vector3(innerWidth<700?-.035:.25,innerWidth<700?-.12:-.23,innerWidth<700?-1.15:-1.0);if(!reduced){p.y+=Math.sin(time*1.4)*.003;p.x+=Math.sin(time*.8)*.003;}camera.localToWorld(p);const q=camera.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.22,-.4,-.10)));return {p,q};}
const memory=createMirrorChallenge({THREE,scene,camera,renderer,mirror,objects:{brush,cup,soap,towel},skin,sleeve,
  playTone:chime,onLeave:()=>{state='done';look.copy(nearLook);camera.position.copy(nearPos);camera.lookAt(look);sync();}});
const ease=t=>t*t*(3-2*t);
function tick(){const dt=Math.min(clock.getDelta(),.06),time=clock.elapsedTime;if(state==='memory'){memory.update(dt,time);renderer.render(scene,camera);requestAnimationFrame(tick);return;}memory.updateIdle(time,state==='done');if(transition){const tr=transition;tr.elapsed+=dt;const raw=Math.min(1,tr.elapsed/tr.duration),t=ease(raw);if(state==='approaching'){camera.position.lerpVectors(tr.fromPos,nearPos,t);if(!reduced)camera.position.y+=Math.sin(raw*Math.PI*8)*.016*Math.sin(raw*Math.PI);look.lerpVectors(tr.fromLook,nearLook,t);camera.lookAt(look);const step=Math.floor(raw*4);if(step!==tr.lastStep&&raw<.95){chime('step');tr.lastStep=step;}}else{const pose=heldPose(time);cup.position.lerpVectors(tr.fromCup,state==='picking'?pose.p:cupHome,t);cup.quaternion.slerpQuaternions(tr.fromQ,state==='picking'?pose.q:cupHomeQ,t);hand.visible=state==='picking'?raw>.22:raw<.72;}
if(raw===1){const old=state;transition=null;state=old==='approaching'?'near':old==='picking'?'held':'done';if(old==='placing')chime('place');sync();}}
if(state==='held'){const pose=heldPose(time);cup.position.copy(pose.p);cup.quaternion.copy(pose.q);hand.visible=true;}
if(hand.visible){hand.position.copy(cup.position);hand.quaternion.copy(cup.quaternion);}
const anchor=(state==='done'?new THREE.Vector3(-.42,1.53,-1.42):(state==='held'?cup.position.clone():cupHome.clone()).add(new THREE.Vector3(0,state==='held'?.30:.42,0)));anchor.project(camera);$('#hotspot').style.left=`${Math.max(85,Math.min(innerWidth-85,(anchor.x*.5+.5)*innerWidth))}px`;$('#hotspot').style.top=`${Math.max(110,Math.min(innerHeight-285,(-anchor.y*.5+.5)*innerHeight))}px`;
renderer.render(scene,camera);requestAnimationFrame(tick);}
function resize(){camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<700?53:44;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);resize();sync();renderer.render(scene,camera);$('#loading').hidden=true;tick();
