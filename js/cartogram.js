/*
 *  jQuery listeners for bootstrap menus
 *
 */


$("#cartoMenu .colorBy li a").click(function () {
    var inputVal = $(this).text();
    colorCat = inputVal;
    menuListener(inputVal, "colorBy")
});

$("#cartoMenu .sizeBy li a").click(function () {
    var inputVal = $(this).text();
    sizeCat = inputVal;
    menuListener(inputVal, "sizeBy")
});

$("#cartoMenu .placeBy li a").click(function () {
    var inputVal = $(this).text();
    verticalCat = inputVal;
    menuListener(inputVal, "placeBy")
});

$("#cartoMenu .region ").click(function (event) {
    var target = $(event.target);
    if (!target.is("input")) {
        event.preventDefault();
        event.stopPropagation();
        $(this).children(".division").toggleClass("hide");
    }
    ;
});

$("#cartoMenu .cartoReset").click(function () {

    // change the display to Census
    setTimeout(function () {
        updateVisColor("region");
    }, 1000);
    // Make the chart equisize
    setTimeout(function () {
        updateVisArea("Equisize", sizeInput);
    }, 2000);
    // Use the US layout
    setTimeout(function () {
        restoreCarto();
    }, 3000);
    // clear the filters
    filterListener("all", true);
    // Make the chart equisize
    setTimeout(function () {
        updateVisArea("Equisize", sizeInput);
    }, 5000);
    // Use the

});

var $states = $('#cartoMenu.states input[type=checkbox]');
$('#cartoMenu .state-filter input[type=checkbox]').change(function () {
    var $el = $(this);
    var v = this.value;
    var checked = this.checked;

    // (Un)Select children to match parent
    if (v === 'all') {
        $('#cartoMenu .region input[type=checkbox]').prop('checked', checked);
    }
    else if (v.indexOf('region-') > -1 || v.indexOf('division-') > -1) {
        $el.closest('ul').find('input[type=checkbox]').prop('checked', checked);
    }
    if (!checked) {
        checked = false;
    }
    filterListener(v, checked);
});


function getAttributeName(input) {
    switch (input) {
        case 'Bottom Quintile of Income' :
            return "bottom_quintile_hhi";
        case 'Census Region'  :
            return "region";
        case 'Equal Size' :
            return "Equisize";
        case 'Fruit Consumption' :
            return "adult_at_least_one_fruit";
        case 'Income Inequality' :
            return "income_inequality";
        case 'Land Area' :
            return "area";
        case 'Leisure Activity' :
            return "adults_w_no_activity";
        case 'Obesity Rate' :
            return "obesity %";
        case 'Obesity Total' :
            return "obesity total";
        case 'Population' :
            return "population";
        case 'Soda Consumption' :
            return "soda_consumption";
        case 'Top Quintile of Income' :
            return "top_quintile_hhi";
        case 'TV Activity' :
            return "teen_w_3_plus_tv_hrs";
        case 'US Map' :
            return "us map";
        case 'Vegetable Consumption' :
            return "adult_at_least_one_veg";
        case 'Weight Activity' :
            return "adults_aerobic_strength";
    }
}


function menuListener(inputValue, functionCall) {


    function getFunctionName(input, call) {
        if (input != "us map") {
            switch (call) {
                case 'sizeBy':
                    return updateVisArea(input, sizeInput);
                case 'colorBy':
                    return updateVisColor(input);
                case 'placeBy':
                    return updateVisPlacement(input);
            }
        } else {
            return restoreCarto(sizeInput);
        }
    }

    getFunctionName(getAttributeName(inputValue), functionCall);

}


/*
 * CartogramChart - Object constructor function
 * @param _parentElement  -- the HTML element in which to draw the visualization
 * @param _data           -- the
 */
// color style function
function styleRegion(d) {
    switch (d.region) {
        case 'PACIFIC':
            return '#039362';
        case 'WEST':
            return '#E12E34';
        case 'MIDWEST':
            return '#959595';
        case 'SOUTH':
            return '#F59219';
        case 'NORTHEAST':
            return '#0281CA';
    }
}

// counter for filtration
var cartoColumnCounter = 0;
var cartoRowCounter = 0;
var cartoFilterArray = [];

var verticalCat = 'US Map';
var sizeCat = 'Equal Size';
var colorCat = 'Census Region';
var sizeInput = 50;

