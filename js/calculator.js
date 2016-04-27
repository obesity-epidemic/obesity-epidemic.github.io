//Add the line chart
//Add the plant
//Finish the report section
//Update the body shapes



// change the scale to be an svg.


//Percentiles by age
//http://www.cdc.gov/growthcharts/clinical_charts.htm



// Always have same x values for bmi so they are animated.
// have a bar charts showing the calorie intake of the different obesity levels.


//https://www.researchgate.net/publication/6138361_BMI-based_body_size_guides_for_women_and_men_Development_and_validation_of_a_novel_pictorial_method_to_assess_weight-related_concepts_International_Journal_of_Obesity_London_322_336-342


//OVerweight Raised Risk of
////http://www.bbc.co.uk/health/tools/bmi_calculator/bmi.shtml
/*
Heart disease
High blood pressure
Diabetes
Arthritis
Infertility
Asthma
Cancer

Obese
Heart disease
Diabetes
Arthritis
Infertility

Asthma

Cancer
*/










function init(){

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
var tweeners = [
	getTweenerForPaths(body0, body0),
	getTweenerForPaths(body0, body1), 
	getTweenerForPaths(body1, body2), 
	getTweenerForPaths(body2, body3), 
	getTweenerForPaths(body3, body4), 
	getTweenerForPaths(body4, body5), 
];

var mtweeners = [
	getTweenerForPaths(mbody0, mbody0),
	getTweenerForPaths(mbody0, mbody1), 
	getTweenerForPaths(mbody1, mbody2), 
	getTweenerForPaths(mbody2, mbody3), 
	getTweenerForPaths(mbody3, mbody4), 
	getTweenerForPaths(mbody4, mbody5), 
];


var maxWeight = 400;

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

	var start = _.get(weightClasses, '['+(i-1)+'].mid', 0);

	var scale = d3.scale.linear()
		.domain([start, o.mid])
		.range([0, 1])
		.clamp(true);

	pathObjects.push({
		startBMI:start,
		endBMI: o.mid,
		getPathForBmi: function(bmi){
			return calculator.gender ==1 ? mtweeners[i](scale(bmi)) : tweeners[i](scale(bmi));
		}
	})
});

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

var normalWeightObj = weightClasses[1];

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
		.attr("transform", function(d) { return "translate(" + x(getWeightFromBmi(d.start)) + ",0)"; })
		.selectAll(".bar")
		.attr('opacity', 1)
		.attr("width", function(d){ var end = d.maxWeight || getWeightFromBmi(d.end); return x(end) - x(getWeightFromBmi(d.start))})
		
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



function convertToFeetAndInches(inches){
	var values = [Math.floor(inches / 12), Math.floor(inches % 12)];
	return values[0] + "' " + values[1] + '"';
}

function getBMI(weight, height){
	return (weight / (height * height)) * 703;
}

function getWeightFromBmiAndHeight(bmi, height){
	return (bmi * (height*height)) / 703;
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
//
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
		if(bmi < level.endBMI){
			selected = level;
			return false;
		}
	});

	selected = selected || _.last(pathObjects);

	return selected.getPathForBmi(bmi);
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

	//console.log(bmr);

	return Math.round(bmr * activityLevel.multiplier);
}

//https://en.wikipedia.org/wiki/Harris%E2%80%93Benedict_equation

//https://en.wikipedia.org/wiki/Waist-to-height_ratio

// How many calories to reduce by.
//http://www.bmi-calculator.net/bmr-calculator/harris-benedict-equation/calorie-intake-to-lose-weight.php

//http://www.freedieting.com/calorie_needs.html  (This explains how much to lose.)


