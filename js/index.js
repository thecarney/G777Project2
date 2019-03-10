/* ATTRIBUTIONS */

// call initialize function after page ready
$(document).ready(initialize);

// starting point for script
function initialize() {
    // initialize all tooltips
    $(function () {
        $('[data-toggle="tooltip"]').tooltip({trigger: "hover"})
    });

    // resize function wraps the main function to allow responsive sizing of panel with map
    resize(map());
}

// Main
function map() {

/*/==================================================================================================================
----------------------------------------------------------------------------------------------------------- MAP SETUP
===================================================================================================================== /*/

    // token
    L.mapbox.accessToken = 'pk.eyJ1IjoiamhjYXJuZXkiLCJhIjoiY2pmbHE2ZTVlMDJnbTJybzdxNTNjaWsyMiJ9.hoiyrXTX3pOuEExAnhUtIQ';

    // makebasemaps
    let baseStreets = L.mapbox.styleLayer('mapbox://styles/jhcarney/cjk1yuwd6b9mv2sqvu8452gfu',{
        maxZoom: 22,
        maxNativeZoom: 21
    });
    let baseAerial = L.mapbox.styleLayer('mapbox://styles/jhcarney/cjk1ywa89015v2sqks2r6ivwj',{
        maxZoom: 22,
        maxNativeZoom: 20
    });

    // make map
    var map = L.mapbox.map('map')
        .setView([37.6903, -121.72615], 17);

    // controls
    // geolocate user control
    L.control.locate({
        icon: 'fas fa-crosshairs ',
        iconElementTag: 'span',
        keepCurrentZoomLevel: true,
        locateOptions: {
            enableHighAccuracy: true
        }
    }).addTo(map);

    // scale
    L.control.scale({metric: false}).addTo(map);

/*/==================================================================================================================
-------------------------------------------------------------------------------------------------- MAKE LAYER CONTROL
===================================================================================================================== /*/
    // load empty layer groups to Control first, to specify order in legend

    // tree canopy placeholder
    let lyrTrees = L.mapbox.featureLayer();
    lyrTrees.on('add', function () {
        lyrTrees.eachLayer(function(layer){
            layer.bringToFront();
        });
    });

    // group layer for tables and benches
    let lyrSeating = L.mapbox.featureLayer();

    // group layer for playground equipment
    let lyrEquipment = L.mapbox.featureLayer(null, {
        pointToLayer: function(feature, latlng){
            if (feature.properties.f1 == 2 || feature.properties.f1 == 3) {
                let iconSwingSet = L.divIcon({
                    className: 'fa-icon-swingset',
                    html: '<div class="fa-2x">\n' +
                        '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                        '    <i class="far fa-circle" data-fa-transform="grow-1" style="color:#fdfbfe"></i>\n' +
                        '    <i class="fas fa-circle" style="color:#207375"></i>\n' +
                        '    <i class="fa-inverse fas fa-rocket" data-fa-transform="shrink-6"></i>\n' +
                        '  </span></div>',
                    iconSize: [15, 15],
                    popupAnchor: [5,-3]
                });

                return L.marker(latlng, {
                    icon: iconSwingSet,
                    opacity: 1
                });
            } else {
                let iconPlayStructure = L.divIcon({
                    className: 'fa-icon-playstructure',
                    html: '<div class="fa-2x">\n' +
                        '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                        '    <i class="far fa-circle" data-fa-transform="grow-1" style="color:#fdfbfe"></i>\n' +
                        '    <i class="fas fa-circle" style="color:#1c2e75"></i>\n' +
                        '    <i class="fa-inverse fas fa-shapes" data-fa-transform="shrink-6"></i>\n' +
                        '  </span></div>',
                    iconSize: [15, 15],
                    popupAnchor: [5,-3]
                });

                return L.marker(latlng, {
                    icon: iconPlayStructure,
                    opacity: 1
                });
            }
        }
    });

    // group layer for basemap/groundcover features; listener to push to back on add
    let lyrGroundCover = L.mapbox.featureLayer();
    lyrGroundCover.on('add', function () {
        lyrGroundCover.eachLayer(function(layer){
            layer.bringToBack();
        });
    });

    // group layer for loop path
    let lyrPath = L.mapbox.featureLayer();

    // populate control and add groups in order
    let layerControl = L.control.layers({
        'Streets': baseStreets.addTo(map),
        'Satellite': baseAerial
    }, {
        'Tree Canopy': lyrTrees.addTo(map),
        'Playground Equip.': lyrEquipment.addTo(map),
        'Tables & Benches': lyrSeating.addTo(map),
        'Loop Path': lyrPath.addTo(map),
        'Park Grounds': lyrGroundCover.addTo(map)
    },{
        position: 'topleft'
    }).addTo(map);

    // keep overlays in correct z order
    map.on('overlayadd', function (event) {
        lyrGroundCover.bringToFront();
        lyrCourt.bringToFront();
        lyrPath.bringToFront();
        lyrTrees.bringToFront();
    });

    // keep overlays in correct z order
    map.on('overlayremove', function (event) {
        lyrGroundCover.bringToFront();
        lyrCourt.bringToFront();
        lyrPath.bringToFront();
        lyrTrees.bringToFront();
    });



/*/==================================================================================================================
--------------------------------------------------------------------------------------------- LOAD LAYERS FROM SERVER
===================================================================================================================== /*/



    // async calls to server and style results
    lyrTrees
        .loadURL('https://thecarney2.ngrok.io/p2/trees')
        .on('ready', function() {
            lyrTrees.setStyle({
                clickable: false,
                fill: true,
                fillColor: '#398033',
                fillOpacity: 0.5,
                stroke: true,
                color: '#005e1d',
                weight: 1,
                opacity: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
            });
            lyrTrees.eachLayer(function(layer){
                layer.bringToFront();
            });
        });

    let lyrLawn = L.mapbox.featureLayer()
        .loadURL('https://thecarney2.ngrok.io/p2/lawn')
        .on('ready', function() {
            lyrLawn.eachLayer(function(layer) {
                let popup = L.popup({closeButton: true})
                    .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                layer.bindPopup(popup);
            });
            lyrLawn.setStyle({
                //clickable: false,
                fill: true,
                fillColor: '#d5f46b',
                fillOpacity: 0.5,
                stroke: true,
                color: '#688342',
                weight: 1,
                opacity: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
            });
            lyrLawn.eachLayer(function(layer){
                layer.bringToBack();
            });
        })
        .addTo(lyrGroundCover);

    let lyrMulch = L.mapbox.featureLayer()
        .loadURL('https://thecarney2.ngrok.io/p2/mulch')
        .on('ready', function() {
            lyrMulch.eachLayer(function(layer) {
                let popup = L.popup({closeButton: true})
                    .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                layer.bindPopup(popup);
            });
            lyrMulch.setStyle({
                //clickable: false,
                fill: true,
                fillColor: '#cb9e49',
                fillOpacity: 0.5,
                stroke: true,
                color: '#bb8e4a',
                weight: 1,
                opacity: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
            });
            lyrMulch.eachLayer(function(layer){
                layer.bringToBack();
            });
        })
        .addTo(lyrGroundCover);

    let lyrPavement = L.mapbox.featureLayer()
        .loadURL('https://thecarney2.ngrok.io/p2/pavement')
        .on('ready', function() {
            lyrPavement.eachLayer(function(layer) {
                let popup = L.popup({closeButton: true})
                    .setContent('<strong>'+layer.feature.properties.f2+'</strong>');
                layer.bindPopup(popup);
            });
            lyrPavement.setStyle({
                clickable: false,
                fill: true,
                fillColor: '#d8d6d9',
                fillOpacity: 0.9,
                stroke: true,
                color: '#bcbabd',
                weight: 1,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
            });
            lyrPavement.eachLayer(function(layer){
                layer.bringToBack();
            });
        })
        .addTo(lyrGroundCover);

    let lyrPlayground = L.mapbox.featureLayer()
        .loadURL('https://thecarney2.ngrok.io/p2/playground')
        .on('ready', function() {
            lyrPlayground.eachLayer(function(layer) {
                let popup = L.popup({closeButton: true})
                    .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                layer.bindPopup(popup);
            });
            lyrPlayground.setStyle({
                //clickable: false,
                fill: true,
                fillColor: '#f0c930',
                fillOpacity: 0.5,
                stroke: true,
                color: '#d4af2e',
                weight: 1,
                opacity: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
            });
            lyrPlayground.eachLayer(function(layer){
                layer.bringToBack();
            });
        })
        .addTo(lyrGroundCover);

    let lyrSandbox = L.mapbox.featureLayer()
        .loadURL('https://thecarney2.ngrok.io/p2/sandbox')
        .on('ready', function() {
            lyrSandbox.eachLayer(function(layer) {
                let popup = L.popup({closeButton: true})
                    .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                layer.bindPopup(popup);
            });
            lyrSandbox.setStyle({
                //clickable: false,
                fill: true,
                fillColor: '#ae9959',
                fillOpacity: 0.5,
                stroke: true,
                color: '#a37752',
                weight: 1,
                opacity: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
            });
        })
        .addTo(lyrGroundCover);

    let lyrCourt = L.mapbox.featureLayer()
        .loadURL('https://thecarney2.ngrok.io/p2/bbcourt')
        .on('ready', function() {
            lyrCourt.eachLayer(function(layer) {
                let popup = L.popup({closeButton: true})
                    .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                layer.bindPopup(popup);
            });
            lyrCourt.setStyle({
                //clickable: false,
                fill: true,
                fillColor: '#bcbabd',
                fillOpacity: 0.8,
                stroke: true,
                color: '#fdfbfe',
                weight: 2,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round',
            });
        })
        .addTo(lyrGroundCover);

    let iconBench = L.divIcon({
        className: 'fa-icon-bench',
        html: '<div class="fa-2x">\n' +
            '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
            '    <i class="far fa-circle" data-fa-transform="grow-1" style="color:#fdfbfe"></i>\n' +
            '    <i class="fas fa-circle" style="color:#75543a"></i>\n' +
            '    <i class="fa-inverse fas fa-chair" data-fa-transform="shrink-6"></i>\n' +
            '  </span></div>',
        iconSize: [15, 15],
        popupAnchor: [5,-3]
    });
    let lyrBench = L.mapbox.featureLayer(null,{
        pointToLayer: function(feature, latlng){
            return L.marker(latlng, {
                icon: iconBench,
                opacity: 1
            });
        }
    })
        .loadURL('https://thecarney2.ngrok.io/p2/benches')
        .on('ready', function() {
            lyrBench.eachLayer(function(layer) {
                let popup = L.popup({closeButton: false})
                    .setContent('<i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                layer.bindPopup(popup);
            });
        })
        .addTo(lyrSeating);

    let iconTable = L.divIcon({
        className: 'fa-icon-table',
        html: '<div class="fa-2x">\n' +
            '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
            '    <i class="far fa-circle" data-fa-transform="grow-1" style="color:#fdfbfe"></i>\n' +
            '    <i class="fas fa-circle" style="color:#dc7f2f"></i>\n' +
            '    <i class="fa-inverse fas fa-glass-whiskey fa-rotate-180" data-fa-transform="shrink-6"></i>\n' +
            '  </span></div>',
        iconSize: [15, 15],
        popupAnchor: [5,-3]
    });
    let lyrTables = L.mapbox.featureLayer(null, {
        pointToLayer: function(feature, latlng){
            return L.marker(latlng, {
                icon: iconTable,
                opacity: 1
            });
        }
    })
        .loadURL('https://thecarney2.ngrok.io/p2/picnic')
        .on('ready', function() {
            lyrTables.eachLayer(function(layer) {
                let popup = L.popup({closeButton: false})
                    .setContent('<i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                layer.bindPopup(popup);
            });
        })
        .addTo(lyrSeating);

    lyrEquipment
        .loadURL('https://thecarney2.ngrok.io/p2/equipment')
        .on('ready', function() {
            lyrEquipment.eachLayer(function(layer) {
                let popup = L.popup({closeButton: false})
                    .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                layer.bindPopup(popup);
            });
        });

    lyrPath
        .loadURL('https://thecarney2.ngrok.io/p2/parkloop')
        .on('ready', function() {
            lyrPath.eachLayer(function(layer) {
                let popup = L.popup({closeButton: false})
                    .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                layer.bindPopup(popup);
            });
            lyrPath.setStyle({
                //clickable: false,
                fill: false,
                //fillColor: '#bcbabd',
                //fillOpacity: 0.5,
                stroke: true,
                color: '#9f0011',
                weight: 3,
                opacity: 0.3,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: '4 4'
            });
        });












    //  ================================================================================================================================ reference
    //
    //         // make listener for button to reset map extent
    //         $("#HomeButton").click(function () {
    //             map.centerAndZoom([-89.9926, 44.7318], 7);
    //         });
    //
    //         // switch basemaps within a popover
    //         $("#basemapToggle").popover({
    //             html: true,
    //             // set the correct button to "active" when popover opens
    //             content: function () {
    //                 if (map.getBasemap() == "gray") {
    //                     $("#bm1").addClass("active").siblings().removeClass("active");
    //                 } else if (map.getBasemap() == "hybrid") {
    //                     $("#bm2").addClass("active").siblings().removeClass("active");
    //                 } else if (map.getBasemap() == "streets") {
    //                     $("#bm3").addClass("active").siblings().removeClass("active");
    //                 } else {
    //                     $("#bm4").addClass("active").siblings().removeClass("active");
    //                 }
    //                 var content = $(this).attr("data-popover-content");
    //                 return $(content).children(".popover-body").html();
    //             },
    //             title: function () {
    //                 var title = $(this).attr("data-popover-content");
    //                 return $(title).children(".popover-heading").html();
    //             }
    //         });
    //         // set listeners to change basemap on button click
    //         $(document).on("click", "#basemapSelectorButtons button", function () {
    //             if (this.id == "bm1") {
    //                 map.setBasemap("gray");
    //                 $(this).addClass("active").siblings().removeClass("active");
    //             } else if (this.id == "bm2") {
    //                 map.setBasemap("hybrid");
    //                 $(this).addClass("active").siblings().removeClass("active");
    //             } else if (this.id == "bm3") {
    //                 map.setBasemap("streets");
    //                 $(this).addClass("active").siblings().removeClass("active");
    //             } else {
    //                 map.setBasemap("topo");
    //                 $(this).addClass("active").siblings().removeClass("active");
    //             }
    //         });
    //
    //         // setup printer (html2canvas)
    //         $("#printScreenButton").click(function() {
    //             html2canvas(document.querySelector("#mainContainer")).then(canvas => {
    //                 let url = canvas.toDataURL();
    //                 let triggerDownload = $("<a>").attr("href", url).attr("download",name+".png").appendTo("body");
    //                 triggerDownload[0].click();
    //                 triggerDownload.remove();
    //                 $("#modalPrintScreen").modal("hide");
    //                 console.log("print screen attempt");
    //                 //document.body.appendChild(canvas)
    //             });
    //         });
    //
    //         // promise chain for loading default data
    //         map.on("load", function () {
    //             getDataCancer()  // site resource
    //                 .then(createGraphicsCancer)  // graphics array
    //                 .then(createLayerCancer)  // feature layer
    //                 .then(getDataWellPoints)  // site resource
    //                 .then(createGraphicsWellPoints)  // graphics array
    //                 .then(createLayerWellPoints)  // feature layer
    //                 .then(createLayerWidget)  // legend/opacity/layertoggle
    //                 .then(runUserAnalysis)  // setup custom analysis
    //                 .otherwise(errback);  // catch
    //         });
    //
    //         // load well points json -- data is resource of the website
    //         function getDataWellPoints() {
    //             let request = esriRequest({
    //                 url: "data/wellNitrate_wm.geojson",
    //                 handleAs: "json"
    //             });
    //             return request;
    //         }
    //
    //         //make graphics for well points
    //         function createGraphicsWellPoints(response) {
    //             // Create an array of Graphics from each GeoJSON feature
    //             let graphics = arrayUtils.map(response.features, function (feature, i) {
    //                 return new Graphic(
    //                     new Point({
    //                         x: feature.geometry.coordinates[0],
    //                         y: feature.geometry.coordinates[1]
    //                     }), null,
    //                     {
    //                         FID: i,
    //                         title: feature.properties.FID,
    //                         nitr_ran: feature.properties.nitr_ran
    //                     }
    //                 );
    //             });
    //             return graphics;
    //         }
    //
    //         // make layer for well points
    //         function createLayerWellPoints(graphics) {
    //             // make feature collection with graphics array
    //             let featureCollection = {
    //                 "layerDefinition": null,
    //                 "featureSet": {
    //                     "features": graphics,
    //                     "geometryType": "esriGeometryPoint"
    //                 }
    //             };
    //
    //             // layer definition required to make layer from feature collection
    //             featureCollection.layerDefinition = {
    //                 "geometryType": "esriGeometryPoint",
    //                 "objectIdField": "FID",
    //                 "drawingInfo": {
    //                     "renderer": {}
    //                 },
    //                 "fields": [{
    //                     name: "FID",
    //                     alias: "FID",
    //                     type: "oid"
    //                 }, {
    //                     name: "TARGET_FID",
    //                     alias: "TARGET_FID",
    //                     type: "double"
    //                 }, {
    //                     name: "nitr_ran",
    //                     alias: "nitr_ran",
    //                     type: "double"
    //                 }]
    //             };
    //
    //
    //             // popup specs
    //             let popupTemplate = new PopupTemplate({
    //                 title: "Well ID: {FID}",
    //                 fieldInfos: [
    //                     {fieldName: "nitr_ran", label: "Nitrate Measurement: ", visible: true, format: {places: 2}}
    //                 ]
    //             });
    //
    //             // make the layer
    //             let layerWells = new FeatureLayer(featureCollection, {
    //                 infoTemplate: popupTemplate,
    //                 id: "Inputs  |  Well Sample Data"
    //             });
    //
    //             // point feature renderer
    //             let thisRenderer = new SimpleRenderer(new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 7, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([200, 200, 200]), 0.5), new Color([80, 80, 80])));
    //             // apply renderer
    //             layerWells.setRenderer(thisRenderer);
    //
    //             // add to map
    //             map.addLayer(layerWells);
    //
    //             // store layer id
    //             layerIdList.push("Inputs  |  Well Sample Data");
    //
    //             // return
    //             return layerWells;
    //         }
    //
    //         // load cancer json -- data is static and so loaded as a resource of the website
    //         function getDataCancer() {
    //             let request = esriRequest({
    //                 //location of data
    //                 url: "data/resultsTemplate_simple.json",
    //                 handleAs: "json"
    //             });
    //             return request;
    //         }
    //
    //         // make graphics for cancer
    //         function createGraphicsCancer(response) {
    //             // Graphics array
    //             let graphics = arrayUtils.map(response.features, function (feature, i) {
    //                 return new Graphic(
    //                     new Polygon({
    //                         rings: feature.geometry.coordinates
    //                     }), null,
    //                     {
    //                         OBJECTID: i,
    //                         meanCancerRate: feature.properties.meanCancerRate
    //                     }
    //                 );
    //             });
    //             return graphics;
    //         }
    //
    //         // make layer for cancer
    //         function createLayerCancer(graphics) {
    //             // feature collection from graphics
    //             let featureCollection = {
    //                 "layerDefinition": null,
    //                 "featureSet": {
    //                     "features": graphics,
    //                     "geometryType": "esriGeometryPolygon"
    //                 }
    //             };
    //             // polygon renderer
    //             let rendererCancer = new SimpleRenderer(new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(0.25).setColor(new Color([128, 128, 128]))));
    //             rendererCancer.setColorInfo({
    //                 field: "meanCancerRate",
    //                 minDataValue: 0,
    //                 maxDataValue: 1,
    //                 colors: [  // orange color ramp
    //                     new Color([255, 247, 236]),
    //                     new Color([254, 232, 200]),
    //                     new Color([252, 212, 158]),
    //                     new Color([253, 187, 132]),
    //                     new Color([252, 141, 89]),
    //                     new Color([239, 101, 72]),
    //                     new Color([215, 48, 31]),
    //                     new Color([179, 0, 0]),
    //                     new Color([127, 0, 0]),
    //                 ]
    //             });
    //
    //             // set layer definition
    //             featureCollection.layerDefinition = {
    //                 "geometryType": "esriGeometryPolyon",
    //                 "objectIdField": "OBJECTID",
    //                 "drawingInfo": {
    //                     "renderer": {}
    //                 },
    //                 "fields": [{
    //                     name: "OBJECTID",
    //                     alias: "OBJECTID",
    //                     type: "oid"
    //                 }, {
    //                     name: "meanCancerRate",
    //                     alias: "Mean",
    //                     type: "double"
    //                 }]
    //             };
    //
    //             // popup info
    //             let popupTemplate = new PopupTemplate({
    //                 title: "Bin ID: {OBJECTID}",
    //                 fieldInfos: [
    //                     {fieldName: "meanCancerRate", label: "Mean Cancer Rate: ", visible: true, format: {places: 2}}
    //                 ]
    //             });
    //
    //             // make layer with popup
    //             let layerCancer = new FeatureLayer(featureCollection, {
    //                 infoTemplate: popupTemplate,
    //                 id: "Inputs  |  Mean Cancer Rate by Bin"
    //             });
    //
    //             // apply renderer and default opacity
    //             layerCancer.setRenderer(rendererCancer);
    //             layerCancer.setOpacity(.99);
    //
    //             // store layer id
    //             layerIdList.push("Inputs  |  Mean Cancer Rate by Bin");
    //
    //             // add to map
    //             map.addLayer(layerCancer);
    //
    //             // return
    //             return layerCancer;
    //         }
    //
    //         // make graphics for new user-defined layers
    //         function createGraphicsCustom([lyrType, response]) {
    //             // store min and max values for each field to be passed to renderer for color ramp scaling
    //             let meanCancerRateMIN = Infinity;
    //             let meanCancerRateMAX = -Infinity;
    //             let predictedMIN = Infinity;
    //             let predictedMAX = -Infinity;
    //             let residualMIN = Infinity;
    //             let residualMAX = -Infinity;
    //             let stdresidMIN = Infinity;
    //             let stdresidMAX = -Infinity;
    //
    //             // loop to set min/max
    //             let graphics = arrayUtils.map(response.features, function (feature, i) {
    //
    //                 if (feature.properties.meanCancerRate < meanCancerRateMIN) {
    //                     meanCancerRateMIN = feature.properties.meanCancerRate;
    //                 }
    //                 if (feature.properties.meanCancerRate > meanCancerRateMAX) {
    //                     meanCancerRateMAX = feature.properties.meanCancerRate;
    //                 }
    //
    //                 if (feature.properties.PREDICTED < predictedMIN) {
    //                     predictedMIN = feature.properties.PREDICTED;
    //                 }
    //                 if (feature.properties.PREDICTED > predictedMAX) {
    //                     predictedMAX = feature.properties.PREDICTED;
    //                 }
    //
    //                 if (feature.properties.RESIDUAL < residualMIN) {
    //                     residualMIN = feature.properties.RESIDUAL;
    //                 }
    //                 if (feature.properties.RESIDUAL > residualMAX) {
    //                     residualMAX = feature.properties.RESIDUAL;
    //                 }
    //
    //                 if (feature.properties.STDRESID < stdresidMIN) {
    //                     stdresidMIN = feature.properties.STDRESID;
    //                 }
    //                 if (feature.properties.STDRESID > stdresidMAX) {
    //                     stdresidMAX = feature.properties.STDRESID;
    //                 }
    //
    //                 // graphics array
    //                 return new Graphic(
    //                     new Polygon({
    //                         rings: feature.geometry.coordinates
    //                     }), null,
    //                     {
    //                         OBJECTID: i,
    //                         meanCancerRate: feature.properties.meanCancerRate,
    //                         meanNitrateCon: feature.properties.meanNitrateCon,
    //                         PREDICTED: feature.properties.PREDICTED,
    //                         RESIDUAL: feature.properties.RESIDUAL,
    //                         STDRESID: feature.properties.STDRESID
    //                     }
    //                 );
    //             });
    //
    //             // call layer create function and pass args
    //             createLayerCustom([lyrType, graphics, meanCancerRateMIN, meanCancerRateMAX, predictedMIN, predictedMAX, residualMIN, residualMAX, stdresidMIN, stdresidMAX]);
    //         }
    //
    //         // make layer for new user-defined layers
    //         function createLayerCustom([lyrType, graphics, min1, max1, min2, max2, min3, max3, min4, max4]) {
    //             // makes a Feature Collection based on array of graphic objects
    //             let featureCollection = {
    //                 "layerDefinition": null,
    //                 "featureSet": {
    //                     "features": graphics,
    //                     "geometryType": "esriGeometryPolygon"
    //                 }
    //             };
    //
    //             // defines a layer definition (necessary to make a Feature Layer from the Feature Collection)
    //             featureCollection.layerDefinition = {
    //                 "geometryType": "esriGeometryPolyon",
    //                 "objectIdField": "OBJECTID",
    //                 "drawingInfo": {
    //                     "renderer": {}
    //                 },
    //                 "fields": [{
    //                     name: "OBJECTID",
    //                     alias: "ID",
    //                     type: "oid"
    //                 }, {
    //                     name: "meanCancerRate",
    //                     alias: "Mean Cancer Rate",
    //                     type: "double"
    //                 }, {
    //                     name: "meanNitrateCon",
    //                     alias: "Mean Nitrate Concentration",
    //                     type: "double"
    //                 }, {
    //                     name: "PREDICTED",
    //                     alias: "Predicted Cancer Rate",
    //                     type: "double"
    //                 }, {
    //                     name: "RESIDUAL",
    //                     alias: "Residuals",
    //                     type: "double"
    //                 }, {
    //                     name: "STDRESID",
    //                     alias: "Standardized Residuals",
    //                     type: "double"
    //                 }]
    //             };
    //
    //             // defines popop on click for this layer
    //             let popupTemplate = new PopupTemplate({
    //                 title: "Bin ID: {OBJECTID}",
    //                 fieldInfos: [
    //                     {fieldName: "meanCancerRate", label: "Mean Cancer Rate", visible: true, format: {places: 2}},
    //                     {
    //                         fieldName: "meanNitrateCon",
    //                         label: "Mean Nitrate Concentration",
    //                         visible: true,
    //                         format: {places: 2}
    //                     },
    //                     {fieldName: "PREDICTED", label: "Predicted Cancer Rate", visible: true, format: {places: 2}},
    //                     {fieldName: "RESIDUAL", label: "Raw Residual", visible: false, format: {places: 2}},
    //                     {fieldName: "STDRESID", label: "Standardized Residual", visible: true, format: {places: 2}},
    //                 ]
    //             });
    //
    //             // name (id) for new layer in map
    //             let thisCustomLayerName = "Result  |  Power:" + lastRequestedPower + "  |  Layer:" + lyrType;
    //
    //             // make the Feature Layer
    //             let layerCustom = new FeatureLayer(featureCollection, {
    //                 infoTemplate: popupTemplate,
    //                 id: thisCustomLayerName
    //             });
    //
    //             // defines a renderer (symbology) for the layer
    //             let thisRenderer;
    //
    //             // color ramps maker
    //             if (new String(lyrType).valueOf() == new String("Predicted Cancer Rate").valueOf()) {
    //                 // PURPLE color ramp renderer for predicted cancer rates
    //                 thisRenderer = new SimpleRenderer(new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(0.25).setColor(new Color([128, 128, 128]))));
    //                 thisRenderer.setColorInfo({
    //                     field: "PREDICTED",
    //                     minDataValue: min2,
    //                     maxDataValue: max2,
    //                     colors: [
    //                         new Color([252, 251, 253]),
    //                         new Color([239, 237, 245]),
    //                         new Color([218, 218, 235]),
    //                         new Color([188, 189, 220]),
    //                         new Color([158, 154, 200]),
    //                         new Color([128, 125, 186]),
    //                         new Color([106, 81, 163]),
    //                         new Color([84, 39, 143]),
    //                         new Color([63, 0, 125]),
    //                     ]
    //                 });
    //             } else {
    //                 // RED-WHITE-BLUE class breaks renderer for standard residuals
    //                 let simpleSymbol = new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(0.25).setColor(new Color([128, 128, 128])));
    //                 //thisRenderer = new ClassBreaksRenderer(simpleSymbol);
    //                 thisRenderer = new ClassBreaksRenderer(simpleSymbol, "STDRESID");
    //                 thisRenderer.addBreak(-Infinity, -2.5, new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(0.25)).setColor(new Color([95, 135, 193])));
    //                 thisRenderer.addBreak(-2.5, -1.5, new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(0.25)).setColor(new Color([153, 173, 198])));
    //                 thisRenderer.addBreak(-1.5, -0.5, new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(0.25)).setColor(new Color([202, 213, 202])));
    //                 thisRenderer.addBreak(-0.5, 0.5, new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(0.25)).setColor(new Color([249, 254, 204])));
    //                 thisRenderer.addBreak(0.5, 1.5, new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(0.25)).setColor(new Color([249, 198, 151])));
    //                 thisRenderer.addBreak(1.5, 2.5, new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(0.25)).setColor(new Color([240, 138, 100])));
    //                 thisRenderer.addBreak(2.5, Infinity, new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(0.25)).setColor(new Color([224, 70, 53])));
    //             }
    //
    //             // set the layer's renderer (symbology)
    //             layerCustom.setRenderer(thisRenderer);
    //
    //             // set starting opacity
    //             layerCustom.setOpacity(.99);
    //
    //             // add to map
    //             map.addLayer(layerCustom);
    //
    //             // store layer id
    //             layerIdList.push(thisCustomLayerName);
    //
    //             // make new legend
    //             createLayerWidget();
    //         }
    //
    //
    //         // create layer visibilty toggle widget
    //         function createLayerWidget() {
    //             if (legendCounter == 0) { // first run
    //                 // make widget
    //                 let newLayersForLegend = arrayUtils.map(layerIdList, function (layer) {
    //                     return {
    //                         layer: map.getLayer(layer),
    //                         showLegend: true,
    //                         showOpacitySlider: true,
    //                         visibility: true
    //                     };
    //                 });
    //
    //                 // make Layer List Widget
    //                 let layerList = new LayerList({
    //                     map: map,
    //                     layers: newLayersForLegend,
    //                     showLegend: true,
    //                     showSubLayers: false,
    //                     removeUnderscores: true,
    //                     showOpacitySlider: true,
    //                 }, "layerList" + legendCounter);
    //
    //                 // start widget
    //                 layerList.startup();
    //
    //                 // store widget reference
    //                 layerLegendWidget = layerList;
    //
    //                 // change var to show first run complete
    //                 legendCounter += 1;
    //                 console.log('legend first run attempt');
    //             } else {                 // subsequent calls
    //                 // push new layer list to widget
    //                 let newLayersForLegend = arrayUtils.map(layerIdList, function (layer) {
    //                     return {
    //                         layer: map.getLayer(layer),
    //                         showLegend: true,
    //                         showOpacitySlider: true,
    //                         visibility: true
    //                     };
    //                 });
    //
    //                 // push new layers and refresh
    //                 layerLegendWidget.layers = newLayersForLegend;
    //                 layerLegendWidget.refresh();
    //             }
    //         }
    //
    //         // process user request for new analysis
    //         function runUserAnalysis() {
    //             // based on ngrok url
    //             let baseURL = "https://thecarney.ngrok.io/idw/";  // MUST MATCH NGROK SUBDOMAIN
    //
    //             // get user param
    //             $("#runButton").click(function () {
    //                 let specifiedPower = $("#userEnteredPower").val();
    //                 let urlWithPower = baseURL + specifiedPower;
    //                 let requestSend = 0;
    //
    //                 if (new String(specifiedPower).valueOf() == "0") {  // need val 1 or greater
    //                     requestSend = 0;
    //                     alert("Please enter an interger greater than or equal to 1")
    //
    //                 } else { // do request
    //                     requestSend = 1;
    //                     let dummyResource = urlWithPower + ".txt";
    //                     lastRequestedPower = specifiedPower;
    //                     let modalTracker = 1;
    //
    //                     // open simple loading modal
    //                     $("#modalLoadingData").modal("show");
    //
    //                     //  request and await response
    //                     fetch(dummyResource).then(function (response) {
    //                         if (response.ok) {
    //                             return response.json();
    //                         }
    //                         throw new Error("Network response was not ok.");
    //                     }).then(function (newJSON) {
    //                         // use result
    //                         let newLayerJSON = newJSON;
    //                         // call layer builders
    //                         createGraphicsCustom(["Predicted Cancer Rate", newLayerJSON]);
    //                         createGraphicsCustom(["Standardized Residuals", newLayerJSON]);
    //                         // close loader modal
    //                         $("#modalLoadingData").modal("hide");
    //                         $("#seeInterpretationbtn").removeClass('d-none');
    //                     }).catch(function (error) {
    //                         // timeout to improve user feedback experience
    //                         setTimeout(function () {
    //                             $("#modalLoadingData").modal("toggle");
    //                             $("#modalServerError").modal("show");
    //                         }, 1000);
    //                         console.log("There was a problem with the fetch operation.", error.message);
    //                     });
    //                 }
    //             });
    //         }
    //
    //         // Catch erros on initial layer load
    //         function errback(error) {
    //             console.error("Something went wrong loading the default layers:  ", error);
    //         }
    //
    //     });  // end main function




    // return map object
    return map;
}

function resize(map) {
    // window resize listener
    $(window).on("resize", function () {
        console.log(map.getZoom());

        console.log("resize called");
        // make map height responsive to available space
        let navbarHeight = $("#header1").outerHeight();
        console.log("header: ",navbarHeight);
        let footerHeight = $("#footer1").outerHeight();
        console.log("footer: ",footerHeight);
        let windowHeight = $(window).outerHeight();
        console.log("window: ",windowHeight);

        // set new map height and right panel height
        let newMapHeight = windowHeight - navbarHeight - footerHeight;
        console.log("new map height: ",newMapHeight);
        $("#map").css({"height": newMapHeight});
        $("#map").css({"margin-top": navbarHeight});

    }).trigger("resize");
}