import { MemoryGame } from './memory-logic.js';

export function createMirrorChallenge({THREE,scene,camera,renderer,mirror,objects,skin,sleeve,playTone,onLeave}) {
  const $=selector=>document.querySelector(selector);
  const game=new MemoryGame();
  const names={brush:'牙刷',cup:'水杯',soap:'洗手液',towel:'毛巾'};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let active=false,token=0,phase='idle',demonstrating=null,feedback=null,poseTime=0;
  const homes=Object.fromEntries(Object.entries(objects).map(([key,obj])=>[key,{p:obj.position.clone(),q:obj.quaternion.clone()}]));
  let entrance;
  const standard=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
  function add(parent,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
  function sphere(parent,x,y,z,sx,sy,sz,material){const o=add(parent,new THREE.SphereGeometry(1,24,16),material,x,y,z);o.scale.set(sx,sy,sz);return o;}
  // The button belongs to the physical mirror, even outside the challenge.
  const triggerMaterial=new THREE.MeshStandardMaterial({color:'#c9ad7a',emissive:'#e9ba65',emissiveIntensity:0});
  const trigger=add(scene,new THREE.CylinderGeometry(.048,.048,.025,32),triggerMaterial,-.42,1.39,-1.43);trigger.rotation.x=Math.PI/2;
  add(scene,new THREE.BoxGeometry(.25,.085,.035),standard('#d9ddd0'),-.42,1.39,-1.47);
  const roundLamps=[];
  for(let i=0;i<3;i++){const m=standard('#abbcc0');roundLamps.push(add(scene,new THREE.SphereGeometry(.013,12,8),m,-.49+i*.07,1.34,-1.435));}
  // A separate 3D mirror world lets the reflection act independently.
  const reflection=new THREE.Scene();reflection.background=new THREE.Color('#cbdde0');
  reflection.add(new THREE.HemisphereLight('#f7f5e9','#9aafb0',2.8));
  const mirrorLight=new THREE.DirectionalLight('#fff0db',2.4);mirrorLight.position.set(-2,3,4);reflection.add(mirrorLight);
  const reflectionCamera=new THREE.OrthographicCamera(-.825,.825,.75,-.75,.1,12);reflectionCamera.position.set(0,0,5);reflectionCamera.lookAt(0,0,0);
  const target=new THREE.WebGLRenderTarget(768,698);target.texture.colorSpace=THREE.SRGBColorSpace;
  const screenGeo=mirror.geometry.clone(),uv=screenGeo.attributes.uv,positions=screenGeo.attributes.position;
  for(let i=0;i<uv.count;i++)uv.setXY(i,(positions.getX(i)+.825)/1.65,(positions.getY(i)+.75)/1.5);
  const screen=add(scene,screenGeo,new THREE.MeshBasicMaterial({map:target.texture,toneMapped:false}));screen.position.copy(mirror.position);screen.position.z+=.006;screen.visible=false;
  add(reflection,new THREE.PlaneGeometry(2,.47),standard('#b5cdd4'),0,-.53,-.65);
  for(let i=0;i<5;i++)add(reflection,new THREE.BoxGeometry(.005,.47,.005),standard('#dbe7e8'),-.8+i*.4,-.53,-.63);
  // Friendly stylized elder. Body, face and arms are true 3D geometry.
  const person=new THREE.Group();reflection.add(person);
  const face=standard('#e6bd9e'),hair=standard('#e5e6df'),dark=standard('#45534c'),blush=standard('#d99d86');
  const shirt=sleeve;
  sphere(person,0,-.27,-.10,.32,.35,.15,shirt);
  add(person,new THREE.CylinderGeometry(.065,.075,.15,24),face,0,.006,0);
  const head=new THREE.Group();person.add(head);head.position.set(0,.30,0);
  sphere(head,0,0,0,.19,.23,.145,face);
  sphere(head,-.192,-.01,0,.029,.048,.022,face);sphere(head,.192,-.01,0,.029,.048,.022,face);
  sphere(head,0,.16,-.018,.194,.11,.15,hair);
  for(let i=0;i<5;i++)sphere(head,-.13+i*.065,.18+Math.sin(i)*.018,.06,.067,.063,.072,hair);
  const eyes=[];
  for(const x of [-.072,.072]){eyes.push(sphere(head,x,.01,.133,.012,.017,.007,dark));const brow=add(head,new THREE.CapsuleGeometry(.006,.045,4,8),hair,x,.052,.128);brow.rotation.z=Math.PI/2;}
  sphere(head,0,-.035,.152,.022,.039,.023,face);
  sphere(head,-.12,-.05,.108,.03,.016,.005,blush);sphere(head,.12,-.05,.108,.03,.016,.005,blush);
  const mouth=add(head,new THREE.TorusGeometry(.043,.004,8,24,Math.PI),standard('#a5725f'),0,-.09,.128);mouth.rotation.z=Math.PI;
  const collar=standard('#dbe5df');
  for(const side of [-1,1]){const lapel=add(person,new THREE.BoxGeometry(.10,.017,.02),collar,side*.042,-.07,.04);lapel.rotation.z=side*.55;}
  for(let i=0;i<3;i++)sphere(person,.014,-.16-i*.08,.046,.009,.009,.008,collar);
  function arm(side){const group=new THREE.Group();group.position.set(side*.25,-.12,0);person.add(group);const upper=add(group,new THREE.CapsuleGeometry(.045,.16,4,12),shirt,0,-.10,0);const palm=sphere(group,0,-.23,.035,.045,.058,.028,face);return group;}
  const leftArm=arm(-1),rightArm=arm(1);
  // Mirrored props preserve the same silhouettes and shared palette materials.
  const mirrorProps={},propBases={};
  const order=['towel','soap','cup','brush'];
  scene.updateMatrixWorld(true);
  order.forEach((key,i)=>{
    const clone=objects[key].clone(true);clone.position.set(0,0,0);clone.quaternion.identity();clone.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(clone),center=bounds.getCenter(new THREE.Vector3());clone.position.sub(center);
    const holder=new THREE.Group();holder.add(clone);holder.scale.setScalar(key==='towel'?.35:key==='brush'?.72:.75);holder.position.set(-.57+i*.38,-.56,.34);reflection.add(holder);mirrorProps[key]=holder;propBases[key]=holder.position.clone();
  });
  // A small message physically rendered inside the mirror.
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
  const context=canvas.getContext('2d');const captionTexture=new THREE.CanvasTexture(canvas);captionTexture.colorSpace=THREE.SRGBColorSpace;
  add(reflection,new THREE.PlaneGeometry(1.39,.174),new THREE.MeshBasicMaterial({map:captionTexture,transparent:true,toneMapped:false}),0,.625,.5);
  function caption(text){context.clearRect(0,0,1024,128);context.fillStyle='#f6faf3';context.beginPath();context.roundRect(0,7,1024,110,48);context.fill();context.fillStyle='#486875';context.font='500 43px "PingFang SC", sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillText(text,512,65);captionTexture.needsUpdate=true;}
  const ring=add(scene,new THREE.TorusGeometry(.16,.012,12,48),new THREE.MeshBasicMaterial({color:'#ffdfac',transparent:true,opacity:.9,depthTest:false}));ring.visible=false;ring.renderOrder=10;
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const hitTargets={};
  Object.entries(objects).forEach(([key,obj])=>{
    const center=key==='cup'?homes[key].p.clone().add(new THREE.Vector3(0,.1,0)):key==='brush'?homes[key].p.clone():key==='soap'?homes[key].p.clone():homes[key].p.clone();
    const m=add(scene,new THREE.SphereGeometry(key==='towel'?.31:.20,12,8),new THREE.MeshBasicMaterial({visible:false}),center.x,center.y,center.z);hitTargets[key]=m;
    const button=document.createElement('button');button.className='item-label';button.dataset.item=key;button.textContent=names[key];button.hidden=true;button.onclick=()=>choose(key);$('#object-labels').append(button);
  });
  const buttons=[...document.querySelectorAll('.item-label')];
  function restoreObjects(){for(const [key,obj] of Object.entries(objects)){obj.position.copy(homes[key].p);obj.quaternion.copy(homes[key].q);}ring.visible=false;feedback=null;}
  function clearMirror(){demonstrating=null;for(const key of order){mirrorProps[key].position.copy(propBases[key]);mirrorProps[key].rotation.z=0;}leftArm.rotation.z=0;rightArm.rotation.z=0;}
  function ui(title,message){$('#title').textContent=title;$('#message').textContent=message;}
  function renderUI(){
    if(!active)return;
    document.body.dataset.playing='true';$('.chapter').style.opacity='0';$('.palette-picker').open=false;$('#hotspot').hidden=true;
    document.querySelectorAll('.progress span').forEach((span,i)=>{span.textContent=['01 初见','02 记忆','03 默契'][i];span.className=game.state==='complete'||i<game.round?'done':i===game.round?'active':'';});
    $('#memory-steps').hidden=false;$('#memory-steps').replaceChildren(...game.sequence.map((_,i)=>{const dot=document.createElement('span');dot.className=i<game.index?'filled':'';dot.setAttribute('aria-label',`第${i+1}步${i<game.index?'已完成':'未完成'}`);return dot;}));
    const canInput=phase==='input'&&game.state==='input';buttons.forEach(b=>{b.hidden=!canInput;b.disabled=!canInput;});
    $('#action').disabled=!['input','retry','complete'].includes(phase);
    $('#action').textContent=phase==='complete'?'再玩一次':phase==='enter'?'正在靠近镜子…':phase==='watch'?'先看镜中演示…':phase==='feedback'?'记住了…':'↻ 再看一次';
    $('#assist').hidden=game.failures<3||game.assisted||!['input','retry'].includes(phase);
    $('#leave-memory').hidden=false;
    roundLamps.forEach((lamp,i)=>lamp.material.color.set(game.state==='complete'||i<game.round?'#e1af74':i===game.round?'#f7e4b5':'#a4bbc0'));
  }
  function promptInput(){phase='input';game.ready();caption('轮到你了');ui(`第 ${game.round+1} 轮 · 轮到你了`,game.assisted?`请点击${names[game.sequence[game.index]]}，我们一步一步来。`:'按刚才的顺序点击实物或名称。没有倒计时，想不起来可以再看一次。');renderUI();}
  async function showItem(key,id){
    clearMirror();demonstrating=key;poseTime=0;caption(names[key]);playTone(key);
    await wait(game.failures>=2?1550:1150);
    if(id!==token)return false;clearMirror();await wait(350);return id===token;
  }
  async function demonstrate(assisted=game.assisted){
    const id=++token;restoreObjects();clearMirror();game.assisted=assisted;game.start();phase='watch';caption('看仔细，记住我的顺序');ui(`第 ${game.round+1} 轮 · 看镜子`,assisted?'这次我们一起做。镜中人演示一步，你跟着做一步。':'这是新的顺序。先观察镜中人的动作，演示结束后再点击实物。');renderUI();
    await wait(850);if(id!==token)return;
    if(assisted){await guided(id);return;}
    for(const key of game.sequence)if(!await showItem(key,id))return;
    promptInput();
  }
  async function guided(id){phase='watch';game.state='watch';renderUI();if(!await showItem(game.sequence[game.index],id))return;promptInput();}
  async function choose(key){
    if(!active||phase!=='input')return;
    const result=game.choose(key);if(result==='ignored')return;
    const id=token;phase='feedback';feedback={key,started:performance.now()};playTone(result==='wrong'?'wrong':key);
    if(result==='wrong'){
      phase='retry';caption('没关系，再看一次？');ui('再看一次，慢慢来','已完成的轮次会保留。点击「再看一次」，从本轮第一步重新试试。');renderUI();await wait(450);if(id===token)restoreObjects();return;
    }
    renderUI();await wait(440);if(id!==token)return;restoreObjects();
    if(result==='round'){
      phase='between';caption('做得好，真默契');ui('记住了，真默契。',game.round<2?'镜中的朋友正在准备下一组新的顺序。':'三轮都完成了，今天有了一个很好的开始。');renderUI();await wait(1000);if(id!==token)return;
      if(game.next()){demonstrate(false);return;}
      phase='complete';caption('早安，准备出发');ui('早安，准备出发。','三轮记忆挑战完成了。可以再玩一次，也可以返回洗手间继续探索。');clearMirror();renderUI();playTone('win');
    }else if(game.assisted){await guided(id);}else promptInput();
  }
  function start(){
    token++;restoreObjects();clearMirror();game.reset();active=true;phase='enter';screen.visible=true;mirror.visible=false;
    entrance={elapsed:0,from:camera.position.clone(),q:camera.quaternion.clone()};
    caption('早安，来玩一个小游戏');ui('镜中的你，先抬起了手','靠近一点，镜中的朋友想和你玩一个记忆小游戏。');renderUI();
  }
  function reset(){token++;active=false;phase='idle';entrance=null;restoreObjects();clearMirror();game.reset();screen.visible=false;mirror.visible=true;buttons.forEach(b=>b.hidden=true);$('#memory-steps').hidden=true;$('#assist').hidden=true;$('#leave-memory').hidden=true;document.body.dataset.playing='false';roundLamps.forEach(l=>l.material.color.set('#abbcc0'));}
  function leave(){reset();onLeave();}
  $('#leave-memory').onclick=leave;$('#assist').onclick=()=>demonstrate(true);
  function action(){if(phase==='complete'){game.reset();demonstrate(false);}else if(['input','retry'].includes(phase))demonstrate(game.assisted);}
  function updateIdle(time,available){triggerMaterial.emissiveIntensity=available?(reduced?.5:.55+.35*Math.sin(time*2.4)):0;}
  function update(dt,time){
    if(!active)return;
    triggerMaterial.emissiveIntensity=.3;
    if(entrance){entrance.elapsed+=dt;const t=Math.min(1,entrance.elapsed/(reduced?.15:1.35)),smooth=t*t*(3-2*t);const dest=new THREE.Vector3(.15,2.30,innerWidth<700?5.5:3.45);const destLook=new THREE.Vector3(.10,1.91,-1.35);const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(dest,destLook,new THREE.Vector3(0,1,0)));camera.position.lerpVectors(entrance.from,dest,smooth);camera.quaternion.slerpQuaternions(entrance.q,q,smooth);if(t===1){entrance=null;demonstrate(false);}}
    poseTime+=dt;
    const blink=Math.sin(time*1.1)> .995?.08:1;eyes.forEach(eye=>eye.scale.y=.017*blink);
    head.rotation.z=phase==='retry'?Math.sin(time*5)*.055:0;
    person.position.y=reduced?0:Math.sin(time*1.6)*.004;
    if(demonstrating){const key=demonstrating,progress=Math.min(1,poseTime/.35);const dest=new THREE.Vector3(.34,-.08,.47);mirrorProps[key].position.lerpVectors(propBases[key],dest,progress);rightArm.rotation.z=.9*progress;leftArm.rotation.z=-.25*progress;mirrorProps[key].rotation.z=reduced?0:Math.sin(poseTime*3)*.045;}
    if(phase==='complete'){rightArm.rotation.z=2.2+(reduced?0:Math.sin(time*3)*.12);}
    if(feedback){const {key,started}=feedback;const amount=Math.sin(Math.min(1,(performance.now()-started)/440)*Math.PI);objects[key].position.copy(homes[key].p);objects[key].position.y+=amount*.065;ring.visible=true;ring.position.copy(hitTargets[key].position);ring.position.z+=.11;ring.scale.setScalar(1+amount*.12);ring.material.color.set(phase==='retry'?'#c5d5e0':'#ffdaa0');}
    for(const button of buttons){if(button.hidden)continue;const key=button.dataset.item;const pos=hitTargets[key].position.clone();pos.y+=key==='towel'?.43:key==='brush'?.28:.25;pos.project(camera);button.style.left=`${Math.max(42,Math.min(innerWidth-42,(pos.x*.5+.5)*innerWidth))}px`;button.style.top=`${Math.max(170,Math.min(innerHeight-280,(-pos.y*.5+.5)*innerHeight))}px`;}
    const previous=renderer.getRenderTarget();renderer.setRenderTarget(target);renderer.render(reflection,reflectionCamera);renderer.setRenderTarget(previous);
  }
  function pick(event){
    if(phase!=='input')return;
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(Object.values(hitTargets));if(hits.length){const key=Object.keys(hitTargets).find(key=>hitTargets[key]===hits[0].object);choose(key);}
  }
  function hitTrigger(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.ray.distanceToPoint(trigger.position)<.14;}
  return {start,reset,action,update,updateIdle,pick,hitTrigger};
}