var yFilterOffset = 115,
    xFilterOffset = 810,
    filterIconPad = 15;

var cartoFacet,
    cartoContext;

var cartoData = [];

CartogramChart = function (_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.data.forEach(function (d) {
        d.shift = 0;
        d.previousColor = 0;
    });
    cartoData = this.data;

    // DEBUG RAW DATA
    // console.log(this.data);

    this.initVis();

};

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

CartogramChart.prototype.initVis = function () {
    var vis = this;


    vis.chart = d3.select('#' + vis.parentElement).append('svg:svg')
        .attr('width', 1168)
        .attr('height', 540)
        .attr('id', 'cartoMain');

    vis.margin = {top: 40, right: 40, bottom: 40, left: 80},
        vis.padding = {top: 50, right: 50, bottom: 50, left: 50},
        vis.outerWidth = 820,
        vis.outerHeight = 680,
        vis.innerWidth = vis.outerWidth - vis.margin.left - vis.margin.right,
        vis.innerHeight = vis.outerHeight - vis.margin.top - vis.margin.bottom,
        vis.width = vis.innerWidth - vis.padding.left - vis.padding.right,
        vis.height = vis.innerHeight - vis.padding.top - vis.padding.bottom;

    // add the legend for size using this framework: http://d3-legend.susielu.com/
    vis.chart
        .append("g")
        .attr("class", "legendSize")
        .attr("transform", "translate(720, 240)");

    // add a color legend
    vis.chart
        .append("g")
        .attr("class", "legendQuant")
        .attr("transform", "translate(720,20)");

    // make the correlation slider
    var slider = iopctrl.slider()
        .width(50)
        .events(false)
        .bands([
            {"domain": [-.25, .25], "span":[0.75, 0.12] , "class": "fault"},
            {"domain": [-.5, -.25], "span":[0.75, 0.12] , "class": "weakfault"},
            {"domain": [.25, .5], "span":[0.75, 0.12] , "class": "weakfault"},
            {"domain": [.5, .75], "span": [0.75, 0.12] , "class": "warning"},
            {"domain": [-.75, -.5], "span": [0.75, 0.12] , "class": "warning"},
            {"domain": [.75, 1], "span": [0.75, 0.12] , "class": "ok"},
            {"domain": [-1, -.75], "span": [0.75, 0.12] , "class": "ok"}
        ])
        .ease("elastic");

    var slideScale = d3.scale.linear()
        .domain([-1,1])
        .range([0, 200]);

    slider.axis().orient("top")
        .ticks(6)
        .tickSubdivide(8)
        .tickSize(10, 4, 10)
        .scale(slideScale);

    // add the correlation graph
    vis.chart
        .append("g")
        .attr("transform", "translate(710, 420)")
        .attr("class", "lineargauge hide")
        .call(slider)
        .append("rect")
        .attr("class", "indicator")
        .attr("x", 19)
        .attr("y", 23)
        .attr("height", 38)
        .attr("width", 5)
        .attr("opacity", 0);

    // correlation graph label
    vis.chart
        .append("text")
        .attr("class", "lineargaugeLabel")
        .attr("x", 720)
        .attr("y", 380)
        .text("")
        .attr("opacity", 0);

    // correlation graph readout
    vis.chart
        .append("text")
        .attr("class", "lineargaugeR")
        .attr("x", 940)
        .attr("y", 468)
        .text("R")
        .attr("opacity", 0);

    // correlation graph readout 2
    vis.chart
        .append("text")
        .attr("class", "lineargaugeRQual")
        .attr("x", 740)
        .attr("y", 500)
        .text("strong negative association")
        .attr("opacity", 0);


    // x axis label
    vis.chart
        .append("text")
        .attr("class", "xlabel")
        .attr("text-anchor", "end")
        .attr("x", vis.innerWidth)
        .attr("y", vis.height - 6)
        .text("")
        .attr("opacity", 0);

    // y axis label
    vis.chart
        .append("text")
        .attr("class", "ylabel")
        .attr("text-anchor", "end")
        .attr("y", 20)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("")
        .attr("opacity", 0);

    // SVG drawing area
    vis.svg = d3.select('#' + vis.parentElement).select('#cartoMain').append('svg:svg')
        .attr('width', vis.outerWidth)
        .attr('height', vis.outerHeight)
        .attr('class', 'carto');

    // draw x scale
    vis.x = d3.scale.linear()
        .range([0, vis.width])
        .domain([0, d3.max(vis.data, function (d) {
            return d.location[0];
        })]);

    // draw y scale
    vis.y = d3.scale.linear()
        .range([vis.height, 0])
        .domain([0, d3.max(vis.data, function (d) {
            return d.location[1] + 2;
        })]);

    // draw the x axis
    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient('bottom');

    vis.svg.append('g')
        .attr("width", vis.outerWidth)
        .attr("height", vis.outerHeight)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.height + ")")
        .attr('class', 'axis xAxis')
        .attr('opacity', 0)
        .call(vis.xAxis);

    // draw the y axis
    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient('left');

    vis.svg.append('g')
        .attr("width", vis.outerWidth)
        .attr("height", vis.outerHeight)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + 0 + ")")
        .attr('class', 'axis yAxis')
        .attr('opacity', 0)
        .call(vis.yAxis);

    vis.initStates();
    // vis.initMenu();

};


