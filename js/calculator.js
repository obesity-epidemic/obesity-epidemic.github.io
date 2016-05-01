// We have a staggered init process to avoid blocking the page.
function init(argument) {
	var body0 = d3.select('#body0').node();
	var body1 = d3.select('#body1').node();
	var body2 = d3.select('#body2').node();
	var body3 = d3.select('#body3').node();
	var body4 = d3.select('#body4').node();
	var body5 = d3.select('#body5').node();

	var mbody0 = d3.select('#mbody0').node();
	var mbody1 = d3.select('#mbody1').node();
	var mbody2 = d3.select('#mbody2').node();
	var mbody3 = d3.select('#mbody3').node();
	var mbody4 = d3.select('#mbody4').node();
	var mbody5 = d3.select('#mbody5').node();

	// These are so that at any point in time we can go to a specific body shape.
	var tweeners = [];
	var mtweeners = [];

	var actions = [
		function(){ tweeners.push(getTweenerForPaths(body0, body0)) },
		function(){ tweeners.push(getTweenerForPaths(body0, body1)) },
		function(){ tweeners.push(getTweenerForPaths(body1, body2)) },
		function(){ tweeners.push(getTweenerForPaths(body2, body3)) },
		function(){ tweeners.push(getTweenerForPaths(body3, body4)) },
		function(){ tweeners.push(getTweenerForPaths(body4, body5)) },

		function(){ mtweeners.push(getTweenerForPaths(mbody0, mbody0)) },
		function(){ mtweeners.push(getTweenerForPaths(mbody0, mbody1)) },
		function(){ mtweeners.push(getTweenerForPaths(mbody1, mbody2)) },
		function(){ mtweeners.push(getTweenerForPaths(mbody2, mbody3)) },
		function(){ mtweeners.push(getTweenerForPaths(mbody3, mbody4)) },
		function(){ mtweeners.push(getTweenerForPaths(mbody4, mbody5)) },
	]

	init3(actions, tweeners, mtweeners);
}

function init3(actions, tweeners, mtweeners){
	if(actions.length){
		actions.shift()();
		_.delay(function(){ init3(actions, tweeners, mtweeners) }, 20);
	}else{
		init4(tweeners, mtweeners);
	}
}

