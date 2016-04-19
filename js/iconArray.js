(function() {
    var DEFAULTS = {
        height: 400,
        width: 800,
        columns: 10,
        rows: 10,
        classes: [],
        fillCount: 100
    };

    // Icon array of weight statuses
    var IconArray = function(parentSelector, data, options) {
        this.parentSelector = parentSelector;
        this.data = data;
        this.opts = _.defaultsDeep({}, options, DEFAULTS);

        this.initVis();
    };

    // Initialize the vis.
    IconArray.prototype.initVis = function() {
        var vis = this;
        var elems = vis.opts.rows * vis.opts.columns;
        
        vis.opts.classes.push('icon-array-chart');

        var data = vis.data.map(function(d) {
            return {
                label: d.label,
                cssClass: d.cssClass,
                count: Math.round(d.value * elems / 100)
            }
        });

        var iconData = [];
        _.forEach(data, function(d) {
            for (var i = 0; i < d.count; i++) {
                iconData.push(d.cssClass);
            }
        });

        for (var i = iconData.length; i < vis.opts.fillCount; i++) {
            iconData.push('filler-icon');
        }

        vis.iconData = iconData;
        vis.chart = d3.select(vis.parentSelector)
            .attr('class', vis.opts.classes.join(' '));
        vis.updateVis();
    };

    // Render the vis.
    IconArray.prototype.updateVis = function () {
        var vis = this;

        var icons = vis.chart.selectAll('div')
            .data(vis.iconData);

        icons.enter().append('span')
            .attr('class', function (d) {
                return 'icon fa fa-male ' + d;
            });

        var i = 0;
        var rowEnds = [];
        icons.each(function() {
            i++;

            if (i % vis.opts.columns === 0) {
                rowEnds.push(this);
            }
        });

        _.forEach(rowEnds, function(div) {
            // Append sibling
            var br = document.createElement('br');
            div.parentNode.insertBefore(br, div.nextSibling);
        });
    };

    if (!window.charts) { window.charts = {}; }
    window.charts.IconArray = IconArray;
})();