// All of the state initialization
CartogramChart.prototype.initStates = function () {

    var vis = this;

    vis.formatPercent = d3.format(".0%");
    vis.formatNumber = d3.format('.2s');

    function formatToolTip(input) {
        switch (input) {
            case 'US Map' :
                return '"Population: " + vis.formatNumber(d["population"])';
            case 'Obesity Rate' :
                return '"Number of Obese: " + vis.formatNumber(d["obesity total"])';
            case 'Obesity Total' :
                return '"Number of Obese: " + vis.formatNumber(d["obesity total"])';
            case 'Population' :
                return '"Population: " + vis.formatNumber(d["population"])';
            case 'Land Area' :
                return '"Land Size: " + vis.formatNumber(d["area"])+ "square miles"';
            case 'Fruit Consumption' :
                return '"% Consuming 1+ fruits: " + vis.formatNumber(d["adult_at_least_one_fruit"])+"%"';
            case 'Vegetable Consumption' :
                return '"% Consuming 1+ vegetables: " + vis.formatNumber(d["adult_at_least_one_veg"])+"%"';
            case 'Weight Activity' :
                return '"% Meeting physical strength requirements: " + vis.formatNumber(d["adults_aerobic_strength"])+"%"';
            case 'Leisure Activity' :
                return '"% of adults with no activity: " + vis.formatNumber(d["adults_w_no_activity"])+"%"';
            case 'TV Activity' :
                return '"% watching 3+ hours of tv: " + vis.formatNumber(d["teen_w_3_plus_tv_hrs"])+"%"';
            case 'Bottom Quintile of Income' :
                return '"Bottom quintile of HHI: $" + vis.formatNumber(d["bottom_quintile_hhi"])';
            case 'Top Quintile of Income' :
                return '"Top quintile of HHI: $" + vis.formatNumber(d["top_quintile_hhi"])';
            case 'Income Inequality' :
                return '"Income gap between bottom and top quintiles: $" + vis.formatNumber(d["income_inequality"])';
            case 'Soda Consumption' :
                return '"% Consuming soda daily: " + vis.formatNumber(d["soda_consumption"])+"%"';
            case 'Census Region'  :
                return '"Main Region: " + capitalizeFirstLetter(d["region"])';
            case 'Equal Size' :
                return '"Land Size: " + vis.formatNumber(d["area"]) + " square miles"';
        }
    }

    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) {
            console.log(formatToolTip(colorCat));
            if (!d.filtered) {
                d3.selectAll('.d3-tip').style("display", "block");
                this.parentNode.appendChild(this);
                return '<div class="tip-title">' + d.state_name + '</div>' +
                    '<div>' +
                    '<span class="tip-large-text">' +  d['obesity %'] + '%</span>' +
                    '&nbsp;<span class="tip-small-text">in ' + 2014 +  '<br>' +
                    eval(formatToolTip(sizeCat))  + '<br>' +
                    eval(formatToolTip(colorCat)) + '<br>' +
                    eval(formatToolTip(verticalCat))
                    + '</span>' +
                    '</div>';

                // return "<strong>" + d.state_name + ":</strong> <span style='color:red'>" + d['obesity %'] + "% Obese</span><br>" + eval(formatToolTip(sizeCat)) + "<br>" + eval(formatToolTip(colorCat)) + "<br>" + eval(formatToolTip(verticalCat));
            } else {
                d3.selectAll('.d3-tip').style("display", "none");
            }
        });

    vis.svg.call(vis.tip);


    // draw the states
    vis.svg.append('svg:g')
        .selectAll('cartoStates')
        .data(vis.data)
        .enter().append('svg:rect')
        .attr('class', function (d) {
            return 'cartoStates ' + d.region;
        })
        .attr('id', function (d) {
            return d.state + "Rect";
        })
        .attr('opacity', .95)
        .attr('fill', function (d) {
            d.previousColor = styleRegion(d);
            return styleRegion(d);
        })
        .attr('x', function (d) {
            d.x = vis.x(d.location[0]);
            return vis.x(d.location[0]);
        })
        .attr('y', function (d) {
            d.y = vis.y(d.location[1] + 1);
            return vis.y(d.location[1] + 1);
        })
        .attr('width', function (d) {
            return d.stateSize
        })
        .attr('height', function (d) {
            return d.stateSize
        })
        /*.on('click', function (d) {
         if (!d.filtered) {
         d.clicked = !d.clicked;
         if (d.clicked) {
         d3.select(this)
         .attr('stroke-width', 2)
         .attr('opacity', .95);
         d3.select('#' + d.state + "Label")
         .style("fill", "black")
         .style("font-weight", "bold");
         }
         else {
         d3.select(this)
         .attr('stroke-width', 1)
         .attr('opacity', .5);
         d3.select('#' + d.state + "Label")
         .style("font-weight", "normal");
         }
         }
         })*/
        .on('click', function (d) {
            if (!d.filtered) {
                d.filtered = !d.filtered;
                d3.select(this)
                    .transition().duration(400)
                    .style("opacity", 0);
                d3.select('#' + d.state + "Label")
                    .transition().duration(400)
                    .style("opacity", 0);
                // corresponding change to the filter
                $("#cartoMenu").find("[type=checkbox][value='" + d.state + "']").prop('checked', false);
                if (verticalCat!= 'US Map'){
                    getCorrelation(getAttributeName(verticalCat));
                }
            }
        })
        .on('mouseover', vis.tip.show)
        .on('mouseout', function () {
            vis.tip.hide();
        });

    // add state labels
    vis.svg.selectAll('cartoStates')
        .data(vis.data)
        .enter().append('text')
        .style("text-anchor", "middle")
        .attr('class', 'cartoStateLabel')
        .attr('x', function (d) {
            return d.x + 25;
        })
        .attr('y', function (d) {
            return d.y + 25;
        })
        .text(function (d) {
            return d.state;
        })
        .attr('id', function (d) {
            return d.state + "Label";
        });

};