// This is the main init.
function init4(tweeners, mtweeners){

var percentileData;
var maxWeight = 400;

var childrenWeightClasses = [
	{id: 'under',  label: 'Underweight',    color:'#3C86C1',  start:0, end:5 },
	{id: 'normal', label: 'Normal Weight',  color:'#297D29',  start:5, end:85 },
	{id: 'over',   label: 'Overweight',     color:'#FFBB00',  start:85, end:95 },
	{id: 'obese1', label: 'Obese',          color:'#F90',     start:95, end:200,  maxWeight:maxWeight },
	{id: 'obese1', label: 'Obese',          color:'#F90',     start:95, end:200, maxWeight:maxWeight },
	{id: 'obese1', label: 'Obese',          color:'#F90',     start:95, end:200, maxWeight:maxWeight }
];


var weightClasses=[
	{id: 'under', label: 'Underweight', color:'#3C86C1',  start:0, end:18.5, mid: 15 },
	{id: 'normal', label: 'Normal Weight',      color:'#297D29',   start:18.5, end:25 },
	{id: 'over', label: 'Overweight',  color:'#FFBB00',  start:25, end:30 },
	{id: 'obese1', label: 'Obese I',     color:'#F90',     start:30, end:35 },
	{id: 'obese2', label: 'Obese II',    color:'#F90',     start:35, end:40 }, //#f30
	{id: 'obese3', label: 'Obese III',   color:'#F30',     start:40, end:200, mid: 43, maxWeight:maxWeight }, //#c52323
];

_.each(weightClasses, function(o){
	if(! o.mid){
		o.mid = ( o.end + o.start) / 2;
	}
})

var pathObjects = [];

_.each(weightClasses, function(o,i){

	pathObjects.push({
		getBMIRange: function(){
			var start = _.get(weightClasses, '['+(i-1)+'].mid', 0);
			return {start:weightClasses[i], end:  weightClasses[i].mid};
		},
		getPathForBmi: function(bmi){
			var start = _.get(weightClasses, '['+(i-1)+'].mid', 0);

			var scale = d3.scale.linear()
			.domain([start, weightClasses[i].mid])
			.range([0, 1])
			.clamp(true);

			return calculator.gender ==1 ? mtweeners[i](scale(bmi)) : tweeners[i](scale(bmi));
		}
	})
});

var adultWeightClasses = weightClasses;

var weightIcon = "<i class='material-icons rec-icon'>fitness_center</i>";
var walkingIcon = "<i class='material-icons rec-icon'>directions_walk</i>";
var runningIcon = "<i class='material-icons rec-icon'>directions_run</i>";
var aerobicIcon = "<i class='material-icons rec-icon'>directions_bike</i>";
var jumpingIcon = "<i class='material-icons rec-icon'>accessibility</i>";


//http://www.cdc.gov/physicalactivity/basics/children/index.htm
var activityClasses=[
	{ startAge:6, endAge:18,  label: [ runningIcon + "1 hour of physical activity each day.", weightIcon + "3 days muscle strengthening",  aerobicIcon + "3 days aerobic", jumpingIcon + "3 days bone strengthening"].join("<br /><br />")},
	{ startAge:18, endAge:200, label: [weightIcon + "Muscle strength training 2 days a week<br />", runningIcon + "1.25 hours of intense activity(jogging/running) per week <div><span style='padding-left:189px;'>&nbsp;</span><b>or</b></div>" +walkingIcon+ "2.5 hours of moderate activity (fast walking) per week"].join("<br />")},
];


var goodIcon = '<i class="risk-icon fa fa-check-circle" style="color:#4B8C4B; "></i>';
var okIcon = '<i class="risk-icon fa fa-exclamation-triangle" style="color:#3148FF; "></i>';
var badIcon = '<i class="risk-icon fa fa-exclamation-triangle" style="color:#D89700; "></i>';
var veryBadIcon = '<i class="risk-icon fa fa-exclamation-triangle" style="color:#D85B00; "></i>';
var extremelyBadIcon = '<i class="risk-icon fa fa-times-circle" style="color:#900000; "></i>';

var riskLabels = {
	none:          goodIcon + "No disease risk for type 2 diabetes, hypertension, and heart disease",
	increased:     [okIcon + "Increased risk of type 2 diabetes", okIcon + "Increased risk of hypertension", okIcon + "Increased risk of heart disease"].join('<br />'),
	high:          [badIcon + "High risk of type 2 diabetes", badIcon + "High risk of hypertension", badIcon + "High risk of heart disease"].join('<br />'),
	veryHigh:      [veryBadIcon + "Very high risk of type 2 diabetes", veryBadIcon + "Very high risk of hypertension", veryBadIcon + "Very high risk of heart disease"].join('<br />'),
	extremelyHigh:  [extremelyBadIcon + "Extremely high risk of type 2 diabetes", extremelyBadIcon + "Extremely high risk of hypertension", extremelyBadIcon + "Extremely high risk of heart disease"].join('<br />')
};

var overweightRisks = "<br />" + [okIcon + "Increased risk of arthritis", okIcon + "Increased risk of infertility", okIcon + "Increased risk of asthma",okIcon + "Increased risk of cancer"].join('<br />') 
var obeseRisks = "<br />" + [badIcon + "High risk of arthritis", badIcon + "High risk of infertility", badIcon + "High risk of asthma",badIcon + "High risk of cancer", badIcon + "High risk of fatty liver disease", badIcon + "High risk of miscarriage"].join('<br />') 


var riskClasses=[
	{ startBMI:0,    endBMI:18.5, label: riskLabels.none},
	{ startBMI:18.5, endBMI:25,   label: riskLabels.none},
	{ startBMI:25,   endBMI:30,   label: riskLabels.increased + overweightRisks,     label2:riskLabels.high + overweightRisks},
	{ startBMI:30,   endBMI:35,   label: riskLabels.high + obeseRisks,          label2:riskLabels.veryHigh+ obeseRisks},
	{ startBMI:35,   endBMI:40,   label: riskLabels.veryHigh + obeseRisks,      label2:riskLabels.veryHigh + obeseRisks},
	{ startBMI:40,   endBMI:200,  label: riskLabels.extremelyHigh + obeseRisks, label2:riskLabels.extremelyHigh + obeseRisks}
];

var activityLevels=[
	{value: '0', label: "Little to no exercise"	        , multiplier: 1.2},
	{value: '1', label: "Exercise 1–3 days per week"	, multiplier: 1.375},
	{value: '2', label: "Exercise 3–5 days per week"	, multiplier: 1.55},
	{value: '3', label: "Exercise 6–7 days per week"	, multiplier: 1.725},
	{value: '4', label: "Exercise twice per day"	    , multiplier: 1.9},
];

var activityLevelsIndexed = _.keyBy(activityLevels, 'value');

function getWeightFromBmi(bmi){
	var height = calculator.height;
	return getWeightFromBmiAndHeight(bmi, height);
}

function updateWeightSlider(params) {
	// Setup the svg.
	if(!calculator.weightOpts){
		calculator.weightOpts = utils.setupSVG({
			selector: params.selector,
			width: 500,
			height: 100,
			marginTop: 30,
			marginRight: 20,
			marginBottom: 30,
			marginLeft: 20,
			duration: 800
		});
	}

	var opts = calculator.weightOpts;

	var x = d3.scale.linear()
		.domain([0, maxWeight])
		.range([0, opts.width])
		.clamp(true);


	var bar = opts.svg.selectAll(".bar-group")
			.data(weightClasses, function(d, i){ return i });

	// Enter
	bar.enter().append("g")
		.attr("class", 'bar-group')
		.attr("transform", function(d) { return "translate(" + x(getWeightFromBmi(d.start)) + ",0)"; })
		.append("rect")
		.attr("class", "bar")
		.attr('opacity', 0)
		.attr('fill', function(d){ return d.color;})
		.attr("height",opts.height)
		.attr("y", 0)
	
	//Update	
	bar
		.transition()
		.duration(opts.duration)
		.attr("transform", function(d) {  return "translate(" + x(getWeightFromBmi(d.start)) + ",0)"; })
		.selectAll(".bar")
		.attr('opacity', 1)
		.attr("width", function(d,i,j){ d = weightClasses[j];  var end = d.maxWeight || getWeightFromBmi(d.end);   return x(end) - x(getWeightFromBmi(d.start))})
		
	//Exit
	bar.exit()
		.transition()
		.duration(opts.duration)
		.attr('opacity', 0)
		.remove();

	// Add the BMI ticks and labels
	opts.bmiAxis = d3.svg.axis()
		.scale(x)
		.orient("top")
		.tickFormat(function(d) { return Math.round(getBMI(d, calculator.height)); })
		.tickSize(5)
		.tickPadding(6);


	if(!opts.bmiAxisGroup)
	opts.bmiAxisGroup = opts.svg.append("g")
		.attr("class", "x axis bmiAxis")
		.attr("transform", "translate(0,0)")
	
	opts.bmiAxisGroup.call(opts.bmiAxis);

	if(!opts.xAxis){
		opts.xAxis = opts.svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + opts.height + ")")
			.call(d3.svg.axis()
				.scale(x)
				.orient("bottom")
				.tickFormat(function(d) { return d; })
				.tickSize(5)
				.tickPadding(6));

		opts.xAxis.select(".domain")
		.select(function() { return d3.select(this.parentNode).append('rect').attr("class", "halo")
			.attr("x", 0)
			.attr("y", -opts.height)
			.style("fill", "url(#gradient)")
			.attr("width", opts.width)
			.attr("height", opts.height); });
	}


	// Initialize brush component
	if(!opts.brush){
		opts.brush = d3.svg.brush()
			.x(x)
			.on("brush", brushed);

		// Append brush component here
		var brushGroup = opts.svg.append("g")
			.attr("class", "x brush")
			.call(opts.brush);

		brushGroup.selectAll(".extent")
			.remove();

		brushGroup.selectAll("rect")
			.attr("y", 0)
			.attr("height", opts.height)
			.attr("width", opts.width + 8)
			.attr("x", -4)

		opts.handle = opts.svg.append("g")
			.attr("class", "slider")
			.append("rect")
			.attr("class", "handle")
			.attr("x", -4)
			.attr("y", -4)
			.attr("width", 8)
			.attr("height", opts.height + 8);
	}

	function brushed(value) {
		if(value === undefined){
			value = x.invert(d3.mouse(this)[0]);
		}

		opts.brush.extent([value, value]);
		opts.handle.attr("x", x(value) - 4);
		calculator.set('weight', value);
	}

	opts.updateBrush = brushed;
}



