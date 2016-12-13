var url = "http://api.nal.usda.gov/ndb/";
var APIKey = "yAJGw3PWEEC0HJz5WQjnlUibWVgKAx1vvg9taiH7";

dataFile = "nutrients.csv";

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
    "Fast Foods", "Meals, Entrees, and Sidedishes", "Restaurant Foods"
];
var foodInfo = [];
var foodGroupsInfo = [];
var width, height;
var margin = {left: 5, right: 5, top: 20, bottom: 30};
var mainView, rectGroup, popupWindow;

function initialize() {
    d3.csv("data/" + dataFile, function(error, result){
        foodInfo = result.sort(function(food1, food2) {
            return food1.group.localeCompare(food2.group);
        });
        createMainView();
    });
}

function createMainView() {
    calculateIntegrated(foodInfo, foodGroupsInfo);

    mainView = d3.select("#bar-chart");
    popupWindow = d3.select(".popup-list");
    width = mainView.attr("width") - margin.left - margin.right;
    height = mainView.attr("height") - margin.top - margin.bottom;
    rectGroup = mainView.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "rect-group");
    var xScale = d3.scale.ordinal().rangeRoundBands([0, width], 0.02, 0.01);
    var yScale = d3.scale.linear().rangeRound([height, 0]);
    var zScale = d3.scale.category20();
    // xScale.domain(foodGroupsInfo.map(function(d){return d.group;}));
    yScale.domain([0, d3.max(foodGroupsInfo, function(d){
        return totalNut2(d);
    })]);
    // zScale.domain(allNutrientsList);
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");
        // .tickFormat(d3.time.format("%b"));

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    var layers = d3.layout.stack()(allNutrientsList.map(function(n){
        return foodGroupsInfo.map(function(fg){
            return {x: fg.group, y: fg[n]};
        });
    }));
    xScale.domain(layers[0].map(function(d){return d.x}));
    // yScale.domain([0, d3.max(layers[layers.length - 1], function(d) { return d.y0 + d.y; })]).nice();
    var nutrientName = "";
    var layer = rectGroup.selectAll(".layer")
        .data(layers)
        .enter().append("g")
        .attr("class", "layer")
        .style("fill", function(d, i){return zScale(i)})
        .on("mouseenter", function(d, i){
            nutrientName = allNutrientsList[i];
        });
    layer.selectAll("rect")
        .data(function(d){return d})
        .enter().append("rect")
        .on("mouseenter", function(d){
            d3.select(this).style({stroke: "#000"});
            var top = d3.event.clientY, left = d3.event.clientX + 10;
            popupWindow.style({
                visibility: 'visible',
                top: top + 'px',
                left: left + 'px',
                opacity: 1
            }).text(nutrientName + ": " + d.y.toFixed(3));
        })
        .on("mouseleave", function(d){
            d3.select(this).style("stroke", "none");
            popupWindow.style({visibility: 'hidden', opacity: '0'});
        });
    layer.selectAll("rect")
        .transition()
        .attr("x", function(d){return xScale(d.x)})
        .attr("y", function(d) { return yScale(d.y + d.y0)})
        .attr("height", function(d) { return yScale(d.y0) - yScale(d.y + d.y0); })
        .attr("width", xScale.rangeBand() - 1);

    rectGroup.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-.55em")
        .attr("transform", "rotate(-90)" );
    rectGroup.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis)
        .append("text")
        .attr("dx", "11em")
        .style("text-anchor", "end")
        .text("Nutrients content(100g)");

    var legend = rectGroup.selectAll(".legend")
        .data(allNutrientsList)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i){
            var y = height - 26 - i * 30;
            return "translate(0, " + y + ")";
        });
    legend.append("rect")
        .attr("x", -60)
        .attr("width", 18)
        .attr("height", 26)
        .attr("fill", function(d, i){return zScale(i)});
    legend.append("text")
        .attr("x", -65)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(function(d){return d});
}

function totalNut(foodGroup) {
    var total = 0;
    $.each(foodGroup, function(attr, value){
        if (attr == "group")
            return;
        total += value;
    });
    return total;
}
//Use nutrientlist
function totalNut2(foodGroup) {
    var total = 0;
    for (var index in allNutrientsList) {
        total += foodGroup[allNutrientsList[index]];
    }
    return total;
}

function calculateIntegrated(fromArr, intoArr) {
    if (fromArr == undefined || fromArr == null || fromArr.length == 0) {
        intoArr = fromArr;
        return;
    }
    var foodGroup = constructFG(fromArr[0]);
    var index = 1, count = 1;
    while (index < fromArr.length) {
        if (fromArr[index].group == foodGroup.group) {
            ++count;
            sumFood(fromArr[index], foodGroup);
            ++index;
        } else {
            intoArr.push(averageNut(foodGroup, count));
            foodGroup = constructFG(fromArr[index++]);
            count = 1;
        }
    }
    intoArr.push(averageNut(foodGroup, count));
    return intoArr;
}

function averageNut(foodGroup, count) {
    $.each(foodGroup, function(attribute, value) {
        if (attribute == "group")
            return;
        foodGroup[attribute] /= count;
    });
    return foodGroup;
}

function sumFood(toAdd, foodGroup) {
    $.each(foodGroup, function(attribute, value) {
        if (attribute == "group")
            return;
        foodGroup[attribute] += Number(toAdd[attribute]);
    });
    return foodGroup;
}

function constructFG(food) {
    var foodGroup = {};
    $.each(food, function(attribute, value) {
        if (attribute == "name" || attribute == "id")
            return;
        if (attribute == "group") {
            foodGroup[attribute] = value;
            return;
        }
        foodGroup[attribute] = Number(value);
    });
    return foodGroup;
}