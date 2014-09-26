'use strict';

var canvasWidth = 512;
var canvasHeight = 512;

function update(time) {

	/**
	 *  Upload uniforms
	 */
	
	// Model transform
	gl.uniformMatrix4fv(shader.uniform.uM, false, mat4.create());

	// Perspective transform
	gl.uniformMatrix4fv(shader.uniform.uP, false, scene.camera.uP);

	// Camera
	var dist = 2.0;
	// mat4.lookAt(
	// 	scene.camera.uV,
	// 	vec3.fromValues(dist*Math.sin(time/4000), 0, dist*Math.cos(time/4000)),
	// 	vec3.fromValues(0, 0, 0),
	// 	UP_VECTOR);
	


	// Light position
	scene.light.uLightPosition = vec3.fromValues(2*Math.cos(time/1500), 0.8, 2*Math.sin(time/1500));
	gl.uniform3fv(shader.uniform.uLightPosition, scene.light.uLightPosition);

	// Light direction
	var lightLookatPoint = vec3.fromValues(0, 0.8, 0);
	// From light pos to lookatpoint
	mat4.lookAt(
		scene.light.uLightMatrix,
		scene.light.uLightPosition,
		lightLookatPoint,
		UP_VECTOR);
	gl.uniformMatrix4fv(shader.uniform.uLightMatrix, false, scene.light.uLightMatrix);
	
	// Upload inverted lightmatrix too
	mat4.invert(scene.light.uLightMatrixInverse, scene.light.uLightMatrix);
	gl.uniformMatrix4fv(shader.uniform.uLightMatrixInverse, false, scene.light.uLightMatrixInverse);

	/**
	 *  Upload attributes
	 */
	gl.enableVertexAttribArray(shader.attribute.aVertexPosition);
	gl.vertexAttribPointer(
							shader.attribute.aVertexPosition,
							3,
							gl.FLOAT,
							false,
							0,
							0
						);
}



function draw() {
	bindScene(gl, shader, gl.model);

	if(gl.shadowMappingSupported) {
		shadowMapDrawBit(gl);
	}

	drawScene(gl, scene.camera.uV, scene.camera.uP);

	drawDepthMap(gl);
}

function drawDepthMap(gl) {
	// drawTexturedQuad(gl, gl.depthTexture, 0, 0, 128, 128);

	// switch back to our shader
	gl.useProgram(shader.program);

	// make sure the depth texture is
	// bound to texture slot 0
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, gl.depthTexture);
}

//-------------------------------------------------//
//  Setup functions
//-------------------------------------------------//

function setupScene(gl) {

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	/**
	 *  Setup and bind vertex buffer
	 */
	gl.model = {};
	gl.model.vertices = [
		// Square
			-0.5,   0.5,   0.0,   0.0,   0.0,   0.0,   0.0,   0.0,
			 0.5,   0.5,   0.0,   0.0,   0.0,   0.0,   0.0,   0.0,
			 0.5,  -0.5,   0.0,   0.0,   0.0,   0.0,   0.0,   0.0,
			-0.5,  -0.5,   0.0,   0.0,   0.0,   0.0,   0.0,   0.0,

		// Floor
			-100, -1, -100,   0.0,   0.0,   0.0,   0.0,   0.0,
			 100, -1, -100,   0.0,   0.0,   0.0,   0.0,   0.0,
			 100, -1,  100,   0.0,   0.0,   0.0,   0.0,   0.0,
			-100, -1,  100,   0.0,   0.0,   0.0,   0.0,   0.0,
		];
	gl.vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gl.model.vertices), gl.STATIC_DRAW);


	/**
	 *  Setup and bind index buffer
	 */
	gl.model.indices = [
		// Square
			0, 1, 2,
			2, 3, 0,

		// Floor
			4, 5, 6,
			6, 7, 4,
	];
	gl.iBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.iBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(gl.model.indices), gl.STATIC_DRAW);


	/**
	 *  Build and setup shader program
	 */
	window.shader = new Shader();
	shader.compileProgram(gl);
	gl.useProgram(shader.program);


	/**
	 *  Set up camera
	 */
	
	scene.camera = {};

	// Model transform
	var uM = mat4.create();

	// View transform
	scene.camera.uV = mat4.create();
	mat4.rotateX(scene.camera.uV, scene.camera.uV, Math.PI/2);
	mat4.translate(scene.camera.uV, scene.camera.uV, vec3.fromValues(-3, -2.1, -8));

	// Perspective transform
	scene.camera.uP = mat4.create();
	mat4.perspective(
		scene.camera.uP,
		Math.PI/2,
		1,
		0.01,
		10000);



	scene.light = {};

	// Light position
	scene.light.uLightPosition = vec3.fromValues(0, 1, 0);

	// Light attenuation
	scene.light.uLightAttenuation = 1.0;

	// Light matrix
	scene.light.uLightMatrix = mat4.create();

	// Light matrix inverse
	scene.light.uLightMatrixInverse = mat4.create();
}


