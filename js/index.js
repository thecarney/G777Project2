/* ATTRIBUTIONS */

// call map initialize functions after page ready
$(document).ready(initialize);

// starting point for script
function initialize() {
    // resize function wraps the main function to allow responsive sizing of panel with map
    let defaultMap = resize(map('default'));


}

// Main
function map(type) {
    // sub-functions employed mostly for code management and ordered to minimize passing of objects
    // map init
    let [map, baseStreets, baseAerial] = setupMap();
    let layerControl;

    // interface setup
    setupListeners();
    addScaleControl();
    addHomeButtonControl();
    addLocateUserControl();
    addPostPhotoControl();
    addFilterControl();
    addLayerControl();

    // to store server response data
    let jsonPhoto = [];
    let jsonTrees = [];
    let jsonEquipment = [];
    let jsonSeating = [];
    let jsonPath = [];
    let jsonGroundCover = [];
    let jsonCourt = [];

    // to hold the layer groups actually displayed on the map
    let mapPhoto = L.layerGroup();
    let mapTrees = L.layerGroup();
    let mapEquipment = L.layerGroup();
    let mapSeating = L.layerGroup();
    let mapPath = L.layerGroup();
    let mapGroundCover = L.layerGroup();
    let mapCourt = L.layerGroup();

    // to hold default layer groups
    let lyrPhoto = L.layerGroup();
    let lyrTrees = L.layerGroup();
    let lyrEquipment = L.layerGroup();
    let lyrSeating = L.layerGroup();
    let lyrPath = L.layerGroup();
    let lyrGroundCover = L.layerGroup();
    let lyrCourt = L.layerGroup();

    // to hold layer groups filtered to accessible features
    let lyrEquipmentfAccess = L.layerGroup();
    let lyrSeatingfAccess = L.layerGroup();
    let lyrPathfAccess = L.layerGroup();
    let lyrGroundCoverfAccess = L.layerGroup();
    let lyrCourtfAccess = L.layerGroup();

    // filter fn for accessible features
    let filterAccess = function (feature) { if (feature.properties.f4 === "Yes") { return true; } };

    // init async loading and layer creation
    loadEverything()
        .then((response) => {
            addDefaultLayers();
            addOnLoadPopup();
        })
        .then((response) => {
            // ?
        });

    async function loadEverything () {

        let a = (async() => {
            try {
                let response = await fetch("https://thecarney2.ngrok.io/p2/photos");
                let data = await response.json();
                jsonPhoto.push(data);
                lyrPhoto = await makeLayerPhoto(jsonPhoto);
                mapPhoto = await lyrPhoto;
            } catch (e) {
                console.log(e);
            }
        })();

        let b = (async() => {
            try {
                let response = await fetch("https://thecarney2.ngrok.io/p2/trees");
                let data = await response.json();
                jsonTrees.push(data);
                lyrTrees = await makeLayerTrees(jsonTrees);
                mapTrees = await lyrTrees;
            } catch (e) {
                console.log(e);
            }
        })();

        let c = (async() => {
            try {
                let response = await fetch("https://thecarney2.ngrok.io/p2/equipment");
                let data = await response.json();
                jsonEquipment.push(data);
                lyrEquipment = makeLayerEquipment(jsonEquipment);
                lyrEquipmentfAccess = makeLayerEquipment(jsonEquipment, filterAccess);
                await lyrEquipment;
                await lyrEquipmentfAccess;
                mapEquipment = await lyrEquipment;
            } catch (e) {
                console.log(e);
            }
        })();

        let d = (async() => {
            try {
                let multipleFetch = await Promise.all([
                    (fetch("https://thecarney2.ngrok.io/p2/benches")).then((response) => response.json()),
                    (fetch("https://thecarney2.ngrok.io/p2/picnic")).then((response) => response.json())
                ]);
                let data1 = multipleFetch[0];
                let data2 = multipleFetch[1];
                jsonSeating.push(data1);
                jsonSeating.push(data2);
                lyrSeating = makeLayerSeating(jsonSeating);
                lyrSeatingfAccess = makeLayerSeating(jsonSeating, filterAccess);
                await lyrSeating;
                await lyrSeatingfAccess;
                mapSeating = await lyrSeating;
            } catch (e) {
                console.log(e);
            }
        })();

        let e = (async() => {
            try {
                let response = await fetch("https://thecarney2.ngrok.io/p2/parkloop");
                let data = await response.json();
                jsonPath.push(data);
                lyrPath = makeLayerPath(jsonPath);
                lyrPathfAccess = makeLayerPath(jsonPath, filterAccess);
                await lyrPath;
                await lyrPathfAccess;
                mapPath = await lyrPath;
            } catch (e) {
                console.log(e);
            }
        })();

        let f = (async() => {
            try {
                let multipleFetch = await Promise.all([
                    (fetch("https://thecarney2.ngrok.io/p2/lawn")).then((response) => response.json()),
                    (fetch("https://thecarney2.ngrok.io/p2/mulch")).then((response) => response.json()),
                    (fetch("https://thecarney2.ngrok.io/p2/pavement")).then((response) => response.json()),
                    (fetch("https://thecarney2.ngrok.io/p2/playground")).then((response) => response.json()),
                    (fetch("https://thecarney2.ngrok.io/p2/sandbox")).then((response) => response.json())
                ]);
                Array.prototype.push.apply(jsonGroundCover, multipleFetch);
                lyrGroundCover = makeLayerGroundCover(jsonGroundCover);
                lyrGroundCoverfAccess = makeLayerGroundCover(jsonGroundCover, filterAccess);
                await lyrGroundCover;
                await lyrGroundCoverfAccess;
                mapGroundCover = await lyrGroundCover;
            } catch (e) {
                console.log(e);
            }
        })();

        let g = (async() => {
            try {
                let response = await fetch("https://thecarney2.ngrok.io/p2/bbcourt");
                let data = await response.json();
                jsonCourt.push(data);
                lyrCourt = makeLayerCourt(jsonCourt);
                lyrCourtfAccess = makeLayerCourt(jsonCourt, filterAccess);
                await lyrCourt;
                await lyrCourtfAccess;
                mapCourt = await lyrCourt;
            } catch (e) {
                console.log(e);
            }
        })();

        let everything = await Promise.all([a,b,c,d,e,f,g]);
    }

    function makeLayerPhoto(data, callback = function(){} ) {
        let lyr = L.geoJSON(null,{
            pointToLayer: function (feature, latlng) {
                let iconPhoto = L.divIcon({
                    className: 'fa-icon-photo',
                    html: '<div class="fa-2x">\n' +
                        '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                        '    <i class="far fa-circle" data-fa-transform="grow-1" style="color:#fdfbfe"></i>\n' +
                        '    <i class="fas fa-circle" style="color:#2943dc"></i>\n' +
                        '    <i class="fa-inverse fas fa-camera" data-fa-transform="shrink-8"></i>\n' +
                        '  </span></div>',
                    iconSize: [15, 15],
                    popupAnchor: [5, -3]
                });
                return L.marker(latlng, {
                    icon: iconPhoto,
                    opacity: 1,
                    pane: 'photo'
                });
            },
            onEachFeature: function (feature, layer) {
                let popup = L.popup({
                    closeButton: false,
                    className: 'popup-blue',
                    maxWidth: 'auto',
                    autoPanPaddingTopLeft: L.point(60, 40),
                    offset: L.point(0, -4)
                })
                    .setContent('<img src="https://thecarney2.ngrok.io/images/'
                        +layer.feature.properties.f4+
                        '" alt="pic" style="width: 275px;height: 275px;border-radius: 4px";">' +
                        '<strong>Caption</strong><i>: ' + layer.feature.properties.f2 + '</i>' +
                        '<br><strong>Facing</strong><i>: ' + layer.feature.properties.f5 + '</i>');
                layer.bindPopup(popup);
            }
        });

        lyr.addData(data[0]);

        callback();

        return lyr;

    }  // geoJSON

    function makeLayerTrees(data) {
        let lyr = L.geoJSON(null, {
            pane: 'trees',
            interactive: false,
            style: {
                //clickable: false,
                fill: true,
                fillColor: '#398033',
                fillOpacity: 0.4,
                stroke: true,
                color: '#005e1d',
                weight: 1,
                opacity: 0.4,
                lineCap: 'round',
                lineJoin: 'round'
            }
        });

        lyr.addData(data[0]);

        return lyr;
    }  // geoJSON

    function makeLayerEquipment( data, filter = function(){return true;}  ) {
        let iconSwingSet = L.divIcon({
            className: 'fa-icon-swingset',
            html: '<div class="fa-2x">\n' +
                '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                '    <i class="far fa-circle" data-fa-transform="grow-1" style="color:#fdfbfe"></i>\n' +
                '    <i class="fas fa-circle" style="color:#207375"></i>\n' +
                '    <i class="fa-inverse fas fa-rocket" data-fa-transform="shrink-6"></i>\n' +
                '  </span></div>',
            iconSize: [15, 15],
            popupAnchor: [5, -3]
        });
        let iconPlayStructure = L.divIcon({
            className: 'fa-icon-playstructure',
            html: '<div class="fa-2x">\n' +
                '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                '    <i class="far fa-circle" data-fa-transform="grow-1" style="color:#fdfbfe"></i>\n' +
                '    <i class="fas fa-circle" style="color:#1c2e75"></i>\n' +
                '    <i class="fa-inverse fas fa-shapes" data-fa-transform="shrink-6"></i>\n' +
                '  </span></div>',
            iconSize: [15, 15],
            popupAnchor: [5, -3]
        });

        let lyr = L.geoJSON(null, {
            pointToLayer: function (feature, latlng) {
                if (feature.properties.f1 == 2 || feature.properties.f1 == 3) {
                    return L.marker(latlng, {
                        icon: iconSwingSet,
                        opacity: 1,
                        pane: 'equipment'
                    });
                } else {
                    return L.marker(latlng, {
                        icon: iconPlayStructure,
                        opacity: 1,
                        pane: 'equipment'
                    });
                }
            },
            onEachFeature: function (feature, layer) {
                let popup = L.popup({
                    closeButton: false,
                    className: 'popup-blue',
                    maxWidth: 250,
                    autoPanPaddingTopLeft: L.point(60, 40),
                    offset: L.point(0, -4)
                })
                    .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                layer.bindPopup(popup);
            },
            filter: filter
        });

        lyr.addData(data[0]);

        return lyr;
    }  // geoJSON  // access filter

    function makeLayerSeating(data, filter = function(){return true;} ) {
        let iconBench = L.divIcon({
            className: 'fa-icon-bench',
            html: '<div class="fa-2x">\n' +
                '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                '    <i class="far fa-circle" data-fa-transform="grow-1" style="color:#fdfbfe"></i>\n' +
                '    <i class="fas fa-circle" style="color:#75543a"></i>\n' +
                '    <i class="fa-inverse fas fa-chair" data-fa-transform="shrink-6"></i>\n' +
                '  </span></div>',
            iconSize: [15, 15],
            popupAnchor: [5, -3]
        });
        let iconTable = L.divIcon({
            className: 'fa-icon-table',
            html: '<div class="fa-2x">\n' +
                '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                '    <i class="far fa-circle" data-fa-transform="grow-1" style="color:#fdfbfe"></i>\n' +
                '    <i class="fas fa-circle" style="color:#dc7f2f"></i>\n' +
                '    <i class="fa-inverse fas fa-glass-whiskey fa-rotate-180" data-fa-transform="shrink-6"></i>\n' +
                '  </span></div>',
            iconSize: [15, 15],
            popupAnchor: [5, -3]
        });

        let lyr = L.geoJSON(null, {
            pointToLayer: function (feature, latlng) {
                if (feature.properties.f2 === "Table") {
                    return L.marker(latlng, {
                        icon: iconTable,
                        opacity: 1,
                        pane: 'seats'
                    });
                } else {
                    return L.marker(latlng, {
                        icon: iconBench,
                        opacity: 1,
                        pane: 'seats'
                    });
                }
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties.f2 === "Table") {
                    let popup = L.popup({
                        closeButton: false,
                        className: 'popup-yellow',
                        maxWidth: 250,
                        autoPanPaddingTopLeft: L.point(60, 40),
                        offset: L.point(0, -4)
                    })
                        .setContent('<i>' +
                            layer.feature.properties.f3 +
                            '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                    layer.bindPopup(popup);
                } else {
                    let popup = L.popup({
                        closeButton: false,
                        className: 'popup-brown',
                        maxWidth: 250,
                        autoPanPaddingTopLeft: L.point(60, 40),
                        offset: L.point(0, -4)
                    })
                        .setContent('<i>' +
                            layer.feature.properties.f3 +
                            '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                    layer.bindPopup(popup);
                }
            },
            filter: filter
        });

        let arr = data;
        let arrLen = arr.length;
        for (let i=0; i < arrLen; i++) {
            lyr.addData(arr[i]);
        }

        return lyr;
    }  // geoJSON  // access filter

    function makeLayerPath(data, filter = function(){return true;}) {
        let lyr = L.geoJSON(null, {
            pane: 'polyg509',
            style: {
                fill: false,
                //fillColor: '#bcbabd',
                //fillOpacity: 0.5,
                stroke: true,
                color: '#9f0011',
                weight: 5,
                opacity: 0.3,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: '5 9'
            },
            onEachFeature: function (feature, layer) {
                let popup = L.popup({
                    closeButton: false,
                    className: 'popup-red',
                    maxWidth: 250,
                    autoPanPaddingTopLeft: L.point(60, 40),
                    offset: L.point(0, -4)
                })
                    .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                layer.bindPopup(popup);
            },
            filter: filter
        });

        lyr.addData(data[0]);

        return lyr;
    }  // geoJSON  // access filter

    function makeLayerGroundCover(data, filter = function(){return true;} ) {
        let styleLawn = {
            fill: true,
            fillColor: '#d5f46b',
            fillOpacity: 0.5,
            stroke: true,
            color: '#688342',
            weight: 1,
            opacity: 0.5,
            lineCap: 'round',
            lineJoin: 'round',
            pane: 'polyg502'
        };
        let styleMulch = {
            fill: true,
            fillColor: '#cb9e49',
            fillOpacity: 0.5,
            stroke: true,
            color: '#bb8e4a',
            weight: 1,
            opacity: 0.5,
            lineCap: 'round',
            lineJoin: 'round',
            pane: 'polyg501'
        };
        let stylePavement = {
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
            pane: 'polyg503'
        };
        let stylePlayground = {
            fill: true,
            fillColor: '#f0c930',
            fillOpacity: 0.5,
            stroke: true,
            color: '#d4af2e',
            weight: 1,
            opacity: 0.5,
            lineCap: 'round',
            lineJoin: 'round',
            pane: 'polyg504'
        };
        let styleSandbox = {
            fill: true,
            fillColor: '#ae9959',
            fillOpacity: 0.5,
            stroke: true,
            color: '#a37752',
            weight: 1,
            opacity: 0.5,
            lineCap: 'round',
            lineJoin: 'round',
            pane: 'polyg505'
        };

        let lyr = L.geoJSON(null,{
            style: function (feature) {
                if (feature.properties.f5 === "lawn") {
                    return styleLawn;
                } else if (feature.properties.f5 === "mulch") {
                    return styleMulch;
                } else if (feature.properties.f5 === "pavement") {
                    return stylePavement;
                } else if (feature.properties.f5 === "playground") {
                    return stylePlayground;
                } else {
                    return styleSandbox;
                }
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties.f5 === "lawn") {
                    let popup = L.popup({
                        closeButton: false,
                        className: 'popup-green',
                        maxWidth: 250,
                        autoPanPaddingTopLeft: L.point(60, 40),
                        offset: L.point(0, -4)
                    })
                        .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                            layer.feature.properties.f3 +
                            '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                    layer.bindPopup(popup);
                } else if (feature.properties.f5 === "mulch") {
                    let popup = L.popup({
                        closeButton: false,
                        className: 'popup-brown',
                        maxWidth: 250,
                        autoPanPaddingTopLeft: L.point(60, 40),
                        offset: L.point(0, -4)
                    })
                        .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                            layer.feature.properties.f3 +
                            '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                    layer.bindPopup(popup);
                } else if (feature.properties.f5 === "pavement") {
                    let popup = L.popup({
                        closeButton: false,
                        className: 'popup-grey',
                        maxWidth: 250,
                        autoPanPaddingTopLeft: L.point(60, 40),
                        offset: L.point(0, -4)
                    })
                        .setContent('<strong>' + layer.feature.properties.f2 + '</strong>');
                    layer.bindPopup(popup);
                } else if (feature.properties.f5 === "playground") {
                    let popup = L.popup({
                        closeButton: false,
                        className: 'popup-yellow',
                        maxWidth: 250,
                        autoPanPaddingTopLeft: L.point(60, 40),
                        offset: L.point(0, -4)
                    })
                        .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                            layer.feature.properties.f3 +
                            '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                    layer.bindPopup(popup);
                } else {
                    let popup = L.popup({
                        closeButton: false,
                        className: 'popup-brown',
                        maxWidth: 250,
                        autoPanPaddingTopLeft: L.point(60, 40),
                        offset: L.point(0, -4)
                    })
                        .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                            layer.feature.properties.f3 +
                            '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                    layer.bindPopup(popup);
                }
            },
            filter: filter
        });

        let arr = data;
        let arrLen = arr.length;
        for (let i=0; i < arrLen; i++) {
            lyr.addData(arr[i]);
        }

        return lyr;

    }  // geoJSON  // access filter

    function makeLayerCourt(data, filter = function(){return true;} ) {

        let lyr = L.geoJSON(null, {
            pane: 'polyg508',
            style: {
                fill: true,
                fillColor: '#bcbabd',
                fillOpacity: 0.8,
                stroke: true,
                color: '#fdfbfe',
                weight: 2,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round',
            },
            onEachFeature: function (feature, layer) {
                let popup = L.popup({
                    closeButton: false,
                    className: 'popup-grey',
                    maxWidth: 250,
                    autoPanPaddingTopLeft: L.point(60, 40),
                    offset: L.point(0, -4)
                })
                    .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4);
                layer.bindPopup(popup);
            },
            filter: filter
        });

        lyr.addData(data[0]);

        return lyr;

    }  // geoJSON  // access filter

    function setupMap() {
        // token
        L.mapbox.accessToken = 'pk.eyJ1IjoiamhjYXJuZXkiLCJhIjoiY2pmbHE2ZTVlMDJnbTJybzdxNTNjaWsyMiJ9.hoiyrXTX3pOuEExAnhUtIQ';
        // basemaps, enable over zoom
        let baseStreets = L.mapbox.styleLayer('mapbox://styles/jhcarney/cjk1yuwd6b9mv2sqvu8452gfu', {
            maxZoom: 22,
            maxNativeZoom: 21
        });
        let baseAerial = L.mapbox.styleLayer('mapbox://styles/jhcarney/cjk1ywa89015v2sqks2r6ivwj', {
            maxZoom: 22,
            maxNativeZoom: 20
        });
        // make map
        let map = L.mapbox.map('map')
            .setView([37.6909, -121.72615], 17);
        // panes for marker z ordering
        map.createPane('photo').style.zIndex = 610;
        map.createPane('equipment').style.zIndex = 609;
        map.createPane('seats').style.zIndex = 608;
        // pane for trees to show on top of other features
        map.createPane('trees').style.zIndex = 611;
        // series of panes for z order of polygons
        map.createPane('polyg510').style.zIndex = 510;
        map.createPane('polyg509').style.zIndex = 509;
        map.createPane('polyg508').style.zIndex = 508;
        map.createPane('polyg507').style.zIndex = 507;
        map.createPane('polyg506').style.zIndex = 506;
        map.createPane('polyg505').style.zIndex = 505;
        map.createPane('polyg504').style.zIndex = 504;
        map.createPane('polyg503').style.zIndex = 503;
        map.createPane('polyg502').style.zIndex = 502;
        map.createPane('polyg501').style.zIndex = 501;
        // make sure popups stay on top
        map.getPane('popupPane').style.zIndex = 700;
        // this is a pane for a transparent polygon overlay used to control user interaction with the popup layer
        map.createPane('hiddenOverlay').style.zIndex = 698;
        // pane for new photo interaction
        map.createPane('newPhoto').style.zIndex = 699;

        return [map, baseStreets, baseAerial];
    }

    function addLayerControl() {

        layerControl = L.control.layers({
            'Streets': baseStreets.addTo(map),
            'Satellite': baseAerial
        }, {
            // 'Visitor Photos': lyrPhoto,
            // 'Tree Canopy': lyrTrees,
            // 'Playground Equip.': lyrEquipment,
            // 'Tables & Benches': lyrSeating,
            // 'Loop Path': lyrPath,
            // 'Park Grounds': lyrGroundCover
        }, {
            position: 'topleft',
            collapsed: false
        }).addTo(map);

        moveLayerControlToPopover(layerControl);

        // make a hidden polygon overlay
        let hiddenData = [{
            "type": "Feature",
            "properties": {
                "name": "overlay",
                "popupContent": "test"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[-121.728602, 37.691681], [-121.724186, 37.691543], [-121.723973, 37.689516], [-121.728260, 37.689467]]]
            }
        }];

        let transparentStyle = {
            color: "#ff0b00",
            weight: 5,
            fillOpacity: 0,
            opacity: 0
        };

        let hiddenLayer = L.geoJSON(hiddenData, {
            pane: 'hiddenOverlay',
            style: transparentStyle
        });

        map.on('popupopen', function (e) {
            map.addLayer(hiddenLayer);
        });

        map.on('popupclose', function (e) {
            map.removeLayer(hiddenLayer);
        })
    }

    function addDefaultLayers() {
        // lyrCourt is controlled by lyrGroundCover
        map.on('overlayadd', function (event) {
            if (event.layer === mapGroundCover) {
                map.addLayer(mapCourt);
            }
        });
        map.on('overlayremove', function (event) {
            if (event.layer === mapGroundCover) {
                map.removeLayer(mapCourt);
            }
        });

        layerControl.addOverlay(mapPhoto, 'Visitor Photos');
        layerControl.addOverlay(mapTrees, 'Tree Canopy');
        layerControl.addOverlay(mapEquipment, 'Playground Equip.');
        layerControl.addOverlay(mapSeating, 'Tables & Benches');
        layerControl.addOverlay(mapPath, 'Loop Path');
        layerControl.addOverlay(mapGroundCover, 'Park Grounds');

        map.addLayer(mapPath);
        map.addLayer(mapEquipment);
        map.addLayer(mapSeating);
        map.addLayer(mapGroundCover);
    }

    function setupListeners() {
        // validation and post for make photo
        $("#btnSubmitPhoto").on('click', function () {
            // get photo form
            let photoForm = document.getElementById("formPhoto");
            // not valid
            if (photoForm.checkValidity() === false) {
                event.preventDefault();
                event.stopPropagation();
                console.log("invalid");
                photoForm.classList.add('was-validated');
            } else {
                console.log("valid");
                // build form data, append fields before file

                let latlon = document.getElementById('modalPhotoLatLon').value;
                console.log(latlon);

                let caption = document.getElementById('validationCustom02').value;
                console.log(caption);

                let facing = document.getElementById('validationCustom03').value;
                console.log(facing);

                let fileInput = document.getElementById('inputGroupFile01');
                let file = fileInput.files[0];

                let formData = new FormData();
                formData.append('latlon', latlon);
                formData.append('caption', caption);
                formData.append('facing', facing);
                formData.append('photo', file);

                // simple way, whole form, but no ordering
                //let form = $('#formPhoto')[0];
                //let formData = new FormData(form);

                // toggle modal, open loading modal
                $('#modalPhoto').modal('toggle');
                $('#modalLoading').modal('toggle');
                // post and show modals to user
                $.ajax({
                    url: 'https://thecarney2.ngrok.io/p2/postPhoto',
                    data: formData,
                    type: 'POST',
                    contentType: false,
                    processData: false,
                    success: function (data, status, jqXHR) {
                        console.log("photo posted");

                        $('#modalLoading').modal('hide');
                        $('#modalSuccess').modal('show');

                        loadNewPhotosAfterPost();
                    },
                    error: function (jqXHR, status, err) {
                        console.log("error posting photo");
                        $('#modalLoading').modal('hide');
                        $('#modalFailure').modal('show');
                    }
                })
            }
        });

        // put selected file name in photo modal
        $('#inputGroupFile01').on('change', function () {
            let fileName = $(this).val();
            $('#fileInputLabel1').html(fileName);
            let pathName = $('#fileInputLabel1').html();
            let shortName = pathName.replace("C:\\fakepath\\", "");
            $('#fileInputLabel1').html(shortName);
        });

        // close hamburger menu on selection
        $(document).click(function (event) {
            var clickover = $(event.target);
            var _opened = $(".navbar-collapse").hasClass("show");
            if (_opened === true && !clickover.hasClass("navbar-toggler")) {
                $(".navbar-toggler").click();
            }
        });

        // close popovers on lose focus
        $('body').on('click', function (e) {
            $('[data-toggle="popover"]').each(function () {
                if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                    $(this).popover('hide');
                }
            });
        });
    }

    function addScaleControl() {
        // scale
        L.control.scale({metric: false}).addTo(map);
    }

    function addHomeButtonControl() {
        // home button
        L.easyButton('<i class="fas fa-home myCustomHomeButton" data-fa-transform="grow-4 up-2"></i>', function () {
            map.setView([37.6903, -121.72615], 17);
        }).addTo(map);
    }

    function addLocateUserControl() {
        // geolocate user control
        L.control.locate({
            icon: 'fas fa-crosshairs ',
            iconElementTag: 'span',
            keepCurrentZoomLevel: true,
            locateOptions: {
                enableHighAccuracy: true
            }
        }).addTo(map);
    }

    function addPostPhotoControl() {
        // photo button
        L.easyButton('<i class="fas fa-camera myCustomPhotoButton" data-fa-transform="grow-4 up-2"></i>', function () {

            let markerLatLng = map.getCenter();

            let iconNewPhoto = L.divIcon({
                className: 'fa-icon-photo',
                html: '<div class="fa-2x">\n' +
                    '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                    '    <i class="far fa-circle" data-fa-transform="grow-1" style="color:#fdfbfe"></i>\n' +
                    '    <i class="fas fa-circle" style="color:#dc00b3"></i>\n' +
                    '    <i class="fa-inverse fas fa-camera" data-fa-transform="shrink-8"></i>\n' +
                    '  </span></div>',
                iconSize: [15, 15],
                popupAnchor: [5, -3],
                draggable: true
            });

            let newPhotoMarker = new L.marker(markerLatLng, {
                icon: iconNewPhoto,
                opacity: 1,
                pane: 'newPhoto'
            });

            let popup = L.popup({
                closeButton: false,
                closeOnClick: false,
                className: 'popup-grey',
                maxWidth: 250,
                autoPanPaddingTopLeft: L.point(60, 40),
                offset: L.point(0, -4)
            });
            popup.setContent('<div class="col text-center m-0 p-0"> <strong> Drag marker to photo location </strong></div>' +
                '<div class="col text-center m-0 p-0"><button class="btn btn-primary btn-sm p-1" type="button" id="btnOpenPhotoModal" style="box-shadow: none; border: 1px solid #656565">Add Photo</button>' +
                '<button class="btn btn-light btn-sm p-1" type="button" id="btnCancelNewPhoto" style="box-shadow: none; border: 1px solid #656565">Close</button></div>');
            newPhotoMarker.bindPopup(popup);

            // click event for buttons in popup
            $('#map').on('click', '#btnOpenPhotoModal', function () {
                console.log('clicked add photo button');

                // get marker latlon
                let lat = newPhotoMarker.getLatLng().lat;
                let latRnd = round(lat, 6);
                let lon = newPhotoMarker.getLatLng().lng;
                let lonRnd = round(lon, 6);
                $("#modalPhotoLatLon").val(latRnd + ", " + lonRnd);
                console.log(latRnd + ", " + lonRnd);

                // open modal, pass latlon to form
                $("#modalPhoto").modal('toggle');

                // remove the temp layer at the end
                map.removeLayer(newPhotoMarker);

                function round(number, precision) {
                    var shift = function (number, exponent) {
                        var numArray = ("" + number).split("e");
                        return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + exponent) : exponent));
                    };
                    return shift(Math.round(shift(number, +precision)), -precision);
                };
            });

            $('#map').on('click', '#btnCancelNewPhoto', function () {
                console.log('clicked close button on add photo');
                map.removeLayer(newPhotoMarker);
            });

            newPhotoMarker.addTo(map);

            newPhotoMarker.dragging.enable();

            newPhotoMarker.openPopup();

            newPhotoMarker.on('dragend', function () {
                newPhotoMarker.openPopup();
            });

        }).addTo(map);
    }

    function addFilterControl() {
        // div with icon for easy button
        let htmlString =
            '<div class="p-0 m-0" id="filterPopover" data-toggle="popover"><i id="filterIcon" class="fas fa-filter myCustomHomeButton filterButton" data-fa-transform="grow-3 up-1" style="color:#1e1e1e" ></i></div>';

        //let htmlStringInactive =
        //    '<div class="p-0 m-0" id="filterPopover" data-toggle="popover"><i id="filterIcon" class="fas fa-filter myCustomHomeButton filterButton" data-fa-transform="grow-3 up-1" style="color:#1e1e1e"  ></i></div>';

        L.easyButton(htmlString, function () {
            // doesnt need anything for popover to work
        }).addTo(map);

        //initialize popover
        $(function () {
            $('#filterPopover').popover({
                title: "Filter Features",
                html: true,
                content: $("#filters"), // div with checks/radios/buttons
                placement: 'right',
                trigger: 'click'
            })
        });

        // handle selections and filter layers
        $('input:radio').on('click', function(e) {
            console.log(e.currentTarget.value); //e.currenTarget.value points to the property value of the 'clicked' target.
            if (e.currentTarget.value.valueOf() === "All") {
                $('#filterIcon').css('color','#1e1e1e');
                fShowAllFeatures();
            } else {
                $('#filterIcon').css('color','#0030FF');
                fShowAccessibleFeatures();
            }
        });

    }

    function fShowAllFeatures() {
        map.removeLayer(mapEquipment);
        map.removeLayer(mapSeating);
        map.removeLayer(mapPath);
        map.removeLayer(mapGroundCover);
        map.removeLayer(mapCourt);

        mapEquipment = lyrEquipment;
        mapSeating = lyrSeating;
        mapPath = lyrPath;
        mapGroundCover = lyrGroundCover;
        mapCourt = lyrCourt;

        map.addLayer(mapEquipment);
        map.addLayer(mapSeating);
        map.addLayer(mapPath);
        map.addLayer(mapGroundCover);
        map.addLayer(mapCourt);

        console.log('tried to show ALL FEATURES');
    }

    function fShowAccessibleFeatures() {
        map.removeLayer(mapEquipment);
        map.removeLayer(mapSeating);
        map.removeLayer(mapPath);
        map.removeLayer(mapGroundCover);
        map.removeLayer(mapCourt);

        mapEquipment = lyrEquipmentfAccess;
        mapSeating = lyrSeatingfAccess;
        mapPath = lyrPathfAccess;
        mapGroundCover = lyrGroundCoverfAccess;
        mapCourt = lyrCourtfAccess;

        map.addLayer(mapEquipment);
        map.addLayer(mapSeating);
        map.addLayer(mapPath);
        map.addLayer(mapGroundCover);
        map.addLayer(mapCourt);

        console.log('tried to show ACCESSIBLE FEATURES');
    }

    function moveLayerControlToPopover(layerControl){
        // div with icon for easy button
        htmlString =
            '<div class="p-0 m-0" id="layersPopover" data-toggle="popover">' +
            '<i class="fas fa-layer-group myCustomHomeButton filterButton" data-fa-transform="grow-3 up-1"></i>' +
            '</div>';

        L.easyButton(htmlString, function () {
            // doesnt need anything for popover to work
        }).addTo(map);

        //initialize popover
        $(function () {
            $('#layersPopover').popover({
                title: "Layers",
                html: true,
                content: $("#layersControl"), // div with checks/radios/buttons
                placement: 'right',
                trigger: 'click'
            })
        });

        let htmlObject = layerControl.getContainer();
        let a = document.getElementById('layersControl');
        function setParent(el, newParent){
            newParent.appendChild(el);
        }
        setParent(htmlObject, a);

    }

    function loadNewPhotosAfterPost() {
        // get locations of photos we already had
        let arrPhotoLatLon = [];
        lyrPhoto.eachLayer(function (layer1) {
            layer1.eachLayer(function (layer2) {
                arrPhotoLatLon.push(layer2.getLatLng().toString());
            })
        });

        // make photo layer from server again, use callback to only add new one to map
        let lyrWithNewPhotos = makeLayerPhoto(function () {
            lyrWithNewPhotos.eachLayer(function (layer3) {
                layer3.eachLayer(function (layer4) {
                    if ( $.inArray(layer4.getLatLng().toString(), arrPhotoLatLon) === -1 ){
                        console.log('add new photo marker to layergroup');
                        lyrPhoto.addLayer(layer3);
                    } else {
                    }
                })
            });
        });

        map.addLayer(lyrPhoto);
    }

    function addOnLoadPopup() {
        let popupOnLoad = L.popup({
            closeButton: false,
            className: 'popup-on-load',
            offset: L.point(0, 0),
            maxWidth: 215
        })
            .setLatLng([37.6912, -121.72615])
            .setContent('<div><h6 class="mb-0">Welcome!</h6><br>Explore the park using the controls at the ' +
                'top left, or by accessing some additional functionality from the main menu at the top right. <br><br></div>')
            .openOn(map);


        // inelegantly show when popup will auto-close

        let origContent = popupOnLoad.getContent();

        popupOnLoad.setContent(origContent + '<i class="text-warning">- 8 -</i>');

        setTimeout(function () {
            popupOnLoad.setContent(origContent + '<i class="text-warning">- 7 -</i>');
        }, 1000);

        setTimeout(function () {
            popupOnLoad.setContent(origContent + '<i class="text-warning">- 6 -</i>');
        }, 2000);

        setTimeout(function () {
            popupOnLoad.setContent(origContent + '<i class="text-warning">- 5 -</i>');
        }, 3000);

        setTimeout(function () {
            popupOnLoad.setContent(origContent + '<i class="text-warning">- 4 -</i>');
        }, 4000);

        setTimeout(function () {
            popupOnLoad.setContent(origContent + '<i class="text-warning">- 3 -</i>');
        }, 5000);

        setTimeout(function () {
            popupOnLoad.setContent(origContent + '<i class="text-warning">- 2 -</i>');
        }, 6000);

        setTimeout(function () {
            popupOnLoad.setContent(origContent + '<i class="text-warning">- 1 -</i>');
        }, 7000);

        setTimeout(function () {
            map.closePopup(popupOnLoad);
        }, 8000);

    }

    // return map object
    return map;
}

function resize(map) {
    // window resize listener
    $(window).on("resize", function () {
        //console.log(map.getZoom());

        //console.log("resize called");
        // make map height responsive to available space
        let navbarHeight = $("#header1").outerHeight();
        //console.log("header: ", navbarHeight);
        let footerHeight = $("#footer1").outerHeight();
        //console.log("footer: ", footerHeight);
        let windowHeight = $(window).outerHeight();
        //console.log("window: ", windowHeight);

        // set new map height and right panel height
        let newMapHeight = windowHeight - navbarHeight - footerHeight;
        //console.log("new map height: ", newMapHeight);
        $("#map").css({"height": newMapHeight});
        $("#map").css({"margin-top": navbarHeight});

    }).trigger("resize");
}

/*/==================================================================================================================
------------------------------------------------------------------------------------------------------------- SCRATCH
===================================================================================================================== /*/

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
