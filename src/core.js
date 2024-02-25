


import {ACESFilmicToneMapping, PMREMGenerator, AudioListener, CineonToneMapping, EventDispatcher, MathUtils, NoToneMapping, PCFSoftShadowMap, PerspectiveCamera, ReinhardToneMapping, sRGBEncoding, UniformsLib, Vector3, VSMShadowMap, WebGLRenderer, RepeatWrapping, Vector2, MirroredRepeatWrapping, EquirectangularReflectionMapping} from 'three';
import Loader from './loader.js';
import App from './app';
import {assets} from './assets';
import { World } from './world.js';
import * as Includes from './includes.js';
import { CineCamera } from './camera.js';
import { VRButton } from './vr.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';


let Assets;

const player = document.querySelector("audio");

const renderer = new WebGLRenderer({ 
    preserveDrawingBuffer: App.screenshot,
    stencil: false,
    antialias: true,
    powerPreference: "high-performance"
});

function DownloadCanvasAsImage(){
    let downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', 'promo.png');
    let canvas = document.querySelector('canvas');
    let dataURL = canvas.toDataURL('image/png');
    let url = dataURL.replace(/^data:image\/png/,'data:application/octet-stream');
    downloadLink.setAttribute('href', url);
    downloadLink.click();
}

if( App.screenshot ) window.addEventListener("keydown", DownloadCanvasAsImage);

App.renderer = renderer;
renderer.autoClear = false;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.domElement.tabIndex = 0;
renderer.xr.enabled = true;

const fn = renderer.shadowMap.render;

const isQuest = navigator.userAgent.includes("Quest");

renderer.shadowMap.render = function(lights, scene, camera) {
    fn.call(renderer.shadowMap, lights, scene, camera);
    if ( renderer.xr.isPresenting && !isQuest ) renderer.clear(false, true, false);
}

App.pmremGenerator = new PMREMGenerator( renderer );
App.pmremGenerator.compileEquirectangularShader();

document.body.appendChild(renderer.domElement);

const progressFn = (e) => {
    const pc = 1 - e.count / ( e.total - 1);
    document.getElementById("loader-bar").style.height = (100 * pc) + "%";
}

const camera = new CineCamera(50, window.innerWidth / window.innerHeight, 0.2, 12000);

App.camera = camera;

const world = new World();

App.world = world;

var audioContext = new (window.AudioContext || window.webkitAudioContext)();

let stats;

Loader(renderer, assets, progressFn).then((a) => {
    Assets = a;
    App.assets = Assets;

    const patchGround = (a) => {
        a.wrapS = a.wrapT = RepeatWrapping;
        a.repeat = new Vector2(200, 200);
    };

    const patchRod = (a) => {
        a.wrapS = a.wrapT = MirroredRepeatWrapping;
        a.repeat = new Vector2(3, 3);
    };

    ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap"].forEach((k) => {
        patchRod(App.assets.rod.children[0].children[0].material[k]);
    });

    patchGround(App.assets["ground/normal"]);
    
    App.assets.seed = new Vector2(Math.random(), Math.random()).multiplyScalar(1000);
    App.assets.envMap = App.pmremGenerator.fromEquirectangular( App.assets.psky ).texture;
	App.pmremGenerator.dispose();
    
    App.dispatchEvent({ type: "ready", assets: Assets, renderer, camera });
    
    document.body.classList.add("ready");
    
    document.body.appendChild( VRButton.createButton( renderer ) );
    
    const fn = () => {
        player.currentTime = 4;
        document.querySelector("#loader").click();
    };
    
    renderer.xr.addEventListener('sessionstart', fn);

    renderer.xr.addEventListener('sessionstart', () => { audioContext.resume(); });
 
    document.querySelector("#loader").addEventListener("click", () => {
        
        player.play();
    
        document.body.classList.remove("loading");
    
        renderer.xr.removeEventListener('sessionstart', fn);

        App.isLoaded = true;

        if( App.stats ) {
            
            stats = new Stats();
			document.body.appendChild( stats.dom );
        
        }
    
    }, {once: true})
    
    
});

world.add(camera);

function onWindowResize() {
    const width = window.innerWidth
    const height = window.innerHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener( 'resize', onWindowResize );

onWindowResize();

renderer.setAnimationLoop(() => {
    
    if(App.isLoaded) {
        
        App.update();

        camera.update();
        
        world.update();
    
        renderer.render(world, camera);
    
        if( stats ) stats.update();
    }

});

export default App;