function drawScene(gl, uV, uP) {
	// Upload camera view matrix
	gl.uniformMatrix4fv(shader.uniform.uV, false, uV);
	gl.uniformMatrix4fv(shader.uniform.uP, false, uP);
	
	// Draw scene
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, 512, 512);

	gl.drawElements(gl.TRIANGLES, gl.model.indices.length, gl.UNSIGNED_SHORT, 0);
}


//--SHADOW MAPPING SETUP----------------------------------//


function shadowMapDrawBit(gl) {

	if(gl.shadowMappingType === 'depth_texture') {
		// Upload perspective matrix
		gl.uniformMatrix4fv(shader.uniform.uP, false, scene.camera.uP);
		
		// Upload light matrices
		gl.uniformMatrix4fv(shader.uniform.uV, false, scene.light.uLightMatrix);

		// Draw shadow map
		gl.bindFramebuffer(gl.FRAMEBUFFER, gl.framebuffer);
		gl.viewport(0, 0, gl.texSize, gl.texSize);
		gl.clear(gl.DEPTH_BUFFER_BIT);
		
		gl.drawElements(gl.TRIANGLES, gl.model.indices.length, gl.UNSIGNED_SHORT, 0);
	}

	if(gl.shadowMappingType === 'packed_8_bit_texture') {

		gl.useProgram(gl.shadowMapShader.program);

		bindScene(gl, gl.shadowMapShader, gl.model);

		// Model transform
		var uM = mat4.create();
		gl.uniformMatrix4fv(gl.shadowMapShader.uniform.uM, false, uM);

		// Upload perspective matrix
		gl.uniformMatrix4fv(gl.shadowMapShader.uniform.uP, false, scene.camera.uP);
		
		// Upload light matrices
		gl.uniformMatrix4fv(gl.shadowMapShader.uniform.uV, false, scene.light.uLightMatrix);


		gl.bindFramebuffer(gl.FRAMEBUFFER, gl.framebuffer);
		gl.viewport(0, 0, gl.texSize, gl.texSize);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.drawElements(gl.TRIANGLES, gl.model.indices.length, gl.UNSIGNED_SHORT, 0);
	
		// go back to normal program
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.useProgram(shader.program);
	}

}


/**
 *  Create depth texture stuff
 */
