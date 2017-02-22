$(document).ready(function(){
  var width = "100%",
      height = "100%";
      numShapes = 0;
      mouseX = 0;
      mouseY = 0;
      radius = 10;
      shapeType = "rect";
      mouseX, mouseY
      selectedShape = null
      interval = null;
  
    //Make an SVG Container
    var svg = d3.select("#box").append("svg")
                                .attr("width", width)
                                .attr("height", height)
                                .style("border", "1px solid black")
                                .on("mousedown", mouseDownCanvas)
                                .on("mouseup", stopShape)
                                .on("mousemove", mouseMoveCanvas);
    setPalette()
});


//Draw a new shape on the canvas
function newShape(x, y){
    //Draw the Circle
    var group = d3.select("svg").append("g").attr("id", "group"+numShapes);
    var shape = group.append(shapeType)
                  .attr("id", numShapes)
                  .attr("diffX",x)
                  .attr("diffY",y)
                  .attr("r", radius)
                  .attr("width", radius)
                  .attr("height", radius)
                  .classed("shape", true)
                  .classed(shapeType, true)

    //Set color based on the current palette
    setColor(shape);

    //Add Event Listeners
    shape.on('mousedown', mouseDownShape);
    shape.on('dblclick', dblClickShape)
         .on("mouseup", stopShape)
    
    //Place the shape on the canvas around the mouse tip
    growShape(shape, x, y);
    numShapes++;
}

//Grow the new shape. Continues until interval cancelled
function growShape(shape, x, y) {
    var radius = shape.attr("r")
    setCoords(shape, x, y);
    interval = setInterval(grow, 15);
    //Increment size and nudge position each interval
    function grow() {
        radius++;
        shape.attr("width", radius);
        shape.attr("height", radius)
        shape.attr("r", radius);
        x -= 0.5;
        y -= 0.5;
        if (shapeType == "rect") {
            setCoords(shape,x,y)
        }
    }
}

//Clears active motion
function stopShape() {
    clearInterval(interval);
}

//Positions the shape at the given coordinates
function setCoords(shape, x, y) {
    //Sets the coordinates
    var group = d3.select("#group" + shape.attr('id'));
    group.attr("transform", "translate("+(x)+','+(y)+")");
    shape.attr("diffX", x)
         .attr("diffY", y)
}

//Sets the color to the RGB sliders on the given shape 
function setColor(shape) {
    var red = $('#red').val();
    var green = $('#green').val();
    var blue = $('#blue').val();
    var rgb = 'rgb('+red+','+green+','+blue+')'
    try {
        shape.style("fill", rgb);
    }
    catch (err) {
        shape.setAttribute('style',"background-color: " + rgb)
    }
}

//Sets the shape to the mouse movement until mouseup
function moveShape(shape) {
    selectShape(shape)
    //This is the current position of the mouse. We move the shape relative to movement from this point
    var startX = mouseX - shape.attr('diffX');
    var startY = mouseY - shape.attr('diffY');

    interval = setInterval(function() {
        //Set the shape to follow the mouse, but ensure the distance between shape edge and mouse
        //is maintained
         setCoords(shape, mouseX-startX, mouseY-startY);
    }, 1);
}

/*************BUTTONS AND HOVERS******************************/
//Deletes the currently selected object
function removeSelected(){
    d3.select('#group' + selectedShape.attr('id')).remove()
}

function removeShape(shape) {
    d3.select('#group' + shape.attr('id')).remove();
}

//Deletes all shapes from the board
function clearShapes() {
    numShapes = 0;
    d3.selectAll("g").remove();
}

//Selects the clicked shape
function selectShape(shape) {
    deselectShape();
    shape.classed("selected-shape", true);
    selectedShape = shape;
    addPull(shape, true,true);
    addPull(shape, false, true);
    addPull(shape, true,false);
    addPull(shape,false,false);
}

//Deselects currently selected shape
function deselectShape() {
    if (selectedShape !== null) {
        selectedShape.classed("selected-shape", false);
        selectedShape = null;
        d3.selectAll(".pull").remove()
    }
}

//Sets the color of the palette
function setPalette() {
    setColor(document.getElementById("palette"));
    if (selectedShape != null) {
        setColor(selectedShape);
    }
}

function addPull(shape, left, top) {
    var r = parseInt(shape.attr("r"))
    
    var groupId = '#group' + shape.attr('id')
    pull = d3.select(groupId).append('circle')
             .attr("r", 10)
             .style("fill","blue")
             .style("stroke","black")
             .style("stroke-width",2)
             .classed("pull", true);
    if (left) {pull.classed("left", true)};
    if (top) {pull.classed("top", true)};
    setPullCoords(shape, pull)
    pull.on('mouseover', stopEvent);
    pull.on('mousedown', mouseDownPull);
    pull.on('mouseup', stopShape);
}

function setPullCoords(shape, pull) {
    var x,y = x = 0;
    if (!pull.classed("left")) {
        x = shape.attr('width')
    }
    if (!pull.classed("top")) {
        y = shape.attr('height')
    }
    if (shape.classed('circle')) {
        x = shape.attr('r')*Math.cos(Math.PI / 4)
        y = shape.attr('r')*Math.sin(Math.PI / 4)
        if(pull.classed("top")) {y = -y};
        if(pull.classed("left")) {x = -x}
    }

    pull.attr('cx',x)
        .attr('cy',y)
}

function resizeShape(group, pull) {
    group.on('mouseup', stopShape);
    group.on('mousedown', stopShape)
    var shape = group.select('.shape');
    var mouseStartX = mouseX;
    var mouseStartY = mouseY;
    var pullId = pull.attr("id")

    var diffX = parseInt(shape.attr("diffX"));
    var diffY = parseInt(shape.attr("diffY"));
    var r     = parseInt(shape.attr("r"));

    var width = parseInt(shape.attr("width"));
    var height = parseInt(shape.attr("height"));

    interval = setInterval(function() {
        var newX = diffX;
        var newY = diffY;
        var newR = r;
        var widthDiff = mouseX - mouseStartX;
        var heightDiff = mouseY - mouseStartY;
        if(pull.classed("top")) {
            heightDiff = mouseStartY - mouseY;
            newY = diffY - heightDiff
        }
        if (pull.classed("left")) {
            widthDiff = mouseStartX - mouseX;
            newX = diffX - widthDiff;
        }
        if (shape.classed("rect")) {
            setCoords(shape, newX, newY);
        }
        rDiff = (heightDiff + widthDiff)
        newR = r + rDiff
        if(newR <= 0) {newR = 1}
        shape.attr("r", newR)

        pulls = group.selectAll(".pull")[0];
        for (var i = pulls.length - 1; i >= 0; i--) {
            setPullCoords(shape,d3.select(pulls[i]))
        }
        newWidth = widthDiff + width
        if (newWidth <= 0){ newWidth = 1};
        newHeight = heightDiff + height;
        if (newHeight <= 0) {newHeight = 1} 

        shape.attr("width", newWidth);
        shape.attr("height", newHeight);
        
    }, .01);
}