var coordinates = {
    x: 0,
    y: 0,
    z: {
        initialBase: 9,
        base: 9,
        fraction: 0
    },
    hoverPoint: {
        x: 0,
        y: 0
    }
}

var interval = {
    base: 0,
    tenthExponent: 0,
    count: {
        initialValue: 10,
        rateOfChange: 1,
        xValue: 10, //derived from initialValue + zFraction * rateOfChange
        yValue: 0 // y's value is derived from x's value, therefore initial y.value is 0
    },
    pxPerUnit: 0
}

var windowDimensions = {
    width: window.innerWidth,
    height: window.innerHeight
}

var canvas = {
    htmlElement: document.querySelector('#canvas'),
    getCtx: () => {
        var htmlElement = document.querySelector('#canvas');
        return htmlElement.getContext('2d');
    }
}

//calculates initial values and draws grid.
window.onload = () => {
    setCanvasDimensions();
    gridSetUp();
    renderGrid();
}

//fires dragEvent;
document.onmousedown = () => {
    dragEvent();
}

function gridSetUp() {
    clearCanvas();
    windowDimensions.width = window.innerWidth;
    windowDimensions.height = window.innerHeight;
    setCanvasDimensions();
    calculateIntervalBase();
    var deltaXUnits = interval.count.xValue * interval.base * interval.tenthExponent; //Net X Units
    interval.pxPerUnit = windowDimensions.width / deltaXUnits; //pxPerUnit value used for coordinate - and pixel location calculations
}

//custom event(hold mouse button 1 and drag)
function dragEvent(e) {
    e = e || window.event;
    e.preventDefault();
    posX = e.clientX; //browser's x pixels
    posY = e.clientY; //browser's y pixels
    document.onmouseup = () => { //clears event after mouse button has been released
        document.onmouseup = null;
        document.onmousemove = null;
    }
    document.onmousemove = (e) => { //drag party of drag event ;)
        posXDifference = e.clientX - posX;
        posYDifference = e.clientY - posY;
        if (Math.abs(posXDifference) + Math.abs(posYDifference) > 5) { //makes rerendering less frequent to improve performance
            var currentCoordinates = calculateCoordinatesFromPx(e.clientX, e.clientY); //get current coordinates
            var prevCoordinates = calculateCoordinatesFromPx(posX, posY); //get previousCoordinates
            if (currentCoordinates != null && prevCoordinates != null) {
                calculateDragNewMdpt(prevCoordinates[1], currentCoordinates[1], prevCoordinates[0], currentCoordinates[0]);
            }
            renderGrid();
            dragEvent(e);
        }
    }
}

