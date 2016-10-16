//some global vars here
var ergdata = null;
var ergadataVals = new Array();
var classSeries;
var classColors;
var map;
var nomoiLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
   format: new ol.format.GeoJSON({
    defaultDataProjection:'EPSG:3857'
    }),
  url: 'data/nomoi.simple.geojson',
  strategy: ol.loadingstrategy.bbox,
  style: setStyle
  })
});

var raster1 = new ol.layer.Tile({
  visible:true,
  source: new ol.source.OSM({
  url: 'http://mt{0-3}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
  })
});
var raster2 = new ol.layer.Tile({
  visible:false,
  source: new ol.source.OSM()
});
    new ol.layer.Tile({
            source: new ol.source.OSM()
        })

//and our methods here
 function geMapThemmatic(){  
 loadErganiData();
 }
/**
 * load the ergani data
 * @returns JSON array
 */
function loadErganiData() {
var monthFrom = parseInt(getDateFrom().split("/")[0]);
var yearFrom = parseInt(getDateFrom().split("/")[1]); 
var monthTo =  parseInt(getDateTo().split("/")[0]);
var yearTo =   parseInt(getDateTo().split("/")[1]);
var signifier = getSignifier();
  $.ajax({
    //rakadimia ΠΑΝΤΟΥ
    url: "http://rakadimia.gr/ntuaDemoService.php",
    async: false,
    data: {monthFrom: monthFrom, yearFrom: yearFrom,monthTo:monthTo,yearTo,yearTo,column:signifier},
    dataType: 'jsonp'
  }).done(function(resp) {
    ergdata = resp;
    matchDataWithSpatial(signifier);
  }).fail(function() {
    alert("there was an error loading ERGANH DATA")
  })
}
/**
 * load the geojson file holding nomoi,perifereies
 */
function matchDataWithSpatial(signifier){ 
ergadataVals = new Array();
  nomoiLayer.getSource().getFeatures().forEach(function(feat) {
      var feat_esid = feat.get("ESYE_ID");
      var columnToFind = signifier;
      var value = getValFromCode(ergdata, feat_esid, columnToFind);
      ergadataVals.push(value);
      console.log("value",value)
      feat.set("STYLEVAL", value);
      //siplify the geometry to improve performance
      //feat.setGeometry(feat.getGeometry().simplify(100));
    });
    getAndSetClassesFromData(ergadataVals, getClassNum(), getMethod(),signifier);
  nomoiLayer.setStyle(setStyle);
}



/**
 * function to verify the style for the feature
 */
function setStyle(feat) {
  var currVal = parseFloat(feat.get("STYLEVAL")); 
  var bounds = classSeries.bounds;
  var numRanges = new Array();
  for (var i = 0; i < bounds.length-1; i++) { 
  numRanges.push({
      min: parseFloat(bounds[i]),
      max: parseFloat(bounds[i+1])
    });  
  }
  //console.log("numRanges",numRanges)  
  var classIndex = verifyClassFromVal(numRanges, currVal);
  //console.log("classIndex",classIndex)
  //.log("currVal",currVal) 
  var polyStyleConfig = {
    stroke: new ol.style.Stroke({
      color: 'rgba(255, 0, 0,0.3)',
      width: 1
    })
  };

  var textStyleConfig = {};

  if (classIndex !== -1) {
    polyStyleConfig = {
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 255, 1.0)',
        width: 1
      }),
      fill: new ol.style.Stroke({
        color: hexToRgbA(classColors[classIndex])
      })
    };
    textStyleConfig = {
      text: new ol.style.Text({
        text: currVal.toString(),
        font: '12px Calibri,sans-serif',
        fill: new ol.style.Fill({
          color: "#000000"
        }),
        stroke: new ol.style.Stroke({
          color: "#FFFFFF",
          width: 2
        })
      }),
      geometry: function(feature) {
        var retPoint;
        if (feature.getGeometry().getType() === 'MultiPolygon') {
          retPoint = getMaxPoly(feature.getGeometry().getPolygons()).getInteriorPoint();
        } else if (feature.getGeometry().getType() === 'Polygon') {
          retPoint = feature.getGeometry().getInteriorPoint();
        }
        
        return retPoint;
      }
    }
  };

  var textStyle = new ol.style.Style(textStyleConfig);
  var style = new ol.style.Style(polyStyleConfig);
  return [style, textStyle];
}




function initMap(){

map = new ol.Map({
  layers: [raster1,raster2,nomoiLayer],
  target: document.getElementById('map'),
  view: new ol.View({
    center: [2579291, 4639666],
    maxZoom: 19,
    zoom: 6
  })
});

 var listenerKey = nomoiLayer.getSource().on('change', function(e) {
  if (nomoiLayer.getSource().getState() == 'ready') {
  ol.Observable.unByKey(listenerKey);
  $('#dvLoading').fadeOut(2000);
  }
});
//loadErganiData();
}


function getValFromCode(arr, esye_id, colVal) {
  var retVal = null;
  for (var i = 0; i < arr.length; i++) {
    //console.log("arr[i].ESYE_ID",arr[i].ESYE_ID);
    //console.log("esye_id",esye_id);
    if (arr[i].ESYE_ID == esye_id) {
      if (arr[i][colVal] != null) {
        retVal = parseInt(arr[i][colVal]);
      } else {
        retVal = 0
      }
    }
  }
  return retVal;
}
 
