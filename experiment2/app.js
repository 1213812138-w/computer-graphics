"use strict";
const canvas=document.querySelector('#canvas'),mode=document.querySelector('#mode'),axis=document.querySelector('#axis'),status=document.querySelector('#status');
let renderer;
try {renderer=createRenderer(canvas,true);} catch(e){status.textContent=e.message;status.className='error';throw e;}
const parts=createAnimal(true),keys=new Set();
const state={position:[0,0,0],rotation:M.identity(),jump:0,velocity:0};
let drag=null,last=0;
function reset(){
  Object.assign(state,{position:[0,0,0],rotation:M.mul(M.rotate([0,1,0],-0.35),M.rotate([1,0,0],0.08)),jump:0,velocity:0});
  for(const p of parts)p.offset=[0,0,0];keys.clear();drag=null;mode.value='ball';axis.value='x';
}
// 后乘：本地轴变换；前乘：固定屏幕轴变换。平移单独保存，屏幕旋转绕物体中心。
function localRotate(a,angle){state.rotation=M.mul(state.rotation,M.rotate(a,angle));}
function screenRotate(a,angle){state.rotation=M.mul(M.rotate(a,angle),state.rotation);}
function forward(distance){
  const d=M.point(state.rotation,[0,0,distance],0);
  state.position=state.position.map((v,i)=>v+d[i]);
}
function rootMatrix(){return M.mul(M.translate(state.position[0],state.position[1]+state.jump,state.position[2]),state.rotation);}
function jump(){if(state.jump===0&&state.velocity===0)state.velocity=3.8;canvas.focus();}
// 正交投影：将屏幕射线逆旋转到各椭球局部坐标，解二次方程；取最近交点。
function pick(point){
  let nearest=Infinity,result=null;
  const R=state.rotation;
  const inverseVector=v=>[0,1,2].map(j=>R[j*4]*v[0]+R[j*4+1]*v[1]+R[j*4+2]*v[2]);
  const origin=inverseVector([point[0]-state.position[0],point[1]-state.position[1]-state.jump,29-state.position[2]]);
  const direction=inverseVector([0,0,-1]);
  for(const p of parts){
    const o=origin.map((v,i)=>(v-p.p[i]-p.offset[i])/p.s[i]),d=direction.map((v,i)=>v/p.s[i]);
    const a=dot(d,d),b=2*dot(o,d),c=dot(o,o)-1,disc=b*b-4*a*c;
    if(disc<0)continue;const t=(-b-Math.sqrt(disc))/(2*a);
    if(t>=0&&t<nearest){nearest=t;result=p;}
  }return result;
}
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||drag)return;canvas.focus();
  const point=renderer.pointer(e),p=mode.value==='ball'?null:pick(point);
  if(mode.value!=='ball'&&!p){status.textContent='请点击企鹅后拖动';return;}
  drag={id:e.pointerId,kind:mode.value,start:point,ball:trackball(e.clientX,e.clientY,canvas.getBoundingClientRect()),rotation:[...state.rotation],
    origin:[...state.position],part:p,offset:p?[...p.offset]:null};
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(drag.kind==='ball'){
    const b=trackball(e.clientX,e.clientY,canvas.getBoundingClientRect());
    state.rotation=M.mul(ballRotation(drag.ball,b),drag.rotation);
  }else{
    const point=renderer.pointer(e),d=[point[0]-drag.start[0],point[1]-drag.start[1],0];
    if(drag.kind==='whole')state.position=drag.origin.map((v,i)=>v+d[i]);
    else{
      // 屏幕平面位移经 R 的转置换算为本地位移，部件仍随身体变换。
      const R=state.rotation;
      drag.part.offset=drag.offset.map((v,i)=>v+R[i*4]*d[0]+R[i*4+1]*d[1]+R[i*4+2]*d[2]);
    }
  }
});
function endDrag(){const d=drag;drag=null;if(d&&canvas.hasPointerCapture(d.id))canvas.releasePointerCapture(d.id);}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,endDrag);
const accepted=['KeyW','KeyS','KeyA','KeyD','KeyI','KeyK','KeyJ','KeyL','KeyU','KeyO','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'];
canvas.addEventListener('keydown',e=>{if(accepted.includes(e.code)){e.preventDefault();keys.add(e.code);if(e.code==='Space'&&!e.repeat)jump();}});
window.addEventListener('keyup',e=>keys.delete(e.code));canvas.addEventListener('blur',()=>keys.clear());
window.addEventListener('blur',()=>{keys.clear();endDrag();});
for(const menu of [mode,axis])menu.onchange=()=>{endDrag();canvas.focus();};
document.querySelector('#jump').onclick=jump;document.querySelector('#reset').onclick=()=>{endDrag();reset();canvas.focus();};
const pair=(a,b)=>Number(keys.has(a))-Number(keys.has(b));
function frame(t){
  const dt=Math.min((t-last)/1000||0,0.04);last=t;
  if(!drag){
    localRotate([0,1,0],pair('KeyA','KeyD')*dt*1.5);
    localRotate([1,0,0],pair('KeyI','KeyK')*dt*1.5);
    localRotate([0,0,1],pair('KeyJ','KeyL')*dt*1.5);
    const a={x:[1,0,0],y:[0,1,0],z:[0,0,1]}[axis.value];
    screenRotate(a,pair('KeyU','KeyO')*dt*1.5);
    forward(pair('KeyW','KeyS')*dt*1.6);
    state.position[0]+=pair('ArrowRight','ArrowLeft')*dt*1.6;
    state.position[1]+=pair('ArrowUp','ArrowDown')*dt*1.6;
  }
  if(state.velocity!==0||state.jump>0){state.velocity-=8*dt;state.jump+=state.velocity*dt;if(state.jump<=0){state.jump=0;state.velocity=0;}}
  renderer.begin();
  state.position[0]=Math.max(-2.9*renderer.aspect+1.6,Math.min(2.9*renderer.aspect-1.6,state.position[0]));
  state.position[1]=Math.max(-1.3,Math.min(1.1,state.position[1]));
  state.position[2]=Math.max(-12,Math.min(12,state.position[2]));
  const root=rootMatrix();for(const p of parts)renderer.draw(partMatrix(root,p,true),p.color);
  const f=M.point(state.rotation,[0,0,1],0);
  status.textContent=`位置 (${state.position.map(v=>v.toFixed(2)).join(', ')}) ｜ 头部朝向 (${f.map(v=>v.toFixed(2)).join(', ')})`;
  requestAnimationFrame(frame);
}
reset();requestAnimationFrame(frame);
