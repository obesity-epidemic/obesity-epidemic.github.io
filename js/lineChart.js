(function() {
    var DEFAULTS = {
        height: 400,
        width: 800,
        margin: {
            top: 10,
            right: 10,
            bottom: 20,
            left: 40
        }
    }

    var Line = function(parentSelector, data, options) {
        this.parentSelector = parentSelector;
        this.data = data;
        this.opts = _.defaultsDeep({}, options, DEFAULTS);

        this.initVis();
    };

    Line.prototype.initVis = function() {
        var vis = this;

        vis.filter = '';

        vis.margin = vis.opts.margin;

        vis.width = vis.opts.width - vis.margin.left - vis.margin.right;
        vis.height = vis.opts.height - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select(vis.parentSelector).append('svg')
            .attr('width', vis.opts.width)
            .attr('height', vis.opts.height)
            .attr('class', 'line-chart')
            .append('g')
            .attr('transform', 'translate(' + vis.margin.left + ',' + vis.margin.top + ')');

        // Overlay with path clipping
        vis.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

        var yFormat = d3.format('$.2s');

        // Scales and axes
        vis.x = d3.time.scale()
            .range([0, vis.width]);

        vis.y = d3.scale.linear()
            .range([vis.height, 0]);

        vis.classScale = d3.scale.ordinal()
            .range(['overweight', 'obese'])
            .domain(['US overweight Cost', 'US obesity Cost']);

        vis.xAxis = d3.svg.axis()
            .scale(vis.x)
            .orient("bottom");

        vis.yAxis = d3.svg.axis()
            .scale(vis.y)
            .ticks(6)
            .tickFormat(function(d) {
                return yFormat(d).replace('G', 'B');
            })
            .orient("left");

        // Attach axes
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");
        
        // Initialize the line generator
        vis.line = d3.svg.line()
            .x(function(d) {
                return vis.x(d.year); })
            .y(function(d) {
                return vis.y(d.y); });

        vis.lineData = vis.classScale.domain().map(function(name) {
            return {
                name: name,
                values: vis.data.map(function(d) {
                    return { year: d.year, y: d[name] };
                })
            };
        });


        // TO-DO: Tooltip placeholder
        // vis.placeholder = vis.svg.append("text")
        //     .attr("class", "placeholder")
        //     .attr("x", 5)
        //     .attr("y", 5);

        vis.wrangleData();
    };

    Line.prototype.wrangleData = function() {
        var vis = this;

        // In the first step no data wrangling/filtering needed
        vis.displayData = vis.lineData;

        if (vis.filter) {
            vis.displayData = vis.displayData.filter(function(d) {
                return d.name === vis.filter; } );
        }

        // Update the visualization
        vis.updateVis();
    };

    Line.prototype.updateVis = function () {
        var vis = this;

        // Update domains
        vis.x.domain(d3.extent(vis.displayData[0].values,
            function(d) { return d.year; }));

        vis.y.domain([0, d3.max(vis.displayData, function (d) {
                return d3.max(d.values, function (e) {
                    return e.y;
                });
            })]);

        // Draw the layers
        var categories = vis.svg.selectAll(".area")
            .data(vis.displayData);

        categories.enter().append("path")
            .style("opacity", 0)
            .attr("class", function (d) {
                return 'line ' + vis.classScale(d.name);
            });

        categories
            .attr("d", function(d) {
                return vis.line(d.values);
            })
            .transition()
            .duration(500)
            .style("opacity", 1);

        categories.exit()
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();


        // Call axis functions with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);
    };

    if (!window.charts) { window.charts = {}; }
    window.charts.Line = Line;
})();