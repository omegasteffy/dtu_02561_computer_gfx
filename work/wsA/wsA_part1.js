/**
 * Global variables
 */
let coordinateSys;
let gl;		  //the GL context
let program;  // the compiled GL-program
let moveCube; //matrix for positioning the cube
let sphere1;
let time = 0;
let min_filter_value = null;
let max_filter_value = null;
let wrap_s_value = null;
let wrap_t_value = null;
let cubemap_image = null;
let cubeimage_cnt=0;

const cubemapTextures = [    '../../code_and_data/env_textures/cm_left.png'
							,'../../code_and_data/env_textures/cm_right.png'
							,'../../code_and_data/env_textures/cm_top.png'
							,'../../code_and_data/env_textures/cm_bottom.png'
							,'../../code_and_data/env_textures/cm_back.png'
							,'../../code_and_data/env_textures/cm_front.png'
				];

let cubemap_counter = 0;
cubemap_image = [];
for (var i = 0; i < 6; i++) {
	cubemap_image[i] = new Image();
	cubemap_image[i].crossorigin = 'anonymous';
	cubemap_image[i].src = cubemapTextures[i];
	cubemap_image[i].onload = setup_stuff;
}


function setup_stuff()
{

	cubeimage_cnt++;
	if(cubeimage_cnt<6)
	{
		console.log("Texture load " + cubeimage_cnt	);
		return;
	}

	console.trace("Started");

	//general boiler plate stuff
	let canvas = document.getElementById('draw_area');
	gl = WebGLUtils.setupWebGL(canvas);
	program = initShaders(gl, "vert1", "frag1");
	gl.useProgram(program);
	uniforms = cacheUniformLocations(gl, program);
	gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	
	coordinateSys = coordinateSystem(gl);

	let texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture); // make our new texture the current one
	gl.activeTexture(gl.TEXTURE0);
	//let cubeTexture = gl.createTexture();
	gl.uniform1i(uniforms.tex,0);


	for(let i=0;i<6; i++)
	{
		gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+i, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, cubemap_image[i]);
	}
	
	
	render();

}

function decode_radiobutton_selection()
{
	let changed_settings = false;
	let min_filter_boxes = document.getElementsByName('MinimizeFilter');
	for(let k = 0; k< min_filter_boxes.length; k++ )
	{
		if (min_filter_boxes[k].checked && (min_filter_value != min_filter_boxes[k].value))
		{
			min_filter_value = min_filter_boxes[k].value;
			changed_settings = true;
		}
	}
	let max_filter_boxes = document.getElementsByName('MaximizeFilter');
	for(let k = 0; k< max_filter_boxes.length; k++ )
	{
		if (max_filter_boxes[k].checked && (max_filter_value != max_filter_boxes[k].value))
		{
			max_filter_value = max_filter_boxes[k].value;
			changed_settings = true;
		}
	}	
	return changed_settings;
}

//setup_stuff();

