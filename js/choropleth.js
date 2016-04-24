(function() {
    var DEFAULTS = {
        height: 500,
        width: 960,
        margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        },
        classes: [],
        mode: 'by-year',
        scaleValueCounts: {
            'seq': 7,
            'diverge': 10
        }
    };
    var percentFormat = d3.format('0.2f');

    var Choropleth = function(parentSelector, data, mapData, activeProperty, options) {
        this.parentSelector = parentSelector;
        this.data = data;
        this.mapData = mapData;
        this.opts = _.defaultsDeep({}, options, DEFAULTS);
        this.activeProperty = activeProperty;
        this.mode = '';

        this.initVis();
    };

    Choropleth.prototype.initVis = function() {
        var vis = this;

        vis.margin = vis.opts.margin;

        vis.width = vis.opts.height - vis.margin.left - vis.margin.right;
        vis.height = vis.opts.width - vis.margin.top - vis.margin.bottom;

        vis.opts.classes.push('choropleth-chart', vis.opts.mode);

        // SVG drawing area
        vis.svg = d3.select(vis.parentSelector).append('svg')
            .attr('width', vis.opts.width)
            .attr('height', vis.opts.height)
            .attr('class', vis.opts.classes.join(' '))
            .append('g')
            .attr('transform', 'translate(' + vis.margin.left + ',' + vis.margin.top + ')');

        vis.projection = d3.geo.albersUsa()
            .scale(1000);
            //.translate([vis.width / 2, vis.height / 2]);
        vis.path = d3.geo.path().projection(vis.projection);

        // Convert TopoJSON to GeoJSON
        vis.usa = topojson.feature(vis.mapData, vis.mapData.objects.ne_10m_admin_1_states_provinces_lakes).features;

        // Render the USA by using the path generator
        vis.statesSelection = vis.svg.selectAll('path')
            .data(vis.usa, function(d) { return d.properties.postal; })
            .enter()
            .append('path')
            .attr('class', 'land')
            .attr('d', vis.path);

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

        // Tool tip
        vis.tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(stateDatum) {
                var ab = stateDatum.properties.postal.toUpperCase();
                var displayValue;

                var d = _.find(vis.data, function(d) {
                   return d.ab == ab;
                });

                // return '<div class="tip-title">' + d.st + '</div>' +
                //     '<div>' +
                //         '<span class="tip-large-text">' + displayValue + '%</span>' +
                //         '&nbsp;<span class="tip-small-text">in ' + currentYear + '</span>' +
                //     '</div>';

                if (vis.mode === 'by-year') {
                    var currentYear = vis.activeProperty.match(/yr(\d{4})/)[1];
                    displayValue = percentFormat(d[vis.activeProperty]);

                    return '<div class="tip-title">' + d.st + '</div>' +
                        '<div>' +
                        '<span class="tip-large-text">' + displayValue + '%</span>' +
                        '&nbsp;<span class="tip-small-text">in ' + currentYear + '</span>' +
                        '</div>';
                }
                else {
                    var startYear = vis.rangeStart.match(/yr(\d{4})/)[1];
                    var endYear = vis.rangeEnd.match(/yr(\d{4})/)[1];
                    displayValue = percentFormat(d[vis.rangeEnd] - d[vis.rangeStart]);

                    return '<div class="tip-title">' + d.st + '</div>' +
                        '<div>' +
                        '<span class="tip-large-text">' + displayValue + '%</span>' +
                        '&nbsp;<span class="tip-small-text">from ' + startYear + ' &mdash; ' + endYear + '</span>' +
                        '</div>';
                }
            });
        vis.svg.call(vis.tip);

        vis.color = null;
        vis.setMode(vis.opts.mode);
        vis.wrangleData();
    };

    Choropleth.prototype.setMode = function(mode) {
        var vis = this;

        vis.mode = mode;

        if (mode === 'over-time') {
            vis.svg.classed({
                seq: false,
                diverge: true
            });

            // vis.colorScaleMode = 'diverge';
            vis.color = vis.quantileDiverge;

            if (!vis.rangeStart || !vis.rangeEnd) {
                vis.rangeStart = 'yr1990';
                vis.rangeEnd = 'yr2014';
            }
        }
        else if (mode === 'by-year') {
            vis.svg.classed({
                seq: true,
                diverge: false
            });

            vis.color = vis.quantizeSeq;
        }

        vis.wrangleData();
        
        return vis;
    };

    Choropleth.prototype.setActiveProperty = function(activeProperty) {
        var vis = this;
        vis.activeProperty = activeProperty;
        vis.wrangleData();

        return vis;
    };

    Choropleth.prototype.setRange = function(range) {
        var vis = this;

        vis.rangeStart = range[0];
        vis.rangeEnd = range[1];
        vis.wrangleData();

        return vis;
    };

    Choropleth.prototype.wrangleData = function() {
        var vis = this;
        vis.displayData = {};
        _.forEach(vis.data, function(d) {
            var val;
                
            if (vis.mode === 'over-time') {
                val = d[vis.rangeEnd] - d[vis.rangeStart];
            }
            else {
                val = d[vis.activeProperty];
            }

            vis.displayData[d.ab] = val;
        });

        vis.updateVis();
    };

    Choropleth.prototype.updateVis = function () {
        var vis = this;

        vis.statesSelection.attr('class', function (d) {
            if (d.properties.adm0_a3 !== 'USA') { return; }

            var returnVal = 'no-data';
            var v = vis.displayData[d.properties.postal];

            if (v !== null) {
                if (!isNaN(v)) {
                    returnVal = vis.color(v);
                }
            }

            return 'state ' + d.properties.postal.toLowerCase() + ' ' + returnVal;
        })
        .on('mousemove', vis.tip.show)
        .on('mouseout', vis.tip.hide)
    };

    if (!window.charts) { window.charts = {}; }
    window.charts.Choropleth = Choropleth;
})();