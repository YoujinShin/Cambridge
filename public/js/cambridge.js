var total_population = new L.LayerGroup(); // population layer
var age_population = new L.LayerGroup();
var sewer = new L.LayerGroup();
var zoning = new L.LayerGroup();

// total populcation data
var rateById = d3.map();
var popAcrebyID = d3.map(); // population per acre
var housingAcrebyID = d3.map(); // housing units per acre

// age population data
var under_18 = d3.map();
var over_65 = d3.map();

var quantize = d3.scale.quantize()
	.domain([0, 9000])
	.range(d3.range(9).map(function(i) { return "q"+i+"-9"; }));

var quantize_age = d3.scale.quantize()
	.domain([0, 1400])
	.range(d3.range(9).map(function(i) { return "q"+i+"-9"; }));


queue() // upload data using queue 
	.defer(d3.json, "tracts_2010.geojson") // cambridge geo data
	.defer(d3.json, "infra_drainage.geojson")// cambridge drainage data
	.defer(d3.json, "CDD_ZoningDistricts.geojson")
	.defer(d3.csv, "camb_tract_pop_2010.csv", function(d) { 
		rateById.set(d.id, +d.population); // cambridge CDD data
		popAcrebyID.set(d.id, + d.population_per_acre);
		housingAcrebyID.set(d.id, + d.housing_units_per_acre);
	})
	.defer(d3.csv, "camb_tract_age_2010.csv", function(d) {
		under_18.set(d.id, +d.under_18);
		over_65.set(d.id, +d.over_65);
		// console.log(d.under_18);
	})
	.await(ready);
	

// tooltip !
var tooltip = d3.select("body")
	.append("div")
	.attr("id", "tooltip");


function onEachFeature(feature, layer) {
	layer.on({
		mouseover: highlightFeature,
		mouseout: resetHighlight
	})
}


// legend !
var legend = L.control({position: 'bottomright'});

legend.onAdd = function(map) {
	var div = L.DomUtil.create('div', 'info legend'),
		grades = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000],
		labels = [],
		from, to;

	labels.push("Total population (2010)");

	for(var i = 0; i < grades.length; i++) {
		from = grades[i];
		to = grades[i + 1];

		labels.push(
					'<i style="background:' + getColor("q"+i+"-9") + '"></i> ' +
					from + (to ? ' &ndash; ' + to : '+'));
	}

	div.innerHTML = labels.join('<br>');
	return div;
}


function highlightFeature(e) {
	var layer = e.target;

	// mouse position
	var tx = e.containerPoint.x;
	var ty = e.containerPoint.y;

	layer.setStyle({
		weight: 1.5,
		color: "rgba(0,0,0,1)",
		fillOpacity: 0.82
	});

	layer.bringToFront();

	var tract = layer.feature.properties.NAME10;
	var pop = rateById.get(tract);
	var pop_per_acre = popAcrebyID.get(tract);
	var housing_per_acre = housingAcrebyID.get(tract);

	tooltip.style("left", tx-70+"px");
	tooltip.style("top", ty+40+"px");

	tooltip.html(function(d) {
		return "<span style='font-weight:bold;font-size:14px'>Tract " 
				+ tract +"</span><br>"
			+ "<span style='font-style:italic; color:grey;'>" 
				+ "Total population "+ pop 
			+"</span><br>"
				+"Population per acre: " + pop_per_acre
				+"<br>Housing units per acre: " + housing_per_acre
			;
	});

	tooltip.style("visibility", "visible");

	// console.log( svg_left.selectAll(".bar").attr("height") ); //2

	svg_left.selectAll(".bar").each(function(d) {
		if(d.id ==  tract) {
			// console.log(tract+", "+d3.select(this).attr("height"));
			d3.select(this).attr("height", 8);
		}
	});

	svg_right.selectAll(".bar").each(function(d) {
		if(d.id ==  tract) {
			d3.select(this).attr("height", 8);
		}
	});
}


function resetHighlight(e) {
	var layer = e.target;
	var tract = layer.feature.properties.NAME10;
	var c = getColor( quantize(rateById.get(tract)) );

	layer.setStyle({
		weight: 1.3,
		color: c,
		fillOpacity: 0.86
	});

	layer.bringToBack();
	tooltip.style("visibility", "hidden");

	svg_left.selectAll(".bar").each(function(d) {
		if(d.id ==  tract) {
			d3.select(this).attr("height", 2);
		}
	});

	svg_right.selectAll(".bar").each(function(d) {
		if(d.id ==  tract) {
			d3.select(this).attr("height", 2);
		}
	});
}
 

function ready(error, tract, drainage, zone) {
	console.log("tract geographic data uploaded");

	//  total population
	L.geoJson(tract, {

		style: function(feature) {
			var tract = feature.properties.NAME10;
			var c = getColor( quantize( rateById.get(tract) ) );

			return {
				color: c,
				weight: 1.3,
				fillColor: c,
				fillOpacity: 0.86
			};
		},

		onEachFeature: onEachFeature
	}).addTo(total_population);


	// drainage 
	L.geoJson(drainage, {
		style: function(feature) {

			return {
				color: "rgba(255,20,20,1)",
				weight: 1,
				opacity: 1
			};
		}
	}).addTo(sewer);


	// zoning district
	L.geoJson(zone, {
		style: function(feature) {
			return {
				color: "blue",
				weight: 1,
				opacity: 1,
				fillColor: "white",
				fillOpacity: 0
			}
		}
	}).addTo(zoning);
}


//  maps
var mbUrl = 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png';

var grayscale   = L.tileLayer(mbUrl, {id: 'examples.map-20v6611k'}),
	streets  = L.tileLayer(mbUrl, {id: 'examples.map-i875mjb7'});

var map = L.map('map', {
	center: [42.3783903,-71.1129096 - 0.015],
	zoom: 13,
	layers: [grayscale, total_population]
});


// layers
var baseLayers = {
	"Grayscale": grayscale,
	"Streets": streets
};

var overlays = {
	"Sewage network": sewer,
	"Total population": total_population,
	"Zoning district": zoning
	// "Population by age": age_population
};

L.control.layers(baseLayers, overlays, {collapsed:false}).addTo(map);
legend.addTo(map);

// legend control depend on overlay selection
map.on('overlayadd', function (eventLayer) {
    if (eventLayer.name === 'Total population') {
    	// console.log(this);
        legend.addTo(this);
        $( "#viz_left" ).css( "visibility", "visible" );
        $( "#viz_right" ).css( "visibility", "visible" );
        $( "#des_age" ).css( "visibility" , "visible" );
    }
});

map.on('overlayremove', function (eventLayer) {
	if (eventLayer.name === 'Total population') {
		this.removeControl(legend);
		$( "#viz_left" ).css( "visibility", "hidden" );
		$( "#viz_right" ).css( "visibility", "hidden" );
		$( "#des_age" ).css( "visibility", "hidden" );
	}
});

////////
function getColor(d) {
	switch(d) {
		case 'q0-9': return "rgb(247,251,255)";
		case 'q1-9': return "rgb(222,235,247)";
		case 'q2-9': return "rgb(198,219,239)";
		case 'q3-9': return "rgb(158,202,225)";
		case 'q4-9': return "rgb(107,174,214)";
		case 'q5-9': return "rgb(66,146,198)";
		case 'q6-9': return "rgb(33,113,181)";
		case 'q7-9': return "rgb(8,81,156)";
		case 'q8-9': return "rgb(8,48,107)";
	}
}