var lastBmi;
function updateBmiBody(params) {
	// Setup the svg.
	if(!calculator.bodyOpts){
		calculator.bodyOpts = utils.setupSVG({
			selector: params.selector,
			width: 500,
			height: 500,
			marginTop: 0,
			marginRight: 0,
			marginBottom: 0,
			marginLeft: 0,
			duration: 800
		});

		calculator.bodyOpts.root.attr('viewBox', "0 0 239 482.4");

		var path = calculator.bodyOpts.path = calculator.bodyOpts.svg.append('path')
		//.attr('class', 'bmi-color');
		path.attr('d', getBodyPath(calculator.rawBmi));
	}

	var opts = calculator.bodyOpts;


	if(Math.abs(lastBmi - calculator.rawBmi) < 2){
		lastBmi = calculator.rawBmi;
		opts.path.attr('d', getBodyPath(calculator.rawBmi))
		.attr('fill', calculator.weightClass.color);
		return;
	}
	
	
	lastBmi = calculator.rawBmi;
	transitionPath(opts);
	
}


function _transitionPath(opts){
	opts.path.transition()
		.duration(opts.duration)
		.attrTween("d", pathTween(getBodyPath(calculator.rawBmi)))
		.attr('fill', calculator.weightClass.color)
}

var transitionPath = _.debounce(_transitionPath, 100);


