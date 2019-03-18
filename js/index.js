/* ATTRIBUTIONS */

// call map initialize functions after page ready
$(document).ready(initialize);

// starting point for script
function initialize() {
    // resize function wraps the main function to allow responsive sizing of panel with map
    let defaultMap = resize(map('default'));

    //let directionsMap = resize(map('directions'));


}

// Main
function map(type) {
    // sub-functions employed mostly for code management and ordered to minimize passing of objects

    let arr = setupMap();
    let map = arr[0];
    let baseStreets = arr[1];
    let baseAerial = arr[2];

    setupListeners();

    addScaleControl();

    addHomeButtonControl();

    addLocateUserControl();

    addPostPhotoControl();

    addFilterControl();

    addOnLoadPopup();

    let lyrPhoto = makeLayerPhoto(function () {});
    let lyrTrees = makeLayerTrees();
    let lyrEquipment = makeLayerEquipment();
    let lyrSeating = makeLayerSeating();
    let lyrPath = makeLayerPath();
    let lyrGroundCover = makeLayerGroundCover();
    let lyrCourt = makeLayerCourt();

    addLayerControlAndDefaultLayers();


    let reports = fetch("https://thecarney2.ngrok.io/p2/reports")
        .then(function (response) {
            return response.json();
        })
        .then(function (myJson) {
            //console.log(JSON.stringify(myJson));
        });


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
                        console.log(data);

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
        htmlString =
            '<div class="p-0 m-0" id="filterPopover" data-toggle="popover">' +
            '<i class="fas fa-filter myCustomHomeButton filterButton" data-fa-transform="grow-3 up-1"></i>' +
            '</div>';

        L.easyButton(htmlString, function () {
            // doesnt need anything for popover to work
        }).addTo(map);

        //initialize popover
        $(function () {
            $('#filterPopover').popover({
                title: "Filters",
                html: true,
                content: $("#filters"), // div with checks/radios/buttons
                placement: 'right',
                trigger: 'click'
            })
        });

        // handle selections and filter layers

        //setupFilters();

        function setupFilters() {
            let filters = document.getElementById('filters');
            let types = ['All', 'Accessible'];
            let checkboxes = [];
            for (let i = 0; i < types.length; i++) {
                // Create an an input checkbox and label inside.
                let item = filters.appendChild(document.createElement('div'));
                let checkbox = item.appendChild(document.createElement('input'));
                let label = item.appendChild(document.createElement('label'));
                checkbox.type = 'checkbox';
                checkbox.id = types[i];
                checkbox.checked = true;
                // create a label to the right of the checkbox with explanatory text
                label.innerHTML = types[i];
                label.setAttribute('for', types[i]);
                // Whenever a person clicks on this checkbox, call the update().
                checkbox.addEventListener('change', update);
                checkboxes.push(checkbox);
            }
            console.log(checkboxes);
        }  //// not working

        function update() {
            let enabled = {};
            // Run through each checkbox and record whether it is checked. If it is,
            // add it to the object of types to display, otherwise do not.
            for (let i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].checked) enabled[checkboxes[i].id] = true;
            }
            lyrSeating.setFilter(function(feature) {
                // If this symbol is in the list, return true. if not, return false.
                // The 'in' operator in javascript does exactly that: given a string
                // or number, it says if that is in a object.
                // 2 in { 2: true } // true
                // 2 in { } // false
                return (feature.properties['marker-symbol'] in enabled);
            });
        }  //// not working

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
            collapsed: false
        }).addTo(map);

        moveLayerControlToPopover(layerControl);

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

    function makeLayerPhoto(callback) {
        let lyrFinal = L.geoJSON();

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
                });
                callback();
            })
            .addTo(lyrFinal);
        return lyrFinal;
    }  // geoJSON

    function makeLayerTrees() {
        // Mapbox featureLayer for its async loading
        // then extract its json and pass to L.geoJSON, to allow pane assignment
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
    }  // geoJSON

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

        let lyr = L.geoJSON();

        let lyrEquipment = L.mapbox.featureLayer(null, {
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
            })
            .addTo(lyr);
        return lyr;
    }  // geoJSON

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

        let lyr = L.geoJSON();
        //let lyr = L.mapbox.featureLayer();

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
    }  // geoJSON

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
    }  // geoJSON

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
    }  // geoJSON

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
    }  // geoJSON

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