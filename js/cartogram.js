/*
 * CartogramChart - Object constructor function
 * @param _parentElement  -- the HTML element in which to draw the visualization
 * @param _data           -- the  
 */
// color style function
function styleRegion(d) {
    switch (d.region) {
        case 'PACIFIC': return  '#039362';
        case 'WEST': return  '#E12E34';
        case 'MIDWEST': return  '#959595';
        case 'SOUTH': return  '#F59219';
        case 'NORTHEAST': return  '#0281CA';
    }
}

// counter for filtration
var cartoColumnCounter = 0;
var cartoRowCounter = 0;
var cartoFilterArray = [];

var verticalCat = 'us map';

var yFilterOffset = 115,
    xFilterOffset = 810,
    filterIconPad = 15;

var cartoFacet,
    cartoContext;

var cartoData = [];

CartogramChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    cartoData = this.data;

    // DEBUG RAW DATA
    // console.log(this.data);

    this.initVis();

};

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

CartogramChart.prototype.initVis = function(){
    var vis = this;

    // get all of the chart panels built
    vis.initPanels();

    // define margin and dimensions for the Cartogram
    vis.margin = {top: 60, right: 60, bottom: 60, left: 60};
    vis.width = 731 - vis.margin.left - vis.margin.right;
    vis.height = 570 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select('#' +vis.parentElement).select('#cartoMain').append('svg:svg')
        .attr('width', vis.width + vis.margin.right + vis.margin.left)
        .attr('height', vis.height + vis.margin.top + vis.margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + vis.margin.left + ',' + vis.margin.top + ')')
        .attr('width', vis.width)
        .attr('height', vis.height)
        .attr('class', 'carto');

    // draw x scale
    vis.x = d3.scale.linear()
        .range([0, vis.width])
        .domain([0, d3.max(vis.data, function (d) {return d.location[0];})]);

    // draw y scale
    vis.y = d3.scale.linear()
        .range([vis.height, 0])
        .domain([0, d3.max(vis.data, function (d) {return d.location[1] + 1;})]);

    // draw the x axis
    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient('bottom');

    vis.svg.append('g')
        .attr('transform', 'translate(0,' + vis.height + ')')
        .attr('class', 'axis xAxis')
        .attr('opacity', 0)
        .call(vis.xAxis);

    // draw the y axis
    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient('left');

    vis.svg.append('g')
        .attr('transform', 'translate(0,0)')
        .attr('class', 'axis yAxis')
        .attr('opacity', 0)
        .call(vis.yAxis);

    vis.initStates();
    vis.initMenu();

};

