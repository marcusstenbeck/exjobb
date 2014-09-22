'use strict';
(function () {

	var UP_VECTOR = vec3.fromValues(0, 1, 0);
	var canvasWidth = 768;
	var canvasHeight = 512;

	var packBits = {
		front: [
			'vec4 packColor(vec3 color) {',
			'	float maxColor = max(max(color.r, color.g), color.b);',
			'	float exponent = ceil(log(maxColor) / log(2.0));',
			'	float scaledExp = (exponent + 128.0) / 255.0;',
			'	float f = pow(2.0, exponent);',
			'	return vec4(color / f, scaledExp);',
			'}',
		].join('\n'),
		
		main: [
			'vec4 packedColor = packColor(color);',
			'color = packedColor.rgb;',
			'alpha = packedColor.a;',
		].join('\n')
	};
	
	var unpackBits = {
		front: [
			'vec3 unpackColor(vec4 color) {',
			'	float exponent = color.a * 255.0 - 128.0;',
			'	float f = pow(2.0, exponent);',
			'	return color.rgb * f;',
			'}',

			'vec3 unpackFromTexture(sampler2D texture, vec2 tc) {',
			'	return unpackColor(texture2D(texture, tc));',
			'}',
		].join('\n'),
	};

	function interleaveData(data) {
		/*
			Expects data in format
			{
				vertexPositions: [x1, y1, z1, x2, y2, z2, ... ],
				vertexNormals: [nx1, ny1, nz1, nx2, ny2, nz2, ... ],
				vertexTextureCoords: [tx1, ty1, tx2, ty2, ... ],
				indices: [tr1_p1, tr1_p2, tr1_p3, tr2_p1, tr2_p2, tr2_p3, ... ]
			}
		*/
		var vCount = data.vertexPositions.length / 3;
		var vertexData = new Array();

		var tempData;
		for (var i = 0; i < vCount; i++) {
			tempData = [
				data.vertexPositions[ i * 3 ],
				data.vertexPositions[ i * 3 + 1 ],
				data.vertexPositions[ i * 3 + 2 ],
				
				data.vertexTextureCoords[ i * 2 ],
				data.vertexTextureCoords[ i * 2 + 1 ],
				
				data.vertexNormals[ i * 3 ],
				data.vertexNormals[ i * 3 + 1 ],
				data.vertexNormals[ i * 3 + 2 ],
			];

			vertexData = vertexData.concat(tempData);
		};

		return {
			vertexData: vertexData,
			indexData: data.indices
		};
	}


	function init() {
		document.write('<canvas width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas>')

		var canv = document.getElementsByTagName('canvas')[0];

		var requestedContextAttributes = {
			antialias: false
		};

		try {
			var gl = canv.getContext('webgl', requestedContextAttributes);
		} catch (e) {
			console.error('WebGL is not supported');
		}

		if(gl) {
			return gl;
		}

		return null;
	}


	var time = 0;
	function update(tpf) {
		time = time + tpf;

		sceneUpdate(time);
		lightUpdate(time);
	}



	function draw(uV, uP) {

		HDRDrawBit(gl, gl.pingColorTexture); // Draw high values to ping

		// Downsample and blur (median filter) to pong
		downsampleAndBlurBit(gl, gl.pingColorTexture, gl.pongColorTexture, 8);

		// Draw scene to ping
		drawScene(gl, gl.pingColorTexture);

		// Additive blend ping+pong to screen
		additiveBlendBit(gl, gl.pingColorTexture, gl.pongColorTexture);


		drawTexQuad(gl, gl.pingColorTexture, 512, 256, 256, 256);
		drawTexQuad(gl, gl.pongColorTexture, 512, 0, 256, 256);
	}

	function drawTexQuad(gl, textureTarget, locx, locy, width, height) {
		drawTexturedQuad(gl, textureTarget, locx, locy, width, height);

		// switch back to our shader
		gl.useProgram(shader.program);
	}

//-------------------------------------------------//
//  Setup functions
//-------------------------------------------------//

	function setupScene(gl) {

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.enable(gl.DEPTH_TEST);


		window.scene = {};

		var teapotData = interleaveData(teapot); // Teapot data loaded in index.html


		/**
		 *  Model setup
		 */
		scene.model = {};
		scene.model.uM = mat4.create();
		mat4.scale(scene.model.uM, scene.model.uM, vec3.fromValues(2, 2, 2));

		// Setup and bind vertex buffer
		scene.model.vertices = teapotData.vertexData;
		// Create vertex buffer
		gl.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scene.model.vertices), gl.STATIC_DRAW);

		// Setup index buffer
		scene.model.indices = teapotData.indexData;
		// Create index buffer
		gl.iBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.iBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(scene.model.indices), gl.STATIC_DRAW);


		// Load test texture
		scene.model.material = {};
		scene.model.material.img = new Image();
		scene.model.material.img.src = 'js/assets/ash_uvgrid02_512.jpg';
		scene.model.material.img.onload = function() {
			scene.model.material.texture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0+2);
			gl.bindTexture(gl.TEXTURE_2D, scene.model.material.texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene.model.material.img);
			gl.activeTexture(gl.TEXTURE0);
		};


		

		/**
		 *  Camera setup
		 */
		scene.camera = {};

		scene.camera.uV = mat4.create();

		scene.camera.uP = mat4.create();
		mat4.perspective(
			scene.camera.uP,
			Math.PI/2,
			1,
			0.01,
			10000
		);


		/**
		 *  Build and setup shader program
		 */
		window.shader = new Shader();

		shader.compileProgram(gl);
		gl.useProgram(shader.program);
	}

	function bindScene(gl, theshader, vData) {
		// gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vData.vertices), gl.STATIC_DRAW);
		
		// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.iBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(vData.indices), gl.STATIC_DRAW);
		
		var FLOAT_WIDTH = 4;
		var theStride = (3+2+3) * FLOAT_WIDTH;
		
		shader.attribute.aVertexPosition = gl.getAttribLocation(shader.program, 'aVertexPosition');
		shader.attribute.aVertexTexCoord = gl.getAttribLocation(shader.program, 'aVertexTexCoord');
		shader.attribute.aVertexNormal = gl.getAttribLocation(shader.program, 'aVertexNormal');
		
		gl.enableVertexAttribArray(shader.attribute.aVertexPosition);
		gl.enableVertexAttribArray(shader.attribute.aVertexTexCoord);
		gl.enableVertexAttribArray(shader.attribute.aVertexNormal);

		gl.vertexAttribPointer(
			shader.attribute.aVertexPosition,
			3,
			gl.FLOAT,
			false,
			theStride,
			0
		);
		
		gl.vertexAttribPointer(
			shader.attribute.aVertexTexCoord,
			2,
			gl.FLOAT,
			false,
			theStride,
			3 * FLOAT_WIDTH
		);

		gl.vertexAttribPointer(
			shader.attribute.aVertexNormal,
			3,
			gl.FLOAT,
			false,
			theStride,
			(2+3) * FLOAT_WIDTH
		);
	}

	function sceneUpdate(time) {
		// Model transform		
		gl.uniformMatrix4fv(shader.uniform.uM, false, scene.model.uM);

		// View transform
		var dist = 40;
		var timeFactor = time/10000;
		mat4.lookAt(
			scene.camera.uV,
			vec3.fromValues(dist * Math.sin(timeFactor), (1/3) * dist, dist * Math.cos(timeFactor)),
			vec3.fromValues(0, 0, 0),
			UP_VECTOR
		);
		gl.uniformMatrix4fv(shader.uniform.uV, false, scene.camera.uV);

		// Perspective transform
		gl.uniformMatrix4fv(shader.uniform.uP, false, scene.camera.uP);

		gl.uniform1i(shader.uniform.uTexture, 2);
	}

	function drawScene(gl, textureTarget) {
		bindScene(gl, shader, scene.model);
		chooseRenderTarget(gl, textureTarget);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, 512, 512);
		
		gl.drawElements(gl.TRIANGLES, scene.model.indices.length, gl.UNSIGNED_SHORT, 0);
	}

	function chooseRenderTarget(gl, textureTarget) {
		if(!textureTarget) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		} else {
			gl.bindFramebuffer(gl.FRAMEBUFFER, gl.framebuffer);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureTarget, 0);
		}
	}

