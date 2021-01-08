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

var unitInterval = {
    base: 0,
    exponent: 0, //10 is squared by this exponent property
    count: { 
        initialValue: 10,
        value: 10, //based on z's fraction value
        rateOfChange: 1.5
    },
    pxPerUnit: 0
}

var windowDimensions = {
    width: window.innerWidth,
    height: window.innerHeight
}

var canvas = {
    htmlElement: document.querySelector('#canvas'),
    getCtx:() => {
        var htmlElement = document.querySelector('#canvas');
        return htmlElement.getContext('2d');
    }
}

//calculates initial values and draws grid.
window.onload = () => {
    calculateIntervalBase();
    var deltaXUnits = unitInterval.count.value * unitInterval.base * 10 ** unitInterval.exponent; //Net X Units
    unitInterval.pxPerUnit = windowDimensions.width / deltaXUnits; //pxPerUnit value used for coordinate - and pixel location calculations
    renderGrid();
}

//fires dragEvent;
document.onmousedown = () => {
    dragEvent();
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
        if(Math.abs(posXDifference) + Math.abs(posYDifference) > 5) { //makes rerendering less frequent to improve performance
            var currentCoordinates = calculateCoordinatesFromPx(e.clientX, e.clientY); //get current coordinates
            var prevCoordinates = calculateCoordinatesFromPx(posX, posY); //get previousCoordinates
            if(currentCoordinates != null && prevCoordinates != null) {
                calculateDragNewMdpt(prevCoordinates[1], currentCoordinates[1], prevCoordinates[0], currentCoordinates[0]);
            }
            renderGrid();
            dragEvent(e);
        }
    }
}

function renderGrid() {
    setCanvasDimensions();
    clearCanvas();
    const tenthPower = 10 ** unitInterval.exponent
    const unit = unitInterval.base * tenthPower;
    const roundedX = intToIntRounder(coordinates.x, unit);
    const roundedY =  intToIntRounder(coordinates.y, unit);
    const xOffset = (roundedX - coordinates.x) + coordinates.x;
    const yOffset = (roundedY - coordinates.y) + coordinates.y;
    var i = 0;
    while(i <= (unitInterval.count.value / 2) + 1) {
        renderXAxis(i, xOffset, unit);
        renderYAxis(i, yOffset, unit);
        i++;
    }
}

function renderXAxis(index, offset, unit) {
    var x = offset + (unit * index); //positive x value(s)
    var xPositiveCoordinates = calculatePxFromCoordinates(x, coordinates.y);
    x = offset - (unit * index); //negative x value(s)
    var xNegativeCoordinates = calculatePxFromCoordinates(x, coordinates.y);
    if(xPositiveCoordinates == null || index == 0) {
        //do nothing
    } 
    else {
        drawLine(xPositiveCoordinates[0], xPositiveCoordinates[0], 0, windowDimensions.height, 1, 'black');
    }
    if(xNegativeCoordinates == null) {
        //do nothing   
    }
    else {
        drawLine(xNegativeCoordinates[0], xNegativeCoordinates[0], 0, windowDimensions.height, 1, 'black');
    }
}

function renderYAxis(index, offset, unit) {
    var y = offset + (unit * index); //positive x value(s)
    var yPositiveCoordinates = calculatePxFromCoordinates(coordinates.x, y);
    y = offset - (unit * index); //negative x value(s)
    var yNegativeCoordinates = calculatePxFromCoordinates(coordinates.x, y);
    if(yPositiveCoordinates == null || index == 0) {
        //do nothing
    } 
    else {
        drawLine(0, windowDimensions.width, yPositiveCoordinates[1] , yPositiveCoordinates[1], 1, 'black');
    }
    if(yNegativeCoordinates == null) {
        //do nothing   
    }
    else {
        drawLine(0, windowDimensions.width, yNegativeCoordinates[1] , yNegativeCoordinates[1], 1, 'black');
    }
}

function calculateCoordinatesFromPx(x, y) {
    var mdptX = windowDimensions.width / 2;
    var mdptY = windowDimensions.height / 2;
    if(Math.sign(x) == -1 || Math.sign(y) == -1 || x > windowDimensions.width || y > windowDimensions.height ) {
        return null;
    }
    else {
        x = ((x - mdptX) / unitInterval.pxPerUnit) + coordinates.x; //moves x's 0 value from top left to center
        y = (((y * - 1) + mdptY) / unitInterval.pxPerUnit) + coordinates.y; //moves y's 0 value from top left to center

        return [x, y];
    }
}