// Chart setup with all of the panels and icons
CartogramChart.prototype.initPanels = function() {
    var vis = this;

    // TODO make these width's dynamic
    // drawing the main parent svg
    vis.chart = d3.select('#' +vis.parentElement).append('svg:svg')
        .attr('width',1168)
        .attr('height', 580)
        .attr('id', 'cartoMain');

    // append the top right panel
    vis.chart
        .append('svg:rect')
        .attr('id', "cartoModes")
        .attr('fill', '#F1F1F1')
        .attr('x', 800)
        .attr('y', 0)
        .attr('width', 300)
        .attr('height', 100);

    // append the filter panel
    vis.chart
        .append('svg:rect')
        .attr('id', "cartoFilter")
        .attr('fill', '#F1F1F1')
        .attr('x', 800)
        .attr('y', 104)
        .attr('width', 300)
        .attr('height', 200);

    vis.chart
        .append('svg:rect')
        .attr('id', "cartoStateFilter")
        .attr('fill', 'white')
        .attr('x', 806)
        .attr('y', 110)
        .attr('width', 288)
        .attr('height', 65);

    vis.chart
        .append("text")
        .attr('x', 900)
        .attr('y', 170)
        .text("Filtered States");

        // append the Selection panel
    vis.chart
        .append('svg:rect')
        .attr('id', "cartoSelection")
        .attr('fill', 'orange')
        .attr('x', 800)
        .attr('y', 308)
        .attr('width', 300)
        .attr('height', 260);

    // append the bottom icon panel
    vis.chart
        .append('svg:rect')
        .attr('id', "cartoFactors")
        .attr('fill', 'green')
        .attr('x', 20)
        .attr('y', 532)
        .attr('width', 750)
        .attr('height', 36);

    // add the top row of icons
    vis.chart
        .append("g")
        .append("svg:image")
        .attr("xlink:href",'img/Equisize.png')
        .attr('height', '70')
        .attr('width', '70')
        .attr('id', 'cartoSize')
        .attr("x", 810)
        .attr("y", 25);

    vis.chart.select('g')
        .append("svg:image")
        .attr("xlink:href",'img/region.png')
        .attr('height', '70')
        .attr('width', '70')
        .attr('id', 'cartoColor')
        .attr("x", 910)
        .attr("y", 25);

    vis.chart.select('g')
        .append("svg:image")
        .attr("xlink:href",'img/us map.png')
        .attr('height', '70')
        .attr('width', '70')
        .attr('id', 'cartoLocation')
        .attr("x", 1010)
        .attr("y", 25);

    // add the regional row of icons

    vis.chart
        .append("g")
        .append("svg:image")
        .attr("xlink:href",'img/WEST.png')
        .attr('height', '70')
        .attr('width', '70')
        .attr('id', 'cartoWEST')
        .attr("x", 830)
        .attr("y", 200)
        .on("click", function(){
            d3.selectAll('.WEST')
                .data(cartoData.filter(
                    function(d){return d.region === 'WEST'}))
                .attr('stroke-width', function (d){
                    d.clicked = !d.clicked;
                    globalUnFilter('WEST');
                    if (d.clicked) {
                    d3.select('#'+ d.state + "Label")
                        .style("fill", "black")
                        .style("font-weight", "bold");
                    return 2 } else {
                        d3.select('#'+ d.state + "Label")
                            .style("font-weight", "normal");
                        return 1;
                    }
                })
                .attr('opacity', function(d){
                    if(d.clicked){
                        return .95;
                    } else {
                        return .5;
                    }
                })})
        .on("dblclick", function(){
            return globalFilter('WEST');
        })
        .on('mouseover', function() {
            d3.selectAll('.WEST')
                .data(cartoData.filter(
                    function(d){return d.region === 'WEST'}))
                    .style("opacity", function(d) {
                        d3.select('#'+ d.state + "Label")
                            .style("opacity", 1);
                        return .25;})})
        .on('mouseout', function() {
            d3.selectAll('.WEST')
                .data(cartoData.filter(
                    function(d){return d.region === 'WEST'}))
                .transition()
                .style("opacity", function(d) {
                    if (d.filtered){
                    d3.select('#'+ d.state + "Label")
                        .transition()
                        .style("opacity", 0)
                        .duration(2000);
                    return 0;}else {return .5;}}
                    )
                .duration(2000);}
        );

    vis.chart
        .append("g")
        .append("svg:image")
        .attr("xlink:href",'img/MIDWEST.png')
        .attr('height', '70')
        .attr('width', '70')
        .attr('id', 'cartoMIDWEST')
        .attr("x", 920)
        .attr("y", 180)
        .on("click", function(){
            d3.selectAll('.MIDWEST')
                .data(cartoData.filter(
                    function (d) {
                        return d.region === 'MIDWEST'
                    }))
                .attr('stroke-width', function (d) {
                    d.clicked = !d.clicked;
                    globalUnFilter('MIDWEST');
                    if (d.clicked) {
                        d3.select('#' + d.state + "Label")
                            .style("fill", "black")
                            .style("font-weight", "bold");
                        return 2
                    } else {
                        d3.select('#' + d.state + "Label")
                            .style("font-weight", "normal");
                        return 1;
                    }
                })
                .attr('opacity', function (d) {
                    if (d.clicked) {
                        return .95;
                    } else {
                        return .5;
                    }
                })
        })
        .on("dblclick", function(){
            return globalFilter('MIDWEST');
        }).on('mouseover', function() {
            d3.selectAll('.MIDWEST')
                .data(cartoData.filter(
                    function(d){return d.region === 'MIDWEST'}))
                .style("opacity", function(d) {
                    d3.select('#'+ d.state + "Label")
                        .style("opacity", 1);
                    return .25;})})
        .on('mouseout', function() {
            d3.selectAll('.MIDWEST')
                .data(cartoData.filter(
                    function(d){return d.region === 'MIDWEST'}))
                .transition()
                .style("opacity", function(d) {
                    if (d.filtered){
                        d3.select('#'+ d.state + "Label")
                            .transition()
                            .style("opacity", 0)
                            .duration(2000);
                        return 0;}else {return .5;}}
                )
                .duration(2000);}
        );

    vis.chart
        .append("g")
        .append("svg:image")
        .attr("xlink:href",'img/EAST.png')
        .attr('height', '70')
        .attr('width', '70')
        .attr('id', 'cartoEAST')
        .attr("x", 1020)
        .attr("y", 180)
        .on("click", function(){
            d3.selectAll('.NORTHEAST')
                .data(cartoData.filter(
                    function (d) {
                        return d.region === 'NORTHEAST'
                    }))
                .attr('stroke-width', function (d) {
                    d.clicked = !d.clicked;
                    globalUnFilter('NORTHEAST');
                    if (d.clicked) {
                        d3.select('#' + d.state + "Label")
                            .style("fill", "black")
                            .style("font-weight", "bold");
                        return 2
                    } else {
                        d3.select('#' + d.state + "Label")
                            .style("font-weight", "normal");
                        return 1;
                    }
                })
                .attr('opacity', function (d) {
                    if (d.clicked) {
                        return .95;
                    } else {
                        return .5;
                    }
                })
        })
        .on("dblclick", function(){
            return globalFilter('NORTHEAST');
        }).on('mouseover', function() {
            d3.selectAll('.NORTHEAST')
                .data(cartoData.filter(
                    function(d){return d.region === 'NORTHEAST'}))
                .style("opacity", function(d) {
                    d3.select('#'+ d.state + "Label")
                        .style("opacity", 1);
                    return .25;})})
        .on('mouseout', function() {
            d3.selectAll('.NORTHEAST')
                .data(cartoData.filter(
                    function(d){return d.region === 'NORTHEAST'}))
                .transition()
                .style("opacity", function(d) {
                    if (d.filtered){
                        d3.select('#'+ d.state + "Label")
                            .transition()
                            .style("opacity", 0)
                            .duration(2000);
                        return 0;}else {return .5;}}
                )
                .duration(2000);}
        );


    vis.chart
        .append("g")
        .append("svg:image")
        .attr("xlink:href",'img/SOUTH.png')
        .attr('height', '70')
        .attr('width', '70')
        .attr('id', 'cartoSOUTH')
        .attr("x", 920)
        .attr("y", 240)
        .on("click", function(){
            d3.selectAll('.SOUTH')
                .data(cartoData.filter(
                    function (d) {
                        return d.region === 'SOUTH'
                    }))
                .attr('stroke-width', function (d) {
                    d.clicked = !d.clicked;
                    globalUnFilter('SOUTH');
                    if (d.clicked) {
                        d3.select('#' + d.state + "Label")
                            .style("fill", "black")
                            .style("font-weight", "bold");
                        return 2
                    } else {
                        d3.select('#' + d.state + "Label")
                            .style("font-weight", "normal");
                        return 1;
                    }
                })
                .attr('opacity', function (d) {
                    if (d.clicked) {
                        return .95;
                    } else {
                        return .5;
                    }
                })
        })
        .on("dblclick", function(){
            return globalFilter('SOUTH');
        }).on('mouseover', function() {
            d3.selectAll('.SOUTH')
                .data(cartoData.filter(
                    function(d){return d.region === 'SOUTH'}))
                .style("opacity", function(d) {
                    d3.select('#'+ d.state + "Label")
                        .style("opacity", 1);
                    return .25;})})
        .on('mouseout', function() {
            d3.selectAll('.SOUTH')
                .data(cartoData.filter(
                    function(d){return d.region === 'SOUTH'}))
                .transition()
                .style("opacity", function(d) {
                    if (d.filtered){
                        d3.select('#'+ d.state + "Label")
                            .transition()
                            .style("opacity", 0)
                            .duration(2000);
                        return 0;}else {return .5;}}
                )
                .duration(2000);}
        );


    // add the bottom row of icons

    vis.chart.select('g')
        .append("svg:image")
        .attr("xlink:href",'img/adult_at_least_one_fruit.png')
        .attr('height', '30')
        .attr('width', '30')
        .attr('id', 'cartoFruit')
        .attr("x", 75)
        .attr("y", 534);
/*        .on('mouseover', function(d) {
            d3.select(this)
                .transition(200)
                .attr('height', function(d){return  1.6 * 30;})
                .attr('width', function(d){ return  1.6 * 30;})
                .attr('x', function (d) {
                    return (75-7);
                })
                .attr('y', function (d) {
                    return (534-7);
                })
                .attr('stroke-width', 2)
                .attr('opacity', 1);
        });*/


    vis.chart.select('g')
        .append("svg:image")
        .attr("xlink:href",'img/adult_at_least_one_veg.png')
        .attr('height', '30')
        .attr('width', '30')
        .attr('id', 'cartoVeg')
        .attr("x", 150)
        .attr("y", 534);

    vis.chart.select('g')
        .append("svg:image")
        .attr("xlink:href",'img/adults_aerobic_strength.png')
        .attr('height', '30')
        .attr('width', '30')
        .attr('id', 'cartoWeight')
        .attr("x", 225)
        .attr("y", 534);

    vis.chart.select('g')
        .append("svg:image")
        .attr("xlink:href",'img/adults_aerobic_strength.png')
        .attr('height', '30')
        .attr('width', '30')
        .attr('id', 'cartoCouch')
        .attr("x", 300)
        .attr("y", 534);

    vis.chart.select('g')
        .append("svg:image")
        .attr("xlink:href",'img/teen_w_3_plus_tv_hrs.png')
        .attr('height', '30')
        .attr('width', '30')
        .attr('id', 'cartoTV')
        .attr("x", 375)
        .attr("y", 534);

    vis.chart.select('g')
        .append("svg:image")
        .attr("xlink:href",'img/bottom_quintile_hhi.png')
        .attr('height', '30')
        .attr('width', '30')
        .attr('id', 'cartoPoor')
        .attr("x", 450)
        .attr("y", 534);

    vis.chart.select('g')
        .append("svg:image")
        .attr("xlink:href",'img/top_quintile_hhi.png')
        .attr('height', '30')
        .attr('width', '30')
        .attr('id', 'cartoRich')
        .attr("x", 525)
        .attr("y", 534);

    vis.chart.select('g')
        .append("svg:image")
        .attr("xlink:href",'img/income_inequality.png')
        .attr('height', '30')
        .attr('width', '30')
        .attr('id', 'cartoInEquality')
        .attr("x", 600)
        .attr("y", 534);

    vis.chart.select('g')
        .append("svg:image")
        .attr("xlink:href",'img/population.png')
        .attr('height', '30')
        .attr('width', '30')
        .attr('id', 'cartoPopulation')
        .attr("x", 675)
        .attr("y", 534);



};