//-- LIGHTS ----------------------------------------------//

	function lightSetup(gl) {

		/**
		 *  Update shader
		 */

		shader.setBit('vs', 'front', [
			shader.getBit('vs', 'front'),
			'uniform vec3 uLightPosition;',
			'varying vec4 vLightPosition;',
		].join('\n'));

		shader.setBit('vs', 'main', [
			shader.getBit('vs', 'main'),
			'vLightPosition = uV * vec4(uLightPosition, 1.0);',
		].join('\n'));

		shader.setBit('fs', 'front', [
			'uniform sampler2D uTexture;',
			
			'varying vec4 vLightPosition;',
			'uniform vec3 uLightColor;',

			'vec3 calculateLight(vec3 diffuse, vec3 specular) {',

			'	vec3 n = normalize(vNormal);',
			'	vec3 v = normalize(-vPos.xyz);',
			'	vec3 Lout = vec3(0.0);',
			
			'	float Li = 3.0;',  // Intensity

			'	vec3 l = normalize(vLightPosition.xyz - vPos.xyz);',  // Point-to-light
			'	vec3 h = normalize(v + l);',  // Half vector
			'	float cosTh = max(0.0, dot(n, h));',  // specular shenagiggiian, NdotHV
			'	float cosTi = max(0.0, dot(n, l));',  // cos(theta_incident), NdotL
			
			// Attenuation
			'	float dist = length(vLightPosition - vPos);',
			'	float constantAttenuation = 1.0;',
			'	float linearAttenuation = 0.01 ;',
			'	float quadraticAttenuation = 0.0001;',
			'	float attenuation = 1.0 / (constantAttenuation + (linearAttenuation * dist) + (quadraticAttenuation * dist * dist));',
			
			'	float m = 30.0;',  // Smoothness from Real-Time Rendering
			'	vec3 Kd = diffuse / PI;',
			'	vec3 Ks = specular * ((m + 8.0) / (8.0 * PI));', // Specual not affected by attenuation

			'	Lout += vec3( Kd + (Ks * pow(cosTh, m)) ) * Li * cosTi * attenuation;',

			'	return Lout;',
			'}',
		].join('\n'));
	
		shader.setBit('fs', 'main', [
			'vec4 texColor = texture2D(uTexture, vTexCoord);',
			'color += calculateLight(texColor.rgb, texColor.rgb);',
		].join('\n'));
	

		shader.compileProgram(gl);
		gl.useProgram(shader.program);

		lightUpdate(12345999);
	}

	function lightUpdate(time) {
		var dist = 10;
		var lightHeight = 5.0;
		var rad = 40;
		var timeFactor = time/10000;
		gl.uniform3fv(shader.uniform.uLightPosition, vec3.fromValues(
			rad * Math.sin( timeFactor - 150 ),
			lightHeight,
			rad * Math.cos( timeFactor - 150 )
		));
	}

