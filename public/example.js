var map = L.map('map').setView([39.74739, -105], 13);

L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
	maxZoom: 18,
	id: 'examples.map-20v6611k'
}).addTo(map);

var baseballIcon = L.icon({
	iconUrl: 'baseball-marker.png',
	iconSize: [32, 37],
	iconAnchor: [16, 37],
	popupAnchor: [0, -28]
});

function onEachFeature(feature, layer) {
	var popupContent = feature.geometry.type;
	if(feature.properties && feature.properties.popupContent) {
		popupContent += feature.properties.popupContent;
	}

	layer.bindPopup(popupContent);
}

L.geoJson([bicycleRental, campus], {
	style: function (feature) {
		return feature.properties && feature.properties.style;
	},

	onEachFeature: onEachFeature,

	pointToLayer: function(feature, latlng) {
		return L.circleMarker(latlng, {
			radius: 8,
			fillColor: "#ff7800",
			color: "#000",
			weight: 1,
			opacity: 1,
			fillOpacity: 0.8
		});
	}
}).addTo(map);


L.geoJson(freeBus, {
	filter: function (feature, layer) {
		if(feature.properties) {
			//If "underConstruction" exists and is true, return false (don't render features under construction)
			return feature.properties.underConstruction !== undefined ? !feature.properties.underConstruction : true;
		}
	}
}).addTo(map);

var coorsLayer = L.geoJson(coorsField, {
	pointToLayer: function (feature, latlng) {
		return L.marker(latlng, {icon: baseballIcon});
	},

	onEachFeature: onEachFeature
}).addTo(map);


