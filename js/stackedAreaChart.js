(function() {
    var DEFAULTS = {
        height: 400,
        width: 800,
        margin: {
            top: 10,
            right: 10,
            bottom: 20,
            left: 30
        },
        classes: [],
        useBrushing: false,
        includeYAxis: true,
        includePoints: true,
        forceXDomain: false
    };

    // Stacked area chart for obesity metrics.
    var StackedArea = function(parentSelector, data, options) {
        this.parentSelector = parentSelector;
        this.data = data;
        this.opts = _.defaultsDeep({}, options, DEFAULTS);

        this.initVis();
    };

    // Initialize the chart.
    StackedArea.prototype.initVis = function() {
        var vis = this;

        vis.filter = '';

        vis.margin = vis.opts.margin;

        vis.width = vis.opts.width - vis.margin.left - vis.margin.right;
        vis.height = vis.opts.height - vis.margin.top - vis.margin.bottom;

        vis.opts.classes.push('stacked-area-chart');

        // SVG drawing area
        vis.svg = d3.select(vis.parentSelector).append('svg')
            .attr('width', vis.opts.width)
            .attr('height', vis.opts.height)
            .attr('class', vis.opts.classes.join(' '))
            .append('g')
            .attr('transform', 'translate(' + vis.margin.left + ',' + vis.margin.top + ')');

        // Overlay with path clipping
        vis.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

        // Scales and axes
        vis.x = d3.time.scale()
            .range([0, vis.width]);

        vis.y = d3.scale.linear()
            .range([vis.height, 0]);

        vis.classScale = d3.scale.ordinal()
            .range(['overweight', 'obese', 'extreme-obese'])
            .domain(['Total Overweight (25 <= BMI < 30)', 'Total Obese (BMI >= 30)', 'Total Extremely Obese (BMI>=40)']);

        vis.xAxis = d3.svg.axis()
            .scale(vis.x)
            .tickSize(3, 0)
            .orient("bottom");

        vis.yAxis = d3.svg.axis()
            .scale(vis.y)
            //.tickFormat('+%')
            .orient("left");

        // Attach axes
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");


        // Initialize stack layout
        vis.stack = d3.layout.stack()
            .offset("zero")
            .values(function(d) { return d.values; })
            .x(function(d) { return d.year; })
            .y(function(d) { return d.y; });

        // Rearrange data into layers
        var transposedData = vis.classScale.domain().map(function(name) {
            return {
                name: name,
                values: vis.data.map(function(d) {
                    return { year: d.year, y: d[name], name: name, datum: d };
                })
            };
        });

        vis.stackedData = vis.stack(transposedData);

        vis.pointData = [];
        vis.stackedData.forEach(function(group) {
            vis.pointData.push(group.values);
        });

        vis.pointData = _.flatten(vis.pointData);


        // Stacked area layout
        vis.area = d3.svg.area()
            .interpolate("cardinal")
            .x(function(d) { return vis.x(d.year); })
            .y0(function(d) { return vis.y(d.y0); })
            .y1(function(d) { return vis.y(d.y0 + d.y); });

        vis.singleArea = d3.svg.area()
            .x(function (d) {
                return vis.x(d.year);
            })
            .y0(vis.height)
            .y1(function (d) {
                return vis.y(d[vis.filter]);
            });


        // TO-DO: Tooltip placeholder
        // vis.placeholder = vis.svg.append("text")
        //     .attr("class", "placeholder")
        //     .attr("x", 5)
        //     .attr("y", 5);

        vis.wrangleData();
    };

    // Filter data upon click events.
    StackedArea.prototype.wrangleData = function() {
        var vis = this;

        // In the first step no data wrangling/filtering needed
        vis.displayData = vis.stackedData;
        vis.displayPointData = vis.pointData;


        if (vis.filter) {
            vis.displayData = vis.displayData.filter(function(d) { return d.name === vis.filter; } );
            vis.displayPointData = [];
        }

        // Update the visualization
        vis.updateVis();
    };

    // Render the vis.
    StackedArea.prototype.updateVis = function () {
        var vis = this;

        // Update domains
        if (vis.opts.forceXDomain) {
            vis.x.domain(vis.opts.forceXDomain);
        }
        else {
            vis.x.domain(d3.extent(vis.displayData[0].values,
                function (d) {
                    return d.year;
                }));
        }

        // Get the maximum of the multi-dimensional array or in other words, get the highest peak of the uppermost layer
        if (vis.filter) {
            // Single area
            vis.y.domain([0, d3.max(vis.displayData[0].values,
                function(d) { return d.y; })]);
        }
        else {
            // Stacked areas
            vis.y.domain([0, d3.max(vis.displayData, function (d) {
                return d3.max(d.values, function (e) {
                    return e.y0 + e.y;
                });
            })
            ]);
        }


        // Draw the layers
        var categories = vis.svg.selectAll(".area")
            .data(vis.displayData, function(d) { return d.name; });

        categories.enter().append("path")
            .style("opacity", 0)
            .attr("class", function (d) {
                return 'area ' + vis.classScale(d.name);
            })
            .on("click", function(d) {
                vis.filter = (vis.filter == d.name) ? "" : d.name;
                vis.wrangleData();
            });

        categories
            .attr("d", function (d) {
                if (vis.filter) {
                    // Single area
                    return vis.singleArea(vis.data);
                }
                else {
                    // Stacked areas
                    return vis.area(d.values);
                }
            })
            .transition()
            .duration(500)
            .style("opacity", 1);

        categories.exit()
            .transition()
            .duration(250)
            .style("opacity", 0)
            .remove();

        // Draw the points
        if (vis.opts.includePoints) {
            var points = vis.svg.selectAll('.point')
                .data(vis.displayPointData);

            points.enter().append('circle')
                .style("opacity", 0)
                .attr('class', 'point')
                .attr('r', '1')
                .attr('cx', function(d) { return vis.x(d.year); })
                .attr('cy', function (d) {
                    return vis.y(d.y + d.y0);
                });

            points
                .transition()
                .duration(250)
                .attr('r', 3)
                .style("opacity", 0.15);

            points.exit()
                .transition()
                .duration(250)
                .style("opacity", 0)
                .remove();
        }

        // Call axis functions with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);

        if (vis.opts.includeYAxis) {
            vis.svg.select(".y-axis")
                .transition()
                .delay(500)
                .duration(500)
                .call(vis.yAxis);
        }
    };

    // TODO: Improve transitions from stacked to single.
    // Based on tweening at: https://bl.ocks.org/mbostock/3916621
    // function transition(path, d0, d1) {
    //     path.transition()
    //         .duration(2000)
    //         .attrTween("d", pathTween(d1, 4))
    //         .each("end", function() { d3.select(this).call(transition, d1, d0); });
    // }
    //
    // function pathTween(d1, precision) {
    //     return function() {
    //         var path0 = this,
    //             path1 = path0.cloneNode(),
    //             n0 = path0.getTotalLength(),
    //             n1 = (path1.setAttribute("d", d1), path1).getTotalLength();
    //
    //         // Uniform sampling of distance based on specified precision.
    //         var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
    //         while ((i += dt) < 1) distances.push(i);
    //         distances.push(1);
    //
    //         // Compute point-interpolators at each distance.
    //         var points = distances.map(function(t) {
    //             var p0 = path0.getPointAtLength(t * n0),
    //                 p1 = path1.getPointAtLength(t * n1);
    //             return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
    //         });
    //
    //         return function(t) {
    //             return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : d1;
    //         };
    //     };
    // }

    if (!window.charts) { window.charts = {}; }
    window.charts.StackedArea = StackedArea;
})();