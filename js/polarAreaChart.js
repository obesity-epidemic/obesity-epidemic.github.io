(function() {
    var DEFAULTS = {
        height: 400,
        width: 800,
        margin: {
            top: 0,
            right: 10,
            bottom: 25,
            left: 0
        },
        classes: [],
        scaleValueCounts: 8,
        gridCircles: [10, 20, 30, 40]
    };

    // A polar area chart for comparing states.
    var PolarArea = function(parentSelector, data, activeProperty, options) {
        this.parentSelector = parentSelector;
        this.data = data;
        this.opts = _.defaultsDeep({}, options, DEFAULTS);
        this.activeProperty = activeProperty;
        this.sortOrder = 'rate';

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
            .sort(null)
            .value(function(d) { return d.value; });

        vis.grid = d3.svg.area.radial()
            .radius(150);

        vis.svgBase = d3.select(vis.parentSelector).append('svg')
            .attr('width', vis.opts.width)
            .attr('height', vis.opts.height)
            .attr('class', vis.opts.classes.join(' '))
            .append('g')
            .attr('transform', 'translate(' + vis.width / 2 + ',' + vis.height / 2 + ')');

        vis.svg = vis.svgBase.append('g').attr('class', 'main');
        vis.overlay = vis.svgBase.append('g').attr('class', 'overlay');

        vis.color = d3.scale.quantize()
            .range(d3.range(vis.opts.scaleValueCounts).map(function (i) {
                return 'q' + i + '-' + vis.opts.scaleValueCounts;
            }))
            .domain([0, 40]);

        // (Filter, aggregate, modify data)
        vis.wrangleData();

        vis.dispatch = d3.dispatch('activeState');
        d3.rebind(vis, vis.dispatch, 'on');

        vis.svg.append("g")
            .attr("class", "legendQuant")
            .attr("transform", "translate(-250,130)");

        var legend = d3.legend.color()
            .labelFormat(d3.format(".2f"))
            .useClass(true)
            .scale(vis.color);

        vis.svg.select(".legendQuant")
            .call(legend);
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
            var ret = {
                name: d.ab,
                value: v,
                source: d,
                rawValue: v
            };

            if (v === null) {
                ret.value = 10;
            }

            return ret;
        });

        if (vis.stateFilters) {
            vis.displayData = vis.displayData.filter(function (d) {
                return vis.stateFilters[d.name];
            });
        }

        if (vis.sortOrder === 'alpha') {
            vis.displayData = vis.displayData.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
        }
        else {
            vis.displayData = vis.displayData.sort(function(a, b){
                return a.value - b.value;
            });
        }

        vis.updateVis();
    };

    // Render the vis.
    PolarArea.prototype.updateVis = function () {
        var vis = this;
        var layoutData = vis.pie(vis.displayData);
        var arcs = vis.svg.selectAll('.arc')
            .data(layoutData, function (d) {
                return d.data.name;
            });

        var newArcs = arcs.enter().append('g')
            .attr('class', 'arc')
            .attr('opacity', 0);

        arcs.exit()
            .transition()
            .attr('opacity', 0)
            .remove();

        newArcs.append('path')
            .attr('d', vis.arc)
            .each(function(d) {
                this._current = d;
            }); // store the initial angles

        newArcs.transition().attr('opacity', 1);

        // Handle user selection of a US State
        newArcs.on('mouseover', _.debounce(function(d) {
                d3.select(this).classed('active', true);
                vis.svg.select('.arc.active').classed('active', false);
                //vis.overlay.select('.circle-active').remove();

                var cir = vis.overlay.selectAll('.circle-active').data([{ value: d.value }]);

                cir.enter()
                    .append('circle')
                    .attr('class', 'circle-active');

                cir.exit().remove();

                cir.transition()
                    .attr('r', function(d) { return vis.outerRadius(d); });

                vis.dispatch.activeState(d.data);
            }, 50));

        // Label each wedge
        newArcs.append('text')
            .attr('dy', '.35em')
            .style('text-anchor', 'middle')
            .text(function(d) {
                return d.data.name; });

        arcs.selectAll('text')
            .data(function(d) { return [d]; }) // Update child data.
            .transition()
            //.attr('opacity', 0)
            .transition()
            .duration(1000)
            .attr('transform', function(d) {
                var c = vis.arc.centroid(d);
                var x = c[0];
                var y = c[1];

                // pythagorean theorem for hypotenuse
                var h = Math.sqrt(x*x + y*y);
                var labelr = vis.outerRadius(d) + 10;

                // Keep labels legible even when data gets small and tightly bunched.
                // if (labelr < 100) {
                //     labelr = 140;
                // }
                // else if (labelr < 140) {
                //     labelr += 20;
                // }

                return 'translate(' + (x/h * labelr) +  ',' +
                    (y/h * labelr) +  ')';
            });

        arcs.selectAll('path')
            .data(function(d) { return [d]; }) // Update child data.
            .attr('class', function(d) {
                return d.data.rawValue === null ? 'black' : vis.color(d.value); })
            .transition()
            .duration(1000)
            .delay(250)
            .attr('d', vis.arc);

        vis.addCircleAxes();
        setTimeout(_.bind(vis.addCircleTicks, vis), 1250); // Wait until after the wedges are in place.
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
                return vis.outerRadius({value: d});
            })
            .attr('class', 'circle');
    };

    PolarArea.prototype.addCircleTicks = function() {
        var vis = this;

        // Find arcs that overlap with where our labels will be placed.
        // y +/- 10 && have an x > 0
        var maxVal = 0;
        var overlapArcs = vis.svg.selectAll('.arc').each(function(d) {
                var el = this;
                var box = el.getBBox();

                if(box.x > 0 && (box.y > -50 || (box.y - box.height) < 50 )) {
                    //console.log(d.data.name);

                    if (box.x + box.width > maxVal) {
                        maxVal = box.x + box.width;
                    }
                }
            });

        var lblToUse = _.filter(vis.opts.gridCircles, function (d) {
            return vis.outerRadius({ value: d }) > (maxVal + 10);
        });

        var lbl = vis.svg.selectAll('.tick-label')
            .data(lblToUse, function(d) { return d; });

        lbl.exit()
            .transition()
            .style('opacity', 0)
            .remove();

        lbl.enter().append('g')
            .style('opacity', 0)
            .attr('class', 'tick-label')
            .attr('transform', function (d) {
                return 'translate('+ vis.outerRadius({ value: d }) +' , 0)'; })
            .append('text')
                .attr('dy', 10)
                .text(function (d) { return d + '%'; });

        lbl.transition()
            .style('opacity', 1);
    };

    // Store the displayed angles in _current.
    // Then, interpolate from _current to the new angles.
    // During the transition, _current is updated in-place by d3.interpolate.
    // function arcTween(a, el, arc) {
    //     var i = d3.interpolate(el._current, a);
    //     el._current = i(0);
    //     return function(t) {
    //         return arc(i(t));
    //     };
    // }

    if (!window.charts) { window.charts = {}; }
    window.charts.PolarArea = PolarArea;
})();