function renderGrid() {
    gridSetUp();
    const tempInterval = interval.base * interval.tenthExponent;
    const roundedX = roundToInterval(coordinates.x, tempInterval);
    const roundedY = roundToInterval(coordinates.y, tempInterval);
    const xOffset = (roundedX - coordinates.x) + coordinates.x;
    const yOffset = (roundedY - coordinates.y) + coordinates.y;
    var unitIntervalCount = windowDimensions.width >= windowDimensions.height ? interval.count.xValue : interval.count.yValue; //interval.count.yValue used for when deltaY > deltaX 
    var subIntervalCount;
    var subAxisFlag = true; //flag used to make subAxes render first then mainAxis so overlapping of lines are consistent
    var i = 0;
    if (tempInterval % (2 * interval.tenthExponent) == 0) { //calculates 
        subIntervalCount = 4;
    } else {
        subIntervalCount = 5;
    }
    while (i <= (unitIntervalCount / 2) + 1) {
        if (i >= (unitIntervalCount + 1) / 2 && subAxisFlag) { //loop resets(code has to be looped twice)
            subAxisFlag = false;
            i = 0; //reset loop 
        }
        let xPositiveCoordinates = calculatePxFromCoordinates((xOffset + (tempInterval * i)), coordinates.y);
        let xNegativeCoordinates = calculatePxFromCoordinates((xOffset - (tempInterval * i)), coordinates.y);
        let yPositiveCoordinates = calculatePxFromCoordinates(coordinates.x, (yOffset + (tempInterval * i)));
        let yNegativeCoordinates = calculatePxFromCoordinates(coordinates.x, (yOffset - (tempInterval * i)));
        if (subAxisFlag) {
            renderSubAxis(xPositiveCoordinates[0], subIntervalCount, true, true);
            renderSubAxis(xNegativeCoordinates[0], subIntervalCount, true, false);
            renderSubAxis(yPositiveCoordinates[1], subIntervalCount, false, false);
            renderSubAxis(yNegativeCoordinates[1], subIntervalCount, false, true);
        } else {
            renderAxis(xPositiveCoordinates[0], xPositiveCoordinates[0], 0, windowDimensions.height, '#A9A9A9'); //renders positive(relative to mdpt) x values
            renderAxis(xNegativeCoordinates[0], xNegativeCoordinates[0], 0, windowDimensions.height, '#A9A9A9'); //renders negative(relative to mdpt) x values
            renderAxis(0, windowDimensions.width, yPositiveCoordinates[1], yPositiveCoordinates[1], '#A9A9A9'); //renders positive(relative to mdtp) y values 
            renderAxis(0, windowDimensions.width, yNegativeCoordinates[1], yNegativeCoordinates[1], '#A9A9A9'); //renders negative(relatvie to mdpt) y values
        }
        i++;
    }
}

function renderAxis(x1, x2, y1, y2, color) {
    if (x1 == null || x2 == null || y1 == null || y2 == null) {
        return; //do nothing
    }
    drawLine(x1, x2, y1, y2, 1, color)
    if (x2 !== windowDimensions.width) {
        return; //end function
    }
}

function renderSubAxis(coordinate, subIntervalCount, isX, isPositive) {
    const tempInterval = interval.base * interval.tenthExponent;
    var i = 1;
    while (i < subIntervalCount) {
        if(coordinate == null) { //if coordinate isn't in bound, end loop
            return;
        }
        var subCoordinatePos = ((tempInterval * interval.pxPerUnit) / subIntervalCount) * i;
        var subCoordinate = isPositive == true ? coordinate + subCoordinatePos : coordinate - subCoordinatePos;
        x1 = isX == true ? subCoordinate : 0;
        x2 = isX == true ? subCoordinate : windowDimensions.width;
        y1 = isX == false ? subCoordinate : 0;
        y2 = isX == false ? subCoordinate : windowDimensions.height;
        drawLine(x1, x2, y1, y2, 0.4, '#E8E8E8');
        i++;
    }
}

function calculateCoordinatesFromPx(xPx, yPx) {
    var mdptX = windowDimensions.width / 2;
    var mdptY = windowDimensions.height / 2;
    if (Math.sign(xPx) == -1 || Math.sign(yPx) == -1 || xPx > windowDimensions.width || yPx > windowDimensions.height) { //checks if pixels aren't negative/out of bounds
        return [null, null];
    } else {
        var x = ((xPx - mdptX) / interval.pxPerUnit) + coordinates.x; //moves x's 0 value from top left to center
        var y = (((yPx * -1) + mdptY) / interval.pxPerUnit) + coordinates.y; //moves y's 0 value from top left to center

        return [x, y];
    }
}

function calculatePxFromCoordinates(x, y) {
    var mdptX = windowDimensions.width / 2;
    var mdptY = windowDimensions.height / 2;

    var xPx = ((x - coordinates.x) * interval.pxPerUnit) + mdptX; //moves xPx's 0 value back to top left, pixels can't be negative, must be cast to positive number
    var yPx = (((y - coordinates.y) * interval.pxPerUnit) - mdptY) * -1; //moves yPx's 0 value back to top left

    if (Math.sign(xPx) == -1 || Math.sign(yPx) == -1 || xPx > windowDimensions.width || yPx > windowDimensions.height) {
        return [null, null];
    } else {
        return [xPx, yPx];
    }
}