function render()
{
	const triangle_subdivision = document.getElementById('subdivision_slider').value;
	sphere1 = sphere_3d(triangle_subdivision);
	time += 1;
	let eyePos = vec4(1.5, 1.5, 2.5, 1.0); //We put camera in corner in order to make the isometric view
	eyePos = mult(rotateY(time * .5), eyePos);
	eyePos = vec3(eyePos[0], eyePos[1], eyePos[2]);
	
	let upVec = vec3(0.0, 1.0, 0.0);//we just need the orientation... it will adjust itself
	let cameraTarget = vec3(0.0, 0.0, 0.0);// for isometric we should look at origo

	cameraMatrix = lookAt(eyePos, cameraTarget, upVec);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	let canvas = document.getElementById('draw_area');
	let FieldOfViewY = 45; //deg
	let AspectRatio = (canvas.width / canvas.height); //should be 1.0
	let near = 1.0;
	let far = 100.0;
	let perMatrix = perspective(FieldOfViewY, AspectRatio, near, far);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE); // Ensure the depth of lines and triangles matter, instead of the drawing order... but not required

	gl.uniformMatrix4fv(uniforms.proj_Matrix, false, flatten(perMatrix));
	gl.uniformMatrix4fv(uniforms.camera_Matrix, false, flatten(cameraMatrix));

	let lightDirection = vec4(0, 0, 1, 0);
	//let lightPos = vec4(1, 1, 4, 0); // only used if we use directional coordinates
	//gl.uniform4fv(uniforms.lightPos, flatten(lightPos));
	let is_white_selected = document.getElementById("colorscheme_white").checked;
	gl.uniform4fv(uniforms.lightDirection, flatten(lightDirection));
	if (is_white_selected) {
		var diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
		var specularColor = vec4(0.8, 0.8, 0.8, 1.0);
	}
	else {
		var diffuseColor = vec4(0.1, 0.1, 0.8, 1.0);
		var specularColor = vec4(0.8, 0.1, 0.1, 1.0);
	}
	let ambientColor = vec4(0.25, 0.25, 0.25, 1.0); //always
	

	let ambient_coef = document.getElementById("ambientlight_slider").value*.01;
	let specular_coef = document.getElementById("specularlight_slider").value * .01;
	let diffuse_coef = document.getElementById("diffuselight_slider").value * .01;

	gl.uniform4fv(uniforms.specularColor, flatten(specularColor));
	gl.uniform4fv(uniforms.diffuseColor, flatten(diffuseColor));
	gl.uniform4fv(uniforms.ambientColor, flatten(ambientColor));

	let is_phong_selected = document.getElementById("lightmodel_phong").checked;
	if (is_phong_selected)
	{
		gl.uniform1i(uniforms.normalize_light_param, 1);
	}
	else
	{
		gl.uniform1i(uniforms.normalize_light_param, 0);
	}

	gl.uniform1f(uniforms.specular_coef, specular_coef);
	gl.uniform1f(uniforms.diffuse_coef, diffuse_coef);
	gl.uniform1f(uniforms.ambient_coef, ambient_coef );

	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	const changed_settings = decode_radiobutton_selection();
 
	if(changed_settings)
	{
		switch(min_filter_value)
		{
			case "Nearest" :
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				break;
			case "Linear":
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				break;
			case "NearestMipMap-Nearest" :
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
				break;
			case "NearestMipMap-Linear":
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
				break;
			case "LinearMipMap-Nearest" :
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
				break;
			case "LinearMipMap-Linear":
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
				break;
			default:
				alert("unrecognized value for minification filter");
		}
		switch(max_filter_value)
		{
			case "Nearest" :
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
				break;
			case "Linear":
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				break;
			//Not supported for magnification filter
			// case "MipMap-Nearest" :
			// 	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST_MIPMAP_NEAREST);
			// 	break;
			// case "MipMap-Linear":
			// 	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST_MIPMAP_LINEAR);
			// 	break;
			default:
				alert("unrecognized value for maxification filter");
		}
	}
 	{// draw coordinat system
		trsMatrix = mat4();
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		send_array_to_attribute_buffer("vertexPos", coordinateSys.points, 3, gl, program);
		send_array_to_attribute_buffer("vColor", coordinateSys.colors, 4, gl, program);
		gl.drawArrays(coordinateSys.drawtype, 0, coordinateSys.drawCount);
	}
	let shinyness = document.getElementById('shine_slider').value;
	{//The sphere
		trsMatrix = mat4();
		gl.uniformMatrix4fv(uniforms.trsMatrix, false, flatten(trsMatrix));
		gl.uniform1f(uniforms.shinyness, shinyness);
		send_array_to_attribute_buffer("vertexPos", sphere1.Points, 4, gl, program);
		send_array_to_attribute_buffer("vColor", sphere1.Colors, 4, gl, program);
		gl.drawArrays(gl.TRIANGLES, 0, sphere1.Points.length);
	}

	requestAnimationFrame(render); 
}