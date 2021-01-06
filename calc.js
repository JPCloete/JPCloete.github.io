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
    exponent: 0, //10 is squared by exponent property
    count: { 
        initialValue: 10,
        value: 10, //based on z's fraction value
        rateOfChange: 0.75
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
    unitInterval.pxPerUnit = windowDimensions.width / (unitInterval.count.value * unitInterval.base * 10 ** unitInterval.exponent);
    drawGrid();
}

//fires dragEvent;
document.onmousedown = () => {
    dragEvent();
}

//custom event(hold mouse button 1 and drag)
function dragEvent(e) {
    e = e || window.event;
    e.preventDefault();
    posX = e.clientX;
    posY = e.clientY;
    document.onmouseup = () => { //clears event after mouse button has been released
        document.onmouseup = null;
        document.onmousemove = null;
    }
    document.onmousemove = (e) => {
        posXDifference = e.clientX - posX;
        posYDifference = e.clientY - posY;
        if(Math.abs(posXDifference) + Math.abs(posYDifference) > 5) { //makes rerendering less frequent to improve performance
            var currentCoordinates = calculateCoordinatesFromPx(e.clientX, e.clientY); //get current coordinates
            var prevCoordinates = calculateCoordinatesFromPx(posX, posY); //get previousCoordinates
            if(currentCoordinates != null && prevCoordinates != null) {
                calculateDragNewMdpt(prevCoordinates[1], currentCoordinates[1], prevCoordinates[0], currentCoordinates[0]);
            }
            dragEvent(e);
        }
    }
}


document.addEventListener('wheel', (e) => { 
    if(e.deltaY == 100) { //deltaY = 100 if mouseWheelUp; deltaY = -100 if mouseWheelDown
        coordinates.z.fraction++;
        handleZFractionLoop();
        calculateIntervalBase();
    }
    else {
        coordinates.z.fraction--;
        handleZFractionLoop();
        calculateIntervalBase();
    }
    unitInterval.pxPerUnit = windowDimensions.width / (unitInterval.count.value * unitInterval.base * 10 ** unitInterval.exponent);
});


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
    console.log(coordinates.x + ', ' + coordinates.y);
}

function handleZFractionLoop() {
    if(coordinates.z.fraction == 10) { //handles zoom out looping
        coordinates.z.base++;
        coordinates.z.fraction = 0;
        unitInterval.count.value = unitInterval.count.initialValue + coordinates.z.fraction * unitInterval.count.rateOfChange; //causes fractal effect when zooming out
    }
    else if(coordinates.z.fraction == -1) { //handles zoom in looping
        coordinates.z.base--;
        coordinates.z.fraction = 9;
        unitInterval.count.value = unitInterval.count.initialValue + coordinates.z.fraction * unitInterval.count.rateOfChange; //causes fractal effect when zooming in 
    }
}

function calculateIntervalBase() {
    var zBaseRemainder = coordinates.z.base % 3;
    switch (zBaseRemainder) {
        case 0:
            unitInterval.base = 1;
            calculateIntervalExponent(zBaseRemainder); //when moving from interval base of 5 to 1
            break;
        case 1:
            unitInterval.base = 2;
            break;
        case 2:
            unitInterval.base = 5;
            calculateIntervalExponent(zBaseRemainder); //when moving from interval base of 1 to 5
            break;
        default:
            //do nothings
    } 
}

function calculateIntervalExponent(remainder) {
    var defaultZDifference = coordinates.z.base - coordinates.z.initialBase - remainder;
    unitInterval.exponent = defaultZDifference / 3; 
}


function calculateIntervalCount() {
    unitInterval.count.value = unitInterval.count.initialValue + (roundNumber(coordinates.z.fraction * unitInterval.count.rateOfChange, 2));
}

function setCanvasDimensions() {
    canvas.htmlElement.height = windowDimensions.height;
    canvas.htmlElement.width = windowDimensions.width;
}

window.addEventListener('resize', () => {
    windowDimensions.width = window.innerWidth;
    windowDimensions.height = window.innerHeight;
    redrawGrid();
});

function drawLine(x1, x2, y1, y2, lineWidth, lineColor) {
    const ctx = canvas.getCtx();
    ctx.beginPath();
    ctx.translate(0.5, 0.5); //used to hack canvas pixel calculation clown fiesta.
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = lineWidth + 0.5;
    ctx.strokeStyle = lineColor;
    ctx.stroke();
}

function drawGridMainAxes() {
    drawLine((windowDimensions.width / 2), (windowDimensions.width / 2),  0, windowDimensions.height , 1, 'black'); //y-axis (y = 0)
    drawLine(0, windowDimensions.width,  (windowDimensions.height / 2), (windowDimensions.height / 2) , 1, 'black'); //x-axis (x = 0)
}

function drawGrid() {
    setCanvasDimensions();
    drawGridMainAxes();
}

function redrawGrid() {
    const ctx = canvas.getCtx();
    ctx.clearRect(0, 0, canvas.htmlElement.width, canvas.htmlElement.height); //easy way to clear canvas.
    drawGrid();
}


function roundNumber(num, positionCount) { //to round to a certain position the number has to be multiplied and then divided after rounding by the same number.
    var positionValue = 1; 
    for(index = 0; index < positionCount; index++) {
        positionValue = positionValue * 10;
    }
    return Math.round(num * positionValue) / positionValue;
}

