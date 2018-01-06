console.trace("Started");
let canvas = document.getElementById('draw_area');
let gl = WebGLUtils.setupWebGL(canvas);
let program = initShaders(gl,"vert","frag");

gl.useProgram(program);
gl.viewport( 0.0 ,0.0, canvas.width,canvas.height)
gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

const vertices = new Float32Array(
    [0.0,0.0,
    0.0,1.0,
    1.0,1.0]
)

const uniforms = cacheUniformLocations(gl,program); // a tool to ease the access to uniforms
send_floats_to_attribute_buffer("a_Position",vertices,2,gl,program);
gl.clear(gl.COLOR_BUFFER_BIT); 
gl.drawArrays(gl.POINTS,0,3);

console.trace("Ended");