function updateVisArea(inputParam, maxSize=50) {

    //  implement z scale (size)
    var z = d3.scale.linear()
        .range([5, maxSize])
        .domain([d3.min(cartoData, function (d) {
                if (inputParam == 'Equisize') {
                    return maxSize;
                }
                return d[inputParam];
            }
        ), d3.max(cartoData, function (d) {
                if (inputParam == 'Equisize') {
                    return maxSize;
                }
                return d[inputParam];
            }
        )]);

    var legendSize = d3.legend.size()
        .scale(z)
        .labelFormat(function(d){
            return getFormatRight(inputParam, d);})
        .shape('rect')
        .orient('horizontal')
        .shapePadding(15)
        .labelOffset(20)
        .title(sizeCat);

    if (inputParam == 'Equisize'){
        d3.select(".legendSize").transition().style("display","none").duration(1000)
    }
    else {
        // Add the shape legend
        d3.select(".legendSize").transition().style("display","inline").duration(1000);
        d3.select(".legendSize").call(legendSize);}


    var states = d3.selectAll(".cartoStates").data(cartoData);

    states
        .attr("transform", function (d) {
            if (inputParam == 'Equisize') {
                d.shift = (d.stateSize - maxSize) / 2;
                var inv_shift = d.shift * -1;
                return "translate(" + inv_shift + "," + inv_shift + ")";
            }
            else {
                return "translate(0, 0)";
            }
        });

    states
        .transition()
        .attr("height", function (d) {
            if (inputParam == 'Equisize') {
                d.shift = (d.stateSize - maxSize) / 2;
                d.stateSize = maxSize;
            } else {
                d.shift = (d.stateSize - z(d[inputParam]) ) / 2;
                d.stateSize = z(d[inputParam]);
            }
            return d.stateSize;
        })
        .attr("width", function (d) {
            return d.stateSize;
        })
        .attr("transform", function (d) {
            if (inputParam != 'Equisize') {
                return "translate(" + d.shift + "," + d.shift + ")";
            } else {
                return "translate(" + d.shift + "," + d.shift + ")";
            }
        })
        .duration(1000);

    var statesLabels = d3.selectAll(".cartoStateLabel").data(cartoData);

    statesLabels
        .attr("transform", function (d) {
            var inv_shift = d.shift * -1;
            return "translate(" + inv_shift + "," + inv_shift + ")";
        })
        .transition()
        .attr('x', function (d) {
            return d.x + d.stateSize / 2;
        })
        .attr('y', function (d) {
            return d.y + d.stateSize / 2;
        })
        .text(function (d) {
            return d.state;
        })
        .attr("transform", function (d) {
            if (inputParam != 'Equisize') {
                return "translate(" + d.shift + "," + d.shift + ")";
            } else {
                return "translate(" + 0 + "," + 0 + ")";
            }
        }).duration(1000);

}