//------------------------------------------------------//

//-- HDR PASS ------------------------------------------//

	function HDRSetup(gl) {
		gl.texSize = 512;

		if(textureType == gl.FLOAT) {
			var hasLinearExt = gl.floatTextureLinearExt ? true : false;
			HDRSetupFloatTexture(gl, gl.texSize, gl.FLOAT, hasLinearExt);
		} else {
			HDRSetup8BitTexture(gl, gl.texSize, gl.UNSIGNED_BYTE);
		}
	}

	function HDRSetupFloatTexture(gl, texSize, textureType, hasLinearExt) {
		// Set up HDR rendering with float textures
		console.log('float textures, linear is', hasLinearExt);

		// Create ping color texture
		gl.pingColorTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, gl.pingColorTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, textureType, null);

		// Create pong color texture
		gl.pongColorTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + 1);
		gl.bindTexture(gl.TEXTURE_2D, gl.pongColorTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, textureType, null);


		// Create the depth buffer
		gl.depthBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, gl.depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texSize, texSize);

		// Create the framebuffer
		gl.framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, gl.framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gl.pingColorTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, gl.depthBuffer);


		shader.setBit('fs', 'front', [
			shader.getBit('fs', 'front'),
			'uniform int uHDR;',
		].join('\n'));

		shader.setBit('fs', 'main', [
			shader.getBit('fs', 'main'),
			'if(uHDR == 1) color *= step(1.0, color);',
		].join('\n'));

		shader.compileProgram(gl);
	}

	function HDRSetup8BitTexture(gl, texSize, textureType) {
		// Set up HDR rendering with 8 bit textures
		console.log('8 bit textures!');

		// Create ping color texture
		gl.pingColorTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, gl.pingColorTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, textureType, null);

		// Create pong color texture
		gl.pongColorTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + 1);
		gl.bindTexture(gl.TEXTURE_2D, gl.pongColorTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, textureType, null);


		// Create the depth buffer
		gl.depthBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, gl.depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texSize, texSize);

		// Create the framebuffer
		gl.framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, gl.framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gl.pingColorTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, gl.depthBuffer);


		shader.setBit('fs', 'front', [
			shader.getBit('fs', 'front'),
			'uniform int uHDR;',
			packBits.front,
		].join('\n'));

		shader.setBit('fs', 'main', [
			shader.getBit('fs', 'main'),
			'if(uHDR == 1) color *= step(1.0, color);',
		].join('\n'));

		if(textureType == gl.UNSIGNED_BYTE) {
			shader.setBit('fs', 'main', [
				shader.getBit('fs', 'main'),
				'if(uHDR == 1) color *= step(1.0, color);',
				packBits.main,
			].join('\n'));
		}

		shader.compileProgram(gl);
	}

	function HDRDrawBit(gl, textureTarget) {
		bindScene(gl, shader, scene.model);

		gl.uniform1i(shader.uniform.uHDR, 1);

		// Draw HDR texture
		chooseRenderTarget(gl, textureTarget);

		gl.viewport(0, 0, gl.texSize, gl.texSize);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		gl.drawElements(gl.TRIANGLES, scene.model.indices.length, gl.UNSIGNED_SHORT, 0);

		gl.uniform1i(shader.uniform.uHDR, 0);
	}

