/* ATTRIBUTIONS */

// call initialize functions after page ready
$(document).ready(initialize);

// photo form validator
(function() {
    'use strict';
    window.addEventListener('load', function() {
        // get photo form
        let photoForm = document.getElementById("formPhoto");
        $("#btnSubmitPhoto").on('click', function () {
            if (photoForm.checkValidity() === false) {
                event.preventDefault();
                event.stopPropagation();
                console.log("invalid");
            }
            photoForm.classList.add('was-validated');
            console.log("valid");
        });
    }, false);
})();

// put selected file name in photo modal
$('#inputGroupFile01').on('change',function(){
    let fileName = $(this).val();
    $('#fileInputLabel1').html(fileName);
    let pathName = $('#fileInputLabel1').html();
    let shortName = pathName.replace("C:\\fakepath\\","");
    $('#fileInputLabel1').html(shortName);
});



// starting point for script
function initialize() {
    // // initialize all tooltips
    // $(function () {
    //     $('[data-toggle="tooltip"]').tooltip({trigger: "hover"})
    // });







    // resize function wraps the main function to allow responsive sizing of panel with map
    let defaultMap = resize(map('default'));

    //let directionsMap = resize(map('directions'));





}

// Main
function map(type) {




    // map setup
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
    var map = L.mapbox.map('map')
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
    map.createPane('hiddenOverlay').style.zIndex = 699;


    // home button
    L.easyButton('<i class="fas fa-home myCustomHomeButton" data-fa-transform="grow-4 up-2"></i>', function () {
        map.setView([37.6903, -121.72615], 17);
    }).addTo(map);

    // geolocate user control
    L.control.locate({
        icon: 'fas fa-crosshairs ',
        iconElementTag: 'span',
        keepCurrentZoomLevel: true,
        locateOptions: {
            enableHighAccuracy: true
        }
    }).addTo(map); // MAKE MAP, CONTROLS, PANES

    // scale
    L.control.scale({metric: false}).addTo(map);

    let popupOnLoad = L.popup({
        closeButton: false,
        className: 'popup-on-load',
        offset: L.point(0, 0),
        maxWidth: 190
    })
        .setLatLng([37.6912, -121.72615])
        .setContent('<div><h6 class="mb-0">Welcome!</h6><br>Explore the park using the controls at the ' +
            'top left, or by accessing some additional functionality from the main menu at the top right. </div>')
        .openOn(map);

    // setTimeout(function () {
    //     popupOnLoad.setContent(popupOnLoad.getContent() + '<br>DOGS DOGS DOGS!');
    // }, 5000);


    let reports = fetch("https://thecarney2.ngrok.io/p2/reports")
        .then(function (response) {
            return response.json();
        })
        .then(function (myJson) {
            //console.log(JSON.stringify(myJson));
        });


    // setup calls to fetch data and make layers
    let lyrPhoto = makeLayerPhoto();
    let lyrTrees = makeLayerTrees();
    let lyrEquipment = makeLayerEquipment();
    let lyrSeating = makeLayerSeating();
    let lyrPath = makeLayerPath();
    let lyrGroundCover = makeLayerGroundCover();
    let lyrCourt = makeLayerCourt();

    // add layers to map
    addLayerControlAndDefaultLayers();

    function makeLayerPhoto() {
        let lyr = L.mapbox.featureLayer(null, {
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
        })
            .loadURL('https://thecarney2.ngrok.io/p2/photos')
            .on('ready', function () {
                lyr.eachLayer(function (layer) {
                    let popup = L.popup({
                        closeButton: false,
                        className: 'popup-blue',
                        maxWidth: 250,
                        autoPanPaddingTopLeft: L.point(60, 40),
                        offset: L.point(0, -4)
                    })
                        .setContent('<strong>' + layer.feature.properties.f3 + '</strong><i>: ' +
                            layer.feature.properties.f2 + '</i>');
                    layer.bindPopup(popup);
                });
            });
        return lyr;
    }

    function makeLayerTrees() {
        // Mapbox featureLayer for its async loading
        // then extract its json and pass to L.geoJSON, to allow pane asssingment
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
        let loader = L.mapbox.featureLayer()
            .loadURL('https://thecarney2.ngrok.io/p2/trees')
            .on('ready', function () {
                let json = loader.getGeoJSON();
                lyr.addData(json);
            });
        return lyr;
    }

    function makeLayerEquipment() {
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

        let lyr = L.mapbox.featureLayer(null, {
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
            }
        })
            .loadURL('https://thecarney2.ngrok.io/p2/equipment')
            .on('ready', function () {
                lyrEquipment.eachLayer(function (layer) {
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
                });
            });
        return lyr;
    }

    function makeLayerSeating() {
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

        let lyr = L.mapbox.featureLayer();

        let lyrBench = L.mapbox.featureLayer(null, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {
                    icon: iconBench,
                    opacity: 1,
                    pane: 'seats'
                });
            }
        })
            .loadURL('https://thecarney2.ngrok.io/p2/benches')
            .on('ready', function () {
                lyrBench.eachLayer(function (layer) {
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
                });
            })
            .addTo(lyr);

        let lyrTables = L.mapbox.featureLayer(null, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {
                    icon: iconTable,
                    opacity: 1,
                    pane: 'seats'
                });
            }
        })
            .loadURL('https://thecarney2.ngrok.io/p2/picnic')
            .on('ready', function () {
                lyrTables.eachLayer(function (layer) {
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
                });
            })
            .addTo(lyr);

        return lyr;
    }

    function makeLayerPath() {
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
            }
        });
        let loader = L.mapbox.featureLayer()
            .loadURL('https://thecarney2.ngrok.io/p2/parkloop')
            .on('ready', function () {
                let json = loader.getGeoJSON();
                lyr.addData(json);
                lyr.eachLayer(function (layer) {
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
                });
            });
        return lyr;
    }

    function makeLayerGroundCover() {
        let lyrFinal = L.geoJSON();
        let lyrLawn = L.geoJSON(null, {
            pane: 'polyg502',
            style: {
                fill: true,
                fillColor: '#d5f46b',
                fillOpacity: 0.5,
                stroke: true,
                color: '#688342',
                weight: 1,
                opacity: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
            }
        }).addTo(lyrFinal);

        let lyrMulch = L.geoJSON(null, {
            pane: 'polyg501',
            style: {
                fill: true,
                fillColor: '#cb9e49',
                fillOpacity: 0.5,
                stroke: true,
                color: '#bb8e4a',
                weight: 1,
                opacity: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
            }
        }).addTo(lyrFinal);

        let lyrPavement = L.geoJSON(null, {
            pane: 'polyg503',
            style: {
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
            }
        }).addTo(lyrFinal);

        let lyrPlayground = L.geoJSON(null, {
            pane: 'polyg504',
            style: {
                fill: true,
                fillColor: '#f0c930',
                fillOpacity: 0.5,
                stroke: true,
                color: '#d4af2e',
                weight: 1,
                opacity: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
            }
        }).addTo(lyrFinal);

        let lyrSandbox = L.geoJSON(null, {
            pane: 'polyg505',
            style: {
                fill: true,
                fillColor: '#ae9959',
                fillOpacity: 0.5,
                stroke: true,
                color: '#a37752',
                weight: 1,
                opacity: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
            }
        }).addTo(lyrFinal);

        let loaderLawn = L.mapbox.featureLayer()
            .loadURL('https://thecarney2.ngrok.io/p2/lawn')
            .on('ready', function () {
                let json = loaderLawn.getGeoJSON();
                lyrLawn.addData(json);
                lyrLawn.eachLayer(function (layer) {
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
                });
            });

        let loaderMulch = L.mapbox.featureLayer()
            .loadURL('https://thecarney2.ngrok.io/p2/mulch')
            .on('ready', function () {
                let json = loaderMulch.getGeoJSON();
                lyrMulch.addData(json);
                lyrMulch.eachLayer(function (layer) {
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
                });
            });

        let loaderPavement = L.mapbox.featureLayer()
            .loadURL('https://thecarney2.ngrok.io/p2/pavement')
            .on('ready', function () {
                let json = loaderPavement.getGeoJSON();
                lyrPavement.addData(json);
                lyrPavement.eachLayer(function (layer) {
                    let popup = L.popup({
                        closeButton: false,
                        className: 'popup-grey',
                        maxWidth: 250,
                        autoPanPaddingTopLeft: L.point(60, 40),
                        offset: L.point(0, -4)
                    })
                        .setContent('<strong>' + layer.feature.properties.f2 + '</strong>');
                    layer.bindPopup(popup);
                });
            });

        let loaderPlayground = L.mapbox.featureLayer()
            .loadURL('https://thecarney2.ngrok.io/p2/playground')
            .on('ready', function () {
                let json = loaderPlayground.getGeoJSON();
                lyrPlayground.addData(json);
                lyrPlayground.eachLayer(function (layer) {
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
                });
            });

        let loaderSandbox = L.mapbox.featureLayer()
            .loadURL('https://thecarney2.ngrok.io/p2/sandbox')
            .on('ready', function () {
                let json = loaderSandbox.getGeoJSON();
                lyrSandbox.addData(json);
                lyrSandbox.eachLayer(function (layer) {
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
                });
            });

        return lyrFinal;
    }

    function makeLayerCourt() {
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
            }
        });
        let loader = L.mapbox.featureLayer()
            .loadURL('https://thecarney2.ngrok.io/p2/bbcourt')
            .on('ready', function () {
                let json = loader.getGeoJSON();
                lyr.addData(json);
                lyr.eachLayer(function (layer) {
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
                });
            });
        return lyr;
    }

    function addLayerControlAndDefaultLayers() {
        // lyrCourt is controlled by lyrGroundCover
        map.on('overlayadd', function (event) {
            if (event.layer === lyrGroundCover) {
                map.addLayer(lyrCourt);
            }
        });
        map.on('overlayremove', function (event) {
            if (event.layer === lyrGroundCover) {
                map.removeLayer(lyrCourt);
            }
        });

        let layerControl = L.control.layers({
            'Streets': baseStreets.addTo(map),
            'Satellite': baseAerial
        }, {
            'Visitor Photos': lyrPhoto,
            'Tree Canopy': lyrTrees,
            'Playground Equip.': lyrEquipment,
            'Tables & Benches': lyrSeating,
            'Loop Path': lyrPath,
            'Park Grounds': lyrGroundCover
        }, {
            position: 'topleft',
        }).addTo(map);

        map.addLayer(lyrGroundCover);
        map.addLayer(lyrPath);
        map.addLayer(lyrSeating);
        map.addLayer(lyrEquipment);
        //map.addLayer(lyrTrees);
        //map.addLayer(lyrPhoto);

        // make a hidden polygon overlay
        let hiddenData = [{
            "type": "Feature",
            "properties": {
                "name": "overlay",
                "popupContent": "test"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[-121.728602, 37.691681],[-121.724186, 37.691543],[-121.723973, 37.689516],[-121.728260, 37.689467]]]
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

        map.on('popupopen', function(e){
            map.addLayer(hiddenLayer);
        });

        map.on('popupclose', function(e){
            map.removeLayer(hiddenLayer);
        })
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