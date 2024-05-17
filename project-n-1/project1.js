function composite(bgImg, fgImg, fgOpac, fgPos) {

    var bgWidth = bgImg.width;
    var bgHeight = bgImg.height;
    var fgWidth = fgImg.width;
    var fgHeight = fgImg.height;

    var startX = Math.max(0, fgPos.x);
    var startY = Math.max(0, fgPos.y);
    var endX = Math.min(bgWidth, fgPos.x + fgWidth);
    var endY = Math.min(bgHeight, fgPos.y + fgHeight);

    for (var y = startY; y < endY; y++) {
        for (var x = startX; x < endX; x++) {

            var fgX = x - fgPos.x;
            var fgY = y - fgPos.y;

            var bgIndex = (y * bgWidth + x) * 4;

            var fgIndex = (fgY * fgWidth + fgX) * 4;

            var alpha = fgImg.data[fgIndex + 3] / 255 * fgOpac;

            for (var i = 0; i < 3; i++) {

                var bgComponent = bgImg.data[bgIndex + i];
                var fgComponent = fgImg.data[fgIndex + i];

                bgImg.data[bgIndex + i] = Math.round(bgComponent * (1 - alpha) + fgComponent * alpha);
            }

            bgImg.data[bgIndex + 3] = Math.round((1 - alpha) * bgImg.data[bgIndex + 3] + alpha * fgImg.data[fgIndex + 3]);
        }
    }
}