//------------------------------------------------------//

//-- DOWNSAMPLE and BLUR -------------------------------//

	function downsampleAndBlurSetup(gl) {
		var shader = new Shader();


		shader.setBit('fs', 'front', [
			'uniform sampler2D uTexture;',
			'uniform int size;',
			'uniform vec2 dir;',
		].join('\n'));

		// https://gitorious.org/gluon/gluon/source/f64961dbea07b31fe5292900deaf09716bb196ba:graphics/shaders/GLSL/mosaic.frag
		shader.setBit('fs', 'main', [
			'float blur = 1.0 / float(size);',
			'vec4 texColor = vec4(0.0);',

			'texColor += texture2D(uTexture, vTexCoord - vec2(4.0 * blur, 4.0 * blur) * dir) * 0.0162162162;',
			'texColor += texture2D(uTexture, vTexCoord - vec2(3.0 * blur, 3.0 * blur) * dir) * 0.0540540541;',
			'texColor += texture2D(uTexture, vTexCoord - vec2(2.0 * blur, 2.0 * blur) * dir) * 0.1216216216;',
			'texColor += texture2D(uTexture, vTexCoord - vec2(blur, blur) * dir) * 0.1945945946;',
			'texColor += texture2D(uTexture, vTexCoord) * 0.2270270270;',
			'texColor += texture2D(uTexture, vTexCoord + vec2(blur, blur) * dir) * 0.1945945946;',
			'texColor += texture2D(uTexture, vTexCoord + vec2(2.0 * blur, 2.0 * blur) * dir) * 0.1216216216;',
			'texColor += texture2D(uTexture, vTexCoord + vec2(3.0 * blur, 3.0 * blur) * dir) * 0.0540540541;',
			'texColor += texture2D(uTexture, vTexCoord + vec2(4.0 * blur, 4.0 * blur) * dir) * 0.0162162162;',

			'color = texColor.rgb;',
			'alpha = texColor.a;',
		].join('\n'));

		if(textureType == gl.UNSIGNED_BYTE) {
			shader.setBit('fs', 'front', [
				shader.getBit('fs', 'front'),
				packBits.front,
				unpackBits.front,
			].join('\n'));

			shader.setBit('fs', 'main', [
				'float blur = 1.0 / float(size);',

				'color = unpackFromTexture(uTexture, vTexCoord - vec2(4.0 * blur, 4.0 * blur) * dir) * 0.0162162162;',
				'color += unpackFromTexture(uTexture, vTexCoord - vec2(3.0 * blur, 3.0 * blur) * dir) * 0.0540540541;',
				'color += unpackFromTexture(uTexture, vTexCoord - vec2(2.0 * blur, 2.0 * blur) * dir) * 0.1216216216;',
				'color += unpackFromTexture(uTexture, vTexCoord - vec2(blur, blur) * dir) * 0.1945945946;',
				'color += unpackFromTexture(uTexture, vTexCoord) * 0.2270270270;',
				'color += unpackFromTexture(uTexture, vTexCoord + vec2(blur, blur) * dir) * 0.1945945946;',
				'color += unpackFromTexture(uTexture, vTexCoord + vec2(2.0 * blur, 2.0 * blur) * dir) * 0.1216216216;',
				'color += unpackFromTexture(uTexture, vTexCoord + vec2(3.0 * blur, 3.0 * blur) * dir) * 0.0540540541;',
				'color += unpackFromTexture(uTexture, vTexCoord + vec2(4.0 * blur, 4.0 * blur) * dir) * 0.0162162162;',
				
				packBits.main,
			].join('\n'));
		}

		shader.compileProgram(gl);

		var extraTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, extraTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.downsampleAndBlur = {
			shader: shader,
			extraTexture: extraTexture
		};
	}

	function downsampleAndBlurBit(gl, texture, textureTarget, factor) {
		gl.useProgram(gl.downsampleAndBlur.shader.program);
		bindScene(gl, gl.downsampleAndBlur.shader, gl.quad);

		var factor = factor || 2;

		// Gotta bind the matrices since that doesn't happen in bindScene()
		var matrix = mat4.create();
		gl.uniformMatrix4fv(gl.downsampleAndBlur.shader.uniform.uM, false, matrix);
		gl.uniformMatrix4fv(gl.downsampleAndBlur.shader.uniform.uV, false, matrix);
		gl.uniformMatrix4fv(gl.downsampleAndBlur.shader.uniform.uP, false, matrix);


		gl.bindTexture(gl.TEXTURE_2D, gl.downsampleAndBlur.extraTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.texSize / factor, gl.texSize / factor, 0, gl.RGBA, textureType, null);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.uniform1i(gl.downsampleAndBlur.shader.uniform.size, gl.texSize/factor);

		chooseRenderTarget(gl, gl.downsampleAndBlur.extraTexture);
		gl.activeTexture(gl.TEXTURE0 + 1);
		gl.bindTexture(gl.TEXTURE_2D, gl.downsampleAndBlur.extraTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.texSize / factor, gl.texSize / factor, 0, gl.RGBA, textureType, null);
		// Create the depth buffer
		var halfSizeDepthbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, halfSizeDepthbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gl.texSize / factor, gl.texSize / factor);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, halfSizeDepthbuffer);

		gl.viewport(0, 0, gl.texSize / factor, gl.texSize / factor);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		


		var horizontal = [1,0];
		var vertical = [0,1];

		// Blur X
		gl.uniform2fv(gl.downsampleAndBlur.shader.uniform.dir, vertical);
		gl.drawElements(gl.TRIANGLES, gl.quad.indices.length, gl.UNSIGNED_SHORT, 0);

		// Blur Y
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, gl.downsampleAndBlur.extraTexture);

		chooseRenderTarget(gl, textureTarget);
		// Go back to normal size
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, gl.depthBuffer);
		
		gl.viewport(0, 0, gl.texSize, gl.texSize);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.uniform2fv(gl.downsampleAndBlur.shader.uniform.dir, horizontal);
		gl.drawElements(gl.TRIANGLES, gl.quad.indices.length, gl.UNSIGNED_SHORT, 0);


		gl.useProgram(shader.program);
	}

