function SnackViz(){
	this.init = function(mets, foods){


		this.foods = foods;
		this.mets = mets;

		



		this.selectedFood = this.foods[0];

		this.refresh();
		
	};


	this.set = function(prop, val){

		if(prop == 'selectedFood' && _.isString(val)){
			val = _.find(this.foods, {label:val});
			if(this[prop] === val){
				return; //If the value is already selected, nothing needs to be done.
			}
		}

		this[prop] = val;
		this.refresh();
	}

	this.refresh = function(){
		if(!this.selectedFood) return;
		this.weight = _.get(window, 'calculator.weight', 130);

		var weightInKg = this.weight / 2.2046226218;

		var self = this;

		$('#snack-list').html(templates.mainSnackList({foods:self.foods}));
		$('#main-snack').html(templates.mainSnackTemplate(this.selectedFood));

		var domainMax = getTime(_.last(this.foods).calories, this.mets[0]);

		var scale = d3.scale.linear().domain([0,domainMax]).range([0,550]);


		var parent = d3.select('#activities');

		var bar = parent.selectAll(".met-item")
			.data(this.mets, function(d, i){ return d.label; });


		function tweenText( newValue ) {
			return function(d) {
				//debugger;
				// get current value as starting point for tween animation
				var currentValue = (this.textContent+'').replace(' min', '') || '0 min';

				currentValue = currentValue.replace(' min', '');
				// create interpolator and do not show nasty floating numbers
				var i = d3.interpolateRound( +currentValue, +newValue(d).replace(' min', '') );

				return function(t) {
					this.textContent = i(t) + ' min';
				};
			}
		}


		function getTime(calories, d) {
			return Math.round(calories / (d.mets * weightInKg) * 60)
		}

		// Enter
		bar.enter().append("div")
			.attr("class", 'met-item')
			.html(templates.metTemplate)
			.append("div")
			.attr('class', 'bar')
			.style('width', 0)
			.append("div")
			.attr('class', 'bar-label')
		
		//Update	
		bar
			.transition()
			.duration(800)
			//.text(function(d){ debugger; return (self.selectedFood.calories / (d.met * weightInKg) * 60) + 'minutes'  })
			
			.selectAll(".bar")
			//.text(function(d){ debugger; return (self.selectedFood.calories / (d.met * weightInKg) * 60) + 'minutes'  })
			.style("width", function(d){ d.time = getTime(self.selectedFood.calories, d); return (scale(d.time) + 8) + 'px'})
			.selectAll(".bar-label")
			.tween("text", tweenText(function(d){ return d.time + ' min'  }));

			
	}
}

var snackViz = new SnackViz();


queue()
  .defer(d3.json, "data/processed_data/calories-burned.json")
  .defer(d3.csv, "data/processed_data/food-calories.csv")
  .await(function(error, mets, foods){
  		
			_.each(foods, function(o,i){
				o.key = i+'';
				o.calories = +o.calories;
				o.img = _.kebabCase(o.label.replace("'",'')) + '.jpg';
			}).sort(function(a,b){return a.calories - b.calories;});;

			mets = _.filter(mets, function(o){
				return _.includes([
					'Sitting',
					'Walking 2.5 mph',
					'Cycling, 12-13.9 mph, moderate',
					'Weight lifting, body building, vigorous',
					'Rowing machine, moderate',
					'Running, 9 mph (6.5 min mile)',
					'Jumping rope, moderate',
					'Swimming laps, freestyle, slow',
					'Jumping rope, moderate',
					'Stair machine',
					'Running, 6 mph (10 min mile)',
				], o.label);
			}).sort(function(a,b){return a.mets - b.mets;});

			_.each(mets, function(o){
				o.img = o.label.split(' ')[0].replace(',', '').toLowerCase() + '.png';
			})




  		snackViz.init(mets, foods);
  })

