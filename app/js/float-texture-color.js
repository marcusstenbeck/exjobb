'use strict';
(function () {

	var canvasWidth = 512;
	var canvasHeight = 512;

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

		if(gl.shadowMappingSupported) {
			shadowMapDrawBit(gl);
		}

		drawScene(gl);

		drawDepthMap(gl);
	}

	function drawDepthMap(gl) {
		// drawTexturedQuad(gl, gl.colorTexture, 0, 0, 128, 128);

		// switch back to our shader
		gl.useProgram(shader.program);

		// make sure the depth texture is
		// bound to texture slot 0
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, gl.colorTexture);
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


	function shadowMapDrawBit(gl) {

		gl.useProgram(gl.shadowMapShader.program);

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
 	function shadowMapSetupBit(gl) {
		gl.shadowMappingSupported = true;
		

		// The type of shadow mapping
		gl.shadowMappingType = 'packed_8_bit_texture';

		gl.floatTextureExt = gl.getExtension('OES_texture_float');
		gl.halfFloatTextureExt = gl.getExtension('OES_texture_half_float');

		
		var textureType = gl.UNSIGNED_BYTE;
		
		if(gl.floatTextureExt) {
			gl.shadowMappingType = 'float_texture';
			textureType = gl.FLOAT;
		} else if (gl.halfFloatTextureExt) {
			gl.shadowMappingType = 'half_float_texture';
			gl.HALF_FLOAT_OES = gl.halfFloatTextureExt.HALF_FLOAT_OES;
			textureType = gl.HALF_FLOAT_OES;
		}

		// Create a color texture used for depth
		gl.colorTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, gl.colorTexture);
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
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gl.colorTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, gl.depthBuffer);

		
		// TODO: explain this
		gl.shadowMapShader = new Shader();
		gl.shadowMapShader._vertSrc = [
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

		gl.shadowMapShader._fragSrc = [
			'varying vec4 vPos;',

			'//begin(front)',
			'uniform sampler2D uDepthTexture;',
			'//end(front)',

			'void main(void) {',

			'	vec3 color = vec3(0.0);',
			'	float alpha = 1.0;',
			
			'	//begin(main)',
			'	//end(main)',

			'	gl_FragColor = vec4(color, alpha);',
			'}',
		].join('\n');

		var exponent = '8.0';

		var fsMainBit = [
			'vec3 depth = vPos.xyz / vPos.w;',
			'depth = depth * 0.5 + 0.5;',
			'color = pow(vPos.xyz * 0.5 + 0.5, vec3(' + exponent + '));',
		].join('\n');

		var fsFrontBit = '';
		
		shader.setBit('fs', 'main', [
			'vec3 depth = vPos.xyz / vPos.w;',
			'depth = depth * 0.5 + 0.5;',
			'vec4 texColor = texture2D(uDepthTexture, depth.xy);',
		].join('\n'));
		
		if(gl.shadowMappingType === 'packed_8_bit_texture') {

			// Float textures not supported

			// Add packing function
			fsFrontBit = [
				'vec4 packColor(vec3 color) {',
				'	float maxColor = max(max(color.r, color.g), color.b);',
				'	float exponent = ceil(log(maxColor) / log(2.0));',
				'	float scaledExp = (exponent + 128.0) / 255.0;',
				'	float f = pow(2.0, exponent);',
				'	return vec4(color / f, scaledExp);',
				'}',
			].join('\n');

			// Pack colors
			fsMainBit = [
				fsMainBit,
				'vec4 packedColor = packColor(color);',
				'color = packedColor.rgb;',
				'alpha = packedColor.a;',
			].join('\n');

			// Add unpacking function to regular shader
			shader.setBit('fs', 'front', [
				shader.getBit('fs', 'front'),

				'vec3 unpackColor(vec4 color) {',
				'	float exponent = color.a * 255.0 - 128.0;',
				'	float f = pow(2.0, exponent);',
				'	return color.rgb * f;',
				'}',
			].join('\n'));

			// Packed colors, unpack and pass it on
			shader.setBit('fs', 'main', [
				shader.setBit('fs', 'main'),

				'color = unpackColor(texColor);',
			].join('\n'));
		} else {
			// Floating point colors, pass it on as is
			shader.setBit('fs', 'main', [
				shader.setBit('fs', 'main'),

				'color = texColor.rgb;',
			].join('\n'));
		}

		// Scale the color values down
		shader.setBit('fs', 'main', [
			shader.setBit('fs', 'main'),

			'color = pow(color, vec3(1.0/' + exponent + '));',
		].join('\n'));
		
		
		shader.compileProgram(gl);
		gl.useProgram(shader.program);
		
		gl.shadowMapShader.setBit('fs', 'front', fsFrontBit);
		gl.shadowMapShader.setBit('fs', 'main', fsMainBit);

		gl.shadowMapShader.compileProgram(gl);



		if(gl.shadowMappingType) {
			console.log('Shadow mapping type:', gl.shadowMappingType);
		}
 	}


//------------------------------------------------------//

	window.gl = init(canvasWidth, canvasHeight);
	window.scene = {};
 	
 	setupScene(gl);
 	shadowMapSetupBit(gl);


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