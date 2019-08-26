"use strict";

var d3 = d3 || null;

var WIDTH = 800;
var HEIGHT = 600;

var brush2D = d3.brush();
var horiz_scale = d3.scaleLinear().range([0, WIDTH - 15]).domain([0, 1000]);
var vert_scale = d3.scaleLinear().range([10, 40]).domain([0, 1]);

var horiz_fixed_sizelimit = {
    "vert": [0, Number.POSITIVE_INFINITY], // [min-size, max-size]
    "horiz": [30, 30] // [min-size, max-size]
};

var vert_lock_constraint = {
    "top": [10, 10],
    "bottom": [40, 40],
    "left": [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY],
    "right": [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]
};

var svg = d3.select("body").append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

var controlsArea = svg.append("g")
    .attr("class", "controls");


function debug(text_area, text){
    text_area.html(text);
}

function createDebugArea(x, y, anchor, baseline, caption){
    var text_area = svg.append("text")
        .attr("class", "text-area")
        .attr("x", x).attr("y", y)
        .attr("text-anchor", anchor)
        .style("font-size", 20)
        .attr("alignment-baseline", baseline)
        .style("pointer-events", "none")
        .html(caption);

    return text_area;
}

var debug_e = createDebugArea(0, 30, "start", "before-edge", "Event: x,x");
var debug_0 = createDebugArea(0, 60, "start", "before-edge", "Brush: x,x");
var debug_1 = createDebugArea(0, 90, "start", "before-edge", "Range: false");
var debug_2 = createDebugArea(0, 120, "start", "before-edge", "Data: x,x");
var debug_3 = createDebugArea(0, 150, "start", "before-edge", "Screen Extent: x,x");
var debug_4 = createDebugArea(0, 180, "start", "before-edge", "Data Extent: x,x");
var debug_5 = createDebugArea(0, 210, "start", "before-edge", "Scale: x,x");
var debug_6 = createDebugArea(0, 240, "start", "before-edge", "Normalized Range: x,x");

function midPoint(extent){
    return d3.min(extent) + (d3.max(extent) - d3.min(extent)) / extent.length;
}

function initControls(){
    controlsArea.append("g").attr("class", "control-axis control-axis-width")
        .attr("transform", "translate(0,0)");

    controlsArea.append("g").attr("class", "control-axis control-axis-height")
        .attr("transform", "translate(" + horiz_scale.range()[1] + ",0)");

    var brushD3Selection = controlsArea.select("g.control-axis.control-axis-width"),
        brushController = brushutil.createBrushController(horiz_scale, vert_scale, brush2D, brushD3Selection),
        listeners = brushutil.createGenericListeners(brushController,
            [brushStart.bind(null, "START"), brushMoved.bind(null, "MOVED"), brushEnd.bind(null, "END")]);

    svg.selectAll(".handle")
        .style("pointer-events", "none");

    brush2D
        .on("start", listeners[0])
        .on("brush", listeners[1])
        .on("end", listeners[2]);
}

function brushStart(eventName, brushController, selExtent, sourceEvent) {
    var midpoint = midPoint(selExtent[0]),
        mouse = d3.mouse(svg.node()),
        safe_horiz_policy = mouse[0] < midpoint ? -1 : 1;

    var new_extent = brushController.enforce_size_limits_pixel(selExtent, horiz_fixed_sizelimit, {"vert": 0, "horiz": safe_horiz_policy});
    brushController.set_to_pixel(new_extent);

    debug(debug_e, "START");
    debug(debug_0, "Mouse: " + JSON.stringify(mouse[0]));
    debug(debug_1, "Midpoint: " + JSON.stringify(midpoint));
    debug(debug_2, "Horiz Policy: " + safe_horiz_policy);
    debug(debug_3, "Selection: " + JSON.stringify(selExtent[0]));
    debug(debug_4, "Sanitized :" + JSON.stringify(new_extent[0]));
}

function brushMoved(eventName, brushController, selExtent, sourceEvent) {
    var midpoint = midPoint(selExtent[0]),
        mouse = d3.mouse(svg.node()),
        safe_horiz_policy = mouse[0] < midpoint ? -1 : 1;

    var new_extent = brushController.enforce_contraints_pixel(selExtent, vert_lock_constraint);
    new_extent = brushController.enforce_size_limits_pixel(new_extent, horiz_fixed_sizelimit, {"vert": 0, "horiz": safe_horiz_policy});
    brushController.set_to_pixel(new_extent);

    debug(debug_e, "MOVE");
    debug(debug_0, "Mouse: " + JSON.stringify(mouse[0]));
    debug(debug_1, "Midpoint: " + JSON.stringify(midpoint));
    debug(debug_2, "Horiz Policy: " + safe_horiz_policy);
    debug(debug_3, "Selection: " + JSON.stringify(selExtent[0]));
    debug(debug_4, "Sanitized :" + JSON.stringify(new_extent[0]));
}

function brushEnd(eventName, brushController, selExtent, sourceEvent){
    var midpoint = midPoint(selExtent[0]),
        mouse = d3.mouse(svg.node()),
        safe_horiz_policy = mouse[0] < midpoint ? -1 : 1;

    var selExtentIsEmpty = d3.merge(selExtent)
        .filter(function(x){return x !== null;}).length == 0;

    if (selExtentIsEmpty){
        var mouse = d3.mouse(svg.node());
        selExtent = [[mouse[0] - 5, mouse[0]+5],[10,40]];
    }

    var new_extent = brushController.enforce_size_limits_pixel(selExtent, horiz_fixed_sizelimit, {"vert": 0, "horiz": safe_horiz_policy});
    brushController.set_to_pixel(new_extent);

    debug(debug_e, "END");
    debug(debug_0, "Mouse: " + JSON.stringify(mouse[0]));
    debug(debug_1, "Midpoint: " + JSON.stringify(midpoint));
    debug(debug_2, "Horiz Policy: " + safe_horiz_policy);
    debug(debug_3, "Selection: " + JSON.stringify(selExtent[0]));
    debug(debug_4, "Sanitized :" + JSON.stringify(new_extent[0]));
}



initControls();


function zip(arrays) {
    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });
}