(function() {
    var DEFAULTS = {
        height: 400,
        width: 800,
        margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        },
        classes: [],
        scaleValueCounts: 7,
        gridCircles: [10, 20, 30, 40]
    };

    // A polar area chart for comparing states.
    var PolarArea = function(parentSelector, data, activeProperty, options) {
        this.parentSelector = parentSelector;
        this.data = data;
        this.opts = _.defaultsDeep({}, options, DEFAULTS);
        this.activeProperty = activeProperty;
        this.sortOrder = 'alpha';

        this.initVis();
    };

    // Initialize the vis.
    PolarArea.prototype.initVis = function() {
        var vis = this;
        var radius;

        vis.margin = vis.opts.margin;

        vis.width = vis.opts.width - vis.margin.left - vis.margin.right;
        vis.height = vis.opts.height - vis.margin.top - vis.margin.bottom;

        vis.opts.classes.push('polar-area');
        vis.opts.classes.push('seq');

        var dim = Math.min(vis.width, vis.height);
        radius = dim / 2;

        vis.outerRadius = function(d) {
            return radius * d.value / 40;
        };
        vis.arc = d3.svg.arc()
            .outerRadius(vis.outerRadius)
            //.innerRadius(0);
            .innerRadius(dim * 0.05);

        vis.pie = d3.layout.pie()
            .value(function(d) { return d.value; });

        vis.grid = d3.svg.area.radial()
            .radius(150);

        vis.svg = d3.select(vis.parentSelector).append('svg')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('class', vis.opts.classes.join(' '))
            .append('g')
            .attr('transform', 'translate(' + vis.width / 2 + ',' + vis.height / 2 + ')');

        vis.color = d3.scale.quantize()
            .range(d3.range(vis.opts.scaleValueCounts).map(function (i) {
                return 'q' + i + '-' + vis.opts.scaleValueCounts;
            }))
            .domain([0, 40]);

        // (Filter, aggregate, modify data)
        vis.wrangleData();

        vis.dispatch = d3.dispatch('activeState');
        d3.rebind(vis, vis.dispatch, 'on');
    };

    // Setter for `activeProperty`
    PolarArea.prototype.setActiveProperty = function(val) {
        var vis = this;

        vis.activeProperty = val;
        vis.wrangleData();

        return vis;
    };

    // Setter for `sortOrder`
    PolarArea.prototype.setSort = function(val) {
        var vis = this;

        vis.sortOrder = val;
        vis.wrangleData();

        return vis;
    };

    // Setter for `stateFilters` (i.e. the allowed US States)
    PolarArea.prototype.setStates = function (val) {
        var vis = this;

        vis.stateFilters = val;
        vis.wrangleData();

        return vis;
    };

    // Prepare data based on sorting and selected states.
    PolarArea.prototype.wrangleData = function() {
        var vis = this;

        vis.displayData = _.map(vis.data, function(d) {
            var v = d[vis.activeProperty];

            if (v === null) {
                v = 10;
            }

            return {
                name: d.ab,
                value: v,
                source: d
            };
        });

        if (vis.stateFilters) {
            vis.displayData = vis.displayData.filter(function (d) {
                return vis.stateFilters[d.name];
            });
        }

        if (vis.sortOrder === 'alpha') {
            // vis.displayData = vis.displayData.sort(function (a, b) {
            //     return a.name.localeCompare(b.name);
            // });

            vis.pie.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                });
        }
        else {
            // vis.displayData = vis.displayData.sort(function(a, b){
            //     return a.value - b.value;
            // });

            vis.pie.sort(function (a, b) {
                    return a.value - b.value;
                });
        }

        vis.updateVis();
    };

    // Render the vis.
    PolarArea.prototype.updateVis = function () {
        var vis = this;

        vis.svg.selectAll('.arc')
            // .transition()
            // .duration(1000)
            // .attr('opacity', 0)
            .remove();

        var arcs = vis.svg.selectAll('.arc')
            .data(vis.pie(vis.displayData, function (d) {
                return d.data.name;
            }));

        var g = arcs.enter().append('g')
            .attr('class', 'arc')
            .attr('opacity', 0);

        arcs.exit()
            .transition()
            .attr('opacity', 0)
            .remove();

        g.append('path')
            .attr('d', vis.arc)
            .attr('class', function(d) { return vis.color(d.value); });

        g.transition()
            .attr('opacity', 1);

        g.on('click', function(d) {
            vis.svg.select('.arc.active')
                .classed('active', false);

            d3.select(this).classed('active', true);

            vis.svg.select('.circle-active').remove();

            vis.svg.append('circle')
                .attr('class', 'circle-active')
                .attr('r', vis.outerRadius({ value: d.value }));

            vis.dispatch.activeState(d.data);
        });

        g.append('text')
            .attr('transform', function(d) {
                //return 'translate(' + vis.arc.centroid(d) + ')';
                var c = vis.arc.centroid(d);
                var x = c[0];
                var y = c[1];

                // pythagorean theorem for hypotenuse
                var h = Math.sqrt(x*x + y*y);
                var labelr = vis.outerRadius(d) + 10;

                return 'translate(' + (x/h * labelr) +  ',' +
                    (y/h * labelr) +  ')';
            })
            .attr('dy', '.35em')
            .style('text-anchor', 'middle')
            .text(function(d) {
                return d.data.name; });

        vis.addCircleAxes();
    };

    // Draw comparison circle.
    PolarArea.prototype.addCircleAxes = function() {
        var vis = this;
        var circleAxes;

        vis.svg.selectAll('.circle-ticks').remove();

        circleAxes = vis.svg.selectAll('.circle-ticks')
            .data(vis.opts.gridCircles)
            .enter().append('svg:g')
            .attr('class', 'circle-ticks');

        circleAxes.append('svg:circle')
            .attr('r', function (d) {
                return vis.outerRadius({ value: d });
            })
            .attr('class', 'circle');
    };

    if (!window.charts) { window.charts = {}; }
    window.charts.PolarArea = PolarArea;
})();