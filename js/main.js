var weightClasses=[
	{label: 'Underweight', color:'yellow',  start:0, end:18.5 },
	{label: 'Normal',      color:'green',   start:18.5, end:25 },
	{label: 'Overweight',  color:'orange',  start:25, end:30 },
	{label: 'Obese',       color:'red',     start:30, end:60 },
];

function setupSlider(params) {
	// Setup the svg.
	var opts = utils.setupSVG({
		selector: params.selector,
		width: 500,
		height: 100,
		marginTop: 30,
		marginRight: 20,
		marginBottom: 30,
		marginLeft: 20,
		duration: 800
	});

	var bmiX = d3.scale.linear()
    .domain([0, 50])
    .range([0, opts.width])
    .clamp(true);




	var x = d3.scale.linear()
    .domain([0, 400])
    .range([0, opts.width])
    .clamp(true);

    var brush = d3.svg.brush()
    .x(x)
    .extent([0, 0])
    .on("brush", brushed);


var gradient = opts.svg.append("defs")
  .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");


function getPercentage(bmi){
	var height = 70;
	var maxWeight = 400;
	return getWeightFromBmiAndHeight(bmi, height) / maxWeight * 100 + '%';
}

_.each(weightClasses, function(o){
	gradient.append("stop")
	    .attr("offset", getPercentage(o.start))
	    .attr("stop-color", o.color)
	    .attr("stop-opacity", 1);

	gradient.append("stop")
	    .attr("offset", getPercentage(o.end))
	    .attr("stop-color", o.color)
	    .attr("stop-opacity", 1);

});



gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#0c0")
    .attr("stop-opacity", 1);

gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#c00")
    .attr("stop-opacity", 1);


opts.svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0,0)")
    .call(d3.svg.axis()
      .scale(bmiX)
      .orient("top")
      .tickFormat(function(d) { return d; })
      .tickSize(5)
      .tickPadding(6))




    opts.svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + opts.height + ")")
    .call(d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickFormat(function(d) { return d; })
      .tickSize(5)
      .tickPadding(6))
  .select(".domain")
  .select(function() { return d3.select(this.parentNode).append('rect').attr("class", "halo")
    .attr("x", 0)
    .attr("y", -opts.height)
    .style("fill", "url(#gradient)")
    .attr("width", opts.width)
    .attr("height", opts.height); });



    var slider = opts.svg.append("g")
    .attr("class", "slider")
    .call(brush);

slider.selectAll(".extent,.resize")
    .remove();

var handle = slider.append("rect")
    .attr("class", "handle")
   // .attr("transform", "translate(0," + opts.height / 2 + ")")
    .attr("x", -4)
    .attr("y", -4)
    .attr("width", 8)
    .attr("height", opts.height + 8)

slider
    .call(brush.event);

	function brushed() {
	  var value = brush.extent()[0];

	  if (d3.event.sourceEvent) { // not a programmatic event
	    value = x.invert(d3.mouse(this)[0]);
	    brush.extent([value, value]);
	  }

	  handle.attr("x", x(value) - 4);
	  $( document ).trigger( "calculator:weight", [ value ] );
	  //d3.select("body").style("background-color", d3.hsl(value, .8, .8));
	}


}

function function_name(argument) {
	//weight/(height/100*height/100)

	if(bmi < 18.5) return 0;
	if(bmi >= 18.5 && bmi < 25) return 1;
	if(bmi >= 25 && bmi < 30) return 2;
	if(bmi >= 30 && bmi < 30) return 3;

	//If your BMI is less than 18.5, it falls within the underweight range.
	//If your BMI is 18.5 to 24.9, it falls within the normal or Healthy Weight range.
//	If your BMI is 25.0 to 29.9, it falls within the overweight range.
//	If your BMI is 30.0 or higher, it falls within the obese range.



}

function bmi(weight, height){
	return (weight / (height * height)) * 703;
}

function getWeightFromBmiAndHeight(bmi, height){
	return (bmi * (height*height)) / 703;
}




setupSlider({selector:'#heightSlider'});


$( document ).on( "calculator:weight", function(a,val){
	$('#weight-label').html(Math.round(val));
});