function updateHeightSlider(params) {
	// Setup the svg.
	if(!calculator.heightOpts){
		calculator.heightOpts = utils.setupSVG({
			selector: params.selector,
			width: 100,
			height: 500,
			marginTop: 30,
			marginRight: 30,
			marginBottom: 30,
			marginLeft: 30,
			duration: 800
		});
	}

	var opts = calculator.heightOpts;

	var y = d3.scale.linear()
		.domain([0, 96])
		.range([opts.height, 0])
		.clamp(true);

	if(!opts.brush){
		opts.brush = d3.svg.brush()
			.y(y)
			.extent([0, 0])
			.on("brush", brushed);
	
		var backgroundRect = opts.svg.append("rect")
			.attr("class", "background-bar")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", opts.width)
			.attr("height", opts.height);

		opts.selectionRect = opts.svg.append("rect")
			.attr("class", "selection-bar")
			.attr("x", 0)
			.attr("y", opts.height)
			.attr("width", opts.width)
			.attr("height", 0);


		opts.axisGroup = opts.svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0,0)")
			.call(d3.svg.axis()
				.scale(y)
				.orient("left")
				.tickValues([12, 24, 36, 48, 60, 72, 84, 96])
				.tickFormat(function(d) { return d / 12 + "'"; })
				.tickSize(5)
				.tickPadding(6));

		// Append brush component here
		var brushGroup = opts.svg.append("g")
			.attr("class", "x brush")
			.call(opts.brush);

		brushGroup.selectAll(".extent")
			.remove();

		brushGroup.selectAll("rect")
			.attr("y", -4)
			.attr("height", opts.height + 8)
			.attr("width", opts.width)
			.attr("x", 0)

		opts.handle = opts.svg.append("g")
			.attr("class", "slider")
			.append("rect")
			.attr("class", "handle")
			.attr("x", -4)
			.attr("y", -4)
			.attr("width", opts.width + 8)
			.attr("height", 8);
	}

	 function brushed(value) {
		if(value === undefined){
			value = y.invert(d3.mouse(this)[1]);
		}

		opts.brush.extent([value, value]);
		opts.handle.attr("y", y(value) - 4);
		opts.selectionRect
			.attr("y",  y(value))
			.attr("height", opts.height - y(value))
		calculator.set('height', value);
	}

	opts.updateBrush = brushed;
}

