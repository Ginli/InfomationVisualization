var dataFile = "nutrients.csv";
//Constant food information
var allNutIncludingCalories =  [
    "protein (g)","calcium (g)","sodium (g)","fiber (g)","vitaminc (g)","potassium (g)","carbohydrate (g)","sugars (g)","fat (g)","water (g)","calories",
    "saturated (g)","monounsat (g)","polyunsat (g)"
];
var allNutrientsList = [
    "protein (g)","calcium (g)","sodium (g)","fiber (g)","vitaminc (g)","potassium (g)","carbohydrate (g)","sugars (g)","fat (g)","water (g)", "saturated (g)",
    "monounsat (g)","polyunsat (g)"
];
var foodGroupsList = [
    "Dairy and Egg Products", "Spices and Herbs", "Baby Foods", "Fats and Oils", "Poultry Products", "Soups, Sauces, and Gravies", "Sausages and Luncheon Meats",
    "Breakfast Cereals", "Fruits and Fruit Juices", "Pork Products", "Vegetables and Vegetable Products", "Nut and Seed Products", "Beef Products", "Beverages",
    "Finfish and Shellfish Products", "Legumes and Legume Products", "Lamb, Veal, and Game Products", "Baked Products", "Snacks", "Sweets", "Cereal Grains and Pasta",
    "Fast Foods", "Meals, Entrees, and Sidedishes", "Restaurant Foods", "Ethnic Foods"
];
var colors = [
    "#180092", "#0e74f5", "#19843e", "#e0b7ce", "#8fd60e", "#32bdae", "#b8ad92", "#b636b9", "#b6d653",
    "#12eb84", "#d93f3c", "#edf606", "#765eb6", "#268bd2", "#faaa82", "#86b0e4", "#eb7464", "#2ce2d6",
    "#7e8f6c", "#4927ac", "#85386b", "#35ad50", "#88b68d", "#97a4ab", "#f84c0a", "#24c31e", "#e4006d"
];
//    Baby Foods
//    Baked Products
//    Beef Products
//    Beverages
//    Breakfast Cereals
//    Cereal Grains and Pasta
//    Dairy and Egg Products
//    Ethnic Foods
//    Fast Foods
//    Fats and Oils
//    Finfish and Shellfish Products
//    Fruits and Fruit Juices
//    Lamb, Veal, and Game Products
//    Legumes and Legume Products
//    Meals, Entrees, and Sidedishes
//    Nut and Seed Products
//    Pork Products
//    Poultry Products
//    Restaurant Foods
//    Sausages and Luncheon Meats
//    Snacks
//    Soups, Sauces, and Gravies
//    Spices and Herbs
//    Sweets
//    Vegetables and Vegetable Products
var colorForFoodGroup = {};
var originalFoodInfo = [];
var foodInfo = [];
var filteredFoodInfo = [];
var foodGroupsInfo = [];
var width, height;
var margin = {left: 10, right: 10, top: 10, bottom: 10};
var mainView, polygonGraph, popupWindow;
var scaleGroup = [];
var filterGroup = [];
var filteredFoodGroupsList = [];

var headersValue;
var xValue,yValue;
var scatterWidth = 440;
var scatterHeight = 400;
var scatterMargin = { top: 10, left: 30, right: 20, bottom: 30};
var innerWidth = scatterWidth - scatterMargin.top - scatterMargin.bottom;
var innerHeight = scatterHeight - scatterMargin.top - scatterMargin.bottom;
var scatterChart, dotGroup;
var xAxisGroup, yAxisGroup;

