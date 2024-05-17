// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
    // Calcola la matrice di traslazione
    var trans = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    // Calcola la matrice di rotazione attorno all'asse x
    var cosX = Math.cos(rotationX);
    var sinX = Math.sin(rotationX);
    var rotationMatrixX = [
        1, 0, 0, 0,
        0, cosX, sinX, 0,
        0, -sinX, cosX, 0,
        0, 0, 0, 1
    ];

    // Calcola la matrice di rotazione attorno all'asse y
    var cosY = Math.cos(rotationY);
    var sinY = Math.sin(rotationY);
    var rotationMatrixY = [
        cosY, 0, -sinY, 0,
        0, 1, 0, 0,
        sinY, 0, cosY, 0,
        0, 0, 0, 1
    ];

    // Combinazione delle traslazioni e delle rotazioni
    var mv = MatrixMult(trans, MatrixMult(rotationMatrixX, rotationMatrixY));

    return mv;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
        this.vertexBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();
		this.texture= gl.createTexture();

        var vsSource = `
            attribute vec4 aPosition;
            attribute vec2 aTexCoord;
            attribute vec3 aNormal;
            uniform mat4 uModelViewProjection;
            uniform mat4 uModelView;
            uniform mat3 uNormalMatrix;
            varying vec2 vTexCoord;
            varying vec3 vNormal;
			uniform int uSwapYZ;

            void main() {

				vec4 position;
                
                if (uSwapYZ == 1) {
                    position = vec4(aPosition.x, aPosition.z, aPosition.y, aPosition.w);
                } else {
                    position = aPosition;
                }

                gl_Position = uModelViewProjection * position;
                vNormal = normalize(uNormalMatrix * aNormal);
                vTexCoord = aTexCoord;
            }
        `;

        var fsSource = `
            precision mediump float;
            varying vec2 vTexCoord;
            varying vec3 vNormal;
            uniform sampler2D uSampler;
            uniform vec3 uLightDir;
            uniform float uShininess;
            uniform int uUseTexture;
            

            void main() {
                
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(uLightDir);
                float intensity = max(dot(normal, lightDir), 0.0);
            
                vec3 viewDir = normalize(-vec3(0.0, 0.0, 1.0));
                vec3 halfVec = normalize(lightDir + viewDir);
                float specularAngle = max(dot(normal, halfVec), 0.0);
                float specularIntensity = pow(specularAngle, uShininess);
            
                vec3 finalColor = (intensity + specularIntensity) * vec3(1.0) + vec3(0.2); 
            
                vec4 textureColor = texture2D(uSampler, vTexCoord);
            
                if (uUseTexture == 1) {
                    gl_FragColor = vec4(finalColor * textureColor.rgb + specularIntensity, 1.0);
                } else {
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            }
        `;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vsSource);
        gl.compileShader(vertexShader);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fsSource);
        gl.compileShader(fragmentShader);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        gl.useProgram(shaderProgram);
        this.shaderProgram = shaderProgram;

        this.uSamplerLocation = gl.getUniformLocation(this.shaderProgram, "uSampler");
		this.uUseTextureLocation = gl.getUniformLocation(this.shaderProgram, "uUseTexture");
		this.uSwapYZLocation = gl.getUniformLocation(this.shaderProgram, "uSwapYZ");

		this.uNormalMatrixLocation = gl.getUniformLocation(this.shaderProgram, "uNormalMatrix");
		this.uModelViewProjectionLocation = gl.getUniformLocation(this.shaderProgram, "uModelViewProjection");
		this.uModelViewLocation = gl.getUniformLocation(this.shaderProgram, "uModelViewLocation");

        this.uLightDirLocation = gl.getUniformLocation(this.shaderProgram, "uLightDir");
        this.uShininessLocation = gl.getUniformLocation(this.shaderProgram, "uShininess");

    }
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	
		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		gl.useProgram(this.shaderProgram);
    	gl.uniform1i(this.uSwapYZLocation, swap ? 1 : 0);
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram(this.shaderProgram);

        var positionAttributeLocation = gl.getAttribLocation(this.shaderProgram, "aPosition");
        var texCoordAttributeLocation = gl.getAttribLocation(this.shaderProgram, "aTexCoord");
        var normalAttributeLocation = gl.getAttribLocation(this.shaderProgram, "aNormal");

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(texCoordAttributeLocation);
        gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(this.uModelViewProjectionLocation, false, matrixMVP);
        gl.uniformMatrix4fv(this.uModelViewLocation, false, matrixMV);
        gl.uniformMatrix3fv(this.uNormalMatrixLocation, false, matrixNormal);

        gl.uniform1i(this.uSamplerLocation, 0);

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture
		gl.activeTexture(gl.TEXTURE0);
    	gl.bindTexture(gl.TEXTURE_2D, this.texture);

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		this.showTexture(true);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram(this.shaderProgram);
    	gl.uniform1i(this.uUseTextureLocation, show ? 1 : 0);
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.shaderProgram);
    	gl.uniform3f(this.uLightDirLocation, x, y, z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.shaderProgram);
    	gl.uniform1f(this.uShininessLocation, shininess);
	}
}


// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	var forces = Array( positions.length ).fill(new Vec3(0, 0, 0));
	var top = new Vec3(-1.0,-1.0,-1.0); 
	var bottom = new Vec3(1.0,1.0,1.0); 

	// [TO-DO] Compute the total force of each particle
	for(let i = 0; i < springs.length; i++){
		let spring = springs[i];

		let x0 = positions[spring.p0]; 
		let x1 = positions[spring.p1];

		let v0 = velocities[spring.p0]; 
		let v1 = velocities[spring.p1]; 

		let dir = x1.sub(x0).unit(); 
        let len = x1.sub(x0).len();

		let springForce = dir.mul(stiffness * (len - spring.rest));
		forces[spring.p0] = forces[spring.p0].add(springForce); 
		forces[spring.p1] = forces[spring.p1].add(springForce.mul(-1.0));

		let speedVar = v1.sub(v0).dot(dir);
		let dampingForce = dir.mul(speedVar).mul(damping)
		forces[spring.p0] = forces[spring.p0].add(dampingForce); 
		forces[spring.p1] = forces[spring.p1].add(dampingForce.mul(-1.0));
	}
	
	// [TO-DO] Update positions and velocities
	// [TO-DO] Handle collisions
	for(let j = 0; j < velocities.length; j++){
		let acc = forces[j].div(particleMass).add(gravity); 
		velocities[j] = velocities[j].add(acc.mul(dt));
	}

	for(let k = 0; k < positions.length; k++){
		positions[k] = positions[k].add(velocities[k].mul(dt));

		let pos = positions[k];
        let vel = velocities[k];

		if(pos.x < top.x){
			let a = Math.abs(pos.x) - Math.abs(top.x); 
			pos.x += a + (a * restitution);
			vel.x = vel.x*(-restitution);
		}
		if(pos.y < top.y){
			let a = Math.abs(pos.y) - Math.abs(top.y); 
			pos.y += a + (a * restitution);
			vel.y = vel.y*(-restitution);
		}
		if(pos.z < top.z){
			let a = Math.abs(pos.z) - Math.abs(top.z); 
			pos.z += a + (a * restitution);
			vel.z = vel.z*(-restitution);
		}

		if(pos.x > bottom.x){
			let a = Math.abs(pos.x) - Math.abs(bottom.x); 
			pos.x -= a + (a * restitution);
			vel.x = vel.x*(-restitution);
		}
		if(pos.y > bottom.y){
			let a = Math.abs(pos.y) - Math.abs(bottom.y); 
			pos.y -= a + (a * restitution);
			vel.y = vel.y*(-restitution);
		}
		if(pos.z > bottom.z){
			let a = Math.abs(pos.z) - Math.abs(bottom.z); 
			pos.z -= a + (a * restitution);
			vel.z = vel.z*(-restitution);
		}
	}
}

