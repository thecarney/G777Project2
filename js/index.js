/* James Carney 2019 */

$(document).ready(initialize);

// resize function wraps the main function to allow responsive sizing of panel with map
function initialize() {
    resize(map());
}

// Main
function map() {
    // sub-functions mostly for code management, ordered to minimize passing args

    // map init
    let [map, baseStreets, baseAerial] = setupMap();

    // to allow multiple functions to reference this later
    let layerControl;
    let datatable;
    let activeLayerID;

    // interface setup
    validateAndSendPhotoPostForm();
    validateAndSendPostReportForm();
    addScaleControl();
    addHomeButtonControl();
    addLocateUserControl();
    addLayerControlEasyButton();
    addPostPhotoControl();
    addFilterControl();
    addLayerControl();
    addRoutingControl();

    // to store server response data
    let jsonPhoto = [];
    let jsonTrees = [];
    let jsonEquipment = [];
    let jsonSeating = [];
    let jsonPath = [];
    let jsonGroundCover = [];
    let jsonCourt = [];
    let jsonReports = [];

    // to hold the layer groups actually displayed on the map
    let mapPhoto = L.layerGroup();
    let mapTrees = L.layerGroup();
    let mapEquipment = L.layerGroup();
    let mapSeating = L.layerGroup();
    let mapPath = L.layerGroup();
    let mapGroundCover = L.layerGroup();
    let mapCourt = L.layerGroup();
    let mapHighlights = L.layerGroup();

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
    let filterAccess = function (feature) {
        if (feature.properties.f4 === "Yes") {
            return true;
        }
    };

    // async loading and layer creation
    let fresh = 0;
    loadEverything({
        photos: 'y',
        trees: 'y',
        equipment: 'y',
        seating: 'y',
        path: 'y',
        groundCover: 'y',
        court: 'y',
        reports: 'y'
    })
        .then((response) => {
            addDefaultLayers();
            makeLayerIDs();
            addReportControl();
            addOnLoadPopup();
        })
        .then((response) => {
            //global listeners
            mapEquipment.on('click', function (e) {
                activeLayerID = e.layer.options.layerID;
            });

            mapSeating.on('click', function (e) {
                activeLayerID = e.layer.options.layerID;
            });

            mapGroundCover.on('click', function (e) {
                activeLayerID = e.layer.layerID;
            });

            mapCourt.on('click', function (e) {
                activeLayerID = e.layer.layerID;
            });
        })
        .then((response) => {
            // for testing
        });

    // server fetches // params are optional yes/no's for each layer group to allow targeted re-fetch
    async function loadEverything({
                                      photos = 'n', trees = 'n', equipment = 'n', seating = 'n', path = 'n', groundCover = 'n',
                                      court = 'n', reports = 'n'
                                  } = {}) {

        // layersGroups actually on map are only assigned on initial load fresh=0, subsequent calls are for data only
        // to update those default layers
        if (fresh === 0) {
            // nested async to allow parallel requests and promise.all config
            // for promise
            let doThese = [];

            // check and do

            if (photos === 'y') {
                let a = (async () => {
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
                doThese.push(a);
            }

            if (trees === 'y') {
                let b = (async () => {
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
                doThese.push(b);
            }

            if (equipment === 'y') {
                let c = (async () => {
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
                doThese.push(c);
            }

            if (seating === 'y') {
                let d = (async () => {
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
                doThese.push(d);
            }

            if (path === 'y') {
                let e = (async () => {
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
                doThese.push(e);
            }

            if (groundCover === 'y') {
                let f = (async () => {
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
                doThese.push(f);
            }

            if (court === 'y') {
                let g = (async () => {
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
                doThese.push(g);
            }

            if (reports === 'y') {
                let h = (async () => {
                    try {
                        let response = await fetch("https://thecarney2.ngrok.io/p2/reports");
                        let data = await response.json();
                        jsonReports.push(data);
                    } catch (e) {
                        console.log(e);
                    }
                })();
                doThese.push(h);
            }

            fresh++;
            // promise all called
            let everything = await Promise.all(doThese);

        } else {
            // nested async to allow parallel requests and promise.all config
            // for promise
            let doThese = [];

            // check and do

            if (photos === 'y') {
                let a = (async () => {
                    try {
                        let response = await fetch("https://thecarney2.ngrok.io/p2/photos");
                        let data = await response.json();
                        jsonPhoto = [];
                        jsonPhoto.push(data);
                        console.log('json should be different');
                        lyrPhoto = await makeLayerPhoto(jsonPhoto);
                        //mapPhoto = await lyrPhoto;
                    } catch (e) {
                        console.log(e);
                    }
                })();
                doThese.push(a);
            }

            if (trees === 'y') {
                let b = (async () => {
                    try {
                        let response = await fetch("https://thecarney2.ngrok.io/p2/trees");
                        let data = await response.json();
                        jsonTrees.push(data);
                        lyrTrees = await makeLayerTrees(jsonTrees);
                        //mapTrees = await lyrTrees;
                    } catch (e) {
                        console.log(e);
                    }
                })();
                doThese.push(b);
            }

            if (equipment === 'y') {
                let c = (async () => {
                    try {
                        let response = await fetch("https://thecarney2.ngrok.io/p2/equipment");
                        let data = await response.json();
                        jsonEquipment.push(data);
                        lyrEquipment = makeLayerEquipment(jsonEquipment);
                        lyrEquipmentfAccess = makeLayerEquipment(jsonEquipment, filterAccess);
                        await lyrEquipment;
                        await lyrEquipmentfAccess;
                        //mapEquipment = await lyrEquipment;
                    } catch (e) {
                        console.log(e);
                    }
                })();
                doThese.push(c);
            }

            if (seating === 'y') {
                let d = (async () => {
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
                        //mapSeating = await lyrSeating;
                    } catch (e) {
                        console.log(e);
                    }
                })();
                doThese.push(d);
            }

            if (path === 'y') {
                let e = (async () => {
                    try {
                        let response = await fetch("https://thecarney2.ngrok.io/p2/parkloop");
                        let data = await response.json();
                        jsonPath.push(data);
                        lyrPath = makeLayerPath(jsonPath);
                        lyrPathfAccess = makeLayerPath(jsonPath, filterAccess);
                        await lyrPath;
                        await lyrPathfAccess;
                        //mapPath = await lyrPath;
                    } catch (e) {
                        console.log(e);
                    }
                })();
                doThese.push(e);
            }

            if (groundCover === 'y') {
                let f = (async () => {
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
                        //mapGroundCover = await lyrGroundCover;
                    } catch (e) {
                        console.log(e);
                    }
                })();
                doThese.push(f);
            }

            if (court === 'y') {
                let g = (async () => {
                    try {
                        let response = await fetch("https://thecarney2.ngrok.io/p2/bbcourt");
                        let data = await response.json();
                        jsonCourt.push(data);
                        lyrCourt = makeLayerCourt(jsonCourt);
                        lyrCourtfAccess = makeLayerCourt(jsonCourt, filterAccess);
                        await lyrCourt;
                        await lyrCourtfAccess;
                        //mapCourt = await lyrCourt;
                    } catch (e) {
                        console.log(e);
                    }
                })();
                doThese.push(g);
            }

            if (reports === 'y') {
                let h = (async () => {
                    try {
                        let response = await fetch("https://thecarney2.ngrok.io/p2/reports");
                        let data = await response.json();
                        jsonReports = [];
                        jsonReports.push(data);
                    } catch (e) {
                        console.log(e);
                    }
                })();
                doThese.push(h);
            }
            fresh++;
            // promise all called
            let everything = await Promise.all(doThese);
        }

    }

    // "makeLayer..." takes JSON and returns Leaflet "layers" (i.e. features) as L.GeoJSON feature groups
    // some functions take a filter parameter to allow creation of a filtered L.GeoJSON feature group
    function makeLayerPhoto(data, callback = function () {
    }) {
        let lyr = L.geoJSON(null, {
            pointToLayer: function (feature, latlng) { ///data-fa-transform="left-3.25 up-3.25"
                let iconPhoto = L.divIcon({
                    className: 'fa-icon-photo',
                    html: '<div class="fa-2x">\n' +
                        '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                        '    <i class="far fa-circle" data-fa-transform="grow-1 left-3.25 up-3.25" style="color:#fdfbfe"></i>\n' +
                        '    <i class="fas fa-circle" data-fa-transform="left-3.25 up-3.25" style="color:#2943dc"></i>\n' +
                        '    <i class="fa-inverse fas fa-camera" data-fa-transform="shrink-8 left-3.25 up-3.25"></i>\n' +
                        '  </span></div>',
                    iconSize: [15, 15],
                    popupAnchor: [5, -3]
                });
                return L.marker(latlng, {
                    icon: iconPhoto,
                    opacity: 1,
                    pane: 'photo',
                    id: feature.properties.f1
                });
            },
            onEachFeature: function (feature, layer) {
                let popup = L.popup({
                    closeButton: false,
                    className: 'popup-blue',
                    maxWidth: 'auto',
                    autoPanPaddingTopLeft: L.point(60, 40),
                    offset: L.point(-4, -4)
                })
                    .setContent('<img src="https://thecarney2.ngrok.io/images/'
                        + layer.feature.properties.f4 +
                        '" alt="pic" style="width: 275px;height: 275px;border-radius: 4px";">' +
                        '<strong>Caption</strong><i>: ' + layer.feature.properties.f2 + '</i>' +
                        '<br><strong>Facing</strong><i>: ' + layer.feature.properties.f5 + '</i>');
                layer.bindPopup(popup);
            }
        });

        lyr.addData(data[0]);
        callback();
        return lyr;
    }

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
    }

    function makeLayerEquipment(data, filter = function () {
        return true;
    }) {
        let iconSwingSet = L.divIcon({
            className: 'fa-icon-swingset',
            html: '<div class="fa-2x">\n' +
                '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                '    <i class="far fa-circle" data-fa-transform="grow-1  left-3.25 up-3.25" style="color:#fdfbfe"></i>\n' +
                '    <i class="fas fa-circle" data-fa-transform="left-3.25 up-3.25" style="color:#207375"></i>\n' +
                '    <i class="fa-inverse fas fa-rocket" data-fa-transform="shrink-6 left-3.25 up-3.25"></i>\n' +
                '  </span></div>',
            iconSize: [15, 15],
            popupAnchor: [5, -3]
        });
        let iconPlayStructure = L.divIcon({
            className: 'fa-icon-playstructure',
            html: '<div class="fa-2x">\n' +
                '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                '    <i class="far fa-circle" data-fa-transform="grow-1 left-3.25 up-3.25" style="color:#fdfbfe"></i>\n' +
                '    <i class="fas fa-circle" data-fa-transform="left-3.25 up-3.25" style="color:#1c2e75"></i>\n' +
                '    <i class="fa-inverse fas fa-shapes" data-fa-transform="shrink-6 left-3.25 up-3.25"></i>\n' +
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
                        pane: 'equipment',
                        layerID: feature.properties.f5 + '_' + feature.properties.f1
                    });
                } else {
                    return L.marker(latlng, {
                        icon: iconPlayStructure,
                        opacity: 1,
                        pane: 'equipment',
                        layerID: feature.properties.f5 + '_' + feature.properties.f1
                    });
                }
            },
            onEachFeature: function (feature, layer) {
                let popup = L.popup({
                    closeButton: false,
                    className: 'popup-blue',
                    maxWidth: 250,
                    autoPanPaddingTopLeft: L.point(60, 40),
                    offset: L.point(-4, -4)
                })
                    .setContent('<strong>' + layer.feature.properties.f2 + '</strong><br><i>' +
                        layer.feature.properties.f3 +
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4 +
                        '<div class="col text-center m-0 p-0"><button class="btn btn-primary btn-sm p-1" type="button" id="btnCreateReportModal" style="box-shadow: none; border: 1px solid #656565">Make Report</button>'
                    );
                layer.bindPopup(popup);
            },
            filter: filter
        });

        lyr.addData(data[0]);

        return lyr;
    }

    function makeLayerSeating(data, filter = function () {
        return true;
    }) {
        let iconBench = L.divIcon({
            className: 'fa-icon-bench',
            html: '<div class="fa-2x">\n' +
                '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                '    <i class="far fa-circle" data-fa-transform="grow-1 left-3.25 up-3.25" style="color:#fdfbfe"></i>\n' +
                '    <i class="fas fa-circle" data-fa-transform="left-3.25 up-3.25" style="color:#75543a"></i>\n' +
                '    <i class="fa-inverse fas fa-chair" data-fa-transform="shrink-6  left-3.25 up-3.25"></i>\n' +
                '  </span></div>',
            iconSize: [15, 15],
            popupAnchor: [5, -3]
        });
        let iconTable = L.divIcon({
            className: 'fa-icon-table',
            html: '<div class="fa-2x">\n' +
                '  <span class="fa-layers " style="background:rgba(0,0,0,0)">\n' +
                '    <i class="far fa-circle" data-fa-transform="grow-1  left-3.25 up-3.25" style="color:#fdfbfe"></i>\n' +
                '    <i class="fas fa-circle" data-fa-transform="left-3.25 up-3.25" style="color:#dc7f2f"></i>\n' +
                '    <i class="fa-inverse fas fa-glass-whiskey fa-rotate-180" data-fa-transform="shrink-6  left-3.25 up-3.25"></i>\n' +
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
                        pane: 'seats',
                        layerID: feature.properties.f5 + '_' + feature.properties.f1
                    });
                } else {
                    return L.marker(latlng, {
                        icon: iconBench,
                        opacity: 1,
                        pane: 'seats',
                        layerID: feature.properties.f5 + '_' + feature.properties.f1
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
                        offset: L.point(-4, -4)
                    })
                        .setContent('<i>' +
                            layer.feature.properties.f3 +
                            '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4 +
                            '<div class="col text-center m-0 p-0"><button class="btn btn-primary btn-sm p-1" type="button" id="btnCreateReportModal" style="box-shadow: none; border: 1px solid #656565">Make Report</button>'
                        );
                    layer.bindPopup(popup);
                } else {
                    let popup = L.popup({
                        closeButton: false,
                        className: 'popup-brown',
                        maxWidth: 250,
                        autoPanPaddingTopLeft: L.point(60, 40),
                        offset: L.point(-4, -4)
                    })
                        .setContent('<i>' +
                            layer.feature.properties.f3 +
                            '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4 +
                            '<div class="col text-center m-0 p-0"><button class="btn btn-primary btn-sm p-1" type="button" id="btnCreateReportModal" style="box-shadow: none; border: 1px solid #656565">Make Report</button>'
                        );
                    layer.bindPopup(popup);
                }
            },
            filter: filter
        });

        let arr = data;
        let arrLen = arr.length;
        for (let i = 0; i < arrLen; i++) {
            lyr.addData(arr[i]);
        }

        return lyr;
    }

    function makeLayerPath(data, filter = function () {
        return true;
    }) {
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
    }

    function makeLayerGroundCover(data, filter = function () {
        return true;
    }) {
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

        let lyr = L.geoJSON(null, {
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
                            '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4 +
                            '<div class="col text-center m-0 p-0"><button class="btn btn-primary btn-sm p-1" type="button" id="btnCreateReportModal" style="box-shadow: none; border: 1px solid #656565">Make Report</button>'
                        );
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
                            '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4 +
                            '<div class="col text-center m-0 p-0"><button class="btn btn-primary btn-sm p-1" type="button" id="btnCreateReportModal" style="box-shadow: none; border: 1px solid #656565">Make Report</button>'
                        );
                    layer.bindPopup(popup);
                } else if (feature.properties.f5 === "pavement") {
                    let popup = L.popup({
                        closeButton: false,
                        className: 'popup-grey',
                        maxWidth: 250,
                        autoPanPaddingTopLeft: L.point(60, 40),
                        offset: L.point(0, -4)
                    })
                        .setContent('<strong>' + layer.feature.properties.f2 + '</strong>' +
                            '<div class="col text-center m-0 p-0"><button class="btn btn-primary btn-sm p-1" type="button" id="btnCreateReportModal" style="box-shadow: none; border: 1px solid #656565">Make Report</button>'
                        );
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
                            '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4 +
                            '<div class="col text-center m-0 p-0"><button class="btn btn-primary btn-sm p-1" type="button" id="btnCreateReportModal" style="box-shadow: none; border: 1px solid #656565">Make Report</button>'
                        );
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
                            '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4 +
                            '<div class="col text-center m-0 p-0"><button class="btn btn-primary btn-sm p-1" type="button" id="btnCreateReportModal" style="box-shadow: none; border: 1px solid #656565">Make Report</button>'
                        );
                    layer.bindPopup(popup);
                }
            },
            filter: filter
        });

        let arr = data;
        let arrLen = arr.length;
        for (let i = 0; i < arrLen; i++) {
            lyr.addData(arr[i]);
        }

        return lyr;

    }

    function makeLayerCourt(data, filter = function () {
        return true;
    }) {

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
                        '</i><br><strong>Accessible? </strong>' + layer.feature.properties.f4 +
                        '<div class="col text-center m-0 p-0"><button class="btn btn-primary btn-sm p-1" type="button" id="btnCreateReportModal" style="box-shadow: none; border: 1px solid #656565">Make Report</button>'
                    );
                layer.bindPopup(popup);
            },
            filter: filter
        });

        lyr.addData(data[0]);

        return lyr;

    }

    function makeLayerIDs() {  // for layers that can have reports

        mapEquipment.eachLayer(function (layer) {
            tableName = layer.feature.properties.f5;
            dbID = layer.feature.properties.f1;
            layer.layerID = tableName + "_" + dbID;
            //console.log(tableName+"_"+dbID);
        });

        mapSeating.eachLayer(function (layer) {
            tableName = layer.feature.properties.f5;
            dbID = layer.feature.properties.f1;
            layer.layerID = tableName + "_" + dbID;
            //console.log(tableName+"_"+dbID);
        });

        mapGroundCover.eachLayer(function (layer) {
            tableName = layer.feature.properties.f6;
            dbID = layer.feature.properties.f1;
            layer.layerID = tableName + "_" + dbID;
            //console.log(tableName+"_"+dbID);
        });

        mapCourt.eachLayer(function (layer) {
            tableName = layer.feature.properties.f5;
            dbID = layer.feature.properties.f1;
            layer.layerID = tableName + "_" + dbID;
            //console.log(tableName+"_"+dbID);
        });
    }

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
        let map = L.mapbox.map('map', null, {zoomControl: false, attributionControl: false});
        map.setView([37.6913, -121.72615], 17);

        // pane for highlights
        map.createPane('highlight').style.zIndex = 615;
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

    function addOnLoadPopup() {
        let popupOnLoad = L.popup({
            closeButton: false,
            className: 'popup-on-load',
            offset: L.point(0, 0),
            maxWidth: 215,
            keepInView: false,
            autoPan: false
        })
            .setLatLng([37.6912, -121.72615])
            .setContent('<div><h6 class="mb-0 pb-1">Welcome to Tex Spruiell</h6><p class="my-0, py-0">' +
                ' <small> Enjoy exploring your <br> neighborhood park! </small> </p></div>')
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

    function addScaleControl() {
        // scale
        L.control.scale({metric: false, position: 'bottomleft'}).addTo(map);
    }

    function addHomeButtonControl() {
        // home button
        L.easyButton('<i class="fas fa-home myCustomHomeButton" data-fa-transform="grow-4 up-2"></i>', function () {
            map.setView([37.6903, -121.72615], 17);
        }, {position: 'topright'}).addTo(map);
    }

    function addLocateUserControl() {
        // geolocate user control
        L.control.locate({
            icon: 'fas fa-crosshairs ',
            iconElementTag: 'span',
            keepCurrentZoomLevel: true,
            position: 'topright',
            locateOptions: {
                enableHighAccuracy: true
            }
        }).addTo(map);
    }

    function addLayerControlEasyButton() {
        // reserves control's position in stack
        // div with icon for easy button
        htmlString =
            '<div class="p-0 m-0 layersPopoverDataToggle" tabindex = "0" id="layersPopover" data-toggle="popover">' +
            '<i id="layersIcon" tabindex = "0" class="fas fa-layer-group myCustomHomeButton filterButton" data-fa-transform="grow-3 up-1"></i>' +
            '</div>';

        let state = 'closed';
        L.easyButton(htmlString, function () {
            if (state === 'closed') {
                state = 'open';
                $('#layersIcon').css('color', '#008b1f');
            } else {
                state = 'closed';
                $('#layersIcon').css('color', '#323232');
            }
        }).addTo(map);

        //initialize popover
        $(function () {
            $('#layersPopover').popover({
                title: "Layers",
                html: true,
                content: $("#layersControl"), // div with checks/radios/buttons
                placement: 'right',
                trigger: 'click',
                container: 'popovers',
                viewport: {selector: '#map', padding: 5}
            })
        });

        // listener to close popover on lose focus/click outside popover)
        $('body').on('click', function (e) {
            $('[data-toggle="popover"]').each(function () {
                if ($(this).hasClass('layersPopoverDataToggle') && !$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                    $(this).popover('hide');
                    $('#layersIcon').css('color', '#323232');
                    state = 'closed';
                }
            });
        });
    }

    function addLayerControl() {
        // leaflet control
        layerControl = L.control.layers({
            'Streets': baseStreets.addTo(map),
            'Satellite': baseAerial
        }, {
        }, {
            position: 'topleft',
            collapsed: false
        }).addTo(map);

        moveLayerControlToPopover(layerControl);

        // make a hidden polygon overlay for tap interaction design
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

    function moveLayerControlToPopover(layerControl) {
        // now that layer control is ready, move it to popover
        let htmlObject = layerControl.getContainer();
        let a = document.getElementById('layersControl');

        function setParent(el, newParent) {
            newParent.appendChild(el);
        }

        setParent(htmlObject, a);
    }

    function addRoutingControl() {
        // constructors with token
        let routerMapbox = L.Routing.mapbox('pk.eyJ1IjoiamhjYXJuZXkiLCJhIjoiY2p0Z2k5Nzh0MDRkZDN5cDJidmk0c2lwMyJ9.lchq4koczU1lPsZOZ8pWew');

        // includes localization
        let geocoderMapbox = L.Control.Geocoder.mapbox(
            'pk.eyJ1IjoiamhjYXJuZXkiLCJhIjoiY2p0Z2k5Nzh0MDRkZDN5cDJidmk0c2lwMyJ9.lchq4koczU1lPsZOZ8pWew',
            {
                geocodingQueryParams: {
                    proximity: L.latLng(37.6909, -121.72615),
                    country: 'us'
                },
                reverseQueryParams: {
                    proximity: L.latLng(37.6909, -121.72615),
                    country: 'us'
                },
            });

        // configure with options
        let routingControl = L.Routing.control({
            show: true,
            collapse: false,
            collapsible: false,
            position: 'topright',
            routeWhileDragging: true,
            router: routerMapbox,
            geocoder: geocoderMapbox,
            waypointMode: 'connect',
            units: 'imperial',
            lineOptions: {
                addWaypoints: false
            },
            fitSelectedRoutes: false,
            createMarker: function (i, wp, nWps) { // marker constructor
                let mkr = L.marker(wp.latLng, {
                    pane: 'newPhoto',              // reusing a pane with a high z value
                    draggable: true
                });
                return mkr;
            }
        });

        // control button with state logic
        let state = 'control CLOSED and INACTIVE';
        L.easyButton('<i id="directionsIcon" class="fas fa-directions myCustomHomeButton" data-fa-transform="grow-8 up-2"></i>',
            function () {

                if (state === 'control CLOSED and INACTIVE') {
                    // load control
                    state = 'control OPEN and ACTIVE';
                    routingControl.setWaypoints([undefined, L.latLng(37.6905, -121.72615)]);
                    routingControl.show();
                    $('#directionsIcon').css('color', '#0030FF');

                } else if (state === 'control OPEN and ACTIVE') {
                    // just hide control
                    state = 'control CLOSED and ACTIVE';
                    routingControl.hide();

                } else if (state === 'control CLOSED and ACTIVE') {
                    // deactivate, i.e. reset
                    state = 'control CLOSED and INACTIVE';
                    routingControl.hide();
                    routingControl.setWaypoints([undefined, undefined]);
                    $('#directionsIcon').css('color', '#323232');
                }
            }, {position: 'topright'}).addTo(map);

        routingControl.addTo(map);
        routingControl.hide();  // the Easy Button triggers the control, but the control isnt actually attached to the button

        // fit to route with buffer
        routingControl.on('routeselected', function (e) {
            let route = e.route;
            let line = L.Routing.line(route);
            let bounds = line.getBounds();
            map.fitBounds(bounds, {padding: [50, 50]});
        });
    }

    function addFilterControl() {
        // div with icon for easy button
        let htmlString =
            '<div class="p-0 m-0 myCustomFilterPopover" id="filterPopover" data-toggle="popover"><i id="filterIcon" class="fas fa-filter myCustomHomeButton" data-fa-transform="grow-3 up-1" style="color:#323232" ></i></div>';

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

        // close popover on lose focus
        $('body').on('click', function (e) {
            $('[data-toggle="popover"]').each(function () {
                if ($(this).hasClass('myCustomFilterPopover') && !$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                    $(this).popover('hide');
                }
            });
        });

        // handle selections and filter layers
        $('input:radio').on('click', function (e) {
            //console.log(e.currentTarget.value); //e.currenTarget.value points to the property value of the 'clicked' target.
            if (e.currentTarget.value.valueOf() === "All") {
                $('#filterIcon').css('color', '#323232');
                fShowAllFeatures();
            } else {
                $('#filterIcon').css('color', '#0030FF');
                fShowAccessibleFeatures();
            }
        });

    }

    function fShowAllFeatures() {
        // change layer groups

        map.removeLayer(mapEquipment);
        map.removeLayer(mapSeating);
        map.removeLayer(mapPath);
        map.removeLayer(mapGroundCover);
        map.removeLayer(mapCourt);

        // set layergroups to default version
        // this assignment seems to work when both are LayerGroups
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
    }

    function fShowAccessibleFeatures() {
        // change layer groups

        map.removeLayer(mapEquipment);
        map.removeLayer(mapSeating);
        map.removeLayer(mapPath);
        map.removeLayer(mapGroundCover);
        map.removeLayer(mapCourt);

        // set layergroups to accessible version
        // this assignment seems to work when both are LayerGroups
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
    }

    function addPostPhotoControl() {
        // photo button
        let htmlString =
            '<span class="fa-layers fa-fw" style="background:rgba(255,228,225,0)">\n' +
            '    <i class="fas fa-camera addPhotoIcon" style="color:#323232" data-fa-transform="grow-4 down-1 left-1"></i>\n' +
            '    <i class="fas fa-circle addPhotoIcon" style="color:#323232" data-fa-transform="shrink-0 up-8 right-8"></i>\n' +
            '    <i class="fas fa-circle fa-inverse" data-fa-transform="shrink-3 up-8 right-8"></i>\n' +
            '    <i class="fas fa-plus addPhotoIcon" style="color:#323232" data-fa-transform="shrink-6 up-8 right-8"></i>\n' +
            '  </span>';

        // store last new marker
        let newPhotoMarker;

        // control constructor and click logic
        let state = 'closed';
        L.easyButton(htmlString, function () {
            if (state === 'closed') {
                state = 'open';
                $('.addPhotoIcon').css('color', '#0030FF');

                // map marker logic
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

                newPhotoMarker = new L.marker(markerLatLng, {
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
                    '<button class="btn btn-light text-dark btn-sm p-1" type="button" id="btnCancelNewPhoto" style="box-shadow: none; border: 1px solid #656565">Close</button></div>');

                newPhotoMarker.bindPopup(popup);
                newPhotoMarker.addTo(map);
                newPhotoMarker.dragging.enable();
                newPhotoMarker.openPopup();
                newPhotoMarker.on('dragend', function () { newPhotoMarker.openPopup(); });
            } else {
                state = 'closed';
                map.removeLayer(newPhotoMarker);
                $('.addPhotoIcon').css('color', '#323232');
            }
        }).addTo(map);

        // click event for buttons in popup
        $('#map').on('click', '#btnOpenPhotoModal', function () {
            //console.log('clicked add photo button');
            // open modal, pass latlon to form
            let lat = newPhotoMarker.getLatLng().lat;
            let latRnd = round(lat, 6);
            let lon = newPhotoMarker.getLatLng().lng;
            let lonRnd = round(lon, 6);
            $("#modalPhotoLatLon").val(latRnd + ", " + lonRnd);
            $('#modalPhotoLatLon').prop('readonly', true);
            //console.log(latRnd + ", " + lonRnd);
            $("#modalPhoto").modal('show');
            // remove the temp layer at the end
            map.removeLayer(newPhotoMarker);

            // round the lat lon
            function round(number, precision) {
                let shift = function (number, exponent) {
                    let numArray = ("" + number).split("e");
                    return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + exponent) : exponent));
                };
                return shift(Math.round(shift(number, +precision)), -precision);
            };
            state = 'closed';
            $('.addPhotoIcon').css('color', '#323232');
        });

        $('#map').on('click', '#btnCancelNewPhoto', function () {
            //console.log('clicked close button on add photo');
            map.removeLayer(newPhotoMarker);
            state = 'closed';
            $('.addPhotoIcon').css('color', '#323232');
        });
    }

    function validateAndSendPhotoPostForm() {
        // validation and post for make photo
        $("#btnSubmitPhoto").on('click', function () {
            // get photo form
            let photoForm = document.getElementById("formPhoto");
            // not valid
            if (photoForm.checkValidity() === false) {
                event.preventDefault();
                event.stopPropagation();
                //console.log("invalid");
                photoForm.classList.add('was-validated');
            } else {
                //console.log("valid");
                // build form data, append fields before file

                let latlon = document.getElementById('modalPhotoLatLon').value;
                //console.log(latlon);

                let caption = document.getElementById('validationCustom02').value;
                //console.log(caption);

                let facing = document.getElementById('validationCustom03').value;
                //console.log(facing);

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
                $('#modalPhoto').modal('hide');
                setTimeout(function(){ $('#modalLoading').modal('show'); }, 200);

                // post and show modals to user
                $.ajax({
                    url: 'https://thecarney2.ngrok.io/p2/postPhoto',
                    data: formData,
                    type: 'POST',
                    contentType: false,
                    processData: false,
                    success: function (data, status, jqXHR) {
                        //console.log("photo posted");
                        setTimeout(function(){ $('#modalLoading').modal('hide'); }, 100);
                        setTimeout(function(){ $('#modalSuccess').modal('show'); }, 300);
                        loadNewPhotosAfterPost();
                    },
                    error: function (jqXHR, status, err) {
                        //console.log("error posting photo");
                        setTimeout(function(){ $('#modalLoading').modal('hide'); }, 100);
                        setTimeout(function(){ $('#modalFailure').modal('show'); }, 300);
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
    }

    function loadNewPhotosAfterPost() {
        // add the new one to the existng layer

        let newPhotoLayer = L.layerGroup();

        // make photo layer from server again
        loadEverything({photos: 'y'}).then((response) => {

            map.removeLayer(mapPhoto);

            newPhotoLayer = makeLayerPhoto(jsonPhoto);
            //newPhotoLayer.addTo(map);  // this works

        }).then((response) => {
            // get biggest id for new layer
            maxId = 0;
            newPhotoLayer.eachLayer(function (layer) {

                if (layer.feature.properties.f1 > maxId) {
                    maxId = layer.feature.properties.f1;
                    //console.log(maxId);
                }
            });

            newPhotoLayer.eachLayer(function (layer) {
                if (layer.feature.properties.f1 === maxId) {
                    layer.addTo(mapPhoto);
                }
            });
        }).then((response) => {
            mapPhoto.addTo(map);
        });
    }

    function addReportControl() {
        // table constructor
        datatable = $('#report_table_1').DataTable({
            searching: false,
            lengthMenu: false,
            lengthChange: false,
            pageLength: 1,
            paging: true,
            scrollX: true,
            info: false,
            scrollY: 150,
            scrollCollapse: false,
            data: jsonReports[0].rows,
            responsive: false,
            select: 'single',
            autoWidth: true,
            columns: [
                {title: 'ID', data: "id"},
                //{ title: 'Name', data: "tsrelfeature" },
                {title: 'Type', data: "tstype"},
                {title: 'Status', data: "tsstatus"},
                {title: 'Details', data: "tsdetails"},
                //{ title: 'Date Mod.', data: "tsdtmod", type: 'date', render: function (data, type, row, meta) { return data.substring(0,10); } }
            ]
        });

        // control icon
        let htmlString =
            '<span id="reportsPopover" data-toggle="popover" class="fa-layers fa-fw myCustomReportPopover p-0 m-0 " style="background:rgba(255,228,225,0)">\n' +
            '    <i id="reportsIcon" class="fas fa-file-exclamation" data-fa-transform="grow-7 right-1 up-1"></i>\n' +
            '  </span>';

        // make control and state logic
        let int = 0;
        L.easyButton(htmlString, function () {
            datatable.order([0, 'asc']).draw();
            $('#footer1').popover('toggle');
            int++;
            if (int % 2 === 1) {
                $('#reportsIcon').css('color', '#008b1f');
                map.setView([37.6892, -121.72615], 17);
            } else {
                $('#reportsIcon').css('color', '#323232');
                map.removeLayer(mapHighlights);
                mapHighlights.clearLayers();
            }
            datatable.draw();
        }).addTo(map);

        //initialize popover
        $(function () {
            $('#footer1').popover({
                title: "Reports",
                html: true,
                content: $("#reportsContainer"), // push this div into the popover
                placement: 'top',
                container: 'body',
                trigger: 'manual',
                template: '<div class="popover popoverCustomTable" role="tooltip"><h3 class="popover-header"></h3><div class="popover-body"></div></div>'
            })
        });

        // event for selection
        datatable.on('select', function (e, dt, type, indexes) {
            // get the row and related feature name
            let cell = dt.cell('.selected', 0).index();
            let data = dt.row(cell.row).data();
            let featID = data.tsrelfeature;
            // call function to highlight it on map
            highlightFeature(featID);
        });

        // event for deselection
        datatable.on('deselect', function (e, dt, type, indexes) {
            map.removeLayer(mapHighlights);
            mapHighlights.clearLayers();
        });

        // click event for buttons in popup to create report
        $('#map').on('click', '#btnCreateReportModal', function () {
            // get feature, push to modal
            $('#modalReportFeatureID').val(activeLayerID);
            $('#modalReportFeatureID').prop('readonly', true);
            $("#modalCreateReport").modal('show');
        });
    }

    function highlightFeature(featureCode) {
        // loops all features in the four layer groups that can have reports to find the match
        // once found, make a copy of the feature, styles it pink, and adds it to the 'highlight' pane
        mapEquipment.eachLayer(function (layer) {
            if (layer.layerID === featureCode) {
                //console.log('match found: ' + layer.layerID);
                let coords = layer.feature.geometry.coordinates[0];
                let lat = coords[1];
                let lon = coords[0];
                let latLng = L.latLng(lat, lon);

                let highlightLayer = L.circleMarker(latLng, {
                    pane: 'highlight',
                    radius: 15,
                    stroke: true,
                    color: '#FE00EC',
                    weight: 5,
                    opacity: .9,
                    fill: false
                });

                map.removeLayer(mapHighlights);
                mapHighlights.clearLayers();
                highlightLayer.addTo(mapHighlights);
                mapHighlights.addTo(map);
            }
        });

        mapSeating.eachLayer(function (layer) {
            if (layer.layerID === featureCode) {
                //console.log('match found: ' + layer.layerID);
                let coords = layer.feature.geometry.coordinates[0];
                let lat = coords[1];
                let lon = coords[0];
                let latLng = L.latLng(lat, lon);

                let highlightLayer = L.circleMarker(latLng, {
                    pane: 'highlight',
                    radius: 15,
                    stroke: true,
                    color: '#FE00EC',
                    weight: 5,
                    opacity: .9,
                    fill: false
                });

                map.removeLayer(mapHighlights);
                mapHighlights.clearLayers();
                highlightLayer.addTo(mapHighlights);
                mapHighlights.addTo(map);
            }
        });

        mapGroundCover.eachLayer(function (layer) {
            if (layer.layerID === featureCode) {
                let json = layer.toGeoJSON();
                let highlightLayer = L.geoJSON(json, {
                    pane: 'highlight',
                    style: {
                        fill: false,
                        stroke: true,
                        color: '#FE00EC',
                        weight: 10,
                        opacity: 0.7,
                        lineCap: 'round',
                        lineJoin: 'round',
                    }
                });
                map.removeLayer(mapHighlights);
                mapHighlights.clearLayers();
                highlightLayer.addTo(mapHighlights);
                mapHighlights.addTo(map);
            }
        });

        mapCourt.eachLayer(function (layer) {
            if (layer.layerID === featureCode) {
                let json = layer.toGeoJSON();
                let highlightLayer = L.geoJSON(json, {
                    pane: 'highlight',
                    style: {
                        fill: false,
                        stroke: true,
                        color: '#FE00EC',
                        weight: 10,
                        opacity: 0.7,
                        lineCap: 'round',
                        lineJoin: 'round',
                    }
                });
                map.removeLayer(mapHighlights);
                mapHighlights.clearLayers();
                highlightLayer.addTo(mapHighlights);
                mapHighlights.addTo(map);
            }
        });
    }

    function validateAndSendPostReportForm() {
        // form feedback for details length
        let text_max = 200;
        $('#count_message').html(text_max + ' remaining');
        $('#inputGroupReportDetails').keyup(function () {
            let text_length = $('#inputGroupReportDetails').val().length;
            let text_remaining = text_max - text_length;
            $('#count_message').html(text_remaining + ' remaining');
        });

        // validation and post for make photo
        $("#btnSubmitReport").on('click', function () {
            // get form
            let reportForm = document.getElementById("formCreateReport");
            // not valid
            if (reportForm.checkValidity() === false) {
                event.preventDefault();
                event.stopPropagation();
                //console.log("invalid");
                reportForm.classList.add('was-validated');
            } else {
                //console.log("valid");
                // build form data, append fields before file

                let featureCode = document.getElementById('modalReportFeatureID').value;
                //console.log(featureCode);

                let details = document.getElementById('inputGroupReportDetails').value;
                //console.log(details);

                let type = document.getElementById('validationReportType').value;
                //console.log(type);

                let email1 = document.getElementById('inputCreateReportEmailUsername').value;
                let email2 = document.getElementById('inputCreateReportEmailProvider').value;
                let email = email1 + '@' + email2;
                //console.log(email);

                let phone = document.getElementById('inputCreateReportPhone').value;
                //console.log(phone);

                let formData = new FormData();
                formData.append('tsrelfeature', featureCode);
                formData.append('tsdetails', details);
                formData.append('tstype', type);
                formData.append('tsemail', email);
                formData.append('tsphone', phone);

                // toggle modal, open loading modal
                $('#modalCreateReport').modal('hide');
                setTimeout(function(){ $('#modalLoading').modal('show'); }, 200);

                // post and show modals to user
                $.ajax({
                    url: 'https://thecarney2.ngrok.io/p2/postReport',
                    data: formData,
                    type: 'POST',
                    contentType: false,
                    processData: false,
                    success: function (data, status, jqXHR) {
                        //console.log("report posted");
                        setTimeout(function(){ $('#modalLoading').modal('hide'); }, 100);
                        setTimeout(function(){ $('#modalSuccess').modal('show'); }, 300);
                        loadNewReportsAfterPost();
                    },
                    error: function (jqXHR, status, err) {
                        //console.log("error posting photo");
                        setTimeout(function(){ $('#modalLoading').modal('hide'); }, 100);
                        setTimeout(function(){ $('#modalFailure').modal('show'); }, 300);
                    }
                })
            }
        });
    }

    function loadNewReportsAfterPost() {
        // fetch updated report data from server again and update the DataTable
        loadEverything({reports: 'y'}).then((response) => {
            map.removeLayer(mapHighlights);
            mapHighlights.clearLayers();
            datatable.clear().draw();
            datatable.rows.add(jsonReports[0].rows).draw();
        });
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