function initialize() {
    d3.csv("data/" + dataFile, function(error, result){
        foodInfo = result.map(function(d) {
            for (var i in allNutIncludingCalories) {
                d[allNutIncludingCalories[i]] = Math.round(Number(d[allNutIncludingCalories[i]]) * 10000) / 10000;
            }
            return d;
        });
//            foodInfo = foodInfo.slice(1000, 1010); //for test correctness
        for (var i in foodGroupsList) {
            colorForFoodGroup[foodGroupsList[i]] = colors[i];
        }
        initializeRelatedVars();
        createMainView();
        createThreshold();
        searchFunction();
        drawScatterPlot();
    });
}
var originPoint;
var deltaAngle;
var initAngle;
var adjust = 0.0001;
function initializeRelatedVars() {
    mainView = d3.select("#polygonSvg");
    polygonGraph = mainView.append("g").attr("class", "polygon-graph");
    width = mainView.attr("width") - margin.left - margin.right;
    height = mainView.attr("height") - margin.top - margin.bottom;
    for (var i in allNutrientsList) {
        var scale = d3.scale.log().range([0, height / 2]).domain([1, 1 + adjust + d3.max(foodInfo, function(d) {
            return Number(d[allNutrientsList[i]]);
        })]);
        scaleGroup.push(scale);
    }
    originPoint = {x: width / 2, y: height / 2};
    initAngle = 0;
    deltaAngle = 360 / scaleGroup.length;
    filteredFoodInfo = foodInfo;
    filteredFoodGroupsList = foodGroupsList;
//////// initialize scatter plot
    headersValue = Object.keys(foodInfo[0]);
    headersValue.splice(16);
    headersValue.splice(0, 2);
    d3.select("#xAxisOption").selectAll("option")
        .data(headersValue)
        .enter().append("option")
        .text(function(d){return d})
        .attr("value", function(d){return d});
    d3.select("#yAxisOption").selectAll("option")
        .data(headersValue)
        .enter().append("option")
        .text(function(d){return d})
        .attr("value", function(d){return d});
    document.getElementById("xAxisOption").selectedIndex = "10";
    document.getElementById("yAxisOption").selectedIndex = "6";
    xValue = d3.select("#xAxisOption").node().value;
    yValue = d3.select("#yAxisOption").node().value;
    scatterChart = d3.select("#scatter-plot-svg").attr("height", scatterHeight).attr("width", scatterWidth);
    dotGroup = scatterChart.append("g")
        .attr("transform", "translate(" + scatterMargin.left + "," + scatterMargin.top + ")");
    xAxisGroup = scatterChart.append("g")
        .attr("transform", "translate(" + scatterMargin.left + "," + (innerHeight+scatterMargin.top) + ")");
    yAxisGroup = scatterChart.append("g")
        .attr("transform", "translate(" + scatterMargin.left + "," + scatterMargin.top + ")");
}

function createMainView() {
    var polygons = createP(scaleGroup, initAngle, deltaAngle, originPoint);
    drawAxisIn(polygonGraph, originPoint, initAngle, deltaAngle, scaleGroup);
    drawAndUpdatePolygons(polygons);
    drawAndUpdateLegends();
}



function drawAxisIn(polygonGraph, originPoint, initAngle, deltaAngle, scaleGroup) {
    for (var i in scaleGroup) {
        polygonGraph.append("g").attr("class", "magic-axis")
            .call(d3.svg.axis().scale(scaleGroup[i]).orient("bottom"))
            .attr("transform", "translate(" + originPoint.x + "," + originPoint.y + ") rotate(".concat(initAngle + deltaAngle * i) + ")")
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("opacity", 0.5)
            .append("text")
            .text(allNutrientsList[i])
            .attr("transform", "translate(".concat(width / 2 + 6) + ",-12) rotate(90)");
        polygonGraph.selectAll(".tick text").remove();
    }
}

function createP(scaleGroup, initAngle, deltaAngle, originPoint) {
    //return array of polygons, each for one food.
    var polygons = [];
    for (var foodIdx in foodInfo) {
        var polygonPoints = [];
        for (var i in allNutrientsList) {
            var length = scaleGroup[i](1 + foodInfo[foodIdx][allNutrientsList[i]]);
            var dx = Math.cos((initAngle + deltaAngle * i) * (Math.PI / 180)) * length;
            var dy = Math.sin((initAngle + deltaAngle * i) * (Math.PI / 180)) * length;
            var point = {x: originPoint.x + dx, y: originPoint.y + dy};
            polygonPoints.push(point);
        }
        polygons.push(polygonPoints);
    }
//        polygons.forEach(function(d){
//            console.log(d.map(function(e){
//                return [e.x, e.y];
//            }).join());
//        })
    return polygons;
}

