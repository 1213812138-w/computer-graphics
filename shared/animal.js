"use strict";
// 两个实验复用同一套简化造型。正面/嘴朝本地 +Z，上方为 +Y。
function createAnimal(is3D) {
  const dark=[0.10,0.16,0.21],white=[0.96,0.97,0.94],orange=[1,0.64,0.16];
  const parts=[];
  function part(id,name,p,s,color) {parts.push({id,name,p,s,color,offset:[0,0,0]});}
  part('leftWing','左翅膀',[-0.88,-0.12,0],[0.25,0.72,0.29],dark);
  part('rightWing','右翅膀',[0.88,-0.12,0],[0.25,0.72,0.29],dark);
  part('leftFoot','左脚',[-0.38,-1.26,0.22],[0.36,0.16,0.50],orange);
  part('rightFoot','右脚',[0.38,-1.26,0.22],[0.36,0.16,0.50],orange);
  part('body','身体',[0,-0.18,0],[0.82,1.10,0.64],dark);
  part('belly','肚皮',[0,-0.36,0.53],[0.60,0.78,0.18],white);
  part('head','头部',[0,0.92,0],[0.65,0.65,0.59],dark);
  part('leftFace','左脸',[-0.25,0.91,0.48],[0.28,0.38,0.16],white);
  part('rightFace','右脸',[0.25,0.91,0.48],[0.28,0.38,0.16],white);
  part('leftEye','左眼',[-0.25,1.02,0.63],[0.075,0.10,0.065],dark);
  part('rightEye','右眼',[0.25,1.02,0.63],[0.075,0.10,0.065],dark);
  part('beak','嘴巴',[0,0.70,0.70],[0.23,0.14,0.34],orange);
  return parts;
}
function partMatrix(root,part,is3D) {
  const p=part.p.map((x,i)=>x+part.offset[i]);
  return M.mul(M.mul(root,M.translate(p[0],p[1],is3D?p[2]:0)),M.scale(part.s[0],part.s[1],is3D?part.s[2]:1));
}
