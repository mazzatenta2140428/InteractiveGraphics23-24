// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform(positionX, positionY, rotation, scale) {
    var cosTheta = Math.cos(rotation * Math.PI / 180);
    var sinTheta = Math.sin(rotation * Math.PI / 180);

    return [
        scale * cosTheta, scale * sinTheta, 0,
        -scale * sinTheta, scale * cosTheta, 0,
        positionX, positionY, 1
    ];
}


// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform(trans1, trans2) {
    var result = [];

    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            var sum = 0;
            for (var k = 0; k < 3; k++) {
                sum += trans1[i * 3 + k] * trans2[k * 3 + j];
            }
            result.push(sum);
        }
    }

    return result;
}