function shadowMapSetupBit(gl) {
	gl.shadowMappingSupported = true;
	


	// The type of shadow mapping
	gl.shadowMappingType = 'packed_8_bit_texture';

	var vsFrontBit = [
		'uniform vec3 uLightPosition;',
		'uniform mat4 uLightMatrix;',
		'uniform mat4 uLightMatrixInverse;',

		'varying vec4 vLightPosition;',
		'varying vec3 vLightDirection;',

		'varying vec4 vShadowPos;',
		'const mat4 depthScaleMatrix = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);',
	].join('\n');

	var vsMainBit = [
		'vLightPosition = uV * uM * vec4(uLightPosition, 1.0);',
		'vLightDirection = mat3(uV * uLightMatrixInverse) * normalize(vec3(0.0, 0.0, -1.0));',

		'vShadowPos = depthScaleMatrix * uP * uLightMatrix * worldVertexPosition;',
	].join('\n');

	var fsFrontBit = [
		'uniform sampler2D uDepthTexture;',
		'varying vec4 vShadowPos;',
		'varying vec4 vLightPosition;',
		'varying vec3 vLightDirection;',

		'vec3 calculateLight() {',
		'	vec4 lightToPos = vPos - vLightPosition;',
		'	float dotProduct = dot(normalize(lightToPos.xyz), normalize(vLightDirection));',
		// '	float luminance = max(0.0, smoothstep(5.0, 1.0, length(lightToPos)));',

		'	float falloff = sign(dotProduct) * smoothstep(0.9, 1.0, abs(dotProduct));',
		'	float luminance = max(0.0, falloff /* smoothstep(5.0, 1.0, length(lightToPos))*/);',

		'	return vec3(luminance);',
		'}',
	].join('\n');

	var fsMainBit = [
		'if(isInShadow() == 0.0) {',
		'	color = calculateLight();',
		'}',
	].join('\n');


	// Texture size
	gl.texSize = 512;

	
	gl.depthTextureExt = gl.getExtension('WEBGL_depth_texture');
	if(gl.depthTextureExt) {
		gl.shadowMappingType = 'depth_texture';

		// Create a color texture
		gl.colorTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, gl.colorTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.texSize, gl.texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		// Create the depth texture
		gl.depthTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, gl.depthTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, gl.texSize, gl.texSize, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);

		gl.framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, gl.framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gl.colorTexture, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, gl.depthTexture, 0);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		fsFrontBit = [fsFrontBit,
			'float isInShadow() {',
			'	vec3 depth = vShadowPos.xyz / vShadowPos.w;',
			'	float shadowValue = texture2D(uDepthTexture, depth.xy).r;',

			'	depth.z *= 0.999;',

			'	if(shadowValue > depth.z) {',
					// Not in shadow
			'		return 0.0;',
			'	}',

				// In shadow
			'	return 1.0;',
			'}'
		].join('\n');
	}

	// Nothing else has been set up, so go for
	// the minimally supported strategy
	if(gl.shadowMappingType === 'packed_8_bit_texture') {
		// Create a color texture used for depth
		gl.depthTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, gl.depthTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.texSize, gl.texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);


		// Create the depth buffer
		gl.depthBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, gl.depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gl.texSize, gl.texSize);

		// Create the framebuffer
		gl.framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, gl.framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gl.depthTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, gl.depthBuffer);

		fsFrontBit = [fsFrontBit,
			'float unpack (vec4 colour)',
			'{',
			'	const vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0),',
			'								1.0 / (256.0 * 256.0),',
			'								1.0 / 256.0,',
			'								1);',
			'	return dot(colour, bitShifts);',
			'}',

			'float isInShadow() {',
			'	vec3 depth = vShadowPos.xyz / vShadowPos.w;',
			'	float shadowValue = 0.5 + 0.5 * unpack(texture2D(uDepthTexture, depth.xy));',

			'	depth.z *= 0.999;',
			'	if(shadowValue > depth.z) {',
					// Not in shadow
			'		return 0.0;',
			'	}',

				// In shadow
			'	return 1.0;',
			'}'
		].join('\n');


		/**
		 *  Special shader for depth value storage
		 */
		gl.shadowMapShader = new Shader();

		gl.shadowMapShader._vertSrc = [
			'uniform mat4 uP;',
			'uniform mat4 uM;',
			'uniform mat4 uV;',

			'attribute vec3 aVertexPosition;',

			'varying vec4 vPos;',

			'void main(void) {',
			'	vPos = uP * uV * uM * vec4(aVertexPosition, 1.0);',
			
			'	gl_Position = vPos;',
			'}'
		].join('\n');

		gl.shadowMapShader._fragSrc = [
			'varying vec4 vPos;',

			'vec4 pack (float depth) {',
			'	const vec4 bitSh = vec4(256 * 256 * 256,',
			'							256 * 256,',
			'							256,',
			'							1.0);',
			'	const vec4 bitMsk = vec4(0,',
			'							1.0 / 256.0,',
			'							1.0 / 256.0,',
			'							1.0 / 256.0);',
			'	vec4 comp = fract(depth * bitSh);',
			'	comp -= comp.xxyz * bitMsk;',
			'	return comp;',
			'}',

			'void main(void) {',
			'	vec3 depth = vPos.xyz / vPos.w;',

			'	gl_FragColor = pack(depth.z);',
			'}'
		].join('\n');

		gl.shadowMapShader.compileProgram(gl);
	}

	shader.setBit('vs', 'front', vsFrontBit);
	shader.setBit('vs', 'main', vsMainBit);
	shader.setBit('fs', 'front', fsFrontBit);
	shader.setBit('fs', 'main', fsMainBit);


	shader.compileProgram(gl);
	gl.useProgram(shader.program);


	if(gl.shadowMappingType) {
		console.log('Shadow mapping type:', gl.shadowMappingType);
	}
}


//------------------------------------------------------//

window.gl = init(canvasWidth, canvasHeight);
window.scene = {};
	
setupScene(gl);
shadowMapSetupBit(gl);


loop();