function updateVisColor(inputParam) {

    //Cynthia Brewer's ColorBrewer
    var colorsInScale = 7;
    var colorBrew = colorbrewer.OrRd[colorsInScale];

    var colorScale = d3.scale.quantize()
        .range(colorBrew)
        .domain([d3.min(cartoData, function (d) {
                return d[inputParam];
            }
        ), d3.max(cartoData, function (d) {
                return d[inputParam];
            }
        )]);

    var states = d3.selectAll(".cartoStates").data(cartoData);

    states
        .transition()
        .attr("fill", function (d) {
            if (d3.select(this).attr("fill") != "white") {
                if (inputParam == 'region') {
                    d.previousColor = styleRegion(d);
                    return styleRegion(d);
                } else {
                    d.previousColor = colorScale(d[inputParam]);
                    return colorScale(d[inputParam]);
                }
            } else {
                if (inputParam == 'region') {
                    d.previousColor = styleRegion(d);
                } else {
                    d.previousColor = colorScale(d[inputParam]);
                }
                return "white";
            }
        }).duration(1000);

    var legend = d3.legend.color()
        .labelFormat(function(d){
            return getFormatRight(inputParam, d);})
        .scale(colorScale)
        .title(colorCat);

    if (inputParam == 'region'){
        d3.select(".legendQuant").style("display","none")
    }
    else {
        // Add the shape legend
        d3.select(".legendQuant").style("display","inline");
        d3.select(".legendQuant").call(legend);}

}

