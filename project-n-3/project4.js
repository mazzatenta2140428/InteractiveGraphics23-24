// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
    // Calcola la posizione della telecamera rispetto alla scena
    var cosX = Math.cos(-rotationX);
    var sinX = Math.sin(-rotationX);
    var cosY = Math.cos(-rotationY);
    var sinY = Math.sin(-rotationY);

    // Calcola la matrice di rotazione
    var rotationMatrix = [
        cosY, 0, sinY, 0,
        sinX * sinY, cosX, -sinX * cosY, 0,
        -cosX * sinY, sinX, cosX * cosY, 0,
        0, 0, 0, 1
    ];

    // Calcola la matrice di traslazione
    var trans = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    // Combinazione della traslazione e della rotazione
    var modelMatrix = MatrixMult(trans, rotationMatrix);

    // Moltiplica la matrice di proiezione con la matrice di modello
    var modelViewProjectionMatrix = MatrixMult(projectionMatrix, modelMatrix);

    return modelViewProjectionMatrix;
}

// [TO-DO] Complete the implementation of the following class.

class MeshDrawer {
    constructor() {
        this.vertexBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.texture= gl.createTexture();

        var vsSource = `
            attribute vec4 aPosition;
            attribute vec2 aTexCoord;
            uniform mat4 uModelViewProjection;
            uniform int uSwapYZ;
            varying vec2 vTexCoord;
            
            void main() {
                // Se lo swap è attivo, scambia Y e Z durante la trasformazione
                vec4 position;
                if (uSwapYZ == 1) {
                    position = vec4(aPosition.x, aPosition.z, aPosition.y, aPosition.w);
                } else {
                    position = aPosition;
                }
            
                gl_Position = uModelViewProjection * position;
                vTexCoord = aTexCoord;
            }
        `;

        var fsSource = `
            precision mediump float;
            varying vec2 vTexCoord;
            uniform sampler2D uSampler;
            uniform int uUseTexture;
            void main() {
                if (uUseTexture == 1) {
                    gl_FragColor = texture2D(uSampler, vTexCoord);
                } else {
                    gl_FragColor = vec4(1, gl_FragCoord.z * gl_FragCoord.z, 0, 1);
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

        this.uUseTextureLocation = gl.getUniformLocation(this.shaderProgram, "uUseTexture");
        this.uSamplerLocation = gl.getUniformLocation(this.shaderProgram, "uSampler");
        this.uSwapYZ = gl.getUniformLocation(this.shaderProgram, "uSwapYZ");
    }

    setMesh(vertPos, texCoords) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        this.numTriangles = vertPos.length / 3;
    }

    swapYZ(swap) {
        gl.useProgram(this.shaderProgram);
        gl.uniform1i(this.uSwapYZ, swap ? 1 : 0);
    }

    draw(trans) {

        gl.useProgram(this.shaderProgram);

        var positionAttributeLocation = gl.getAttribLocation(this.shaderProgram, "aPosition");
        var texCoordAttributeLocation = gl.getAttribLocation(this.shaderProgram, "aTexCoord");
        var uModelViewProjection = gl.getUniformLocation(this.shaderProgram, "uModelViewProjection");
        

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(texCoordAttributeLocation);
        gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(uModelViewProjection, false, trans);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.uSamplerLocation, 0);

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    setTexture(img) {

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        
        this.showTexture(true); 
    }

    showTexture(show) {
        gl.useProgram(this.shaderProgram);
        gl.uniform1i(this.uUseTextureLocation, show ? 1 : 0);
    }
}