// This is the bmi age percentile bar.
function updatePercentile(params) {
	// Setup the svg.
	if(!calculator.percentileOpts){
		calculator.percentileOpts = utils.setupSVG({
		selector: params.selector,
		width: 470,
		height: 100,
		marginTop: 40,
		marginRight: 10,
		marginBottom: 40,
		marginLeft: 5,
		duration: 800
	});
	}

	var opts = calculator.percentileOpts;

	var dataObj = calculator.percentileObj; 
	var data = dataObj.data;


	var x = d3.scale.linear()
		.domain(d3.extent(data, function(d){return d.bmi;}) )
		.range([0, opts.width])
		.clamp(true);


	var bar = opts.svg.selectAll(".bar-group")
			.data(weightClasses, function(d, i){ return i });

	// Enter
	bar.enter().append("g")
		.attr("class", 'bar-group')
		.attr("transform", function(d) { return "translate(" + (x(d.start) || 0) + ",0)"; })
		.append("rect")
		.attr("class", "bar")
		.attr('opacity', 0)
		.attr('fill', function(d){ return d.color;})
		.attr("height",opts.height)
		.attr("y", 0)
	
	//Update	
	bar
		.transition()
		.duration(opts.duration)
		.attr("transform", function(d) { return "translate(" + (x(d.start) || 0) + ",0)"; })
		.selectAll(".bar")
		.attr('opacity', 1)
		.attr("width", function(d,i,j){ d= weightClasses[j]; var end = d.maxWeight || d.end; return x(end) - x(d.start)})
		
	//Exit
	bar.exit()
		.transition()
		.duration(opts.duration)
		.attr('opacity', 0)
		.remove();

	// Add the BMI ticks and labels
	opts.bmiAxis = d3.svg.axis()
		.scale(x)
		.orient("top")
		.tickValues(_.map(data, 'bmi'))
		.tickFormat(function(d, i) { return data[i].showLabel ? d : ''; })
		.tickSize(5)
		.tickPadding(6);


	var indicator = opts.svg.selectAll(".indicator")
			.data([calculator.rawBmi]);

	indicator.enter().append("rect")
		.attr("class", "indicator")
		.attr("height",opts.height)
		.attr("width",4)
		.attr("fill", 'black')
		.attr("y", 0)

	indicator
		.transition()
		.duration(opts.duration)
		.attr("transform", function(d) { return "translate(" + ((x(d)||0) - 2) + ",0)"; })

	if(!opts.bmiAxisGroup){

		opts.svg.append("text")
			.attr('class', 'axis-label x-axis')
			.attr("text-anchor", "start")
			.text('BMI')
			.attr("transform", "translate(" + -2 + "," + -25 +")");

		opts.svg.append("text")
			.attr('class', 'axis-label x-axis')
			.attr("text-anchor", "start")
			.text('Percentile')
			.attr("transform", "translate(" + -2 + "," + 55 +")");

		opts.bmiAxisGroup = opts.svg.append("g")
			.attr("class", "x axis bmiAxis")
			.attr("transform", "translate(0,0)")
	}

	opts.bmiAxisGroup.transition().duration(opts.duration).call(opts.bmiAxis);

	// Add the Percentile ticks and labels
	opts.percentileAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.tickValues(_.map(data, 'bmi'))
		.tickFormat(function(d, i) { return data[i].percentile; })
		.tickSize(5)
		.tickPadding(6);


	if(!opts.percentileAxisGroup){
	opts.percentileAxisGroup = opts.svg.append("g")
		.attr("class", "x axis percentileAxis")
		.attr("transform", "translate(0," + opts.height + ")")
	}

	opts.percentileAxisGroup.transition().duration(opts.duration).call(opts.percentileAxis);
}


function convertToFeetAndInches(inches){
	var values = [Math.floor(inches / 12), Math.floor(inches % 12)];
	return values[0] + "' " + values[1] + '"';
}

function getBMI(weight, height){
	return (weight / (height * height)) * 703;
}

function getWeightFromBmiAndHeight(bmi, height){
	
	var result = (bmi * (height*height)) / 703;
	//console.log('GEt weight', result);
	return result;
}

//https://en.wikipedia.org/wiki/Classification_of_obesity
function getBodyFatPercentage(bmi, age, gender){
	return Math.round(1.2 * bmi + 0.23 * age - 5.4 - 10.8 * gender) + '%';
}

function getActivityRecommendationForAge(age){
	var selected = null;
	_.each(activityClasses, function(activity){
		if(age<activity.endAge){
			selected = activity;
			return false;
		}
	});
	return selected;
}


function getWeightClass(bmi){
	var selected = null;
	_.each(weightClasses, function(item){
		if(bmi<item.end){
			selected = item;
			return false;
		}
	});
	return selected;
}


//https://www.nhlbi.nih.gov/health/educational/lose_wt/BMI/bmi_dis.htm
//https://www.nhlbi.nih.gov/health/educational/lose_wt/risk.htm
//http://www.hsph.harvard.edu/obesity-prevention-source/obesity-consequences/
function getRisk(bmi, waist, gender){
	var selected = null;

	_.each(riskClasses, function(level){
		if(bmi < level.endBMI){
			selected = level;
			return false;
		}
	});

	if(gender == 0 && waist >= 35 ){ return selected.label2; }
	if(gender == 1 && waist >= 40 ){ return selected.label2; }

	return selected.label;
}


function getBodyPath(bmi){
	var selected = null;

	_.each(pathObjects, function(level){
		if(bmi < level.getBMIRange().end){
			selected = level;
			return false;
		}
	});

	selected = selected || _.last(pathObjects);

	return selected.getPathForBmi(bmi);
}

function getPecentileData(age, gender){
	var selected = null;

	gender = gender == 1 ? 'male' : 'female';

	_.each(percentileData, function(row){
		if(age < row.end && gender == row.gender ){
			selected = row;
			return false;
		}
	});

	return selected;
}

function isChild(){
	return calculator.age < 20;
}

