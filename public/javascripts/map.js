
OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {                
                defaultHandlerOptions: {
                    'single': true,
                    'double': false,
                    'pixelTolerance': 0,
                    'stopSingle': false,
                    'stopDouble': false
                },

                initialize: function(options) {
                    this.handlerOptions = OpenLayers.Util.extend(
                        {}, this.defaultHandlerOptions
                    );
                    OpenLayers.Control.prototype.initialize.apply(
                        this, arguments
                    ); 
                    this.handler = new OpenLayers.Handler.Click(
                        this, {
                            'click': this.trigger
                        }, this.handlerOptions
                    );
                }, 

                trigger: function(e) {

                    var lonlat = map.getLonLatFromViewPortPx(e.xy);
                    
                   $("#x_pos").val(lonlat.lon);
                   $("#y_pos").val(lonlat.lat);
                   
                }

            });

var map = new OpenLayers.Map({
	div: "mapDiv",
	layers: [
		new OpenLayers.Layer.Image(
			"Sixth Floor", 
			"ens_6.jpg",
			new OpenLayers.Bounds(-640, -898, 640, 898),
			new OpenLayers.Size(425, 318) //1279 1795
		),
		new OpenLayers.Layer.Image(
			"Second Floor", 
			"ens_2.jpg",
			new OpenLayers.Bounds(-640, -898, 640, 898),
			new OpenLayers.Size(425, 318) //1279 1795
		)

	],
	center: new OpenLayers.LonLat(6.5, 40.5),
	zoom: 1
});



OpenLayers.Marker.prototype.device_id = "no_device_id_set";
OpenLayers.Marker.prototype.timestamp = null;

map.addControl(new OpenLayers.Control.LayerSwitcher());

var markers = new OpenLayers.Layer.Markers( "Markers" );
map.addLayer(markers);


var click = new OpenLayers.Control.Click();
                map.addControl(click);
                click.activate();

setInterval("deleteOldMarkers(10)", 5000);
$(function(){

	var socket = io.connect('http://trillworks.com:3010');
	
	socket.on('coordinates', function (data) {
		//console.log("data returned: " + data);
		console.log("coordinates event: " + data.x + " " + data.y);
		
		//TODO: validate data fields
		
		//see if marker with device_id exists
		//this is an O(n) search that should be changed to an O(1) 
		//lookup to support large numbers of phones
		for(var i = 0; i < markers.markers.length; i++){
			if(markers.markers[i].device_id == data.device_id){
				//found marker for this phone. update location and timestamp.
				var marker = markers.markers[i];
				marker.timestamp = new Date();
				//console.log(marker);
				marker.moveTo( 
					map.getLayerPxFromViewPortPx(
					map.getPixelFromLonLat(
						new OpenLayers.LonLat(data.x, data.y)
						
						)
					)
				);

				return;

			}
		}

		//no marker with this id found. add a new one.
		//easy to abuse: sent requests to server with lots of fake ID's.
		console.log("adding marker for " + data.device_id + " at :  "+ data.x  );

		var marker = new OpenLayers.Marker(new OpenLayers.LonLat(data.x, data.y));
		marker.device_id = data.device_id;
		marker.timestamp = new Date();
		//console.log(marker);
		markers.addMarker(marker);
		marker.moveTo( 
			map.getLayerPxFromViewPortPx(
				map.getPixelFromLonLat(
					new OpenLayers.LonLat(data.x, data.y)
				)
			)
		);
		
	   
		
		
	});

	$("#move_marker").click(function(){
		//move test marker
		var x = $("#x_pos").val();
		var y = $("#y_pos").val();
		//check for existing test marker, move it if it exists
		for(var i = 0; i < markers.markers.length; i++){
	   //console.log(new Date().getTime() - markers.markers[i].timestamp.getTime());
	
			if(markers.markers[i].device_id == "test_marker"){
				
				markers.markers[i].moveTo( 
					map.getLayerPxFromViewPortPx(
						map.getPixelFromLonLat(
							new OpenLayers.LonLat(x, y)
						)
					)
				); 
				return;
			}
		}

		//didn't find test_marker. Make new one.
		var marker = new OpenLayers.Marker(new OpenLayers.LonLat(x, y));
		marker.device_id = "test_marker";
		marker.timestamp = new Date();
		markers.addMarker(marker);
		marker.moveTo( 
			map.getLayerPxFromViewPortPx(
				map.getPixelFromLonLat(
					new OpenLayers.LonLat(x, y)
				)
			)
		);
	});
});

//delete markers older than period seconds
function deleteOldMarkers(period){
	//console.log("checking for markers older than " + period + " seconds");
	for(var i = 0; i < markers.markers.length; i++){
	   //console.log(new Date().getTime() - markers.markers[i].timestamp.getTime());
	
		if(new Date().getTime() - markers.markers[i].timestamp.getTime() > period * 1000){
			console.log(markers.markers[i].device_id + 
				" has not been updated recently. Deleting.");
			 markers.markers[i].destroy();  
			 markers.removeMarker(markers.markers[i]); 
		}
	}
}