function drawAndUpdatePolygons(polygons) {
    var polygonUpdate = polygonGraph.selectAll("polygon")
        .data(polygons);
        // .attr("points", function(d) {
        //     return d.map(function(d){
        //         return [d.x, d.y].join();
        //     }).join(" ");//space point pairs
        // }).attr("id", function(d, i) {return i;})
        // .attr("data-legend", function(d, i){
        //     console.log(foodInfo[i].group);
        //     return foodInfo[i].group;
        // });
    polygonUpdate.enter().append("polygon")
        .attr("id", function(d, i) {return "number" + i;})
        .attr("points", function(d) {
            return d.map(function(d){
                return [d.x, d.y].join();
            }).join(" ");//space point pairs
        })
        .attr("stroke", function(d, i) {
            return colorForFoodGroup[foodInfo[i].group];
        })
        .attr("data-legend", function(d, i){
            return foodInfo[i].group;
        })
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .attr("opacity", 0.1);
    polygonUpdate.exit().remove();
}

function drawAndUpdateLegends() {
    polygonGraph.selectAll(".legend").remove();
    var cx = 18, cy = 26, r = 9;
    var legend = polygonGraph.selectAll(".legend")
        .data(filteredFoodGroupsList);
    var enter = legend.enter().append("g")
        .attr("clicked", "no")
        .attr("class", "legend")
        .on("click", function(d){
            var clicked = d3.select(this).attr("clicked");
            if (clicked == "no") {
                d3.select(this).attr("clicked", "yes");
            }
            else {
                d3.select(this).attr("clicked", "no");
            }
            toggle_highlightGroup(d, clicked);
        })
        .attr("transform", function(d, i){
            var y = 10 + i * 30;
            var x = width + 40;
            return "translate(" + x + ", " + y + ")";
        });
    enter.append("circle")
        .attr("r", r)
        .attr("opacity", 1)
        .on("mouseenter", function(){
            d3.select(this).attr("r", r * 1.5);
        })
        .on("mouseleave", function(){
            if (this.parentNode.getAttribute("clicked") == "no")
                d3.select(this).attr("r", r);
        })
        .attr("fill", function(d){return colorForFoodGroup[d]});
    enter.append("text")
        .attr("x", 10)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .text(function(d){return d});
    legend.exit().remove();
    legend.selectAll("circle").style("transition", "all 0.3s");
}

function toggle_highlightGroup(groupName, clicked) {
    var sameGroupPolygon = d3.selectAll("#polygonSvg polygon").attr("opacity", 0.1).filter(function(){
        var id = d3.select(this).attr("id").split("number")[1];
        return foodInfo[id].group == groupName;
    });
    if (clicked == "yes") {
        sameGroupPolygon.moveToBack();
        sameGroupPolygon.attr("opacity", 0.1);
    }
    else {
        sameGroupPolygon.moveToFront();
        sameGroupPolygon.attr("opacity", 0.5);
    }
}

var thresholdArea;
var sliders = [];
var sliderForNutrient = {};