function updateVisPlacement(inputParam) {

    var width = 620,
        height = 500;

    // fixed at obesity % for x axis (for now...)
    var x = d3.scale.linear()
        .range([0, width])
        .domain([18, 35]);


    function getCorrectScale(input) {
        switch (input) {
            case "area" :
                return d3.scale
                    .log()
                    .domain([500, d3.max(cartoData, function (d) {
                        return d[inputParam] * 2
                    })])
                    .range([height, 0]);
            case "population"  :
                return d3.scale.log()
                    .domain([300000, d3.max(cartoData, function (d) {
                        return d[inputParam] * 2
                    })])
                    .range([height, 0]);
            case "obesity total":
                return d3.scale.log()
                    .domain([50000, d3.max(cartoData, function (d) {
                        return d[inputParam] * 2
                    })])
                    .range([height, 0]);
            default :
                return d3.scale
                    .linear()
                    .domain([d3.min(cartoData, function (d) {
                        return d[inputParam] * .75;
                    }), d3.max(cartoData, function (d) {
                        return d[inputParam] * 1.25;
                    })])
                    .range([height, 0]);
        }
    }

    var y = getCorrectScale(inputParam);


    // bring back the axes
    d3.selectAll(".axis")
        .attr('opacity', 1);

    d3.selectAll(".xlabel")
        .attr('opacity', 1)
        .transition().duration(500)
        .text('Obesity Percentage');

    d3.selectAll(".ylabel")
        .attr('opacity', 1)
        .transition().duration(500)
        .text(verticalCat);

    d3.selectAll(".lineargaugeLabel")
        .attr('opacity', 1)
        .transition().duration(500)
        .text("Obesity and " +verticalCat);

    // Update the Axis
    var xAxis = d3.svg
        .axis()
        .tickFormat(function(d) { return d + "%"; })
        .scale(x)
        .orient("bottom");



    var yAxis = d3.svg
        .axis()
        .tickFormat(function(d){
            return getFormatRight(inputParam, d);})
        .scale(y)
        .orient("left");

    d3.selectAll(".xAxis")
        .transition()
        .duration(1500)
        .ease("sin-in-out")
        .call(xAxis);

    d3.selectAll(".yAxis")
        .transition()
        .duration(750)
        .ease("sin-in-out")
        .call(yAxis);

    var states = d3.selectAll(".cartoStates");//.data(cartoData);

    states
        .transition()
        .attr("x", function (d) {
            d.x = x(d['obesity %']);
            return d.x;
        }).duration(1000)
        .transition()
        .attr("y", function (d) {
            if (d[inputParam]!= 0 ) {
                d.y = y(d[inputParam]);
                d3.select(this)
                    .attr("fill", function(d){
                        return d.previousColor;
                    });
                return d.y;}
            else {
                d.y = y(6);
                d3.select(this)
                    .attr("fill", "white");
                return d.y;
            }
        }).duration(1000);

    var statesLabels = d3.selectAll(".cartoStateLabel");//.data(cartoData);

    statesLabels
        .transition()
        .attr('x', function (d) {
            return x(d['obesity %']) + d.stateSize / 2;
        })
        .attr('y', function (d) {
            if (d[inputParam]!= 0 ) {
                return y(d[inputParam]) + d.stateSize / 2;}
            else {
                return y(6) + d.stateSize / 2;
            }
        })
        .text(function (d) {
            return d.state;
        }).duration(2500);

    getCorrelation(inputParam);
}
function getFormatRight (inputParam, d) {
    var numFormat = d3.format('.2s');
    switch (inputParam) {
        case "adults_aerobic_strength" :
            return numFormat(d)+ "%";
        case "adult_at_least_one_veg" :
            return numFormat(d)+ "%";
        case "teen_w_3_plus_tv_hrs" :
            return numFormat(d)+ "%";
        case "soda_consumption" :
            return numFormat(d)+ "%";
        case "adults_w_no_activity" :
            return numFormat(d)+ "%";
        case "adult_at_least_one_fruit" :
            return numFormat(d)+ "%";
        case "obesity %" :
            return numFormat(d)+ "%";
        case "area" :
            return numFormat(d) + " mi";
        case "bottom_quintile_hhi" :
            return "$" + numFormat(d);
        case "income_inequality" :
            return "$" + numFormat(d);
        case "top_quintile_hhi" :
            return "$" + numFormat(d);
        default:
            return numFormat(d);
    }
}

function restoreCarto() {


    d3.select(".lineargauge")
        .transition()
        .attr("class","lineargauge hide")
        .duration(1000);

    verticalCat = "US Map";
    var width = 600,
        height = 500;

    var x = d3.scale.linear()
        .range([0, width])
        .domain([0, d3.max(cartoData, function (d) {
            return d.location[0];
        })]);

    // draw y scale
    var y = d3.scale.linear()
        .range([height, 0])
        .domain([0, d3.max(cartoData, function (d) {
            return d.location[1] + 2;
        })]);

    // Update the Axis
    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    d3.selectAll(".xlabel")
        .attr('opacity', 0)
        .transition().duration(500);

    d3.selectAll(".ylabel")
        .attr('opacity', 0)
        .transition().duration(500);

    d3.selectAll(".lineargaugeLabel")
        .attr('opacity', 0)
        .transition().duration(500);

    d3.selectAll(".lineargaugeR")
        .attr('opacity', 0)
        .transition().duration(500);

    d3.selectAll(".lineargaugeRQual")
        .attr('opacity', 0)
        .transition().duration(500);

    d3.selectAll(".xAxis")
        .call(xAxis);

    d3.selectAll(".yAxis")
        .call(yAxis);

    // bring back the axes
    d3.selectAll(".axis")
        .transition()
        .attr('opacity', 0)
        .duration(1000);

    var states = d3.selectAll(".cartoStates");//.data(cartoData);

    states
        .transition()
        .attr("fill", function (d) {
            return d.previousColor;
        })
        .attr("x", function (d) {
            d.x = x(d.location[0]);
            return d.x;
        }).duration(1000)
        .transition()
        .attr("y", function (d) {
            d.y = y(d.location[1] + 1);
            return d.y;
        }).duration(1000);

    var statesLabels = d3.selectAll(".cartoStateLabel");//.data(cartoData);

    statesLabels
        .transition()
        .attr('x', function (d) {
            return d.x + d.stateSize / 2;
        })
        .attr('y', function (d) {
            return d.y + d.stateSize / 2;
        })
        .text(function (d) {
            return d.state;
        }).duration(2500);
}