function calculatePxFromCoordinates(x, y) {
    var mdptX = windowDimensions.width / 2;
    var mdptY = windowDimensions.height / 2;

    xPx = ((x - coordinates.x) * unitInterval.pxPerUnit) + mdptX; //pixels can't be negative, must be cast to positive number. 
    yPx = (((y - coordinates.y) * unitInterval.pxPerUnit) - mdptY) * -1; //pixels can't be negative, must be cast to positive number.

    if(Math.sign(xPx) == -1 || Math.sign(yPx) == -1  || xPx > windowDimensions.width || yPx > windowDimensions.height) {
        return null;
    }
    else {
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
//3.calculate the base of the interval based on remainder
//4.If remainder is 0 or 2 calculate the exponent of the interval
//5.Set pxPerUnit value(VERY IMPORTANT!!!)
document.addEventListener('wheel', (e) => { 
    if(e.deltaY == 100) { //deltaY = 100 if mouseWheelUp; deltaY = -100 if mouseWheelDown
        coordinates.z.fraction++;
        handleZFractionLoop();
    }
    else {
        coordinates.z.fraction--;
        handleZFractionLoop();
    }
    var deltaXUnits = unitInterval.count.value * unitInterval.base * 10 ** unitInterval.exponent; //Net X Units
    unitInterval.pxPerUnit = windowDimensions.width / deltaXUnits; //pxPerUnit value used for coordinate - and pixel location calculations
    renderGrid();
});

function handleZFractionLoop() {
    if(coordinates.z.fraction == 10) { //handles zoom out looping
        coordinates.z.base++;
        coordinates.z.fraction = 0;
        calculateIntervalBase();
    }
    else if(coordinates.z.fraction == -1) { //handles zoom in looping
        coordinates.z.base--;
        coordinates.z.fraction = 9;
        calculateIntervalBase();
    }
    unitInterval.count.value = unitInterval.count.initialValue + coordinates.z.fraction * unitInterval.count.rateOfChange; //causes fractal effect when zooming out
}

function calculateIntervalBase() {
    var zBaseRemainder = coordinates.z.base % 3;
    switch (zBaseRemainder) {
        case 0:
            unitInterval.base = 1;
            calculateIntervalExponent(zBaseRemainder); //when moving from interval base of 5 -> 1
            break;
        case 1:
            unitInterval.base = 2;
            break;
        case 2:
            unitInterval.base = 5;
            calculateIntervalExponent(zBaseRemainder); //when moving from interval base of 1 -> 5
            break;
        default:
            //do nothings
    } 
}

function calculateIntervalExponent(remainder) {
    //remainder is minused to "round" to the 1st factor of 3 below the current base.
    //the case above is only necessary when base is moving from 1 -> 5
    var defaultZDifference = coordinates.z.base - coordinates.z.initialBase - remainder;
    unitInterval.exponent = defaultZDifference / 3; 
}

function setCanvasDimensions() {
    canvas.htmlElement.height = windowDimensions.height;
    canvas.htmlElement.width = windowDimensions.width;
}

window.addEventListener('resize', () => {
    windowDimensions.width = window.innerWidth;
    windowDimensions.height = window.innerHeight;
    setCanvasDimensions();
    renderGrid();
});

function drawLine(x1, x2, y1, y2, lineWidth, lineColor) {
    const ctx = canvas.getCtx();
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

function intToIntRounder(num, rounder) {
    if(Math.sign(rounder) == -1) {
        return num;
    }
    var tempExponent = null; //variable used if exponent is negative
    var remainder = num % rounder;
    if(Math.sign(remainder) == -1 && Math.abs(remainder) < rounder / 2) {
        remainder = 10 - remainder;
    }
    if(Math.sign(unitInterval.exponent) == -1) {
        tempExponent = unitInterval.exponent * -1;
        num = num * 10 ** tempExponent;
        rounder = rounder * 10 ** tempExponent;
    }
    if(remainder < rounder / 2){
        while(num % rounder != 0) {
            num = Math.floor(num - 0.01);
        }
        if(tempExponent != null) {
            return num * 10 ** unitInterval.exponent;
        }
        return num;
    }
    else {
        while(num % rounder != 0) {
            num = Math.ceil(num + 0.01);
        }
        if(tempExponent != null) {
            return num * 10 ** unitInterval.exponent;
        }
        return num;
    }
}