function createThreshold() {
    thresholdArea = d3.select(".threshold-area");
    var rowCount = 0;
    var currentRow;
    for (var i in allNutrientsList) {
        if (rowCount == 0) {
            currentRow = thresholdArea.append("tr").attr("class", "row");
        }
        var input = currentRow.append("td").style("text-align", "center");
        input.append("input").attr("id", "slider" + i).attr("type", "text").attr("class", "span2");
        input.append("div").text(allNutrientsList[i]);
        var minValue = scaleGroup[i].domain()[0] - 1, maxValue = scaleGroup[i].domain()[1] - 1;
        var slider = new Slider("#slider" + i, {
            min: minValue,
            max: maxValue,
            value: [minValue, maxValue],
            step: adjust
        });
        sliders.push(slider);
        sliderForNutrient[allNutrientsList[i]] = slider;
        rowCount += 1;
        if (rowCount == 1)
            rowCount = 0;
    }
    thresholdArea.selectAll("td").style("padding", "20px");
    for (var i in sliders) {
        sliders[i].on("slideStop",function(v){
            updateGraphs();
        });
    }
}

function updateGraphs() {
    filteredFoodInfo = foodInfo.filter(function(d) {
        for (var i in allNutrientsList) {
            var range = sliders[i].getValue();
            var nutrientValue = d[allNutrientsList[i]];
            if (nutrientValue < range[0] || nutrientValue > range[1]) {
//                    console.log(d.name, d.id, allNutrientsList[i], nutrientValue, range);
                return false;
            }
        }
        return true;
    });
    searchFunction();
    filteredFoodGroupsList = updateFoodGroups(filteredFoodInfo);
    updateLegends();
    $("#polygonSvg polygon")
        // .attr("opacity", 0.1)
        .css("visibility", function(i){
        var id = this.id.split("number")[1];
        var food = foodInfo[Number(id)];
        for (var i in allNutrientsList) {
            var range = sliderForNutrient[allNutrientsList[i]].getValue();
            if (food[allNutrientsList[i]] < range[0] || food[allNutrientsList[i]] > range[1]) {
                return "hidden";
            }
        }
        return "visible";
    });
    drawScatterPlot();
}

function updateLegends(){
    polygonGraph.selectAll(".legend")
        .style("display", function(d){
            return filteredFoodGroupsList.indexOf(d) > -1 ? "block" : "none";
        });
}

function updateFoodGroups(filteredFoodInfo) {
    var newGroupList = [];
    var set = {};
    filteredFoodInfo.forEach(function(d){
        set[d.group] = true;
    });
    foodGroupsList.forEach(function(d){
        if (d in set) {
            newGroupList.push(d);
        }
    });
    return newGroupList;
}

function deprecated_updateGraphs() {
//        console.log("update");
    foodInfo = originalFoodInfo.filter(function(d) {
        for (var i in allNutrientsList) {
            var range = sliders[i].getValue();
            var nutrientValue = d[allNutrientsList[i]];
            if (nutrientValue < range[0] || nutrientValue > range[1]) {
//                    console.log(d.name, d.id, allNutrientsList[i], nutrientValue, range);
                return false;
            }
        }
        return true;
    });
    for (var i in foodInfo) {
//            console.log(foodInfo[i]);
    }
    var polygons = createP(scaleGroup, initAngle, deltaAngle, originPoint);
    drawAndUpdatePolygons(polygons);

}
//////////////////////////////////////////////////////Search food function///////////////////////////////////////////
function searchFunction() {
    var searchResult=[];
    var input;
    input = document.getElementById("mySearch").value;
    for(var i=0;i<filteredFoodInfo.length;i++){
        var name = filteredFoodInfo[i].name;
        if(name.toLowerCase().includes(input.toLowerCase())) {
            searchResult.push(filteredFoodInfo[i]);
        }
    }
    console.log(input);
    console.log(searchResult.length);
    displayResult(searchResult,input);
}

function displayResult(searchResult,input) {
    var displayList = d3.select("#food-list-show ul").selectAll("li").data(searchResult);
    displayList.enter().append("li");
    displayList.exit().remove();
    d3.select("#food-list-show ul").selectAll("li").text(function(d) {return d.name;})
        .style("color", function(d){
            return colorForFoodGroup[d.group];
        })
        .on("mouseover", function(){
            d3.select(this).style("background-color", "#262626").style("color", "#fff");
        })
        .on("mouseleave", function(){
            d3.select(this).style("background-color", "inherit").style("color", function(d){
                return colorForFoodGroup[d.group];
            });
        })
        .on("click", function(d) {
            visData(d);
            highlightItem(d);
        });
}

