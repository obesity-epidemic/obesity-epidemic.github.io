(function() {
    var percentFormat = d3.format('0.2f');

    var DEFAULTS = {
        height: 70,
        width: 960,
        margin: {
            top: 0,
            right: 10,
            bottom: 20,
            left: 50
        },
        classes: [],
        indicatorHeight: 20,
        indicatorGap: 3,
        stepDwell: 500,
        scaleValueCounts: {
            'seq': 7,
            'diverge': 10
        }
    };

    // Timeline for choropleth linked view.
    var Timeline = function(parentSelector, data, activeProperty, options) {
        this.parentSelector = parentSelector;
        this.data = data;
        this.opts = _.defaultsDeep({}, options, DEFAULTS);
        this.setActiveProperty(activeProperty);
        this.init = false;
        this.mode = '';

        this.initVis();
    };

    // Initialize the chart.
    Timeline.prototype.initVis = function() {
        var vis = this;

        vis.margin = vis.opts.margin;

        vis.width = vis.opts.width - vis.margin.left - vis.margin.right;
        vis.height = vis.opts.height - vis.margin.top - vis.margin.bottom;

        vis.opts.classes.push('timeline-chart');

        // SVG drawing area
        vis.svg = d3.select(vis.parentSelector).append('svg')
            .attr('width', vis.opts.width)
            .attr('height', vis.opts.height)
            .attr('class', vis.opts.classes.join(' '))
            .append('g')
            .attr('transform', 'translate(' + vis.margin.left + ',' + vis.margin.top + ')');

        // Overlay with path clipping
        vis.svg.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', vis.width)
            .attr('height', vis.height);

        // Scales and axes
        vis.x = d3.time.scale()
            .nice()
            .range([0, vis.width]);

        var dates = _.map(vis.data, 'date');
        var ends = d3.extent(dates);

        vis.x.domain([new Date(ends[0].getFullYear() - 1, 0), new Date(ends[1].getFullYear() + 1, 0)]);

        vis.xMin = vis.x(ends[0]);
        vis.xMax = vis.x(ends[1]);

        // vis.quantize = d3.scale.quantize()
        //     .range(d3.range(vis.opts.scaleValueCounts).map(function (i) {
        //         return 'q' + i + '-' + vis.opts.scaleValueCounts;
        //     }));
        // Sequential scale for 'by-year'
        vis.quantizeSeq = d3.scale.quantize()
            .range(d3.range(vis.opts.scaleValueCounts.seq).map(function (i) {
                return 'q' + i + '-' + vis.opts.scaleValueCounts.seq;
            }))
            .domain([0, 40]);

        // Diverge scale for 'over-time'
        vis.quantileDivergeBase = d3.scale.quantile()
            .range(d3.range(vis.opts.scaleValueCounts.diverge).map(function (i) {
                return 'q' + i + '-' + vis.opts.scaleValueCounts.diverge;
            }))
            .domain([-20, 20]);

        vis.quantileDiverge = function(v) {
            if (v === 0) {
                return 'zero-' + vis.opts.scaleValueCounts.diverge;
            }
            else {
                return vis.quantileDivergeBase(v);
            }
        };

        vis.xAxis = d3.svg.axis()
            .scale(vis.x)
            .tickSize(0)
            .orient('bottom');

        // Attach axes
        vis.svg.append('g')
            .attr('class', 'x-axis axis')
            .attr('transform', 'translate(0,' + vis.height + ')');

        vis.svg.append('g')
            .attr('class', 'y-axis axis');

        // Attach Play/Pause
        vis.playIcon = vis.svg.append('path')
            .attr('d', 'M0 0 L20 10 L0 20 Z')
            .attr('class', 'play')
            .attr('transform', 'translate(-40, 30)')
            .on('click', _.bind(vis.play, vis));

        vis.pauseIcon = vis.svg.append('g')
            .style('display', 'none')
            .attr('class', 'pause')
            .attr('transform', 'translate(-40, 30)')
            .on('click', _.bind(vis.pause, vis));

        vis.pauseIcon.append('path')
            .attr('d', 'M0 0 H7 V20 H0 Z');

        vis.pauseIcon.append('path')
            .attr('d', 'M10 0 H17 V20 H10 Z');

        // Create brush
        vis.brush = d3.svg.brush()
            .x(vis.x)
            .on('brush', _.bind(vis.brushed, vis))
            .on('brushend', _.bind(vis.brushEnd, vis));

        // Indicator Drag Behavior
        var indicatorDrag = d3.behavior.drag()
            //.origin(function(d) { return d; })
            //.on('dragstart', dragstarted)
            .on('drag', _.bind(vis.indicatorDragged, vis))
            .on('dragend', _.bind(vis.indicatorDragEnded, vis));

        // Draw indicator
        var ihFull = vis.opts.indicatorHeight;
        var ihMid = vis.opts.indicatorHeight / 2;
        vis.indicator = vis.svg.append('g')
            .attr('class', 'indicator')
            .call(indicatorDrag);

        vis.indicator.append('path')
            .attr('d', 'M0 0 H11 Q12 ' + ihMid + ', 5.5 ' + ihFull + ' Q-2 ' + ihMid + ', 0 0 Z')
            .style('stroke-linejoin', 'round');

        vis.indicator.append('line')
            .attr('x1', 4)
            .attr('y1', 2)
            .attr('x2', 4)
            .attr('y2', 10);

        vis.indicator.append('line')
            .attr('x1', 6)
            .attr('y1', 2)
            .attr('x2', 6)
            .attr('y2', 10);

        // Tool tip
        vis.tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                // var ab = stateDatum.properties.postal.toUpperCase();
                // var displayValue = vis.displayData[ab];
                var currentYearMatches = d.property.match(/yr(\d{4})/);
                var currentYear = currentYearMatches[1];
                var displayValue;

                if (vis.mode === 'by-year') {
                    return '<div class="tip-title">National Average Obesity Rate</div>' +
                    '<div>' +
                    '<span class="tip-large-text">' + percentFormat(d.nationalAvg) + '%</span>' +
                    '&nbsp;<span class="tip-small-text">in ' + currentYear + '</span>' +
                    '</div>';
                }
                else {
                    return '<div class="tip-title">National Avgerage Obesity Rate Change</div>' +
                        '<div>' +
                        '<span class="tip-large-text">' + percentFormat(d.nationalChange) + '%</span>' +
                        '&nbsp;<span class="tip-small-text">1990 &mdash; ' + currentYear + '</span>' +
                        '</div>';
                }
            });
        vis.svg.call(vis.tip);

        vis.setMode('by-year');
        //vis.setMode('over-time');

        // (Filter, aggregate, modify data)
        vis.wrangleData();

        vis.dispatch = d3.dispatch('activeProperty', 'rangeChange');
        d3.rebind(vis, vis.dispatch, 'on');

        vis.init = true;
    };

    // Begin playing of year-over-year
    Timeline.prototype.play = function() {
        var vis = this;
        vis.steps = _.map(vis.data, 'property');
        vis.steps = vis.steps.slice(_.indexOf(vis.steps, vis.activeProperty));

        if (!vis.steps || vis.steps.length === 0 ||
            (vis.steps.length === 1)) {

            vis.steps = _.map(vis.data, 'property');
        }

        vis.nextStep();
        vis.interval = setInterval(_.bind(vis.nextStep, vis), vis.opts.stepDwell);
        vis.playIcon.style('display', 'none');
        vis.pauseIcon.style('display', null);
    };

    // Move to next step
    Timeline.prototype.nextStep = function() {
        var vis = this;

        if (vis.steps.length > 0) {
            vis.setActiveProperty(vis.steps.shift());

            if (vis.steps.length === 0) {
                vis.pause();
            }
        }
    };

    // Pause any playing
    Timeline.prototype.pause = function() {
        var vis = this;

        // Interrupt playing
        clearInterval(vis.interval);
        vis.playIcon.style('display', null);
        vis.pauseIcon.style('display', 'none');
    };

    // Change the display mode
    Timeline.prototype.setMode = function(mode) {
        var vis = this;

        vis.mode = mode;

        if (mode === 'over-time') {
            vis.svg.classed({
                seq: false,
                diverge: true
            });

            vis.color = vis.quantileDiverge;
            vis.indicator.style('display', 'none');
            if (vis.gBrush) { vis.gBrush.style('display', null); }

            // Set brush extent
            vis.brush.extent([new Date(1990, 0), new Date(2014, 0)]);

            vis.pause();
            vis.playIcon.style('display', 'none');
        }
        else if (mode === 'by-year') {
            vis.svg.classed({
                seq: true,
                diverge: false
            });

            vis.color = vis.quantizeSeq;
            vis.indicator.style('display', null);
            if (vis.gBrush) { vis.gBrush.style('display', 'none'); }

            if (vis.markers) {
                vis.markers.classed('dim', false);
            }

            vis.playIcon.style('display', null);
        }

        vis.updateVis();

        return vis;
    };

    // Change the property from the data set to view.
    Timeline.prototype.setActiveProperty = function(activeProperty) {
        var vis = this;

        vis.activeProperty = activeProperty;
        vis.activeDate = new Date(new Date(activeProperty.substring(2), 0));
        
        if (vis.init) {
            vis.dispatch.activeProperty(activeProperty);
            vis.wrangleData();
        }
        
        return vis;
    };

    // Change the property from the data set to view.
    Timeline.prototype.setRange = function(range) {
        var vis = this;

        var start = new Date(new Date(range[0].substring(2), 0));
        var end = new Date(new Date(range[1].substring(2), 0));

        vis.brush.extent([start, end]);
        vis.updateVis();

        return vis;
    };

    // A placeholder for future filtering and adjustments.
    Timeline.prototype.wrangleData = function() {
        var vis = this;

        vis.updateVis();
    };

    // Render the vis.
    Timeline.prototype.updateVis = function () {
        var vis = this;
        vis.yearPositions = {};

        _.forEach(vis.data, function(v, k) {
            var pos = vis.x(v.date);
            vis.yearPositions[k] = pos;
        });

        if (!vis.gBrush /*&& vis.mode === 'over-time'*/) {
            // Add brush
            vis.gBrush = vis.svg.append('g')
                .attr('class', 'brush')
                .call(vis.brush);

            vis.gBrush.selectAll('rect')
                .attr('y', vis.opts.indicatorHeight + vis.opts.indicatorGap)
                .attr('height', vis.height - vis.opts.indicatorHeight - vis.opts.indicatorGap);

            vis.gBrush.selectAll('.resize').append('rect')
                .attr('class', 'handle')
                .attr('x', function(d) {
                    return d === 'w' ? -6 : 3;
                })
                .attr('y', vis.opts.indicatorHeight + vis.opts.indicatorGap - 1)
                .attr('height', vis.height - vis.opts.indicatorHeight - vis.opts.indicatorGap)
                .attr('width', 3);
        }

        if (vis.gBrush) {
            vis.brush(vis.gBrush);
        }

        vis.markers = vis.svg.selectAll('.marker')
            .data(_.values(vis.data), function(d) { return d.property; });

        vis.markers.enter().append('rect')
            //.style('opacity', 0)
            .attr('y', vis.opts.indicatorHeight + vis.opts.indicatorGap)
            .attr('width', 5)
            .attr('height', vis.height - vis.opts.indicatorHeight - vis.opts.indicatorGap)
            .on('click', function(d) {
                vis.placeIndicator(vis.x(d.date));
                vis.setActiveProperty(d.property);
            })
            .on('mouseover', vis.tip.show)
            .on('mouseout', vis.tip.hide);

        vis.markers
            .attr('class', function (d) {
                return 'marker ' + d.date.getFullYear() + ' ' + vis.color(vis.mode === 'over-time' ? d.nationalChange : d.nationalAvg);
            })
            .transition()
            .duration(500)
            .attr('x', function(d) {
                return vis.x(d.date) - 2.5; });
            //.style('opacity', 1);

        vis.markers.exit()
            .transition()
            .duration(500)
            .style('opacity', 0)
            .remove();

        vis.placeIndicator(vis.x(vis.activeDate));

        // Call axis functions with the new domain
        vis.svg.select('.x-axis').call(vis.xAxis);
    };

    // Handle the user moving the indicator
    Timeline.prototype.indicatorDragged = function() {
        var vis = this;
        //var indicator = d3.select(this);
        var x = d3.event.x;

        vis.dragging = true;

        // Constrain to in-bounds
        if (x < vis.xMin) {
            x = vis.xMin;
        }
        else if (x > vis.xMax) {
            x = vis.xMax;
        }

        vis.placeIndicator(x);
    };

    // Handle the user dropping the indicator
    Timeline.prototype.indicatorDragEnded = function() {
        var vis = this;
        var x = vis.indicator.attr('data-x');
        var nearest;
        var newX;

        nearest = vis.findNearest(vis.x.invert(x));
        newX = vis.x(nearest.date);

        vis.placeIndicator(newX);
        vis.setActiveProperty(nearest.property);
        vis.dragging = false;
    };

    // Center the indicator on the given `x` value
    Timeline.prototype.placeIndicator = function(x) {
        var vis = this;

        vis.indicator
            .attr('transform', 'translate(' + (x - 5) + ', 0)')
            .attr('data-x', x);
    };

    // Update the timeline based on the current brush positioning
    Timeline.prototype.brushed = function() {
        var vis = this;
        var s = vis.brush.extent();

        // Dim the unselected markers
        vis.markers.classed('dim', function (d) {
            return s[0] > d.date || s[1] < d.date;
        });
    };

    // Handle and apply the users new selection (including snapping and notifying externally)
    Timeline.prototype.brushEnd = function() {
        var vis = this;
        var extent0 = vis.brush.extent();
        var extent1 = extent0.map(d3.time.year.round);
        var extent;
        var extentHighDate;
        var dataRange;

        // Snap extent
        var low = null;
        var high = null;
        var lowDiff = Number.POSITIVE_INFINITY;
        var highDiff = Number.POSITIVE_INFINITY;

        _.forEach(vis.data, function(d) {
            var l = Math.abs(extent1[0] - d.date);
            var h = Math.abs(d.date - extent1[1]);

            if (l < lowDiff) {
                lowDiff = l;
                low = d;
            }

            if (h < highDiff) {
                highDiff = h;
                high = d;
            }
        });

        if (low.date.getTime() === high.date.getTime()) {
            high = _.clone(high);
            extentHighDate = (new Date(high.date.getTime())).setMonth(high.date.getMonth() + 1);
        }
        else {
            extentHighDate = high.date;
        }

        dataRange = [low.property, high.property];
        extent = [low.date, extentHighDate];

        vis.brush.extent(extent);
        vis.updateVis();

        // Emit `rangeChange` event so choropleth can calculate diff values
        vis.dispatch.rangeChange(dataRange);
    };

    // Find the nearest marker to a given reference date
    Timeline.prototype.findNearest = function(ref) {
        var vis = this;
        var near = null;
        var diff = Number.POSITIVE_INFINITY;

        _.forEach(vis.data, function(d) {
            var a = Math.abs(ref - d.date);

            if (a < diff) {
                diff = a;
                near = d;
            }
        });

        return near;
    };

    if (!window.charts) { window.charts = {}; }
    window.charts.Timeline = Timeline;
})();