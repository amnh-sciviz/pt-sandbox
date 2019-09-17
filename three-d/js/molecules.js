var winW = window.innerWidth;
var winH = window.innerHeight;

var scene = new THREE.Scene();
//var camera = new THREE.PerspectiveCamera(50, winW / winH, 0.01, 1000);
// var radius = 4;
var camera = new THREE.OrthographicCamera( winW / - 2, winW / 2, winH / 2, winH / - 2, 0.1, 10000 );
var radius = 60;
var mradius = 40;
var side = radius * 3 / Math.sqrt(3);
var height = Math.sqrt(3) / 2 * side;
var showAxes = false;
var transitionMs = 1000;
var molecules = [];
var objects = [];
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
}

function getSprite(label) {
  var d = 512;
  // var spriteAlignment = THREE.SpriteAlignment.topLeft;
  var canvas = document.createElement('canvas');
  canvas.width = d;
  canvas.height = d;
  var context = canvas.getContext('2d');
  // context.fillStyle = "rgba(255, 0, 0, 1.0)";
  // context.fillRect(0, 0, d, d)
  context.font = '64px sans-serif';
  context.fillStyle = "rgba(255, 255, 255, 1.0)";
  // get size data (height depends only on font size)
  var metrics = context.measureText(label);
  var textWidth = metrics.width;
  context.fillText(label, d/2-textWidth/2, d/2+textWidth/4);
  // canvas contents will be used for a texture
  var texture = new THREE.CanvasTexture(canvas);
  var spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    color: 0xffffff
    // useScreenCoordinates: false,
    // alignment: spriteAlignment
  });
  var sprite = new THREE.Sprite(spriteMaterial);
  sprite.name = "label";
  return sprite;
}

function getSphere(radius, color, label, isOdd){
  var group = new THREE.Group();
  var geometry = new THREE.SphereGeometry(radius, 32, 32 );
  var material = new THREE.MeshPhongMaterial( {color: color} );
  var sphere = new THREE.Mesh(geometry, material);
  var sprite = getSprite(label);
  var z = isOdd ? -radius*1.5 : radius*1.5;
  sprite.position.set(0, 0, z);
  sprite.scale.set(200, 200, 1);
  group.add(sphere, sprite);
  return group;
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
  var moleculeGroup;
  var mindex = index % 7;
  var gindex = parseInt(index / 7);
  var isOdd = gindex % 2 > 0;

  // a new molecule
  if (mindex === 0) {
    moleculeGroup = new THREE.Group();
  // existing molecule
  } else {
    moleculeGroup = molecules[gindex];
  }

  // Si
  if (mindex === 0) {
    var si = getSphere(mradius, 0x7a9b8a, "Si", isOdd);
    moleculeGroup.add(si);
    objects.push(si);

  // O
  } else if (mindex >= 1 && mindex <= 4) {
    var o = getSphere(mradius*0.75, 0xd3aa58, "O", isOdd);
    if (mindex === 1) o.position.set(-side/2,  -radius/2, -side/3);
    else if (mindex === 2) o.position.set(0, -radius/2, height*2/3);
    else if (mindex === 3) o.position.set(side/2, -radius/2, -height/3);
    else o.position.set(0, radius, 0);
    moleculeGroup.add(o);
    objects.push(o);

    // add tetrahedral
    if (mindex === 4) {
      var tetra = getTetra(radius, 0xdfba52);
      tetra.name = 'tetra';
      tetra.visible = false;
      moleculeGroup.add(tetra);
    }

  // Mg
  } else {
    var refTetra = moleculeGroup.getObjectByName('tetra');
    var mg = getSphere(mradius * 0.625, 0x306090, "Mg", isOdd);
    var faceIndex = isOdd ? 2 : 0;
    if (mindex === 6) faceIndex = 3;
    mg.translateOnAxis(refTetra.geometry.faces[faceIndex].normal, radius*1.5);
    moleculeGroup.add(mg);
    objects.push(mg);
  }

  if (mindex === 0) {
    if (isOdd) {
      moleculeGroup.rotateX(radians(-180));
      // moleculeGroup.translateY(-radius/2);
      // moleculeGroup.translateZ(-radius/2);
    } else {
      // moleculeGroup.rotateX(radians(-5));
    }
    moleculeGroup.translateX(height*2*x);
    moleculeGroup.translateY(height*2*y);
    molecules.push(moleculeGroup);
    scene.add(moleculeGroup);
  }

  // step in a spiral
  if (mindex === 6) {
    if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1-y)) {
        // change direction
        delta = [-delta[1], delta[0]];
    }
    x += delta[0];
    y += delta[1];
  }

  index++;


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
        scale = Math.max(scale, 0.0000001);
        objects[i].scale.set(scale, scale, scale);
      }
    }

    renderer.render(scene, camera);

    requestAnimationFrame(render);
};
render();
