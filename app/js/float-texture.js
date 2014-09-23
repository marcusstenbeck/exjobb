'use strict';
(function () {

	var canvasWidth = 2048;
	var canvasHeight = 128;


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



	function draw(uV, uP) {
		bindScene(gl, shader, gl.model);

		if(gl.floatTextureSupported) {
			floatTextureDrawBit(gl);
		}

		drawScene(gl);//, scene.camera.uV, scene.camera.uP);

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
			// Diagonal square
				-1.0, -1.0,  1.0,  0.0,  0.0,  0.0,  0.0,  0.0,
				-1.0,  1.0,  1.0,  0.0,  0.0,  0.0,  0.0,  0.0,
				 1.0,  1.0, -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,
				 1.0, -1.0, -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,
			];
		// Create vertex buffer
		gl.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gl.model.vertices), gl.STATIC_DRAW);


		/**
		 *  Setup index buffer
		 */
		gl.model.indices = [
			// Diagonal square
				0, 1, 2,
				2, 3, 0
		];
		// Create index buffer
		gl.iBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.iBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(gl.model.indices), gl.STATIC_DRAW);


		/**
		 *  Build and setup shader program
		 */
		window.shader = new Shader();

		shader._vertSrc = [
			'attribute vec3 aVertexPosition;',

			'varying vec4 vPos;',
			
			'//begin(front)',
			'//end(front)',
			
			'void main() {',
			'	vPos = vec4(aVertexPosition, 1.0);',
			
			'	//begin(main)',
			'	//end(main)',

			'	gl_Position = vPos;',
			'}'
		].join('\n');
		

		shader.setBit('fs', 'front', [
			'uniform sampler2D uDepthTexture;',

			'vec3 valueToRGB(float value) {',
			'	vec3 rgb = vec3(0.0);',
			'	float width = 1.0/7.0;',
			'	rgb.r = clamp(min(1.0, mix(0.0, 1.0, value / width)) * min(1.0, mix(1.0, 0.0, (value - 2.0*width) / width)), 0.0, 1.0) + clamp(min(1.0, mix(0.0, 1.0, (value - 5.0*width) / width)), 0.0, 1.0);',
			'	rgb.g = clamp(min(1.0, mix(0.0, 1.0, (value - width) / width)) * min(1.0, mix(1.0, 0.0, (value - 4.0*width) / width)), 0.0, 1.0) + clamp(min(1.0, mix(0.0, 1.0, (value - 6.0*width) / width)), 0.0, 1.0);',
			'	rgb.b = clamp(min(1.0, mix(0.0, 1.0, (value - 3.0*width) / width)) * min(1.0, mix(1.0, 0.0, (value - 6.0*width) / width)), 0.0, 1.0) + clamp(min(1.0, mix(0.0, 1.0, (value - 6.0*width) / width)), 0.0, 1.0);',
			'	return rgb;',
			'}',
		].join('\n'));

		shader.setBit('fs', 'main', [
			'vec3 depth = vPos.xyz / vPos.w;',
			'depth = depth * 0.5 + 0.5;',
			'float depthValue = texture2D(uDepthTexture, depth.xy).r;',

			'color = valueToRGB(depthValue);'
		].join('\n'));


		shader.compileProgram(gl);
		gl.useProgram(shader.program);
	}

	
	function drawScene(gl, uV, uP) {
		// Draw scene
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, canvasWidth, canvasHeight);

		gl.drawElements(gl.TRIANGLES, gl.model.indices.length, gl.UNSIGNED_SHORT, 0);
	}


