console.trace("Started");
let canvas = document.getElementById('draw_area');

let     gl = WebGLUtils.setupWebGL(canvas);

let program = initShaders(gl,"vert1","frag1");

gl.useProgram(program);
gl.viewport( 0.0 ,0.0, canvas.width,canvas.height)
gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

const vertices = new Float32Array(
    [0.0,0.0,
    0.0,1.0,
    1.0,1.0]
)

let buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,buffer); // make it the current buffer assigned in WebGL
gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);//link the JS-points and the 

let vPos = gl.getAttribLocation(program,"a_Position"); // setup a pointer to match the 
gl.vertexAttribPointer(vPos,2,gl.FLOAT,false,0,0);
gl.enableVertexAttribArray(vPos);

gl.clear(gl.COLOR_BUFFER_BIT); 
gl.drawArrays(gl.POINTS,0,3);

console.trace("Ended");