function Calculator(){
	var self = this;
	this.weight = 150;
	this.height = 70;
	this.gender = 0; // 1 = male
	this.age = 34;
	this.bmi = null;
	this.bodyfat = null;
	this.activityLevel = activityLevels[1];
	this.waist = 32;

	this.init = function(){
		this.bodyPath = d3.select(".bmi-body path");
		updateWeightSlider({selector:'#weightSlider'});
		updateHeightSlider({selector:'#heightSlider'});
		updateBmiBody({selector:'#bmiBody'});
		this.weightOpts.updateBrush(160);
		this.heightOpts.updateBrush(70);

		



		var dataSourceSelect = utils.setupSelect({
			el: '#genderSelect',
			onChange: function(o){ self.set('gender', +o); },
			options: [
				{value: '0', label:'Female'},
				{value: '1', label:'Male'},
			],
			defaultValue: self.gender
		});

		var dataSourceSelect = utils.setupSelect({
			el: '#ageSelect',
			onChange: function(o){ self.set('age', +o); },
			options:_.map(_.range(1, 99), function(i){
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




	};

	this.set = function(prop, val){
		this[prop] = val;
		this.refresh();

		if(prop === 'weight' && snackViz){
			snackViz.refresh();
		}
	}

	this.refresh = function(){
		var bmi = getBMI(this.weight, this.height);
		this.rawBmi = bmi;
		this.bmi = Math.round(bmi);

		var weightClass = getWeightClass(this.rawBmi);
		this.weightClass = weightClass;

		this.bodyfat = getBodyFatPercentage(this.bmi, this.age, this.gender);

		var desiredWeightChange = 0;
		var direction = 'stay';

		var healthyDailyCalories;

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
	};
};



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



var calculator = new Calculator();
calculator.init();

window.calculator = calculator;


};

_.delay(init, 1000);
//init();

/*
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
  			{percentile:5,  bmi: row['5th'] },
  			{percentile:10, bmi: row['10th'] },
  			{percentile:15, bmi: row['15th'] },
  			{percentile:25, bmi: row['25th'] },
  			{percentile:50, bmi: row['50th'] },
  			{percentile:75, bmi: row['75th'] },
  			{percentile:85, bmi: row['85th'] },
  			{percentile:90, bmi: row['90th'] },
  			{percentile:95, bmi: row['95th'] }
  		];
  	});


  	var opts = utils.setupSVG({
		selector: "#bmi-by-age",
		width: 400,
		height: 200,
		marginTop: 40,
		marginRight: 40,
		marginBottom: 40,
		marginLeft: 40,
		duration: 800
	});


  	var data = data[25].data;

  	// Create the scales.
	var xScale = utils.setupScale({type: 'linear', axis:'x', data:data, prop:'percentile', opts:opts,  min:0, max: 100 });
	var yScale = utils.setupScale({type: 'linear', axis:'y', data:data, prop:'bmi', opts:opts,  min:0, max: 45});

	// Add the stacked area.
	var paths = utils.addLine({parent: opts.svg, opts:opts, data:data,  x: xScale.getValue, y: yScale.getValue, y0:yScale.getValue});
	var paths = utils.addScatter({parent: opts.svg, opts:opts, data:data,  x: xScale.getValue, y: yScale.getValue, z:5, y0:yScale.getValue});
	//paths.style("fill", function(d){  return colorScale(d[0].source);})

return;
	// Create and add the x axis.
	var xAxis = d3.svg.axis()
		.scale(xScale)
		.orient("bottom")
		.ticks(d3.time.years, 1)
		.tickFormat(d3.time.format('%Y'))
		.tickSize(5);

	var xAxisGroup = utils.addXAxis({parent: opts.svg, opts:opts, axis:xAxis});

	// Create and add the y axis.
	var yAxis = d3.svg.axis()
		.scale(yScale)
		.orient("left")
		.ticks(7)
		.tickFormat(function(d){ return d3.format("$.2s")(d).replace('G', 'B') });

	utils.addYAxis({parent: opts.svg, opts:opts, axis:yAxis});
	utils.addChartTitle({parent: opts.svg, label: "Funding for Malaria Control and Elimination", opts:opts });

	var timeFormatter = d3.time.format('%Y')







  	debugger;

  });

*/





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

			calculator.weight = 200;
			calculator.height = 67;
			calculator.gender = 0; // 1 = male
			calculator.age = 34;
			calculator.waist = 32;
			calculator.weightOpts.updateBrush(calculator.weight);
			calculator.heightOpts.updateBrush(calculator.height);
			calculator.refresh();

			_.delay(function(){
				calculator.weight = 190;
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
