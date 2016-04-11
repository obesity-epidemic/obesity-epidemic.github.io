// This file contains a library of helper functions that I wanted to use
// for this assignment and future assignments. The hope is that it will
// make it easier to make my style of charts in the future.

var utils = {
	// Sets up an svg using the margin system and returns the config options.
	// If auto is passed in, then it will make the width be the same as the 
	// parent's width.
	// 
	// If you use auto, then you'll want to have somewhere $(window).resize(function(){ updateViz(); })
	setupSVG: function(opts){

		if(opts.width == 'auto'){
			opts.width = $(opts.selector).parent().width() - 5;
		}

		var width = opts.width - opts.marginLeft - opts.marginRight,
			height = opts.height - opts.marginTop - opts.marginBottom;

		var svg = d3.select(opts.selector).select(".svg-group")

		if(svg.size() === 0){
			svg = d3.select(opts.selector)
					.append("svg")
					.append("g")
					.attr("class","svg-group");
		}

			
		d3.select(opts.selector).select("svg")
			.attr("width", width + opts.marginLeft + opts.marginRight)
			.attr("height", height + opts.marginTop + opts.marginBottom);
		
		
		svg.attr("transform", "translate(" + opts.marginLeft + "," + opts.marginTop + ")");

		return {
			svg: svg,
			width: width,
			height: height,
			marginLeft: opts.marginLeft,
			marginRight: opts.marginRight,
			marginTop: opts.marginTop,
			marginBottom: opts.marginBottom,
			duration: opts.duration
		}
	},

	setupScale: function(opts){
		// Ordinal scales are handled a little different. Just return immediately.
		if(opts.type === 'ordinal'){
			var scale = d3.scale.ordinal()
				.domain(opts.data.map(function(d) { return d[opts.prop]; }));
			scale.getValue = function(d) { return scale(d[opts.prop]); };
			scale.getRawValue = function(d) { return d[opts.prop]; };
			return scale;
		}


		var domain = d3.extent(opts.data, function(d) { return d[opts.prop];});
		if(_.has(opts, 'min')){ domain[0] = opts.min; }
		if(_.has(opts, 'max')){	domain[1] = opts.max; }
		if(_.has(opts, 'minPadding')){	domain[0] -= opts.minPadding; }
		if(_.has(opts, 'maxPadding')){	domain[1] += opts.maxPadding; }
		if(_.has(opts, 'maxPaddingPercentage')){ domain[1] *= opts.maxPaddingPercentage; }


		// Quantile scales are handled a little different. Just return immediately.
		if(opts.type === 'quantile'){
			var scale = d3.scale.quantile()
				.domain(domain);
			scale.getValue = function(d) { return scale(d[opts.prop]); };
			scale.getRawValue = function(d) { return d[opts.prop]; };
			return scale;
		}


		var range = opts.axis === 'x' ? [0, opts.opts.width] : [opts.opts.height, 0];

		var scaleType = opts.type == 'time' ? d3.time.scale() : d3.scale[opts.type]();

		var scale = scaleType
			.domain(domain)
			.range(range);

		// A lot of the time we want to use the same property for the value or raw value.
		// These just make it easier for later on if we want to get those values.
		scale.getValue = function(d) { return scale(d[opts.prop]); };
		scale.getRawValue = function(d) { return d[opts.prop]; };
		return scale;
	},

	// Creates an area chart.
	addArea: function(opts){
		// Setup area geneartor
		var area = d3.svg.area()
			.x(opts.x)
			.y0(opts.opts.height)
			.y1(opts.y);

		return opts.parent.append("path")
			.datum(opts.data)
			.attr("class", "area")
			.attr("d", area);
	},

	// Creates an area chart.
	addStackedArea: function(opts){
		var area = d3.svg.area()
			.x(opts.x.getValue)
			.y0(function(d){return opts.y0(d.y0); })
			.y1(function(d){ 
				return opts.y0(d.y0 + d.y);
			});

		var paths = opts.parent.selectAll("path")
			.data(opts.data)
			.enter().append("path")
			.attr("d", area)
			.attr("class", "area")
			.attr("title", function(d){  return d[0].source; })

		 opts.parent.selectAll(".path-label")
			.data(opts.data)
			.enter().append("text")
			.attr("class", "path-label")
			.attr('x', opts.opts.width)
			.attr('y', function(d){ d=_.last(d); return opts.y0(d.y0 + d.y/2) })
			.text(function(d){ return '- '+ _.last(d).source});

		return paths;
	},

	// Creates a bar chart.
	addBar: function(opts){
		//parent, data, x, y,
		var bar = opts.parent.selectAll(".bar-group")
			.data(opts.data, function(d, i){ return opts.key ? d[opts.key] : i });

		// Enter
		bar.enter().append("g")
			.attr("class", 'bar-group')
			.attr("transform", function(d) { return "translate(" + opts.x(d) + ",0)"; })
			.append("rect")
			.attr("class", "bar")
			.attr('opacity', 0)
			.attr("height",0)
			.attr("y", opts.opts.height)
		
		//Update	
		bar
			.transition()
			.duration(opts.opts.duration)
			.attr("transform", function(d) { return "translate(" + opts.x(d) + ",0)"; })
			.selectAll(".bar")
			.attr('opacity', 1)
			.attr("y", opts.y)
			.attr("height", function(d) { return opts.opts.height - opts.y(d); })
			.attr("width", opts.xScale.rangeBand())
			
		//Exit
		bar.exit()
			.transition()
			.duration(opts.opts.duration)
			.attr('opacity', 0)
			.remove();

		return bar;
	},

	// Creates a bar chart.
	addScatter: function(opts){
		//parent, data, x, y,
		var circles = opts.parent.selectAll(".scatter-point-group." + opts.className || "scatter-point-group")
			.data(opts.data, function(d, i){ return opts.key ? d[opts.key] : i });

		// Enter
		var enteredCircles = circles.enter()
			.append("g")
			.attr("class", 'scatter-point-group ' + opts.className || "scatter-point")
			.attr("transform", function(d) { return "translate(" + opts.x(d) + "," + opts.y(d) + ")"; })
			.attr('opacity', 0);

		enteredCircles	
			.append("circle")
			.attr("class", "scatter-point")

		enteredCircles.append("circle")
			.attr("class", "scatter-point-hover")
			.attr('opacity', 0)
			.attr("r", 10)
			

		//Update	
		circles
			.transition()
			.duration(opts.opts.duration)
			.attr("transform", function(d) { return "translate(" + opts.x(d) + "," + opts.y(d) + ")"; })
			.attr('opacity', 1)
			.selectAll(".scatter-point")

			.attr("r", opts.z)
			
		//Exit
		circles.exit()
			.transition()
			.duration(opts.opts.duration)
			.attr('opacity', 0)
			.remove();

		return circles;
	},

	// Adds labels to a bar chart.
	addBarLabels: function(opts){
		return opts.parent.append("text")
			.attr("class", "bar-text")
			.attr("x", opts.xScale.rangeBand() / 2)
			.attr("y", function(d) { return  opts.y(d) - 3; })
			.text(function(d){ return opts.formatter ? opts.formatter(d[opts.prop]) : d[opts.prop]; });
	},

	// Adds a line. Can be used with the area chart.
	addLine: function(opts){
		// Setup area geneartor
		var valueline = d3.svg.line()
			.x(opts.x)
			.y(opts.y)


		var line = opts.parent.selectAll('.line');

		if(line.size() === 0){
			line = opts.parent.append("path")
				.attr("class", "line")
		}

		return line.transition()
			.duration(opts.opts.duration)
			.attr("d", valueline(opts.data, function(d){debugger; return d.YEAR;}));	
	},

	// This adds lines individually. The benefit of doing this is that then they can be bound to a key.
	// This allows them to properly slide for transitions.
	addLines: function(opts){
		//parent, data, x, y,
		
		var lineGroup  = opts.parent.selectAll('.line-group');

		if(lineGroup.size() === 0){
			lineGroup = opts.parent.append("g")
			.attr("class", "line-group");
		}

		var lines = lineGroup.selectAll(".single-line")
			.data(opts.data, function(d, i){ return opts.key ? d[opts.key] : i });

		// Enter
		lines.enter()
			.append("line")
			.attr("class", "single-line")
			.attr('opacity', 0);

		//Update	
		lines
			.transition()
			.duration(opts.opts.duration)
			.attr('opacity', 1)
			.attr("x1", opts.x)
			.attr("y1", opts.y)
			.attr("x2", function(d, i){ return opts.data[i+1] ? opts.x(opts.data[i+1]) : opts.x(d) })
			.attr("y2", function(d, i){ return opts.data[i+1] ? opts.y(opts.data[i+1]) : opts.y(d) })
			
		//Exit
		lines.exit()
			.transition()
			.duration(opts.opts.duration)
			.attr('opacity', 0)
			.remove();

		return lines;
	},


	addColorLegend: function(opts){
		//parent, data, x, y, color
		
		var group  = opts.parent.selectAll('.legend-group-color');

		if(group.size() === 0){
			group = opts.parent.append("g")
			.attr("class", "legend-group-color");
		}

		group.attr("transform", "translate("+ (opts.x) + "," + (opts.y) + ")");

		var items = group.selectAll(".legend-item-group")
			.data(opts.data, function(d, i){ return opts.key ? d[opts.key] : i });

		// Enter
		var groupEntered = items.enter()
			.append("g")
			.attr("class", "legend-item-group")
			.attr('opacity', 0)
			.attr("transform", function(d, i) { return "translate(0," + (i * 18) + ")"; })
			
		groupEntered.append('rect')
			.attr("class", "legend-square")
			.attr('height', 15)
			.attr('width', 15)


		groupEntered.append('text')
			.attr("class", "legend-text")
			.attr('x', 20)
			.attr('y', 0)

		//Update	
		var itemsUpdate = items
			.transition()
			.duration(opts.opts.duration)
			.attr('opacity', 1)
			.attr("transform", function(d, i) {return "translate(0," + (i * 18) + ")"; })
			
		itemsUpdate.select('.legend-square')
			.style('fill', function(d){return d.color;})

		itemsUpdate.select('.legend-text')
			.text(function(d){ return  d.label;})
			
			
		//Exit
		items.exit()
			.transition()
			.duration(opts.opts.duration)
			.attr('opacity', 0)
			.remove();

		return items;
	},


	// Adds the x axis.
	addXAxis: function(opts){
		var xaxis = opts.parent.selectAll('.x-axis');

		if(xaxis.size() === 0){
			xaxis = opts.parent.append("g")
			.attr("class", "axis x-axis")
			.attr("transform", "translate(0," + (opts.opts.height) + ")")
		}

		return xaxis
			.transition()
			.duration(opts.opts.duration)
			.call(opts.axis);
	},

	
	// Adds the y axis.
	addYAxis: function(opts){
		var yaxis = opts.parent.selectAll('.y-axis');

		if(yaxis.size() === 0){
			yaxis = opts.parent.append("g")
			.attr("class", "axis y-axis")
		}
		return yaxis
			.transition()
			.duration(opts.opts.duration)
			.call(opts.axis);

	},

	// Adds the x axis.
	// Example: utils.addXAxisGrid({parent: svg, opts:opts, xScale:xScale});
	addXAxisGrid: function(opts){
		
		// Create and add the x axis.
		var xAxis = d3.svg.axis()
			.scale(opts.xScale)
			.orient("bottom")
			.tickSize(-(opts.opts.height), 0, 0)
			.tickFormat("");


		var xaxis = opts.parent.selectAll('.x-axis-grid');

		if(xaxis.size() === 0){
			xaxis = opts.parent.append("g")
			.attr("class", "x-axis-grid")
			.attr("transform", "translate(0," + (opts.opts.height) + ")")
		}

		return xaxis
			.transition()
			.duration(opts.opts.duration)
			.call(xAxis);
	},

	// Example: utils.addYAxisGrid({parent: svg, opts:opts, yScale:yScale});
	addYAxisGrid: function(opts){
		
		// Create and add the x axis.
		var yAxis = d3.svg.axis()
			.scale(opts.yScale)
			.orient("left")
			.tickSize(-(opts.opts.width), 0, 0)
			.tickFormat("");


		var yaxis = opts.parent.selectAll('.y-axis-grid');

		if(yaxis.size() === 0){
			yaxis = opts.parent.append("g")
			.attr("class", "y-axis-grid")
			//.attr("transform", "translate(0," + (opts.opts.height) + ")")
		}

		return yaxis
			.transition()
			.duration(opts.opts.duration)
			.call(yAxis);
	},

	// Rotates the text on the x axis.
	rotateText: function(opts){
		opts.parent.selectAll("text")
		.attr("x", 0)
		.attr("y", 0)
		.attr("dy", 0)
		.attr("transform", "translate(-5,13)rotate("+ opts.rotate +", 0, 0)")
		.style("text-anchor", "start")
		.style("alignment-baseline", "text-after-edge");
	},

	// Adds a title to the chart.
	addChartTitle: function(opts){
		//Example:  {parent: svg, label: String, x: Number, y: Number}
		if(opts.opts){
			opts.x = opts.x || opts.opts.width / 2;
			opts.y = opts.y || -opts.opts.marginTop + 6;
		}

		return opts.parent.append("text")
			.attr('class', 'chart-title')
			.text(opts.label)
			.attr("transform", "translate(" + opts.x + "," + opts.y +")")
			.attr("text-anchor", "middle");
	},

	// Adds a label to the x axis.
	// Example: utils.addXAxisLabel({parent: svg, label: "Date",            opts:opts });
	addXAxisLabel: function(opts){
		//Example:  {parent: svg, label: String, x: Number, y: Number}
		if(opts.opts){
			opts.x = opts.x || opts.opts.width / 2;
			opts.y = opts.y || opts.opts.height + opts.opts.marginBottom - 6;
		}

		var xaxis = opts.parent.selectAll('.axis-label.x-axis');

		if(xaxis.size() === 0){
			xaxis = opts.parent.append("text")
				.attr('class', 'axis-label x-axis')
				.attr("text-anchor", "middle");;
		}

		return xaxis
			.text(opts.label)
			.attr("transform", "translate(" + opts.x + "," + opts.y +")");
	},

	// Adds a label to the y axis.
	addYAxisLabel: function(opts){
		//Example:  {parent: svg, label: String, x: Number, y: Number}
		if(opts.opts){
			opts.x = opts.x || -opts.opts.marginLeft;
			opts.y = opts.y || opts.opts.height/2;
		}

		var yaxis = opts.parent.selectAll('.axis-label.y-axis');

		if(yaxis.size() === 0){
			yaxis = opts.parent.append("text")
				.attr('class', 'axis-label y-axis')
				.attr("text-anchor", "middle");
		}

		return yaxis
			.text(opts.label)
			.attr("transform", "translate(" + opts.x + "," + opts.y +")rotate(-90)");
			
	},

	// Adds a tooltip for a line.
	addLineTooltip: function(opts){
		// Reference: http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html
		var focus = opts.parent.append("g")
			.style("display", "none");

		// append the circle at the intersection
		var circle = focus.append("circle")
			.attr("class", "circle-tooltip")
			.attr("r", 3);


		var line = focus.append("line")
			.attr("class", "line-tooltip")
			.style("fill", "none")
			.attr('y1', 0)
			.attr('y2', opts.opts.height)
			.attr('x1', 0)
			.attr('x2', 0);

		var div = d3.select("body")
			.append("div")
			.style("position", "absolute")
			.attr("class", "text-tooltip");

		// append the rectangle to capture mouse
		opts.parent.append("rect")
			.attr("width", opts.opts.width)
			.attr("height", opts.opts.height)
			.style("fill", "none")
			.style("pointer-events", "all")
			.on("mouseover", function() { focus.style("display", null); div.style("display", null); })
			.on("mouseout", function() { focus.style("display", "none"); div.style("display", 'none'); })
			.on("mousemove", mousemove);

		var bisectDate = d3.bisector(opts.xScale.getRawValue).left;

		function mousemove() {
			var x0 = opts.xScale.invert(d3.mouse(this)[0]);
			var i = bisectDate(opts.data, x0, 1);
			var d0 = opts.data[i - 1];
			var d1 = opts.data[i];
			var d2 = opts.data[i + 1];
			var d;

			var d0Val = _.get(d0, opts.xProp, Infinity);
			var d1Val = _.get(d1, opts.xProp, Infinity);
			var d2Val = _.get(d2, opts.xProp, Infinity);

			d0Val = Math.abs(d0Val - x0);
			d1Val = Math.abs(d1Val - x0);
			d2Val = Math.abs(d2Val - x0);

			d = d1;
			if(d0Val < d1Val && d0Val < d2Val){ d = d0; }
			if(d2Val < d1Val && d2Val < d0Val){ d = d2; }

			circle.attr("transform",
				  "translate(" + opts.x(d) + "," +
								 opts.y(d) + ")");

			line.attr("transform",
				  "translate(" + opts.x(d) + "," +
								 0 + ")");

			var bounds = line.node().getScreenCTM();

			// If the tooltip is over half way, flip it so the text doesn't go off the screen.
			var flipTooltip = opts.x(d) > opts.opts.width / 2;

			div.html(function(){ return opts.tooltipFormatter(d); })
				.classed("flipped", flipTooltip)	 
				.style("left", flipTooltip ? null : (bounds.e + window.scrollX) + "px")			 
				.style("right", flipTooltip ? $(window).width() - (bounds.e + window.scrollX) + "px" :null )			 
				.style("top", (bounds.f + window.scrollY) + "px");
		}
	}, 

	addTooltip: function(opts){
		opts.parent.call(opts.tip);
		opts.parent
			.on('mouseover', opts.tip.show)
			.on('mouseout', opts.tip.hide);
	},

	// Setup some lodash templates from the templates on the page.
	setupTemplates: function(){
		var _templates = {};
		var templates = {};
		$('.js-template').each(function(){ 
			_templates[this.id] = _.template($(this).html());  
			// Store a render function that can be called by d3.
			var that = this; 
			templates[this.id] = function(d, i){ return _templates[that.id]({d:d, i:i}); };
		});
		return templates;
	},

	titleCase: function(str){
		return _.map(_.words(str), function(o){return _.capitalize(o); }).join(' ');
	},

	setupSelect: function(opts){
		$el = $(opts.el);
		var templateStr = "<span class='valueHolder'></span> <span class='down-arrow glyphicon glyphicon-menu-down'></span>"
		+ "<select id=\"" + opts.id + "\" >"
		+ _.map(opts.options, function(o){return "<option value=\"" + o.value + "\">" + o.label + "</option>"}).join('')
		+ "</select>";
		$el.addClass('quiet-select').html(templateStr);

		$valueHolder = $el.find('.valueHolder');
		$select =$el.find('select');

		var indexedOptions = _.keyBy(opts.options, 'value');

		function refresh(){
			$valueHolder.html(indexedOptions[$select.val()].label);
		}

		function val(val){
			if(val === undefined){
				return $select.val();
			}
			$select.val(val);
			refresh();
		}

		val(opts.defaultValue);

		$select.on('change', function(){
			refresh();
			opts.onChange($select.val());
		});

		return {refresh: refresh, val: val};
	}


};