// All of the state initialization
CartogramChart.prototype.initStates = function() {

    var vis = this;

    vis.formatPercent = d3.format(".0%");
    vis.formatNumber = d3.format('.2s');

    function formatToolTip(input) {
        switch (input) {
            case "us map" : return '"Population: " + vis.formatNumber(d["population"])';
            case "obesity %" : return '"Obesity Rate: " + vis.formatNumber(d["obesity %"])+"%"';
            case "obesity total" : return '"Number of Obese: " + vis.formatNumber(d["obesity total"])';
            case "population" : return '"Population: " + vis.formatNumber(d["population"])';
            case "area" : return '"Land Size: " + vis.formatNumber(d["area"])';
            case "adult_at_least_one_fruit" : return '"% Consuming 1+ fruits: " + vis.formatNumber(d["adult_at_least_one_fruit"])+"%"';
            case "adult_at_least_one_veg" : return '"% Consuming 1+ vegetables: " + vis.formatNumber(d["adult_at_least_one_veg"])+"%"';
            case "adults_aerobic_strength" : return '"% Meeting physical strength requirements: " + vis.formatNumber(d["adults_aerobic_strength"])+"%"';
            case "adults_w_no_activity" : return '"% of adults with no activity: " + vis.formatNumber(d["adults_w_no_activity"])+"%"';
            case "teen_w_3_plus_tv_hrs" : return '"% watching 3+ hours of tv: " + vis.formatNumber(d["teen_w_3_plus_tv_hrs"])+"%"';
            case "bottom_quintile_hhi" : return '"Bottom quintile of HHI: $" + vis.formatNumber(d["bottom_quintile_hhi"])';
            case "top_quintile_hhi" : return '"Top quintile of HHI: $" + vis.formatNumber(d["top_quintile_hhi"])';
            case "income_inequality" : return '"Income gap between bottom and top quintiles: $" + vis.formatNumber(d["income_inequality"])';
            case "soda_consumption" : return '"% Consuming soda daily: " + vis.formatNumber(d["soda_consumption"])+"%"';
        }
    }

    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            if (!d.filtered){
                d3.select(this)
                    .transition(200)
                    .attr('height', function(d){
                        d.adj = ((1.3 * d.stateSize) - d.stateSize)/2;
                        return  1.3 * d.stateSize;})
                    .attr('width', function(d){ return  1.3 * d.stateSize;})
                    .attr('x', function (d) {
                        return d.x - d.adj;
                    })
                    .attr('y', function (d) {
                        return d.y - d.adj;
                    })
                    .attr('stroke-width', 2)
                    .attr('opacity', 1);
                return "<strong>"+d.state_name+":</strong> <span style='color:red'>" +d['obesity %'] + "% Obese</span><br>" + eval(formatToolTip(verticalCat));
            }
        });

    vis.svg.call(vis.tip);

    // draw the states
    vis.svg.append('svg:g')
        .selectAll('cartoStates')
        .data(vis.data)
        .enter().append('svg:rect')
        .attr('class', function (d) {
            return 'cartoStates ' +d.region;
        })
        .attr('id', function (d) {
            return d.state + "Rect";
        })
        .attr('opacity', .5)
        .attr('fill', function (d) {
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
        .attr('width', function(d){return d.stateSize})
        .attr('height', function(d){return d.stateSize})
        .on('click', function(d) {
            if (!d.filtered){
            d.clicked = !d.clicked;
            if (d.clicked){
                d3.select(this)
                    .attr('stroke-width', 2)
                    .attr('opacity', .95);
                d3.select('#'+ d.state + "Label")
                    .style("fill", "black")
                    .style("font-weight", "bold");
            }
            else{
                d3.select(this)
                    .attr('stroke-width', 1)
                    .attr('opacity', .5);
                d3.select('#'+ d.state + "Label")
                    .style("font-weight", "normal");
            }}
        })
        .on('dblclick', function(d) {
            if (!d.filtered){
                d.filtered = !d.filtered;
                d3.select(this)
                    .transition().duration(400)
                    .style("opacity", 0);
                d3.select('#'+ d.state + "Label")
                    .transition().duration(400)
                    .style("opacity", 0);
                d3.select('#' +vis.parentElement).select('g')
                    .append('rect')
                    .attr('class', 'filterIcons')
                    .attr('id', function(){
                        return 'filter'+d.state;
                    } )
                    .attr('fill', function () {
                        return styleRegion(d);
                    })
                    .attr('x', function() {
                        var colOffset =  xFilterOffset + (cartoColumnCounter * filterIconPad);
                        if (cartoColumnCounter < 19){
                            cartoColumnCounter += 1; }
                        else {
                            cartoColumnCounter = 1;
                            colOffset =  xFilterOffset;
                            cartoRowCounter += 1;
                        }
                        return colOffset;
                    })
                    .attr('y', function() {
                        var rowOffset = yFilterOffset + (cartoRowCounter * filterIconPad);
                        cartoFilterArray.push(d.state);
                        return rowOffset;})
                    .attr('width', 10)
                    .attr('height', 10)
                    .on('click', function() {
                        d.filtered = !d.filtered;
                        if (!d.filtered){
                            d3.select('#'+ d.state + "Rect")
                                .transition()
                                .style("opacity", .5)
                                .duration(1000);
                            d3.select('#'+ d.state + "Label")
                                .transition()
                                .style("opacity", 1)
                                .duration(1000);
                            d3.select(this).remove();
                            updateFilter(d);
                        }})
                    .on('mouseover', function() {
                        d3.select('#'+ d.state + "Rect")
                            .style("opacity", .25);
                        d3.select('#'+ d.state + "Label")
                            .style("opacity", 1)})
                    .on('mouseout', function() {
                        d3.select('#'+ d.state + "Rect")
                            .transition()
                            .style("opacity", 0)
                            .duration(2000);
                        d3.select('#'+ d.state + "Label")
                            .transition()
                            .style("opacity", 0)
                            .duration(2000);
                });

            }})
        .on('mouseover', vis.tip.show/* function(d) {
            if (!d.filtered){
                d3.select(this)
                .transition(200)
                .attr('height', function(d){
                    d.adj = ((1.3 * d.stateSize) - d.stateSize)/2;
                    return  1.3 * d.stateSize;})
                .attr('width', function(d){ return  1.3 * d.stateSize;})
                .attr('x', function (d) {
                    return d.x - d.adj;
                })
                .attr('y', function (d) {
                    return d.y - d.adj;
                })
                .attr('stroke-width', 2)
                .attr('opacity', 1);
            }
        }*/)
        .on('mouseout', function() {
            vis.tip.hide();
            d3.select(this)
                .transition(300)
                .attr('height', function(d){return  d.stateSize;})
                .attr('width', function(d){ return  d.stateSize;})
                .attr('x', function (d) {
                    return d.x;
                })
                .attr('y', function (d) {
                    return d.y;
                })
                .attr('stroke-width', function(d){
                    if (d.clicked){
                        return 2;
                    } else {
                        return 1;
                    }
                })
                .attr('opacity', function(d){
                    if (d.clicked){
                        return .95;
                    } else {
                        return .5;
                    }
                });
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

// All of the state initialization
CartogramChart.prototype.initMenu = function() {

    d3.element.dropdownmenu('#cartoMenu')
        .add({
            'Size By' : {
                'Equal Size' : "",
                'Bottom Quintile of Income' : "",
                'Fruit Consumption' : "",
                'Income Inequality' : "",
                'Land Area' : "",
                'Leisure Activity' : "",
                'Obesity Rate' : "",
                'Obesity Total' : "",
                'Population' : "",
                'Soda Consumption' : "",
                'Top Quintile of Income' : "",
                'TV Activity' : "",
                'Vegetable Consumption' : "",
                'Weight Activity' : ""
                },
            'Color By' : {
                'Census Region'  : "",
                'Bottom Quintile of Income' : "",
                'Fruit Consumption' : "",
                'Income Inequality' : "",
                'Land Area' : "",
                'Leisure Activity' : "",
                'Obesity Rate' : "",
                'Obesity Total' : "",
                'Population' : "",
                'Soda Consumption' : "",
                'Top Quintile of Income' : "",
                'TV Activity' : "",
                'Vegetable Consumption' : "",
                'Weight Activity' : ""
            },
            'Placement' : {
                'US Map' : "",
                'Bottom Quintile of Income' : "",
                'Fruit Consumption' : "",
                'Income Inequality' : "",
                'Land Area' : "",
                'Leisure Activity' : "",
                'Obesity Rate' : "",
                'Obesity Total' : "",
                'Population' : "",
                'Soda Consumption' : "",
                'Top Quintile of Income' : "",
                'TV Activity' : "",
                'Vegetable Consumption' : "",
                'Weight Activity' : ""
            }
        })
        .show() // basic menu has been created
        // example of tree traversal
        // and use d3 methods as well
        .call(function(root) {
            root.select('#option3-2').style('color', 'blue')
        })
        .call(applyStyling) // defined in header
        .call(function(root) {
            root.childLink().horizontal(); // make top level horizontal
        })
        .call(function(root) {
            var option = root.firstChildNode();
            for (var i = 0; option != null; option = option.firstChildNode()) {
                option.style('color', '#0' + (i%10) + (i%10));
                i+=3;
            }
        });

    // this comes from  http://bl.ocks.org/tomkelly000/6110163
    function applyStyling(root) {
        root.nodes()
            .style('border', '1px solid #ddd')
            .style('padding', '8px 16px')
            .style('background', '#eee')
            .style('width', '300px')
            .on('mouseenter', function() {
                d3.select(this).transition() // 'this' is a DOM element
                    .style('background', '#ee3')
            })
            .on('mouseleave', function() {
                d3.select(this).transition()
                    .style('background', '#eee')
            })
            .on('click', function() {
                if (this.childNodes.length == 1) {
                    cartoFacet = (this.textContent ? this.textContent : this.innerText);
                }
                if (this.childNodes.length == 2) {
                    cartoContext = (this.textContent ? this.textContent : this.innerText).substring(0, 1);
                    if (cartoFacet) {
                        menuListener(cartoFacet, cartoContext);
                    }
                }
            });

        root.childNodes() // make top level a little different
            .style('background', '#ccc')
            .style('width', '100px')
            .on('mouseenter', function() {
                d3.select(this).transition()
                    .style('background', '#cc3')
            })
            .on('mouseleave', function() {
                d3.select(this).transition()
                    .style('background', '#ccc')
            })
    }

};

function menuListener (inputValue, functionCall) {

    function getAttributeName(input) {
        switch (input) {
            case 'US Map' : return "us map";
            case 'Obesity Rate' : return "obesity %";
            case 'Obesity Total' : return "obesity total";
            case 'Population' : return "population";
            case 'Equal Size' : return "Equisize";
            case 'Land Area' : return "area";
            case 'Census Region'  : return "region";
            case 'Fruit Consumption' : return "adult_at_least_one_fruit";
            case 'Vegetable Consumption' : return "adult_at_least_one_veg";
            case 'Weight Activity' : return "adults_aerobic_strength";
            case 'Leisure Activity' : return "adults_w_no_activity";
            case 'TV Activity' : return "teen_w_3_plus_tv_hrs";
            case 'Bottom Quintile of Income' : return "bottom_quintile_hhi";
            case 'Top Quintile of Income' : return "top_quintile_hhi";
            case 'Income Inequality' : return "income_inequality";
            case 'Soda Consumption' : return "soda_consumption";
        }
    }

    function getFunctionName(input, call) {
        if (input != "us map") {
            switch (call) {
                case 'S':
                    d3.select('#cartoSize')
                        .attr("xlink:href", function () {
                            return 'img/' + input + '.png'
                        });
                    return updateVisArea(input);
                case 'C':
                    d3.select('#cartoColor')
                        .attr("xlink:href", function () {
                            return 'img/' + input + '.png'
                        });
                    return updateVisColor(input);
                case 'P':
                    d3.select('#cartoLocation')
                        .attr("xlink:href", function () {
                            return 'img/' + input + '.png'
                        });
                    return updateVisPlacement(input);
            }
        } else {
            d3.select('#cartoLocation')
                .attr("xlink:href", function () {
                    return 'img/' + input + '.png'
                });
            return restoreCarto();
        }
    }

    getFunctionName( getAttributeName(inputValue), functionCall);

}

function updateVisArea(inputParam){

    //  implement z scale (size)
    var z = d3.scale.linear()
        .range([5, 50])
        .domain([d3.min(cartoData, function (d) {
                if (inputParam == 'Equisize'){
                    return 50;
                }
                return d[inputParam];
            }
        ), d3.max(cartoData, function (d) {
            if (inputParam == 'Equisize'){
                return 50;
            }
            return d[inputParam];
            }
        )]);

    var states = d3.selectAll(".cartoStates").data(cartoData);

    states
        .transition()
        .attr("height", function(d){
            if (inputParam == 'Equisize'){
                d.stateSize = 50;
            } else {
                d.stateSize = z(d[inputParam]);}
            return d.stateSize;
        })
        .attr("width", function(d){
            if (inputParam == 'Equisize'){
                d.stateSize = 50;
            } else {
                d.stateSize = z(d[inputParam]);}
            return d.stateSize;
        }).duration(1000);

    var statesLabels = d3.selectAll(".cartoStateLabel").data(cartoData);

    statesLabels
        .transition()
        .attr('x', function (d) {
            return d.x + d.stateSize/2;
        })
        .attr('y', function (d) {
            return d.y + d.stateSize/2;
        })
        .text(function (d) {
            return d.state;
        }).duration(1500);

}

function updateVisColor(inputParam){

    //Cynthia Brewer's ColorBrewer
    var colorsInScale = 7;
    var colorBrew = colorbrewer.OrRd[colorsInScale];

    var color = d3.scale.quantize()
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
        .attr("fill", function(d){
            if (inputParam == 'region'){
                return styleRegion(d);
            } else {
               return color(d[inputParam]);}
        }).duration(1000);
}

function updateVisPlacement(inputParam){

    verticalCat = inputParam;
    // need better margins since placements can vary!
    var margin = {top: 25, right: 100, bottom: 150, left: 25},
        width = 731 - margin.left - margin.right,
        height = 570 - margin.top - margin.bottom;

    // fixed at obesity % for x axis (for now...)
    var x = d3.scale.linear()
        .range([5, width])
        .domain([d3.min(cartoData, function (d) {
                return d['obesity %'];
            }
        ), d3.max(cartoData, function (d) {
                return d['obesity %'];
            }
        )]);

    // fixed at obesity % for x axis (for now...)
    var y = d3.scale.linear()
        .range([height, 5])
        .domain([d3.min(cartoData, function (d) {
                return d[inputParam];
            }
        ), d3.max(cartoData, function (d) {
                return d[inputParam];
            }
        )]);

    // bring back the axes
    d3.selectAll(".axis")
        .attr('opacity', 1);

    // Update the Axis
    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

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

    var states = d3.selectAll(".cartoStates").data(cartoData);

    states
        .transition()
        .attr("x", function(d){
            d.x = x(d['obesity %']);
            return d.x;
        }).duration(1000)
        .transition()
        .attr("y", function(d){
            d.y = y(d[inputParam]);
            return d.y;
        }).duration(1000);

    var statesLabels = d3.selectAll(".cartoStateLabel").data(cartoData);

    statesLabels
        .transition()
        .attr('x', function (d) {
            return x(d['obesity %']) + d.stateSize/2;
        })
        .attr('y', function (d) {
            return y(d[inputParam])+ d.stateSize/2;
        })
        .text(function (d) {
            return d.state;
        }).duration(2500);
}

function restoreCarto(){

    verticalCat = "us map";
    // get those older bigger margins :-)
    var margin = {top: 60, right: 60, bottom: 60, left: 60},
        width = 731 - margin.left - margin.right,
        height = 570 - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .range([0, width])
        .domain([0, d3.max(cartoData, function (d) {return d.location[0];})]);

    // draw y scale
    var y = d3.scale.linear()
        .range([height, 0])
        .domain([0, d3.max(cartoData, function (d) {return d.location[1] + 1;})]);

    // Update the Axis
    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    d3.selectAll(".xAxis")
        .call(xAxis);

    d3.selectAll(".yAxis")
        .call(yAxis);

    // bring back the axes
    d3.selectAll(".axis")
        .transition()
        .attr('opacity', 0)
        .duration(1000);

    var states = d3.selectAll(".cartoStates").data(cartoData);

    states
        .transition()
        .attr("x", function(d){
            d.x = x(d.location[0]);
            return d.x;
        }).duration(1000)
        .transition()
        .attr("y", function(d){
            d.y = y(d.location[1] + 1);
            return d.y;
        }).duration(1000);

    var statesLabels = d3.selectAll(".cartoStateLabel").data(cartoData);

    statesLabels
        .transition()
        .attr('x', function (d) {
            return d.x + d.stateSize/2;
        })
        .attr('y', function (d) {
            return d.y + d.stateSize/2;
        })
        .text(function (d) {
            return d.state;
        }).duration(2500);
}

function globalFilter(regionalParam) {

    resetArray();

    d3.selectAll('.' + regionalParam)
        .data(cartoData.filter(
            function(d){return d.region === regionalParam}))
        .attr('stroke-width', function (d){
            if (!d.filtered){
                d.filtered = !d.filtered;
                d3.select(this)
                    .transition().duration(400)
                    .style("opacity", 0);
                d3.select('#'+ d.state + "Label")
                    .transition().duration(400)
                    .style("opacity", 0);
                d3.select('#cartoMain').select('g')
                    .append('rect')
                    .attr('class', 'filterIcons')
                    .attr('id', function(){
                        return 'filter'+d.state;
                    })
                    .attr('fill', function () {
                        return styleRegion(d);
                    })
                    .attr('x', function() {
                        var colOffset =  xFilterOffset + (cartoColumnCounter * filterIconPad);
                        if (cartoColumnCounter < 19){
                            cartoColumnCounter += 1; }
                        else {
                            cartoColumnCounter = 1;
                            colOffset =  xFilterOffset;
                            cartoRowCounter += 1;
                        }
                        return colOffset;
                        })
                    .attr('y', function() {
                        var rowOffset = yFilterOffset + (cartoRowCounter * filterIconPad);
                        cartoFilterArray.push(d.state);
                        return rowOffset;})
                    .attr('width', 10)
                    .attr('height', 10)
                    .on('click', function() {
                        if (d.filtered){
                            d.filtered = !d.filtered;
                            d3.select('#'+ d.state + "Rect")
                                .style("opacity",function(){
                                    return .5;
                                });
                            d3.select('#'+ d.state + "Label")
                                .style("opacity",function(){
                                    return 1;
                                });
                            d3.select('#filter' + d.state)
                                .remove();
                            updateFilter(d);
                    }})
                .on('mouseover', function() {
                    d3.select('#'+ d.state + "Rect")
                        .style("opacity", .25);
                    d3.select('#'+ d.state + "Label")
                        .style("opacity", 1)})
                .on('mouseout', function() {
                    d3.select('#'+ d.state + "Rect")
                        .transition()
                        .style("opacity", 0)
                        .duration(2000);
                    d3.select('#'+ d.state + "Label")
                        .transition()
                        .style("opacity", 0)
                        .duration(2000);
                });
        }
            return 1;
        })
}

function resetArray(){
    if (cartoFilterArray.length === 0){
        var reset = true;
    } else {var reset = false;}
    for (var key in cartoData) {
        if (cartoData[key]['filtered'] === true)
        {
            // strange reference behavior unlinks my global array >:(
            if (!include(cartoFilterArray, cartoData[key]['state']))
            {
                cartoFilterArray.push(cartoData[key]['state']);
                if (reset){
                    reset = false;
                    cartoColumnCounter = 1;
                    cartoRowCounter = 0;
                }
                cartoColumnCounter += 1;
                if (cartoColumnCounter > 19){
                    cartoColumnCounter = 1;
                    cartoRowCounter += 1;}
            }
        }
    }
}

function globalUnFilter(regionalParam) {

    resetArray();

    if (cartoFilterArray.length > 0) {
        d3.selectAll('.' + regionalParam)
            .data(cartoData.filter(
                function(d){return d.region === regionalParam}))
            .attr('stroke-width', function (d){
                d3.select('#'+ d.state + "Rect")
                    .transition()
                    .style("opacity", .5)
                    .duration(1000);
                d3.select('#'+ d.state + "Label")
                    .transition()
                    .style("opacity", 1)
                    .duration(1000);
                d.filtered = false;
                updateFilter(d);
                d3.select('#filter'+d.state).remove();
                return 1;}
                );
    }
}


function updateFilter(state) {

    // remove the element from the array
    var index = cartoFilterArray.indexOf(state.state);
    cartoFilterArray.splice(index, 1);
    // redraw the queue
    if (cartoFilterArray.length > 0) {
        d3.selectAll('.filterIcons')
            .data(cartoFilterArray)
            .transition()
            .attr('x', function(d, i) {
                if (i == 0) {
                    cartoRowCounter = 0;
                    cartoColumnCounter = 0;
                } else if (cartoColumnCounter < 18){
                    cartoColumnCounter += 1;
                } else {
                    cartoColumnCounter = 0;
                    cartoRowCounter += 1;
                }
                return xFilterOffset + (cartoColumnCounter * filterIconPad);
            })
            .attr('y', function(d, i) {
                // have to reset within the function
                if (i == 0) {
                    cartoRowCounter = 0;
                    cartoColumnCounter = 0;
                } else if (cartoColumnCounter < 18){
                    cartoColumnCounter += 1;
                } else {
                    cartoColumnCounter = 0;
                    cartoRowCounter += 1;
                }
                return yFilterOffset + (cartoRowCounter * filterIconPad);
            }).duration(1000);
        cartoColumnCounter += 1;
    }
    else {
        cartoColumnCounter = 0;
    }
}

function include(arr, obj) {
    for(var i=0; i<arr.length; i++) {
        if (arr[i] == obj) return true;
    }
}

