$(document).ready(function(){
    // Retrieve the object from storage
    var layoutList = setLayoutList();
    reloadLayoutSelect();

});

//Save the current layout with the user inputted name
function saveLayout() {
    var shapes = d3.selectAll(".shape")[0];
    var shapeList = [];
    //Creates a dictionary with each shape's attributes
    for (var i = shapes.length - 1; i >= 0; i--) {
        var shape = d3.select(shapes[i]);
        var shapeDict = {};
        shapeDict.id = shape.attr("id");
        shapeDict.diffX = shape.attr("diffX");
        shapeDict.diffY = shape.attr("diffY");
        shapeDict.r = shape.attr('r');
        shapeDict.width = shape.attr('width');
        shapeDict.height = shape.attr('height');
        shapeDict.style = shape.attr('style');
        shapeDict.rect = shape.classed('rect');
        shapeList.push(shapeDict);
    }
    title = window.prompt("What would you like to call this layout?");
    layout = {'title': title,'data':shapeList, 'id': layoutList.length};
    layoutList.push(layout);

    // Put the object into storage
    localStorage.setItem('layoutList', JSON.stringify(layoutList));
    reloadLayoutSelect();
}
  
//Loads the currently selected layout
function chooseLayout() {
  layoutId = $('select').val();
  for (var i = layoutList.length - 1; i >= 0; i--) {
      if(layoutList[i].id == layoutId) {
          loadLayout(layoutList[i]);
          break;
      }
  }
}

//Creates a shape for each shape in the saved layout
function loadLayout(layout) {
  clearShapes();
  var shapes = layout.data;
  for (var i = shapes.length - 1; i >= 0; i--) {
      loadShape(shapes[i]);
  }
}

//Uses a shape dictionary to recreate the shape
function loadShape(shapeDict){
  //Draw the Circle
  var group = d3.select("svg").append("g").attr("id", "group"+shapeDict.id);
  var shape;
  if (shapeDict.rect) {
      shape = group.append('rect')
                   .classed('rect', true);
  }
  else {
      shape = group.append('circle')
                   .classed('circle', true);

  }
       shape.attr("id", shapeDict.id)
            .attr("diffX",shapeDict.diffX)
            .attr("diffY",shapeDict.diffY)
            .attr("r", shapeDict.r)
            .attr("width", shapeDict.width)
            .attr("height", shapeDict.height)
            .attr('style', shapeDict.style)
            .classed("shape", true);
  setCoords(shape, parseInt(shapeDict.diffX), parseInt(shapeDict.diffY));
  //Add Event Listeners
  shape.on('mousedown', mouseDownShape);
  shape.on('dblclick', dblClickShape)
       .on("mouseup", stopShape);
      
  numShapes = parseInt(shapeDict.id);
  numShapes++;
}

//Deletes the currently selected layout from the list and reloads the select list
function deleteLayout() {
    layoutId = $('select').val();
    for (var i = 0; i < layoutList.length ; i++) {
        if(layoutList[i].id == layoutId) {
            layoutList.splice(i, 1);
        }
    }
    localStorage.setItem('layoutList', JSON.stringify(layoutList));
    reloadLayoutSelect();
}

//Grabs the layout list from storage
function setLayoutList() {
  layoutList = JSON.parse(localStorage.getItem('layoutList'));
  if (!layoutList) {
      layoutList = [];
  }
  return layoutList;
}

//Reloads the list of stored layouts to choose from
function reloadLayoutSelect() {
  $('select option').each(function() {
      $(this).remove();
  });

  layoutList = setLayoutList();
  for (var i = layoutList.length - 1; i >= 0; i--) {
    $('select').append($('<option>', {value:layoutList[i].id, text: layoutList[i].title}));
  }
}