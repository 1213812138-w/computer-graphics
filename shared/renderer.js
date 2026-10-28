"use strict";
function createRenderer(canvas,is3D) {
  const gl=canvas.getContext('webgl',{antialias:true,preserveDrawingBuffer:true});
  if(!gl) throw new Error('浏览器未能启用 WebGL，请使用支持 WebGL 的 Chrome 或 Edge。');
  const compile=(type,src)=>{
    const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));return s;
  };
  const program=gl.createProgram();
  gl.attachShader(program,compile(gl.VERTEX_SHADER,`
    attribute vec3 position;
    uniform mat4 model,projection;
    uniform mat3 normalMatrix;
    varying vec3 normal;
    void main(){normal=normalMatrix*position;gl_Position=projection*model*vec4(position,1.0);}`));
  gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`
    precision mediump float;
    uniform vec3 color;uniform bool lighting;varying vec3 normal;
    void main(){float light=lighting ? 0.52+0.48*max(dot(normalize(normal),normalize(vec3(-0.5,0.8,1.0))),0.0):1.0;
    gl_FragColor=vec4(color*light,1.0);}`));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  // 二维使用圆形三角扇；三维使用经纬网球体，缩放后得到椭球。
  const vertices=[];
  if(is3D) {
    const point=(a,b)=>[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];
    for(let i=0;i<24;i++) for(let j=0;j<40;j++) {
      const a=i*Math.PI/24,b=j*2*Math.PI/40,c=(i+1)*Math.PI/24,d=(j+1)*2*Math.PI/40;
      vertices.push(...point(a,b),...point(c,b),...point(c,d),...point(a,b),...point(c,d),...point(a,d));
    }
  } else for(let i=0;i<64;i++) {
    const a=i*2*Math.PI/64,b=(i+1)*2*Math.PI/64;
    vertices.push(0,0,0,Math.cos(a),Math.sin(a),0,Math.cos(b),Math.sin(b),0);
  }
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
  const attribute=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute,3,gl.FLOAT,false,0,0);
  const u={};for(const key of ['model','projection','normalMatrix','color','lighting'])u[key]=gl.getUniformLocation(program,key);
  if(is3D) gl.enable(gl.DEPTH_TEST);
  gl.clearColor(1,1,1,1);gl.uniform1i(u.lighting,is3D);
  let aspect=1;
  function begin() {
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
    if(canvas.width!==w||canvas.height!==h) {canvas.width=w;canvas.height=h;}
    aspect=w/h;gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(u.projection,false,new Float32Array(M.projection(aspect)));
  }
  function draw(model,color) {
    gl.uniformMatrix4fv(u.model,false,new Float32Array(model));
    // R*S 的逆转置：每列除以该列长度的平方，正确处理非均匀缩放。
    const normal=[];
    for(let j=0;j<3;j++) {const n=model[j*4]**2+model[j*4+1]**2+model[j*4+2]**2;
      for(let i=0;i<3;i++) normal.push(model[j*4+i]/n);}
    gl.uniformMatrix3fv(u.normalMatrix,false,new Float32Array(normal));
    gl.uniform3fv(u.color,color);gl.drawArrays(gl.TRIANGLES,0,vertices.length/3);
  }
  function pointer(e) {
    const r=canvas.getBoundingClientRect();
    return [(e.clientX-r.left-r.width/2)/r.height*5.8,(r.height/2-e.clientY+r.top)/r.height*5.8,0];
  }
  return {begin,draw,pointer,gl,get aspect(){return aspect;}};
}