//--SHADOW MAPPING SETUP----------------------------------//


	function floatTextureDrawBit(gl) {

		gl.useProgram(gl.floatTextureShader.program);

		// Draw shadow map
		gl.bindFramebuffer(gl.FRAMEBUFFER, gl.framebuffer);
		gl.viewport(0, 0, canvasWidth, canvasHeight);
		gl.clear(gl.DEPTH_BUFFER_BIT);
		
		gl.drawElements(gl.TRIANGLES, gl.model.indices.length, gl.UNSIGNED_SHORT, 0);

		gl.useProgram(shader.program);
	}


	/**
	 *  Create depth texture stuff
	 */
 	function floatTextureSetupBit(gl) {
		gl.floatTextureSupported = true;
		

		// The type of shadow mapping
		gl.floatTextureType = 'packed_8_bit_texture';

		var textureType = gl.UNSIGNED_BYTE;

		gl.floatTextureExt = gl.getExtension('OES_texture_float');
		gl.halfFloatTextureExt = gl.getExtension('OES_texture_half_float');

		if(gl.floatTextureExt) {
			gl.floatTextureType = 'float_texture';
			textureType = gl.FLOAT;
		} else if (gl.halfFloatTextureExt) {
			gl.floatTextureType = 'half_float_texture';
			gl.HALF_FLOAT_OES = gl.halfFloatTextureExt.HALF_FLOAT_OES;
			textureType = gl.HALF_FLOAT_OES;
		}

		// Create a color texture used for depth
		gl.depthTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, gl.depthTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvasWidth, canvasHeight, 0, gl.RGBA, textureType, null);


		// Create the depth buffer
		gl.depthBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, gl.depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvasWidth, canvasHeight);

		// Create the framebuffer
		gl.framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, gl.framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gl.depthTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, gl.depthBuffer);

		

		gl.floatTextureShader = new Shader();
		gl.floatTextureShader._vertSrc = [
			'attribute vec3 aVertexPosition;',

			'varying vec4 vPos;',
			
			'//begin(front)',
			'//end(front)',
			
			'void main() {',
			'	vPos = vec4(aVertexPosition, 1.0);',
			
			'	//begin(main)',
			'	//end(main)',

			'	gl_Position = vPos;',
			'}'
		].join('\n');
		

		gl.floatTextureShader.setBit('fs', 'front', [
			'uniform sampler2D uDepthTexture;',

			'vec3 floatToRGB(float value) {',
			'	vec3 rgb = vec3(0.0);',
			'	float width = 1.0/7.0;',
			'	rgb.r = clamp(min(1.0, mix(0.0, 1.0, value / width)) * min(1.0, mix(1.0, 0.0, (value - 2.0*width) / width)), 0.0, 1.0) + clamp(min(1.0, mix(0.0, 1.0, (value - 5.0*width) / width)), 0.0, 1.0);',
			'	rgb.g = clamp(min(1.0, mix(0.0, 1.0, (value - width) / width)) * min(1.0, mix(1.0, 0.0, (value - 4.0*width) / width)), 0.0, 1.0) + clamp(min(1.0, mix(0.0, 1.0, (value - 6.0*width) / width)), 0.0, 1.0);',
			'	rgb.b = clamp(min(1.0, mix(0.0, 1.0, (value - 3.0*width) / width)) * min(1.0, mix(1.0, 0.0, (value - 6.0*width) / width)), 0.0, 1.0) + clamp(min(1.0, mix(0.0, 1.0, (value - 6.0*width) / width)), 0.0, 1.0);',
			'	return rgb;',
			'}',
		].join('\n'));

		gl.floatTextureShader.setBit('fs', 'main', [
			'vec3 depth = vPos.xyz / vPos.w;',
			'depth = depth * 0.5 + 0.5;',

			'color = vec3(depth.z);'
		].join('\n'));


		var fsMainBit = '';

		if(gl.floatTextureType === 'packed_8_bit_texture') {
			gl.floatTextureShader.setBit('fs', 'front', [
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
			].join('\n'));

			fsMainBit = [
				'vec3 depth = vPos.xyz / vPos.w;',
				'depth = depth * 0.5 + 0.5;',

				'vec4 packedDepth = pack(depth.z);',
				'color = packedDepth.rgb;',
				'alpha = packedDepth.a;',
			].join('\n');



			// make sure the main shader unpacks the values
			shader.setBit('fs', 'front', [
				shader.getBit('fs', 'front'),
				
				'float unpack (vec4 colour)',
				'{',
				'	const vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0),',
				'								1.0 / (256.0 * 256.0),',
				'								1.0 / 256.0,',
				'								1);',
				'	return dot(colour, bitShifts);',
				'}',
			].join('\n'));

			shader.setBit('fs', 'main', [
				'vec3 depth = vPos.xyz / vPos.w;',
				'depth = depth * 0.5 + 0.5;',
				'float depthValue = unpack(texture2D(uDepthTexture, depth.xy));',

				'color = valueToRGB(depthValue);',
			].join('\n'));

			shader.compileProgram(gl);
			gl.useProgram(shader.program);
		} else {
			fsMainBit = [
				'vec3 depth = vPos.xyz / vPos.w;',
				'depth = depth * 0.5 + 0.5;',

				'color = vec3(depth.z);'
			].join('\n');
		}
		
		gl.floatTextureShader.setBit('fs', 'main', fsMainBit);

		gl.floatTextureShader.compileProgram(gl);



		if(gl.floatTextureType) {
			console.log('Shadow mapping type:', gl.floatTextureType);
		}
 	}


//------------------------------------------------------//

	window.gl = init();
	window.scene = {};
 	
 	setupScene(gl);
 	floatTextureSetupBit(gl);


	var lastTime = 0;
	var tpf = 0;
	document.write('<div id="tpf"></div>');
	(function loop(time) {
		window.requestAnimationFrame(loop);
		tpf = time - lastTime || 0;
		lastTime = time;
		
		update(tpf);
		draw();//scene.camera.uV, scene.camera.uP);
	})();

}).call(this)