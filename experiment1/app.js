"use strict";
const canvas=document.querySelector('#canvas'),mode=document.querySelector('#mode'),status=document.querySelector('#status');
let renderer;
try {renderer=createRenderer(canvas,false);} catch(e) {status.textContent=e.message;status.className='error';throw e;}
const parts=createAnimal(false),keys=new Set();
const state={x:0,y:0,jump:0,velocity:0,selected:null};
let drag=null,last=0;
function reset() {
  Object.assign(state,{x:0,y:0,jump:0,velocity:0,selected:null});
  for(const p of parts)p.offset=[0,0,0];keys.clear();drag=null;mode.value='whole';
  status.textContent='整体拖动模式';
}
function jump() {if(state.jump===0&&state.velocity===0)state.velocity=3.8;canvas.focus();}
function hit(point) {
  for(let i=parts.length-1;i>=0;i--) {
    const p=parts[i],x=point[0]-state.x-p.p[0]-p.offset[0],y=point[1]-state.y-state.jump-p.p[1]-p.offset[1];
    if((x/p.s[0])**2+(y/p.s[1])**2<=1)return p;
  }return null;
}
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||drag)return;canvas.focus();const point=renderer.pointer(e),p=hit(point);
  state.selected=p;
  if(!p){status.textContent='未选中企鹅';return;}
  drag={id:e.pointerId,p:mode.value==='part'?p:null,start:point,origin:mode.value==='part'?[...p.offset]:[state.x,state.y]};
  canvas.setPointerCapture(e.pointerId);status.textContent=mode.value==='part'?'已选中：'+p.name:'已选中：企鹅整体';
});
canvas.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;const p=renderer.pointer(e);
  const dx=p[0]-drag.start[0],dy=p[1]-drag.start[1];
  if(drag.p)drag.p.offset=[drag.origin[0]+dx,drag.origin[1]+dy,0];
  else {state.x=drag.origin[0]+dx;state.y=drag.origin[1]+dy;}
});
function endDrag(){const d=drag;drag=null;if(d&&canvas.hasPointerCapture(d.id))canvas.releasePointerCapture(d.id);}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,endDrag);
canvas.addEventListener('keydown',e=>{
  if(['KeyA','KeyD','ArrowLeft','ArrowRight','Space'].includes(e.code)) {e.preventDefault();keys.add(e.code);if(e.code==='Space'&&!e.repeat)jump();}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('blur',()=>keys.clear());window.addEventListener('blur',()=>{keys.clear();endDrag();});
mode.addEventListener('change',()=>{endDrag();status.textContent=mode.value==='part'?'部件拖动模式':'整体拖动模式';canvas.focus();});
document.querySelector('#jump').onclick=jump;document.querySelector('#reset').onclick=()=>{endDrag();reset();canvas.focus();};
function frame(t){
  const dt=Math.min((t-last)/1000||0,0.04);last=t;
  if(!drag)state.x+=((keys.has('KeyD')||keys.has('ArrowRight'))-(keys.has('KeyA')||keys.has('ArrowLeft')))*1.5*dt;
  if(state.velocity!==0||state.jump>0){state.velocity-=8*dt;state.jump+=state.velocity*dt;if(state.jump<=0){state.jump=0;state.velocity=0;}}
  renderer.begin();
  const margin=1.15;state.x=Math.max(-2.9*renderer.aspect+margin,Math.min(2.9*renderer.aspect-margin,state.x));
  state.y=Math.max(-1.4,Math.min(0.4,state.y));
  const root=M.translate(state.x,state.y+state.jump,0);
  for(const p of parts)renderer.draw(partMatrix(root,p,false),p.color);
  requestAnimationFrame(frame);
}
reset();requestAnimationFrame(frame);