//------------------------------------------------------//

//-- ADDITIVE BLEND ------------------------------------//

	function additiveBlendSetup(gl) {
		var shader = new Shader();

		shader.setBit('fs', 'front', [
			'uniform sampler2D uTextureA;',
			'uniform sampler2D uTextureB;',
			unpackBits.front,
		].join('\n'));

		shader.setBit('fs', 'main', [
			'vec3 luminance = texture2D(uTextureA, vTexCoord).rgb + texture2D(uTextureB, vTexCoord).rgb;',
			'float Lwhite = 1.0;',
			'color = (luminance * (1.0 + (luminance / pow(Lwhite, 2.0)))) / (1.0 + luminance);',
		].join('\n'));

		if(textureType == gl.UNSIGNED_BYTE) {
			shader.setBit('fs', 'main', [
				'vec3 luminance = unpackFromTexture(uTextureA, vTexCoord).rgb + unpackFromTexture(uTextureB, vTexCoord).rgb;',
				'float Lwhite = 1.0;',
				'color = (luminance * (1.0 + (luminance / pow(Lwhite, 2.0)))) / (1.0 + luminance);',
			].join('\n'));			
		}

		shader.compileProgram(gl);

		gl.additiveBlend = {
			shader: shader
		};
	}

	function additiveBlendBit(gl, textureA, textureB, textureTarget) {
		gl.useProgram(gl.additiveBlend.shader.program);
		
		bindScene(gl, gl.additiveBlend.shader, gl.quad);

		// Gotta bind the matrices since that doesn't happen in bindScene()
		var matrix = mat4.create();
		gl.uniformMatrix4fv(gl.additiveBlend.shader.uniform.uM, false, matrix);
		gl.uniformMatrix4fv(gl.additiveBlend.shader.uniform.uV, false, matrix);
		gl.uniformMatrix4fv(gl.additiveBlend.shader.uniform.uP, false, matrix);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, textureA);
		gl.uniform1i(gl.additiveBlend.shader.uniform.uTextureA, 0);

		gl.activeTexture(gl.TEXTURE0 + 1);
		gl.bindTexture(gl.TEXTURE_2D, textureB);
		gl.uniform1i(gl.additiveBlend.shader.uniform.uTextureB, 1);

		// Draw HDR texture
		chooseRenderTarget(gl, textureTarget);

		gl.viewport(0, 0, gl.texSize, gl.texSize);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		gl.drawElements(gl.TRIANGLES, gl.quad.indices.length, gl.UNSIGNED_SHORT, 0);

		gl.useProgram(shader.program);
	}

