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
        .data(polygons)
        .attr("points", function(d) {
            return d.map(function(d){
                return [d.x, d.y].join();
            }).join(" ");//space point pairs
        }).attr("id", function(d, i) {return i;})
        .attr("data-legend", function(d, i){
            console.log(foodInfo[i].group);
            return foodInfo[i].group;
        });
    polygonUpdate.enter().append("polygon")
        .attr("id", function(d, i) {return i;})
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
        .attr("class", "legend")
        .attr("transform", function(d, i){
            var y = 10 + i * 30;
            var x = width + 40;
            return "translate(" + x + ", " + y + ")";
        });
    enter.append("circle")
        .attr("r", r)
        .attr("opacity", 0.8)
        .attr("fill", function(d){return colorForFoodGroup[d]});
    enter.append("text")
        .attr("x", 10)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .text(function(d){return d});
    legend.exit().remove();
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
    drawAndUpdateLegends();
    $("#polygonSvg polygon").css("visibility", function(i){
        var id = this.id;
        var food = foodInfo[Number(id)];
        for (var i in allNutrientsList) {
            var range = sliderForNutrient[allNutrientsList[i]].getValue();
            if (food[allNutrientsList[i]] < range[0] || food[allNutrientsList[i]] > range[1]) {
                return "hidden";
            }
        }
        return "visible";
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
    var displayList = d3.select("#food-list-show ul").selectAll("li").data(searchResult)
        .text(function(d){return d.name;})
        .on("click", function(d) {
            console.log(d);
        });
    var newLi = displayList.enter().append("li")
        .text(function(d) {return d.name;})
        .on("mouseover", function(){
            d3.select(this).style("background-color", "#262626").style("color", "#fff");
        })
        .on("mouseleave", function(){
            d3.select(this).style("background-color", "inherit").style("color", "inherit");
        })
        .on("click", function(d) {
            console.log(d);
        });
    displayList.exit().remove();
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
function visData(ss){
    var info=ss.split("#");
}