function calculateDragNewMdpt(y2, y1, x2, x1) {
    var y = y2 - y1;
    var x = x2 - x1;
    coordinates.y = coordinates.y + y;
    coordinates.x = coordinates.x + x;
}

//1.Increment z.fraction depending on zoomin / -out
//2.handle zoomin / -out looping with handleZFractionLoop function eg -> 7.9 => 8.0(zoomout) || 91.0 => 90.9(zoomin)
//3.calculate the base of the interval based on remainder(remainder = base % 3)
//4.If remainder is 0(base = 1[min]) or 2(base = 5[max]) calculate the tenthExponent of the interval
//5.Set pxPerUnit value(VERY IMPORTANT!!!)
document.addEventListener('wheel', (e) => {
    if (e.deltaY == 100) { //deltaY = 100 if mouseWheelUp
        coordinates.z.fraction++;
        handleZFractionLoop();
    } else if (e.deltaY == -100) { //deltaY = -100 if mouseWheelDown
        coordinates.z.fraction--;
        handleZFractionLoop();
    }
    var deltaXUnits = interval.count.xValue * interval.base * interval.tenthExponent; //Net X Units
    interval.pxPerUnit = windowDimensions.width / deltaXUnits; //pxPerUnit value used for coordinate - and pixel location calculations
    renderGrid();
});

function handleZFractionLoop() {
    if (coordinates.z.fraction == 10) { //handles zoom out looping
        coordinates.z.base++;
        coordinates.z.fraction = 0;
        calculateIntervalBase();
    } else if (coordinates.z.fraction == -1) { //handles zoom in looping
        coordinates.z.base--;
        coordinates.z.fraction = 9;
        calculateIntervalBase();
    }
}

function calculateIntervalBase() {
    setIntervalCount();
    var zBaseRemainder = coordinates.z.base % 3;
    switch (zBaseRemainder) {
        case 0:
            interval.base = 1;
            calculateIntervalExponent(zBaseRemainder); //when moving from interval base of 5 -> 1
        case 1:
            interval.base = 2;
        case 2:
            interval.base = 5;
            calculateIntervalExponent(zBaseRemainder); //when moving from interval base of 1 -> 5
        default:
            //do nothings
    }
}

function setIntervalCount() {
    interval.count.xValue = interval.count.initialValue + coordinates.z.fraction * interval.count.rateOfChange; //causes fractal effect when zooming out
    interval.count.yValue = (windowDimensions.height / windowDimensions.width) * interval.count.xValue; //formula for deltaY
}

function calculateIntervalExponent(remainder) {
    var defaultZDifference = coordinates.z.base - coordinates.z.initialBase - remainder; //remainder is minused to "round" to the 1st factor of 3 below the current base.
    interval.tenthExponent = 10 ** (defaultZDifference / 3);
}

function setCanvasDimensions() {
    canvas.htmlElement.height = windowDimensions.height;
    canvas.htmlElement.width = windowDimensions.width;
    canvas.width = windowDimensions.width;
    canvas.height = windowDimensions.height;
}

window.addEventListener('resize', () => {
    setCanvasDimensions();
    gridSetUp();
    renderGrid();
});

function drawLine(x1, x2, y1, y2, lineWidth, lineColor) {
    const ctx = canvas.getCtx();
    ctx.font = "12  px Arial";
    ctx.fillText("2 x10^3", 10, 50);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = lineWidth + 0.5;
    ctx.strokeStyle = lineColor;
    ctx.stroke();
}

function clearCanvas() {
    const ctx = canvas.getCtx();
    ctx.clearRect(0, 0, windowDimensions.width, windowDimensions.height); //easy way to clear canvas.
}

function roundToInterval(num, interval) {
    var remainder = num % interval;
    if (remainder >= interval / 2) {
        num = num + (interval - remainder);
    } else {
        num = num - remainder;
    }
    return num;
}