//////////////////////////////////////////////////
function deprecated_display( searchResult,input){
    var len=searchResult.length;
    var node=document.getElementById("food-list-show");
    node.innerHTML='';
    console.log(len);
    // if(len>50) len=50;
    for(var i=0;i<len;i++){

        var name=searchResult[i]["name"];
        var ss =name+"#";
        for(j=0;j<allNutIncludingCalories.length;j++) {
            ss=ss+searchResult[i][allNutIncludingCalories[j]]+"#";
        }
        var s ='<a href="#item" onclick="visData(\'' + ss + '\')">'+name+'</a>';
        var div = document.createElement('div');
        div.innerHTML=s;
        node.appendChild(div);
    }

}
/////////////////////////////// draw pie chart /////////////////////////////////////////////////////////////////////////////////////
function visData(ss){
    d3.select("#piechart-food-name")
        .text(ss.name)
        .style("color", colorForFoodGroup[ss.group])
        .on("click", function(){
            highlightItem(ss);
        });
    var chartNode=document.getElementById("piechart");
    chartNode.innerHTML="";
    console.log(ss);
    var w = 400;
    var h = 400;
    var r = h/2;
    var color = d3.scale.category20c();
    // for(i=0;i<info.length;i++) console.log(info[i]+"#");
    var protein=ss[allNutIncludingCalories[0]];
    if(isNaN(protein)) protein=0;
    // console.log(info[1]);
    // console.log(protein);
    var carbo=ss[allNutIncludingCalories[6]];
    if(isNaN(carbo)) carbo=0;
    // console.log(carbo);
    var suger=ss[allNutIncludingCalories[7]];
    if(isNaN(suger)) suger=0;
    // console.log(suger);
    var water=ss[allNutIncludingCalories[9]];
    if(isNaN(water)) water=0;
    // console.log(water);
    var calcium=ss[allNutIncludingCalories[1]];
    var sodium=ss[allNutIncludingCalories[2]];
    var fiber=ss[allNutIncludingCalories[3]];
    var vitaminC=ss[allNutIncludingCalories[4]];
    var fat=ss[allNutIncludingCalories[8]];

    var chartInfo=document.getElementById("piechartInfo");
    chartInfo.innerHTML='<h3  class="pos center-title">Main Components</h3><pre> C:carbohydrate:'+carbo+'g '
        +  'S:Suger:'+suger+'g ' +'P:protein:'+protein+'g ' + 'Cal:calcium:'+ calcium + 'g ' + 'Sod:sodium:'+sodium+'g '
        +'Fi:fiber:'+ fiber + 'g '+'VC:vitaminC:'+vitaminC+ 'g '+ 'Fa:fat:'+fat+'g</pre>';

    var data = [{"label":"P", "value":protein},
        {"label":"C", "value":carbo},
        {"label":"S", "value":suger},
        // {"label":"W", "value":water},
        {"label":"Cal", "value":calcium},
        {"label":"Sod", "value":sodium},
        {"label":"Fi", "value":fiber},
        {"label":"VC", "value":vitaminC},
        {"label":"Fa", "value":fat}];
    var vis = d3.select('#piechart').append("svg:svg").data([data]).attr("width", w).attr("height", h).append("svg:g").attr("transform", "translate(" + r + "," + r + ")");
    var pie = d3.layout.pie().value(function(d){return d.value;});
    var arc = d3.svg.arc().outerRadius(r);
    var arcs = vis.selectAll("g.slice").data(pie).enter().append("svg:g").attr("class", "slice");
    arcs.append("svg:path")
        .attr("fill", function(d, i){
            return color(i);
        })
        .attr("d", function (d) {
            // log the result of the arc generator to show how cool it is :)
            console.log(arc(d));
            return arc(d);
        });
    arcs.append("svg:text").attr("transform", function(d){
        d.innerRadius = 0;
        d.outerRadius = r;
        return "translate(" + arc.centroid(d) + ")";}).attr("text-anchor", "middle").text( function(d, i) {
        return data[i].label;}
         )
        .style("visibility", function(d, i){
            return data[i].value == 0 ? "hidden" : "visible";
        })
}
///////////////////////////////////////////////////////////////////////////Scatter Plot /////////////////////////////////////

