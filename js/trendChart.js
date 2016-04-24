(function() {
    var percentFormat = d3.format('0.2f');

    var DEFAULTS = {
        height: 100,
        width: 555,
        margin: {
            top: 5,
            right: 10,
            bottom: 20,
            left: 40
        }
    }

    // A line chart for health spending.
    var Trend = function(parentSelector, data, options) {
        this.parentSelector = parentSelector;
        this.data = data;
        this.opts = _.defaultsDeep({}, options, DEFAULTS);

        this.initVis();
    };

    // Initialize the vis.
    Trend.prototype.initVis = function() {
        var vis = this;

        vis.margin = vis.opts.margin;

        vis.width = vis.opts.width - vis.margin.left - vis.margin.right;
        vis.height = vis.opts.height - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select(vis.parentSelector).append('svg')
            .attr('width', vis.opts.width)
            .attr('height', vis.opts.height)
            .attr('class', 'trend-chart')
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
            .nice()
            .range([0, vis.width])
            .domain([new Date('1989', 0), new Date('2015', 0)]);

        vis.y = d3.scale.linear()
            .nice()
            .range([vis.height, 0])
            .domain([0, 40]);

        vis.xAxis = d3.svg.axis()
            .scale(vis.x)
            .tickSize(3)
            .orient("bottom");

        vis.yAxis = d3.svg.axis()
            .scale(vis.y)
            .ticks(6)
            .tickSize(0)
            .orient("left");

        // Attach axes
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // Initialize the line generator
        vis.line = d3.svg.area()
            .x(function(d) {
                return vis.x(d.year); })
            .y0(vis.height)
            .y1(function(d) {
                return vis.y(d.val); });

        // Tool tip
        vis.tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                return '<div>' +
                    '<span class="tip-large-text">' + percentFormat(d.val) + '%</span>' +
                    '&nbsp;<span class="tip-small-text">in ' + d.year.getFullYear() + '</span>' +
                    '</div>';
            });
        vis.svg.call(vis.tip);

        //vis.svg.append('path').attr('class', 'trend');
    };

    Trend.prototype.setData = function(data) {
        var vis = this;

        vis.displayData = data;
        vis.updateVis();

        return vis;
    };

    // Render the vis.
    Trend.prototype.updateVis = function () {
        var vis = this;

        // Update domains
        //vis.x.domain(d3.extent(vis.displayData, function(d) { return d.year; }));
        //vis.y.domain([0, 40]); //d3.max(vis.displayData, function (d) { return d.val; })]);
        
        vis.svg.append("linearGradient")
            .attr("id", "obese-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0).attr("y1", vis.y(0))
            .attr("x2", 0).attr("y2", vis.y(40))
            .selectAll("stop")
            .data([
                {offset: "0%", color: "#fef0d9"},
                {offset: "50%", color: "#fc8d59"},
                {offset: "100%", color: "#990000"}
            ])
            .enter().append("stop")
            .attr("offset", function(d) { return d.offset; })
            .attr("stop-color", function(d) { return d.color; });

        // Draw the line/area
        var lines = vis.svg.selectAll('.trend')
            .data([vis.displayData]);

        lines.enter()
            .append('path')
            .attr('class', 'trend');
            //.attr('d', function(d) { return vis.line(d); });

        lines//.transition()
            //.attrTween('d', pathTween()
            .attr('d', function(d) { return vis.line(d); });

        lines.exit().remove();

        var points = vis.svg.selectAll('circle')
            .data(vis.displayData, function(d) {
                return d.year;
            });

        points.enter().append('circle')
            .style("opacity", 0)
            .attr('class', 'point')
            .on('mousemove', vis.tip.show)
            .on('mouseout', vis.tip.hide);

        points
            .transition()
            .duration(250)
            .attr('r', 5)
            .attr('cx', function (d) { return vis.x(d.year); })
            .attr('cy', function (d) { return vis.y(d.val); })
            .style("opacity", 0.15);

        points.exit()
            .transition()
            .duration(250)
            .style("opacity", 0)
            .remove();

        // Call axis functions with the new domain
        vis.svg.select(".x-axis").transition().call(vis.xAxis);
        vis.svg.select(".y-axis").transition().call(vis.yAxis);
    };

    // function pathTween() {
    //     var interpolate = d3.scale.quantile()
    //         .domain([0, 1])
    //         .range(d3.range(1, data.length + 1));
    //
    //     return function (t) {
    //         return line(data.slice(0, interpolate(t)));
    //     };
    // }

    if (!window.charts) { window.charts = {}; }
    window.charts.Trend = Trend;
})();