function getMatchingPecentile(percentiles, bmi){
	var selected = null;

	_.each(percentiles, function(row, i){
		if(i == 0) return;
		if(bmi < row.bmi){
			selected = row;
			return false;
		}
	});

	return selected || _.last(percentiles);
}

function updateChildWeightClasses(){
	 // 0 to 5 = Under
	childrenWeightClasses[0].start = 0;
	childrenWeightClasses[0].end = calculator.percentileObj.data[1].bmi;

	// 5-85 Normal
	childrenWeightClasses[1].start = calculator.percentileObj.data[1].bmi;
	childrenWeightClasses[1].end = calculator.percentileObj.data[7].bmi;

	// 85-95 Over
	childrenWeightClasses[2].start = calculator.percentileObj.data[7].bmi;
	childrenWeightClasses[2].end = calculator.percentileObj.data[8].bmi;

	// 95 + Obese
	childrenWeightClasses[3].start = calculator.percentileObj.data[8].bmi;
	childrenWeightClasses[3].end = 200;

	childrenWeightClasses[4].start = calculator.percentileObj.data[8].bmi;
	childrenWeightClasses[4].end = 200;

	childrenWeightClasses[5].start = calculator.percentileObj.data[8].bmi;
	childrenWeightClasses[5].end = 200;

	_.each(childrenWeightClasses, function(o){
		o.mid = ( o.end + o.start) / 2;
	});

	childrenWeightClasses[0].mid = childrenWeightClasses[0].end - 2;
	childrenWeightClasses[5].mid = childrenWeightClasses[0].start + 2;
}

function getDailyCalories(gender, weight, height, age, activityLevel){
	var kg = weight / 2.2046226218;;
	var cm = height * 2.54;
	var bmr;
	if(gender == 0){
		bmr =  (10 * kg) + (6.25 * cm) - (5 * age) - 161;
	}else{
		bmr = (10 * kg) + (6.25 * cm) - (5 * age) + 5;
	}


	return Math.round(bmr * activityLevel.multiplier);
}

//https://en.wikipedia.org/wiki/Harris%E2%80%93Benedict_equation
//https://en.wikipedia.org/wiki/Waist-to-height_ratio

// How many calories to reduce by.
//http://www.bmi-calculator.net/bmr-calculator/harris-benedict-equation/calorie-intake-to-lose-weight.php
//http://www.freedieting.com/calorie_needs.html  (This explains how much to lose.)


