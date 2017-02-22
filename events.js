/*************EVENT LISTENERS*********************/
function mouseDownCanvas() {
    if (d3.event.button === 0) {
        var coords = d3.mouse(this);
        var x = parseInt(coords[0])
        var y = parseInt(coords[1])
        newShape(x, y);
        }
}

function mouseMoveCanvas() {
    mouseX = d3.mouse(this)[0];
    mouseY = d3.mouse(this)[1];
}

function mouseUpNewShape(event) {
    stopShape();
}

function stopEvent (event){
    d3.event.stopPropagation();
}

function mouseDownShape(event) {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    if (d3.event.button === 0) {
        var shape = d3.select(this);
        moveShape(shape);
    }
}

function dblClickShape(event) {
    d3.event.stopPropagation();
    var shape = d3.select(this);
    removeShape(shape)
}

function mouseDownPull(event) {
    d3.event.stopPropagation();
    d3.event.preventDefault();
    group = d3.select(this.parentNode)
    pull = d3.select(this)
    resizeShape(group, pull);
}

function mouseOverPull() {
    d3.event.target()
}

function toggleShape(event) {
    if (event.target.getAttribute('value') == "rect") {
        shapeType = "circle";
        event.target.setAttribute('value', 'circle');
        event.target.innerHTML = "Circles";
    } else {
        shapeType = "rect";
        event.target.setAttribute('value', 'rect');
        event.target.innerHTML = "Boxes";
    }
}