function drawScatterPlot() {
    render(filteredFoodInfo);
}
function render(data) {
    renderDrawing(data);
}
function renderDrawing(data) {

    var xScale = d3.scale.linear()
        .range([0, innerWidth])
        .domain(d3.extent(data, function(d) { return d[xValue]}));
    var yScale = d3.scale.linear()
        .range([innerHeight, 0])
        .domain(d3.extent(data, function(d) { return d[yValue]}));
    var xAxis = d3.svg.axis()
    //                .tickSize(-360)
        .tickFormat(function(d) {
            var prefix = d3.formatPrefix(d);
            return prefix.scale(d) + prefix.symbol;
        })
        .scale(xScale)
        .orient("buttom");

    var yAxis = d3.svg.axis()
        .scale(yScale)
        //                .tickSize(-460)
        .orient("left");

    xAxisGroup.call(xAxis);
    yAxisGroup.call(yAxis);
    scatterChart.selectAll(".domain").attr("fill", "none").attr("stroke", "#000");

    var dotGroupSelection = dotGroup.selectAll("circle")
        .data(data);


    dotGroupSelection.enter()
        .append ("circle")
        .on ("mouseenter", function(d, i) {
            highlight (d.name);
            d3.select("#tooltip")
                .style({
                visibility: "visible",
                top: (d3.event.clientY + 5) + "px",
                left: (d3.event.clientX + 5) + "px",
                opacity: 0.7
            }).text(d.name);
        })
        .on("click", function(d){
            visData(d);
            highlightItem(d);
        })
        .on ("mouseleave", function(d, i) {
            unhighlight();
            d3.select("#tooltip").style({
                opacity: 0
            })
        });
    dotGroupSelection.exit().remove();

    dotGroupSelection.transition()
        .attr ("r", 3)
        .attr ("cx", function(d, i) {
            return xScale(d[xValue]);
        })
        .attr ("cy", function(d, i) {
            return yScale(d[yValue]);
        })
        .attr ("fill", function(d, i) {
            return colorForFoodGroup[d.group];
        })
        .attr("stroke", undefined)
        .attr ("opacity", 0.6);
}

function highlight(name) {
    dotGroup.selectAll("circle")
        .attr("r", function(d, i) {
            return d.name == name? 7 : 3;
        })
        .style("stroke", function(d){
            return d.name == name? "#000" : undefined;
        })
//            d3.select(this).style({stroke: "black"});
}
function unhighlight() {
    dotGroup.selectAll("circle")
        .attr("r", 3)
        .style("stroke", undefined)
//            d3.select(this).style({stroke: undefined});
}
function changeXYValue() {
    var xOption = d3.select("#xAxisOption");
    var yOption = d3.select("#yAxisOption");
    xValue = xOption.node().value;
    yValue = yOption.node().value;
    drawScatterPlot();
}

function highlightItem(d){
    var id = -1;
    for (var i in foodInfo) {
        if (foodInfo[i].name == d.name) {
            id = i;
            break;
        }
    }
    if (id == -1) return;
    polygonGraph.selectAll("polygon")
    .attr("opacity", 0.1).attr("stroke-width", 2);
    polygonGraph.select("#number" + id).attr("stroke-width", 5).attr("opacity", 1).moveToFront();
    dotGroup.selectAll("circle").attr("r", 3).attr("stroke", undefined).filter(function(data){
        return data.name == d.name;
    }).attr("r", 7).attr("stroke", "#000").moveToFront();

}
