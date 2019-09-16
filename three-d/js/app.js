var winW = window.innerWidth;
var winH = window.innerHeight;

var scene = new THREE.Scene();
//var camera = new THREE.PerspectiveCamera(50, winW / winH, 0.01, 1000);
// var radius = 4;
var camera = new THREE.OrthographicCamera( winW / - 2, winW / 2, winH / 2, winH / - 2, 0.1, 10000 );
var radius = 200;
var side = radius * 3 / Math.sqrt(3);
var height = Math.sqrt(3) / 2 * side;
var showAxes = false;
var transitionMs = 1000;
var molecules = [];
var timestamps = [];
var helpers = [];
var sound = new Howl({ src: ['../shared/audio/woodblock.mp3'] });

// for moving in a spiral
var index = 0;
var x = 0;
var y = 0;
var delta = [0, -1];

var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(winW, winH);
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
var origin = new THREE.Vector3(0, 0, 0);
camera.position.set(0, 0, radius * 20);
camera.lookAt(origin);

function radians(degrees){
  return degrees * (Math.PI/180);
}

function easeInElastic(t){
  if (t <= 0) return 0;
  else if (t >= 1) return 1;
  return (.04 - .04 / t) * Math.sin(25 * t) + 1;
}

function getCentroid(v1, v2, v3){
  var position = new THREE.Vector3();
  position.x = ( v1.x + v2.x + v3.x ) / 3;
  position.y = ( v1.y + v2.y + v3.y ) / 3;
  position.z = ( v1.z + v2.z + v3.z ) / 3;
  return position;
};

function getSphere(radius, color){
  var geometry = new THREE.SphereGeometry(radius, 32, 32 );
  var material = new THREE.MeshPhongMaterial( {color: color} );
  var sphere = new THREE.Mesh(geometry, material);
  return sphere;
}

function getTetra(radius, color){
  var tetraGeometry = new THREE.Geometry();
  tetraGeometry.vertices.push(
    new THREE.Vector3(-side/2,  -radius/2, -side/3),
    new THREE.Vector3(0, -radius/2, height*2/3),
    new THREE.Vector3(side/2, -radius/2, -height/3),
    new THREE.Vector3(0, radius, 0)
  );
  tetraGeometry.faces.push(
    new THREE.Face3(2, 1, 0),
    new THREE.Face3(0, 1, 3),
    new THREE.Face3(0, 3, 2),
    new THREE.Face3(2, 3, 1)
  );
  tetraGeometry.computeBoundingSphere();
  tetraGeometry.computeFaceNormals();
  var tetraMaterial = new THREE.MeshPhongMaterial( { color: color, transparent: true, opacity: 0.333 } );
  var tetra = new THREE.Mesh(tetraGeometry, tetraMaterial);
  return tetra;
}

function addMolecule(){
  var moleculeGroup = new THREE.Group();

  // add tetrahedral
  var tetra = getTetra(radius, 0xdfba52);
  var tvertices = tetra.geometry.vertices;
  tetra.name = 'tetra';
  moleculeGroup.add(tetra);

  // add silicon
  var si = getSphere(radius * 0.2, 0x7a9b8a);
  moleculeGroup.add(si);

  // add oxygen
  var o;
  var colors = [0xff0000, 0x00ff00, 0x0000ff, 0x00ffff];
  for(var i=0; i<tvertices.length; i++){
    // var color = showAxes ? colors[i] : 0xd3aa58;
    // o = getSphere(radius * 0.15, color);
    o = getSphere(radius * 0.15, 0xd3aa58);
    o.position.copy(tvertices[i]);
    moleculeGroup.add(o);
  }

  var isOdd = index % 2 > 0;

  // add Mg
  var faceIndex1 = isOdd ? 2 : 0;
  var faceIndex2 = 3;
  var mgr = radius * 0.125;
  var mg1 = getSphere(mgr, 0x306090);
  var mg2 = getSphere(mgr, 0x306090);
  mg1.translateOnAxis(tetra.geometry.faces[faceIndex1].normal, radius);
  mg2.translateOnAxis(tetra.geometry.faces[faceIndex2].normal, radius);
  moleculeGroup.add(mg1, mg2);

  if (isOdd) {
    moleculeGroup.rotateX(radians(-175));
    moleculeGroup.translateY(-radius/2);
    // moleculeGroup.translateZ(-radius/2);
  } else {
    moleculeGroup.rotateX(radians(-5));
  }

  moleculeGroup.translateX(height*3/2*x);
  moleculeGroup.translateY(height*3/2*y);

  // step in a spiral
  if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1-y)) {
      // change direction
      delta = [-delta[1], delta[0]];
  }
  x += delta[0];
  y += delta[1];
  index++;

  // helper
  var moleculeAxis = new THREE.AxesHelper(radius*2);
  moleculeAxis.visible = showAxes;
  moleculeGroup.add(moleculeAxis);
  var moleculeNormals = new THREE.FaceNormalsHelper(tetra, radius * 0.5);
  moleculeNormals.visible = showAxes;
  moleculeGroup.add(moleculeNormals);
  helpers.push(moleculeAxis, moleculeNormals);

  molecules.push(moleculeGroup);
  scene.add(moleculeGroup);
  timestamps.push(new Date().getTime());
  sound.play();

}

// show x-y-z axis
var axesHelper = new THREE.AxesHelper(radius * 25);
axesHelper.visible = showAxes;
scene.add(axesHelper);
helpers.push(axesHelper);

// add lights
var ambientLight = new THREE.AmbientLight(0xffffff);
var spotLight = new THREE.PointLight(0xffffff);
spotLight.position.set(0, radius * 12, 0);
scene.add(ambientLight);
scene.add(spotLight);

addMolecule();

// resize listener
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function toggleAxis(){
  showAxes = !showAxes;
  for (var i=0; i<helpers.length; i++) {
    helpers[i].visible = showAxes;
  }
}

// the main loop
var render = function () {

    // bounce in
    var now = new Date().getTime();
    for (var i=0; i<timestamps.length; i++) {
      var t = timestamps[i];
      var timeSince = now - t;
      if (timeSince <= transitionMs) {
        var scale = easeInElastic(timeSince / transitionMs);
        molecules[i].scale.set(scale, scale, scale);
      }
    }

    renderer.render(scene, camera);

    requestAnimationFrame(render);
};
render();
