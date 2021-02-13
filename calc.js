var coordinates = {
    x: 0,
    y: 0,
    z: {
        //base is a relative unit to determine interval size. Factors of 3 to allow 3 bases(1, 2, 5), 45 allows zoomining in to a factor of 10e-15 and zooming out to a factor of 10e21
        initialBase: 45, 
        base: 45, 
        fraction: 5
    },
    hoverPoint: {
        x: 0,
        y: 0
    }
}

var interval = {
    base: 1,
    tenthExponent: 1,
    count: {
        initialValue: 10,
        rateOfChange: 0.7,
        xValue: 0, //derived from initialValue + zFraction * rateOfChange
        yValue: 0, // y's value is derived from x's value, therefore initial y.value is 0
        xTextOnY0Axis: true, //flag for rendering x interval's on y = 0 if true or on horizontal sides of window if false
        yTextOnX0Axis: true //flag for rendering y interval's on x = 0 if true or on vertical sides of window if false
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
    setIntervalCount();
    renderGrid();
}

//fires dragEvent;
window.onmousedown = () => {
    dragEvent();
}

function gridSetUp() {
    console.log(interval.base * interval.tenthExponent);
    clearCanvas();
    windowDimensions.width = window.innerWidth;
    windowDimensions.height = window.innerHeight;
    setCanvasDimensions();
    setIntervalCount();
    var deltaXUnits = interval.count.xValue * interval.base * interval.tenthExponent; //Net X Units
    interval.pxPerUnit = windowDimensions.width / deltaXUnits; //pxPerUnit value used for coordinate - and pixel location calculations
}

//custom event(hold mouse button 1 and drag)
function dragEvent(e) {
    e = e || window.event;
    e.preventDefault();
    posX = e.clientX; //browser's x pixels
    posY = e.clientY; //browser's y pixels
    window.onmouseup = () => { //clears event after mouse button has been released
        window.onmouseup = null;
        window.onmousemove = null;
    }
    window.onmousemove = (e) => { //drag party of drag event ;)
        posXDifference = e.clientX - posX;
        posYDifference = e.clientY - posY;
        if (Math.abs(posXDifference) + Math.abs(posYDifference) > 1) { //makes rerendering less frequent to improve performance
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
    var unitIntervalCount = windowDimensions.width >= windowDimensions.height ? interval.count.xValue : interval.count.yValue; //interval.count.yValue used for when deltaY > deltaX(browser height > width)
    var subIntervalCount;
    var i = 0;
    var j = 0;
    interval.xTextOnY0Axis = false;
    interval.yTextOnX0Axis = false;
    if (tempInterval % (2 * interval.tenthExponent) == 0) { //calculates 
        subIntervalCount = 4;
    } else {
        subIntervalCount = 5;
    }
    //2 while loops used to keep z-index of intersecting lines consistent
    while (i <= (unitIntervalCount / 2) + 1) { 
        let xPositiveCoordinates = calculatePxFromCoordinates((xOffset + (tempInterval * i)), coordinates.y);  
        let xNegativeCoordinates = calculatePxFromCoordinates((xOffset - (tempInterval * i)), coordinates.y); 
        let yPositiveCoordinates = calculatePxFromCoordinates(coordinates.x, (yOffset + (tempInterval * i))); 
        let yNegativeCoordinates = calculatePxFromCoordinates(coordinates.x, (yOffset - (tempInterval * i))); 
        renderSubAxis(xPositiveCoordinates[0], subIntervalCount, true, true); //renders positive(relative to mdpt) x subValues
        renderSubAxis(xNegativeCoordinates[0], subIntervalCount, true, false); //renders negative(relative to mdpt) x subValues
        renderSubAxis(yPositiveCoordinates[1], subIntervalCount, false, false); //renders positive(relative to mdpt) y subValues
        renderSubAxis(yNegativeCoordinates[1], subIntervalCount, false, true); //renders negative(relative to mdpt) y subValues
        i++;
    }
    while (j <= (unitIntervalCount / 2) + 1) {
        let xPositiveCoordinates = calculatePxFromCoordinates((xOffset + (tempInterval * j)), coordinates.y);
        let xNegativeCoordinates = calculatePxFromCoordinates((xOffset - (tempInterval * j)), coordinates.y);
        let yPositiveCoordinates = calculatePxFromCoordinates(coordinates.x, (yOffset + (tempInterval * j)));
        let yNegativeCoordinates = calculatePxFromCoordinates(coordinates.x, (yOffset - (tempInterval * j)));
        renderAxis(xPositiveCoordinates[0], xPositiveCoordinates[0], 0, windowDimensions.height, (xOffset + (tempInterval * j)), true); //renders positive(relative to mdpt) x values
        renderAxis(xNegativeCoordinates[0], xNegativeCoordinates[0], 0, windowDimensions.height, (xOffset - (tempInterval * j)), true); //renders negative(relative to mdpt) x values
        renderAxis(0, windowDimensions.width, yPositiveCoordinates[1], yPositiveCoordinates[1], (yOffset + (tempInterval * j)), false); //renders positive(relative to mdtp) y values 
        renderAxis(0, windowDimensions.width, yNegativeCoordinates[1], yNegativeCoordinates[1], (yOffset - (tempInterval * j)), false); //renders negative(relatvie to mdpt) y values
        j++
    }
}

function renderAxis(x1, x2, y1, y2, coordinate, isX) {
    if (x1 == null || x2 == null || y1 == null || y2 == null) {
        return; //do nothing
    }
    if(coordinate == 0) {
        drawLine(x1, x2, y1, y2, 1, "black");
        if(isX) {
            interval.xTextOnY0Axis = true;
        } else {
            interval.yTextOnX0Axis = true;
        }
    } else {
        drawLine(x1, x2, y1, y2, 1, "#989898");
    }
    if(isX && interval.xTextOnY0Axis == true) {
        
    }
}

function drawIntervalText(intervalBase, x, y) {
    const ctx = canvas.getCtx();
    ctx.scale(2, 2);
    ctx.font = 9 + "px Verdana";
    if(interval.tenthExponent >= 1000000) {
        ctx.fillText(intervalBase + " x10", x, y);
        ctx.fillText(Math.log10(interval.tenthExponent), x + 25, y - 5);
    } else {
        ctx.fillText(intervalBase * interval.tenthExponent, x, y);
    }
    ctx.scale(1, 1)
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
        drawLine(x1, x2, y1, y2, 1, "#E0E0E0");
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

window.addEventListener('wheel', (e) => {
    let posX = e.pageX; //browser's x pixels
    let posY = e.pageY; //browser's y pixels
    let oldHoverCoordinates = calculateCoordinatesFromPx(posX, posY);
    if (e.deltaY == 100 && coordinates.z.base != 110) { //deltaY = 100 if mouseWheelUp
        coordinates.z.fraction++;
        initZoomEvent(oldHoverCoordinates, posX, posY);
    } else if (e.deltaY == -100 && coordinates.z.base != 0) { //deltaY = -100 if mouseWheelDown
        coordinates.z.fraction--;
        initZoomEvent(oldHoverCoordinates, posX, posY)
    }
    renderGrid();
});

function initZoomEvent(oldHoverCoordinates, posX, posY) {
    handleZFractionLoop();
    setIntervalCount();
    gridSetUp(); //need to run this before getting the new hoverCoordinates
    let newHoverCoordinates = calculateCoordinatesFromPx(posX, posY);
    calculateMdptFromHoverpointZoom(oldHoverCoordinates, newHoverCoordinates)
}

function calculateMdptFromHoverpointZoom(oldHoverCoordinates, newHoverCoordinates) {
    let hoverOffsetX = oldHoverCoordinates[0] - newHoverCoordinates[0];
    let hoverOffsetY = oldHoverCoordinates[1] - newHoverCoordinates[1];
    coordinates.x += hoverOffsetX;
    coordinates.y += hoverOffsetY;
}

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

function setIntervalCount() {
    interval.count.xValue = interval.count.initialValue + coordinates.z.fraction;
    interval.count.yValue = (windowDimensions.height / windowDimensions.width) * interval.count.xValue; //formula for deltaY
}

function calculateIntervalBase() {
    var zBaseRemainder = coordinates.z.base % 3;
    switch (zBaseRemainder) {
        case 0:
            interval.base = 1;
            calculateIntervalExponent(zBaseRemainder); //when moving from interval base of 5 -> 1
            return;
        case 1:
            interval.base = 2;
            return;
        case 2:
            interval.base = 5;
            calculateIntervalExponent(zBaseRemainder); //when moving from interval base of 1 -> 5
            return;
        default:
            return; //do nothing
    }
}

function calculateIntervalExponent(remainder) {
    var defaultZDifference = coordinates.z.base - coordinates.z.initialBase - remainder; //remainder is minused to "round" to the 1st factor of 3 below the current base.
    interval.tenthExponent = 10 ** (defaultZDifference / 3);
}

function setCanvasDimensions() {
    canvas.htmlElement.width = windowDimensions.width;
    canvas.htmlElement.height = windowDimensions.height
}

window.addEventListener('resize', () => {
    gridSetUp();
    renderGrid();
});

function drawLine(x1, x2, y1, y2, lineWidth, lineColor) {
    const ctx = canvas.getCtx();
    ctx.beginPath();
    x1 = Math.round(x1) + 0.5;
    x2 = Math.round(x2) + 0.5;
    if(y1 == y2) {
        y1 = Math.round(y1) + 0.5;
        y2 = Math.round(y2) + 0.5;
    }
    ctx.moveTo(x1, y1); 
    ctx.lineTo(x2, y2);
    ctx.lineWidth = lineWidth;
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