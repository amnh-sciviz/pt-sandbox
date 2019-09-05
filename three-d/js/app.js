var winW = window.innerWidth;
var winH = window.innerHeight;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(50, winW / winH, 0.01, 1000);
var radius = 4;

var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(winW, winH);
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
var origin = new THREE.Vector3(0, 0, 0);

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

function addMolecule(x, y, z){
  var moleculeGroup = new THREE.Group();

  // add tetrahedral
  var tetraGeometry = new THREE.TetrahedronGeometry(radius);
  var tetraMaterial = new THREE.MeshPhongMaterial( { color: 0xdfba52, transparent: true, opacity: 0.333 } );
  var tetra = new THREE.Mesh(tetraGeometry, tetraMaterial);
  var tvertices = tetraGeometry.vertices;
  moleculeGroup.add(tetra);

  // add silicon
  var si = getSphere(radius * 0.2, 0x7a9b8a);
  moleculeGroup.add(si);

  // add oxygen
  var o;
  for(var i=0; i<tvertices.length; i++){
    o = getSphere(radius * 0.15, 0xd3aa58);
    o.position.copy(tvertices[i]);
    moleculeGroup.add(o);
  }

  // add Mg
  var mg1 = getSphere(radius * 0.125, 0x306090);
  var mg2 = getSphere(radius * 0.125, 0x306090);
  mg1.translateOnAxis(tetraGeometry.faces[0].normal, radius);
  mg2.translateOnAxis(tetraGeometry.faces[1].normal, radius);
  moleculeGroup.add(mg1);
  moleculeGroup.add(mg2);

  moleculeGroup.position.set(x, y, z);
  scene.add(moleculeGroup);
}

camera.position.z = radius * 5;

// var axesHelper = new THREE.AxesHelper(100);
// scene.add(axesHelper);

var ambientLight = new THREE.AmbientLight(0xffffff);
var spotLight = new THREE.PointLight(0xffffff);
spotLight.position.set(0, radius * 12, 0);
scene.add(ambientLight);
scene.add(spotLight);

addMolecule(0, 0, 0);

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

var render = function () {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
};

render();
