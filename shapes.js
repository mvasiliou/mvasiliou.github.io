$(document).ready(function(){
  var width = "100%",
      height = "100%";
      numShapes = 0;
      mouseX = 0;
      mouseY = 0;
      radius = 10;
      shapeType = "rect"
  
    //Make an SVG Container
    var svg = d3.select("#box").append("svg")
                                .attr("width", width)
                                .attr("height", height)
                                .style("border", "1px solid black")
                                .on("mousedown", mouseDownCanvas)
                                .on("mouseup", stopShape)
                                .on("mousemove", mouseMoveCanvas)

    

    // Retrieve the object from storage
    var layoutList = setLayoutList();
    reloadLayoutSelect();

    $("#save").on('click', saveLayout)
    $('#delete').on('click', deleteLayouts)

    function saveLayout() {
        var shapes = d3.selectAll(".shape")[0];
        var shapeList = []
        for (var i = shapes.length - 1; i >= 0; i--) {
            var shape = d3.select(shapes[i])
            var shapeDict = {}
            shapeDict['id'] = shape.attr("id");
            shapeDict['diffX'] = shape.attr("diffX")
            shapeDict['diffY'] = shape.attr("diffY")
            shapeDict['r'] = shape.attr('r')
            shapeDict['width'] = shape.attr('width')
            shapeDict['height'] = shape.attr('height')
            shapeDict['style'] = shape.attr('style')
            shapeDict['rect'] = shape.classed('rect')
            shapeList.push(shapeDict)
        }
        layout = {'title': $('#layout-title').val(),'data':shapeList, 'id': layoutList.length}
        layoutList.push(layout)

        // Put the object into storage
        localStorage.setItem('layoutList', JSON.stringify(layoutList));
        reloadLayoutSelect();

    }
  });
  function chooseLayout() {
    layoutId = $('select').val();
    for (var i = layoutList.length - 1; i >= 0; i--) {
        if(layoutList[i]['id'] == layoutId) {
            loadLayout(layoutList[i])
        }
    }
  }

  function loadLayout(layout) {
    clearShapes();
    var shapes = layout['data'];
    for (var i = shapes.length - 1; i >= 0; i--) {
        loadShape(shapes[i]);
    }
  }

  function loadShape(shapeDict){
    //Draw the Circle
    var group = d3.select("svg").append("g").attr("id", "group"+numShapes);
    var shape;
    if (shapeDict['rect']) {
        shape = group.append('rect')
                     .classed('rect', true)
    }
    else {
        shape = group.append('circle')
                     .classed('circle', true)

    }
         shape.attr("id", shapeDict['id'])
              .attr("diffX",shapeDict['diffX'])
              .attr("diffY",shapeDict['diffY'])
              .attr("r", shapeDict['r'])
              .attr("width", shapeDict['width'])
              .attr("height", shapeDict['height'])
              .attr('style', shapeDict['style'])
              .classed("shape", true)
    setCoords(shape, parseInt(shapeDict['diffX']), parseInt(shapeDict['diffY']));
    //Add Event Listeners
    shape.on('mousedown', mouseDownShape);
    shape.on('dblclick', dblClickShape)
         .on("mouseup", stopShape)
        
    numShapes++;
}

  function deleteLayouts() {
    layoutList = []
    localStorage.setItem('layoutList', JSON.stringify(layoutList));
    reloadLayoutSelect();
  }

  function setLayoutList() {
    layoutList = JSON.parse(localStorage.getItem('layoutList'));
    if (!layoutList) {
        layoutList = [] 
    }
    return layoutList;
  }

  function reloadLayoutSelect() {
    $('select option').each(function() {
        $(this).remove();
    });

    layoutList = setLayoutList();
    for (var i = layoutList.length - 1; i >= 0; i--) {
        $('select').append($('<option>', {value:layoutList[i]['id'], text: layoutList[i]['title']}));
    }
  }

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
    shape.attr("diffY", y)
}

