(function(){

	var $svg = $("#scale-svg"); 
	var svgGroup = d3.select('#scale');
	var circle2 = svgGroup.select("#circle2");
	var circle1 = svgGroup.select("#circle1");
	var lever = svgGroup.select('#lever');

	function getTransform(factor) {
		var width = 100;
		var height = 100;
		var x = (width * factor) - ((width * factor) / 2);
		var y = height * factor
		return "translate(" + -x + "," + -y + ") scale(" + factor + ")";
	}

	var drag = d3.behavior.drag()
		.on("drag", function(d, i) {

			var y = d3.event.sourceEvent.pageY
			var y0 = $svg.get(0).getBoundingClientRect().top + window.scrollY
			y = y - y0;
			var height = $svg.get(0).getBoundingClientRect().height - 20
			var scaleOffset = (y - 10) / height;
			scaleOffset = Math.max(scaleOffset, 0)
			scaleOffset = Math.min(scaleOffset, 1)
			scaleOffset = scaleOffset - 0.5;

			var scale1 = 1 + scaleOffset;
			var scale2 = 1 - scaleOffset;

			if(this === circle2.node()){
				scale2 = 1 + scaleOffset;
				scale1 = 1 - scaleOffset;
			}

			circle1.attr('transform', getTransform(scale1));
			circle2.attr('transform', getTransform(scale2));
			var ratio = scale2 - scale1;
			lever.attr("transform", "rotate(" + (25 * ratio) + ", 315, 165)");

			var newClass = 'maintaining-weight';
			if(scale1 > 1.1){
				newClass = 'gaining-weight';
			}
			if(scale1 < 0.9){
				newClass = 'losing-weight';
			}

			$('.scale-section')
				.removeClass('gaining-weight losing-weight maintaining-weight')
				.addClass(newClass);
	});

	var value = getTransform(1);
	circle2.attr('transform', value).call(drag);
	circle1.attr('transform', value).call(drag);

	$('.scale-section')
	.addClass('maintaining-weight');

})();