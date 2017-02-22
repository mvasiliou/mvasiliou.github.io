/*************EVENT LISTENERS*********************/
//Stops event from propogating to the next level of elements
function stopEvent (event){
    d3.event.stopPropagation();
}

//Clears active motion
function stopShape() {
    clearInterval(interval);
}

function mouseDownCanvas() {
    //Only want to fire if this is a left click
    if (d3.event.button === 0) {
        //Creates new shape at the mouse coordinates
        newShape(mouseX, mouseY);
    }
}

//Tracks the mouse coordinates as the mouse moves on the canvas
function mouseMoveCanvas() {
    mouseX = d3.mouse(this)[0];
    mouseY = d3.mouse(this)[1];
}
//Selects the shape and let's the user move it around
function mouseDownShape(event) {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    stopShape();
    //Only want to fire if this is a left click
    if (d3.event.button === 0) {
        var shape = d3.select(this);
        selectShape(shape);
        moveShape(shape);
    }
}

//Removes the shape
function dblClickShape(event) {
    d3.event.stopPropagation();
    var shape = d3.select(this);
    removeShape(shape);
}


function mouseDownPull(event) {
    d3.event.stopPropagation();
    d3.event.preventDefault();
    if(d3.event.button == 0) {
        group = d3.select(this.parentNode);
        pull = d3.select(this);
        resizeShape(group, pull);
    }
}
//Switchs the current shape type and rewrite button
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