//Sets the color to the RGB sliders on the given shape 
function setColor(shape) {
    var red = 200;
    var green = 0;
    var blue = 0;
    shape.style("fill", 'rgb('+red+','+green+','+blue+')');
}

//Sets the shape to the mouse movement until mouseup
function moveShape(shape) {
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

    var groupId = '#group' + selectedShape.attr('id')
    d3.select(groupId).remove()
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
    addPull(shape, "tl", 0,0);
    addPull(shape, "tr", shape.attr('width'), 0);
    addPull(shape, "bl",0,shape.attr('height'));
    addPull(shape,"br",shape.attr('width'),shape.attr('height'));
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

function addPull(shape, id, x, y) {
    var r = parseInt(shape.attr("r"))
    
    var groupId = '#group' + shape.attr('id')
    pull = d3.select(groupId).append('circle')
             .attr("r", 10)
             .attr("id", id)
             .attr('cx',x)
             .attr('cy',y)
             .style("fill","blue")
             .classed("pull", true);
    pull.on('mouseover', stopEvent);
    pull.on('mousedown', mouseDownPull);
    pull.on('mouseup', mouseUpPull);
}

function setPullCoords(shape, pull) {
    var x,y = x = 0;
    var id = pull.attr('id')
    if (id == 'tr') {
        x = shape.attr('width')
    }
    else if (id == 'bl') {
        y = shape.attr('height')
    }

    else if (id == 'br') {
        x = shape.attr('width')
        y = shape.attr('height')
    }

    pull.attr('cx',x)
        .attr('cy',y)
}

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

function mouseUpPull(event) {
    stopShape();    
}

function stopEvent (event){
    d3.event.stopPropagation();
}

function mouseDownShape(event) {
    if (d3.event.button === 0) {
        d3.event.stopPropagation();
        var shape = d3.select(this);
        moveShape(shape);
    }
}

function dblClickShape(event) {
    d3.event.stopPropagation();
    var shape = d3.select(this);
    if (shape.classed("selected-shape")) {
        deselectShape()
    }
    else {
        selectShape(shape);   
    }
}

function mouseDownPull(event) {
    d3.event.stopPropagation();
    group = d3.select(this.parentNode)
    group.on('mouseup', stopShape);
    group.on('mousedown', stopShape)
    var shape = group.select('.shape');
    var mouseStartX = mouseX;
    var mouseStartY = mouseY;
    var pullId = d3.select(this).attr("id")

    var diffX = parseInt(shape.attr("diffX"));
    var diffY = parseInt(shape.attr("diffY"));

    var width = parseInt(shape.attr("width"));
    var height = parseInt(shape.attr("height"));

    interval = setInterval(function() {
        var widthDiff = 0;
        var heightDiff = 0;
        if (pullId == "tr") {
            widthDiff = mouseX - mouseStartX;
            heightDiff = mouseStartY - mouseY;
            setCoords(shape, diffX, diffY - heightDiff);
        }
        else if (pullId == "tl") {
            widthDiff = mouseStartX - mouseX;
            heightDiff = mouseStartY - mouseY;
            setCoords(shape, diffX - widthDiff, diffY - heightDiff);
        }
        else if (pullId == "bl") {
            widthDiff = mouseStartX - mouseX;
            heightDiff = mouseY - mouseStartY;
            setCoords(shape, diffX - widthDiff, diffY);
        }

        else {
            widthDiff = mouseX - mouseStartX;
            heightDiff = mouseY - mouseStartY;
        }
        pulls = group.selectAll(".pull")[0];
        for (var i = pulls.length - 1; i >= 0; i--) {
            setPullCoords(shape,d3.select(pulls[i]))
        }

        shape.attr("width", widthDiff + width);
        shape.attr("height", heightDiff + height);
        shape.attr("r", heightDiff + height)
    }, 1);
}

function mouseOverPull() {
    d3.event.target()
}

function toggleShape(event) {
    shapeType = event.target.getAttribute('value');
}



var mouseX, mouseY
var selectedShape = null;
var interval = null;