//------------------------------------------------------//

//-- QUAD ----------------------------------------------//
	function setupQuad(gl) {
		gl.quad = {
			vertices: [
				-1,  1,  0,   0, 1,   0,0,0,
				 1,  1,  0,   1, 1,   0,0,0,
				 1, -1,  0,   1, 0,   0,0,0,
				-1, -1,  0,   0, 0,   0,0,0,
			],
			indices: [0,1,2,  0,2,3]
		}	
	}

//------------------------------------------------------//


	window.gl = init();
	window.scene = {};

	gl.floatTextureExt = gl.getExtension('OES_texture_float');
	gl.floatTextureLinearExt = gl.getExtension('OES_texture_float_linear');

	if(gl.floatTextureExt) {
		window.textureType = gl.FLOAT;
	} else {
		window.textureType = gl.UNSIGNED_BYTE;
	}

	setupQuad(gl);
	setupScene(gl);
	lightSetup(gl);
	HDRSetup(gl);
	downsampleAndBlurSetup(gl);
	additiveBlendSetup(gl);


	var lastTime = 0;
	var tpf = 0;
	document.write('<div id="tpf"></div>');
	(function loop(time) {
		window.requestAnimationFrame(loop);
		tpf = time - lastTime || 0;
		lastTime = time;
		
		update(tpf);
		draw(scene.camera.uV, scene.camera.uP);
	})();

}).call(this)