"use strict";
// 列主序矩阵，列向量：mul(A,B) 表示先做 B，再做 A。
const M = {
  identity: () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
  mul(a,b) {
    const c=Array(16).fill(0);
    for(let j=0;j<4;j++) for(let i=0;i<4;i++)
      for(let k=0;k<4;k++) c[j*4+i]+=a[k*4+i]*b[j*4+k];
    return c;
  },
  translate(x,y,z=0) {const m=this.identity(); m[12]=x;m[13]=y;m[14]=z;return m;},
  scale(x,y,z=1) {return [x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1];},
  rotate(axis,angle) {
    const n=Math.hypot(...axis); if(n<1e-10) return this.identity();
    const [x,y,z]=axis.map(v=>v/n), c=Math.cos(angle),s=Math.sin(angle),t=1-c;
    return [t*x*x+c,t*x*y+s*z,t*x*z-s*y,0,
      t*x*y-s*z,t*y*y+c,t*y*z+s*x,0,
      t*x*z+s*y,t*y*z-s*x,t*z*z+c,0,0,0,0,1];
  },
  point(m,p,w=1) {return [0,1,2].map(i=>m[i]*p[0]+m[4+i]*p[1]+m[8+i]*(p[2]||0)+m[12+i]*w);},
  projection(aspect) {return [1/(2.9*aspect),0,0,0,0,1/2.9,0,0,0,0,-1/30,0,0,0,0,1];}
};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
// 虚拟跟踪球：屏幕点投影到单位半球；球外归一化到赤道。
function trackball(x,y,rect) {
  const radius=Math.min(rect.width,rect.height)/2;
  let a=(x-rect.left-rect.width/2)/radius,b=(rect.top+rect.height/2-y)/radius;
  const d=a*a+b*b;
  if(d>1) {const n=Math.sqrt(d);a/=n;b/=n;return [a,b,0];}
  return [a,b,Math.sqrt(1-d)];
}
function ballRotation(a,b) {
  let axis=cross(a,b),len=Math.hypot(...axis),d=Math.max(-1,Math.min(1,dot(a,b)));
  if(len<1e-8) {
    if(d>0) return M.identity();
    axis=cross(a,Math.abs(a[0])<0.8?[1,0,0]:[0,1,0]);
  }
  return M.rotate(axis,Math.atan2(len,d));
}