function Calculator(){
	var self = this;
	this.weight = 160;
	this.height = 64;
	this.gender = 0; // 1 = male
	this.age = 34;
	this.bmi = null;
	this.bodyfat = null;
	this.activityLevel = activityLevels[1];
	this.waist = 32;

	this.init = function(){
		
		$('.calculator.loading').removeClass('loading');

		this.genderSelect = utils.setupSelect({
			el: '#genderSelect',
			onChange: function(o){ self.set('gender', +o); },
			options: [
				{value: '0', label:'Female'},
				{value: '1', label:'Male'},
			],
			defaultValue: self.gender
		});

		this.ageSelect = utils.setupSelect({
			el: '#ageSelect',
			onChange: function(o){ self.set('age', +o); },
			options:_.map(_.range(2, 99), function(i){
				return {value: i+'', label:i+''};
			}),
			defaultValue: self.age
		});

		var dataSourceSelect = utils.setupSelect({
			el: '#waistSelect',
			onChange: function(o){ self.set('waist', o); },
			options:_.map(_.range(20, 99), function(i){
				return {value: i+'', label:i + '"'};
			}),
			defaultValue: self.waist
		});

		var activityLevelSelect = utils.setupSelect({
			el: '#activityLevelSelect',
			onChange: function(o){ self.set('activityLevel', activityLevelsIndexed[o]); },
			options: activityLevels,
			defaultValue: '1'
		});

		this.percentileObj = getPecentileData(this.age, this.gender);
		this.bodyPath = d3.select(".bmi-body path");
		updateWeightSlider({selector:'#weightSlider'});
		updateHeightSlider({selector:'#heightSlider'});
		updatePercentile({selector:'#bmi-by-age'});
		updateBmiBody({selector:'#bmiBody'});
		this.weightOpts.updateBrush(this.weight);
		this.heightOpts.updateBrush(this.height);
	};

	this.set = function(prop, val){
		this[prop] = val;

		if(prop === 'age'){
			this.weightOpts.updateBrush(calculator.weight);
		}

		this.refresh();

		if(prop === 'weight' && snackViz){
			snackViz.refresh();
		}
	}

	this.refresh = function(){
		var bmi = getBMI(this.weight, this.height);
		this.rawBmi = bmi;
		this.bmi = Math.round(bmi);

		if(isChild()){
			updateChildWeightClasses();
			weightClasses = childrenWeightClasses;
		}else{
			weightClasses = adultWeightClasses;
		}


		this.percentileObj = getPecentileData(this.age, this.gender);
		this.matchingPercentile = getMatchingPecentile(this.percentileObj.data, this.rawBmi); 

		$('#bmi-by-age-label').html("Your BMI is greater than " 
		+ this.matchingPercentile.percentileStart 
		+ "% to " + this.matchingPercentile.percentile 
		+ "% of "
		+ this.percentileObj.start +  " to " + this.percentileObj.end + "-year-old " + (this.gender ? 'males.' : 'females.'));

		var weightClass = getWeightClass(this.rawBmi);
		this.weightClass = weightClass;

		this.bodyfat = getBodyFatPercentage(this.bmi, this.age, this.gender);

		var desiredWeightChange = 0;
		var direction = 'stay';

		var healthyDailyCalories;

		var normalWeightObj = weightClasses[1];

		if(this.bmi < normalWeightObj.start){
			var healthyWeight = getWeightFromBmi(normalWeightObj.start);
			healthyDailyCalories = getDailyCalories(this.gender, healthyWeight, this.height, this.age, this.activityLevel);
			desiredWeightChange = Math.round(healthyWeight - this.weight);
			direction = 'gain';
		}else if(this.bmi > normalWeightObj.end){
			var healthyWeight = getWeightFromBmi(normalWeightObj.end);
			desiredWeightChange = Math.round(this.weight - getWeightFromBmi(normalWeightObj.end));
			direction = 'lose';
		}else{
			healthyDailyCalories = getDailyCalories(this.gender, this.weight, this.height, this.age, this.activityLevel);
		}

		$('.weight-label').html(Math.floor(this.weight));
		//$('#weight-label').html(this.weight));
		$('.height-label').html(convertToFeetAndInches(this.height));
		$('.bmi-label').html(this.bmi);
		$('.bodyfat-label').html(this.bodyfat);
		$('.gender-label').html(this.gender == 0 ? 'female' : 'male');
		$('.age-label').html(this.age);

		$('.desired-weight-change-label').html(desiredWeightChange);
		$('.desired-weight-change-group').hide();
		$('.desired-weight-change-group.'+ direction).show();
		$('.risks-label').html(getRisk(this.bmi, this.waist, this.gender));
		$('.recommended-activity-label').html(getActivityRecommendationForAge(this.age).label);
		$('.daily-calories-label').html(getDailyCalories(this.gender, this.weight, this.height, this.age, this.activityLevel));
		$('.recommended-calories-label').html(healthyDailyCalories);
		$('.gender-icon').hide();
		$('.gender-icon.gender-'+ this.gender).show();
		$('.obesityClass').html(weightClass.label);
		$('.calculator ').removeClass('under normal over obese1 obese2 obese3').addClass(weightClass.id);

		updateWeightSlider();
		updateBmiBody();
		updatePercentile();

		this.genderSelect.val(this.gender + '');
		this.ageSelect.val(this.age + '');

		var chairHeight = 41*491/this.height;


		d3.select('#chair').transition()
		.duration(800)
		.style('height', chairHeight);

	};
};


var calculator = new Calculator();


queue()
  .defer(d3.csv, "data/processed_data/bmi_percentiles-by_age.csv")
  .await(function(error, data){

  	_.each(data, function(row){
  		_.each(row, function(item, i){
  			if(i !== 'gender'){
  				row[i] = +row[i];
  			}
  		});
  		row.data = [
  			{percentile:0,   percentileStart:0, showLabel:false,  start:0,   bmi: row['5th'] - 1},
  			{percentile:5,   percentileStart:0, showLabel:true,   start:row['5th'] - 1,   bmi: row['5th'] },
  			{percentile:10,  percentileStart:5, showLabel:true,   start:row['5th'] ,  bmi: row['10th'] },
  			{percentile:15,  percentileStart:10, showLabel:false,   start:row['10th'],  bmi: row['15th'] },
  			{percentile:25,  percentileStart:15, showLabel:true,   start:row['15th'],  bmi: row['25th'] },
  			{percentile:50,  percentileStart:25, showLabel:true,   start:row['25th'],  bmi: row['50th'] },
  			{percentile:75,  percentileStart:50, showLabel:true,   start:row['50th'],  bmi: row['75th'] },
  			{percentile:85,  percentileStart:75, showLabel:true,   start:row['75th'],  bmi: row['85th'] },
  			{percentile:90,  percentileStart:85, showLabel:true,   start:row['85th'],  bmi: row['90th'] },
  			{percentile:95,  percentileStart:90, showLabel:true,   start:row['90th'],  bmi: row['95th'] },
  			{percentile:100, percentileStart:95, showLabel:false,  start:row['95th'],  bmi: row['95th'] + 1},
  		];
  	});

  	percentileData = data;
  	calculator.init();
  });


