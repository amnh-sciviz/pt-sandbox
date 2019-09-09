var winW = window.innerWidth;
var winH = window.innerHeight;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(50, winW / winH, 0.01, 1000);
var radius = 4;
var currentIndex = -1;
var currentFaceIndex = -1;
var showAxes = false;
var molecules = [];

var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(winW, winH);
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
var origin = new THREE.Vector3(0, 0, 0);
camera.position.x = radius * 3;
camera.position.y = radius * 3;
camera.position.z = radius * 3;
camera.lookAt(origin);

function radians(degrees){
  return degrees * (Math.PI/180);
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
  var sphere = new THREE.Mesh( geometry, material );
  return sphere;
}

function addMolecule(){
  var moleculeGroup = new THREE.Group();
  var rotateGroup = new THREE.Group();
  rotateGroup.name = 'rotate';

  // add tetrahedral
  var tetraGeometry = new THREE.TetrahedronGeometry(radius);
  var tetraMaterial = new THREE.MeshPhongMaterial( { color: 0xdfba52, transparent: true, opacity: 0.333 } );
  var tetra = new THREE.Mesh(tetraGeometry, tetraMaterial);
  var tvertices = tetraGeometry.vertices;
  tetra.name = 'tetra';
  rotateGroup.add(tetra);

  // console.log(currentIndex, currentFaceIndex)
  // console.log(tetraGeometry.faces)
  // console.log(tvertices)

  // add silicon
  var si = getSphere(radius * 0.2, 0x7a9b8a);
  rotateGroup.add(si);

  // add oxygen
  var o;
  var colors = [0xff0000, 0x00ff00, 0x0000ff, 0x00ffff];
  for(var i=0; i<tvertices.length; i++){
    var color = showAxes ? colors[i] : 0xd3aa58;
    o = getSphere(radius * 0.15, color);
    o.position.copy(tvertices[i]);
    rotateGroup.add(o);
  }

  // add Mg
  var mgr = radius * 0.125;
  var mg1 = getSphere(mgr, 0x306090);
  var mg2 = getSphere(mgr, 0x306090);
  mg1.translateOnAxis(tetraGeometry.faces[0].normal, radius + mgr*0.75);
  mg2.translateOnAxis(tetraGeometry.faces[1].normal, radius + mgr*0.75);
  rotateGroup.add(mg1);
  rotateGroup.add(mg2);

  // helper
  if (showAxes) {
    var moleculeAxis = new THREE.AxesHelper(radius*2);
    rotateGroup.add(moleculeAxis);
    var moleculeNormals = new THREE.FaceNormalsHelper( tetra, radius * 0.5);
    rotateGroup.add(moleculeNormals);
  }

  // rotate as needed
  var rotationAmount = Math.atan( 2*Math.sqrt(2)); // https://en.wikipedia.org/wiki/Tetrahedron#Formulas_for_a_regular_tetrahedron
  var rotationAxis = new THREE.Vector3(1, 1, 0).normalize();
  if (currentIndex >= 0 && currentFaceIndex===1) rotationAxis = new THREE.Vector3(0, -1, -1).normalize();
  else if (currentIndex >= 0 && currentFaceIndex===2) rotationAxis = new THREE.Vector3(0, 1, 1).normalize();
  else if (currentIndex >= 0 && currentFaceIndex===3) rotationAxis = new THREE.Vector3(1, -1, 0).normalize();
  if (currentIndex >= 0) rotateGroup.applyMatrix(new THREE.Matrix4().makeRotationAxis(rotationAxis, rotationAmount));
  moleculeGroup.add(rotateGroup);

  if (currentIndex >= 0) {
    if (currentIndex >= molecules.length) return;

    var parent = molecules[currentIndex].getObjectByName('rotate');
    var parentTetra = parent.getObjectByName('tetra');
    var parentFace = parentTetra.geometry.faces[currentFaceIndex];

    // moleculeGroup.position.copy(parent.position);
    parent.add(moleculeGroup);
    moleculeGroup.translateOnAxis(parentFace.normal, radius*2);
    // moleculeGroup.up.copy(tetraGeometry.faces[0].normal);
    // moleculeGroup.lookAt(parent.position);

    // find next empty/available space
    currentFaceIndex++;
    if (currentFaceIndex >= 4) {
      currentIndex++;
      currentFaceIndex = 0;
    }

    // check if position is taken already
    var found = false;
    var myPosition = new THREE.Vector3(0, 0, 0);
    var yourPosition = new THREE.Vector3(0, 0, 0);
    myPosition = moleculeGroup.getWorldPosition(myPosition);
    for (var i=0; i<molecules.length; i++){
      if (molecules[i].getWorldPosition(yourPosition).distanceTo(myPosition) < radius) {
        // console.log("Found.")
        found = true;
        break;
      }
    }

    if (!found) {
      molecules.push(moleculeGroup);

    } else {
      parent.remove(moleculeGroup);
      addMolecule();
    }

  // first
  } else {
    moleculeGroup.position.set(0, 0, 0);
    currentIndex = 0;
    currentFaceIndex = 0;
    molecules.push(moleculeGroup);
    scene.add(moleculeGroup);
  }

}

// show x-y-z axis
if (showAxes) {
  var axesHelper = new THREE.AxesHelper(radius * 25);
  scene.add(axesHelper);
}


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

// the main loop
var render = function () {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
};
render();