function getAndSetClassesFromData(data, numclasses, method, signifier) {
  var serie = new geostats(data);
  var legenLabel = ""; 
  if (method === "method_EI") {
    serie.getClassEqInterval(numclasses);
    methodLabel = "Equal Interval";
  } else if (method === "method_Q") {
    serie.getClassQuantile(numclasses);
    methodLabel = "Quantile";
  } else if (method === "method_SD") {
    serie.getClassStdDeviation(numclasses);
    methodLabel = "Standard Deviation ";
  } else if (method === "method_AP") {
    serie.getClassArithmeticProgression(numclasses);
    methodLabel = "Arithmetic Progression";
  } else if (method === "method_GP") {
    serie.getClassGeometricProgression(numclasses);
    methodLabel = "Geometric Progression ";
  } else if (method === "method_CJ") {
    serie.getClassJenks(numclasses);
    methodLabel = "Class Jenks";
  } else {
  alert("error: no such method.")
  }
   /**
  <option value="E3_PROSL" >Ε3 Αναγγελίες Πρόσληψης</option>
                   <option value="E5_APOX" >Ε5 Αναγγελίες Οικειοθελούς Αποχώρησης</option>
                   <option value="E6_KATAG" >Ε6 Καταγγελίες Συμβάσεων Αορίστου Χρόνου</option>
                   <option value="E7_TIMOUT" >Ε7 Λήξεις Συμβάσεων Ορισμένου Χρόνου</option>
                   <option value="E567_APOX" >Ε5+Ε6+Ε7 ΣΥΝΟΛΟ ΑΠΟΧ/ΣΕΩΝ</option>
                   <option value="E567_ISOZ">Ε3-(Ε5+Ε6+Ε7) ΙΣΟΖΥΓΙΟ</option>
                   */
  var signLabel = "";
  if (signifier ==="E3_PROSL" ){
  signLabel = "Ε3 Αναγγελίες Πρόσληψης";
  } else if (signifier ==="E5_APOX" ){
  signLabel = "Ε5 Αναγγελίες Οικειοθελούς Αποχώρησης";
  } else if (signifier ==="E6_KATAG" ){
  signLabel = "Ε6 Καταγγελίες Συμβάσεων Αορίστου Χρόνου";
  } else if (signifier ==="E7_TIMOUT" ){
  signLabel = "Ε7 Λήξεις Συμβάσεων Ορισμένου Χρόνου";
  } else if (signifier ==="E567_APOX" ){
  signLabel = "Ε5+Ε6+Ε7 ΣΥΝΟΛΟ ΑΠΟΧ/ΣΕΩΝ<";
  } else if (signifier ==="E567_ISOZ" ){
  signLabel = "Ε3-(Ε5+Ε6+Ε7) ΙΣΟΖΥΓΙΟ";
  }  else {
  alert("error: no such signifier.")
  }
  //var colors =new Array('#FEF0D9', '#FDCC8A','#FC8D59', '#E34A33','#B30000');
  var color_x = chroma.scale([getColorFrom(), getColorTo()]).colors(numclasses)

  serie.setColors(color_x);
  document.getElementById('legend').innerHTML = serie.getHtmlLegend(null, "ΕΡΓΑΝΗ DATA </br> "+signLabel+" </br> Από: " + getDateFrom() + "</br> Εώς: " + getDateTo() +"</br> Μέθοδος:"+methodLabel, 1);
  classSeries = serie;
  classColors = color_x;
}


function verifyClassFromVal(rangevals, val) {
  var retIndex = -1;
  for (var i = 0; i < rangevals.length; i++) {
    if (val >= rangevals[i].min && val <= rangevals[i].max) {
      retIndex = i;
    }
  }
  return retIndex;
}

function hexToRgbA(hex) {
  var c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',0.7)';
  }
  throw new Error('Bad Hex');
}

function getMaxPoly(polys) {
  var polyObj = [];
  //now need to find which one is the greater and so label only this
  for (var b = 0; b < polys.length; b++) {
    polyObj.push({
      poly: polys[b],
      area: polys[b].getArea()
    });
  }
  polyObj.sort(function(a, b) {
    return a.area - b.area
  });

  return polyObj[polyObj.length - 1].poly;
}


function setTile(obj){
console.log("obj",obj.value);
if (obj.value === 'gsat'){
raster1.setVisible(true);
raster2.setVisible(false);
} else if (obj.value === 'OSM'){
raster1.setVisible(false);
raster2.setVisible(true)
}
}


function getMethod(){
var val = $('#methodselector').val();
return val;
}
function getSignifier(){
var val =  $('#signifierselector').val();
return val;
}

function getDateFrom(){
var val =  $('#datepicker1').val();
return val;
}


function getDateTo(){
var val =  $('#datepicker2').val();
return val;
}

function getClassNum(){
var val =  $('#classpsinerval').val();
return parseInt(val);
}

function getColorFrom(){
var val =  $('#colorpicker1').val();
return val;
}

function getColorTo(){
var val =  $('#colorpicker2').val();
return val;
}