function include(arr, obj) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == obj) return true;
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
}

function filterListener(value, checked){

    switch (value) {
        case "all" :
            cartoData.forEach(function (d) {
                updateStates(d.state, checked);
            });
            break;
        case "region-ne" :
            cartoData.forEach(function (d) {
                if (d.region == 'NORTHEAST') {
                    updateStates(d.state, checked);
                }
            });
            break;
        case "region-mw" :
            cartoData.forEach(function (d) {
                if (d.region == 'MIDWEST') {
                    updateStates(d.state, checked);
                }
            });
            break;
        case "region-w" :
            cartoData.forEach(function (d) {
                if (d.region == 'WEST') {
                    updateStates(d.state, checked);
                }
            });
            break;
        case "region-s" :
            cartoData.forEach(function (d) {
                if (d.region == 'SOUTH') {
                    updateStates(d.state, checked);
                }
            });
            break;
        default:
            updateStates(value, checked);
    }

    function updateStates (value, filtered){
        var selState = d3.select('#' + value + "Rect");
        selState
            .style("stroke", function (d) {
                d.filtered = !filtered;
                return d3.select(this).attr("stroke");
            });
        if (!filtered) {
            selState
                .transition().duration(400)
                .style("opacity", 0);

            d3.select('#' + value + "Label")
                .transition().duration(400)
                .style("opacity", 0);
            $("#cartoMenu").find("[type=checkbox][value='" + value + "']").prop('checked', false);
        }
        else {
            selState
                .transition().duration(400)
                .style("opacity", .95);
            d3.select('#' + value + "Label")
                .transition().duration(400)
                .style("opacity", 1);
            $("#cartoMenu").find("[type=checkbox][value='" + value + "']").prop('checked', true);
        }
        if (verticalCat!= 'US Map'){
            getCorrelation(getAttributeName(verticalCat));
        }
    }
}

function getCorrelation(inputParam) {
    var obesity = [],
        factor = [];

    $.each(cartoData, function (index, value) {
        var filtered = d3.select("#" + (value['state'] + "Rect")).data()[0]['filtered'];
        if (value[inputParam] != 0 && !filtered) {
            obesity.push(value['obesity %']);
            factor.push(value[inputParam]);
        }
    });

    var data = new Array(
        obesity,
        factor
    );
    var value = pearsonCorrelation(data, 0, 1);

    var slideScale = d3.scale.linear()
        .domain([-1,1])
        .range([19, 218]);

    d3.select(".lineargauge.hide")
        .attr("class","lineargauge");

    d3.selectAll("#cartoMain .indicator")
        .attr("opacity", 1)
        .transition()
        .ease("bounce")
        .attr("x", function(){
            return slideScale(value);
        }).duration(2000);

    d3.selectAll(".lineargaugeR")
        .transition()
        .ease("sin-in-out")
        .attr('opacity', 1)
        .style('fill', function(){
            if (Math.abs(value) > .74) {
                return '#008000';
            } else if (Math.abs(value) > .50) {
                return '#FFA500';
            }  else if (Math.abs(value) > .25) {
                return '#BD4040';
            } else {
                return '#A70000';
            }
        })
        .text("R = "+Math.round(value*1000)/1000)
        .duration(500);

    d3.selectAll(".lineargaugeRQual")
        .transition()
        .ease("sin-in-out")
        .attr('opacity', 1)
        .attr('fill', function(){
            return '#008000';
        })
        .text(function(){
            var strength = "no";
            if (Math.abs(value) > .74) {
                d3.select(this).style("fill", '#008000');
                strength = "strong";
            } else if (Math.abs(value) > .50) {
                d3.select(this).style("fill", '#FFA500');
                strength = "moderate";
            }  else if (Math.abs(value) > .25) {
                d3.select(this).style("fill", '#BD4040');
                strength = "weak";
            }
            if (strength != "no" && value > 0) {
                return strength + " positive association";
            } else if (strength != "no") {
                return strength + " negative association";
            }
            d3.select(this).style("fill", '#A70000');
            return "no association";
        })
        .duration(500);
}