window.calculator = calculator;


};


init();


// This is used by the show me more buttons.
function demo(id, el){

	switch(id){
		case 'calculator1':

			calculator.weight = 140.2;
			calculator.height = 63.1;
			calculator.gender = 0; // 1 = male
			calculator.age = 34;
			calculator.waist = 32;
			calculator.weightOpts.updateBrush(calculator.weight);
			calculator.heightOpts.updateBrush(calculator.height);
			calculator.refresh();

			_.delay(function(){
				calculator.weight = 164.3;
				calculator.height = 64.1;
				calculator.gender = 0; // 1 = male
				calculator.age = 34;
				calculator.waist = 32;
				calculator.weightOpts.updateBrush(calculator.weight);
				calculator.heightOpts.updateBrush(calculator.height);
				calculator.refresh();
			}, 2000);

		break;


		case 'calculator2':

			calculator.weight = 195;
			calculator.height = 67;
			calculator.gender = 0; // 1 = male
			calculator.age = 34;
			calculator.waist = 32;
			calculator.weightOpts.updateBrush(calculator.weight);
			calculator.heightOpts.updateBrush(calculator.height);
			calculator.refresh();

			_.delay(function(){
				calculator.weight = 185;
				calculator.weightOpts.updateBrush(calculator.weight);
				calculator.heightOpts.updateBrush(calculator.height);
				calculator.refresh();
			}, 2000);

		break;


		case 'calculator3':

			calculator.weight = 180;
			calculator.height = 70;
			calculator.gender = 1; // 1 = male
			calculator.age = 34;
			calculator.waist = 32;
			calculator.weightOpts.updateBrush(calculator.weight);
			calculator.heightOpts.updateBrush(calculator.height);
			calculator.refresh();

			_.delay(function(){
				calculator.weight = 205;
				calculator.age = 44;
				calculator.weightOpts.updateBrush(calculator.weight);
				calculator.heightOpts.updateBrush(calculator.height);
				calculator.refresh();
			}, 2000);

		break;

		case 'food1':
			snackViz.set('selectedFood', 'Snickers');
		break;

		case 'food2':
			snackViz.set('selectedFood', 'Pepsi');
		break;

		case 'food3':
			snackViz.set('selectedFood', 'Celery');
		break;

	}


}


function getTweenerForPaths(path0, path1, precision) {
	precision = precision || 4;

	var n0 = path0.getTotalLength(),
		n1 = path1.getTotalLength(); // Get the actual length of the path.

	// Uniform sampling of distance based on specified precision.
	var distances = [0], i = 0, dt = precision / Math.max(n0, n1); // Add points along the path.
	while ((i += dt) < 1) distances.push(i);
	distances.push(1);

	// Compute point-interpolators at each distance.
	var points = distances.map(function(t) {
		var p0 = path0.getPointAtLength(t * n0), // t * n0 is like saying .5 * 400px  = get point at spot 200.
			p1 = path1.getPointAtLength(t * n1);
		return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]); // For each point, create an interpolater function.
	});

	return function(t) {
		//if(path0 == path1) { return path0.getAttribute('d'); }
		return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : path1.getAttribute('d');
	};
}


 function pathTween(d1, precision) {
	precision = precision || 4;
	return function() {
		var path0 = this,
				path1 = path0.cloneNode(),
				n0 = path0.getTotalLength(),
				n1 = (path1.setAttribute("d", d1), path1).getTotalLength();

		// Uniform sampling of distance based on specified precision.
		var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
		while ((i += dt) < 1) distances.push(i);
		distances.push(1);

		// Compute point-interpolators at each distance.
		var points = distances.map(function(t) {
			var p0 = path0.getPointAtLength(t * n0),
				p1 = path1.getPointAtLength(t * n1);
			return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
		});

		return function(t) {
			//if(path0.getAttribute('d') == path1.getAttribute('d')) return d1;
			return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : d1;
		};
	};
}