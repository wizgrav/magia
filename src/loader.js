import { TextureLoader, AudioLoader } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import {mods} from './assets';

let renderer = null;
let ktxLoader = new KTX2Loader();
export default function Loader( r, files, progressCb) {
    if(!renderer) {
        renderer = r;
        ktxLoader.setTranscoderPath( '/assets/basis/' ).detectSupport( renderer );
    }

    var handlers = {
        "svg": TextureLoader,
        "jpg": TextureLoader,
        "jpeg": TextureLoader,
        "png": TextureLoader,
        "gif": TextureLoader,
        "wav": AudioLoader,
        "mp3": AudioLoader,
        "ogg": AudioLoader,
        "fbx": FBXLoader,
        "glb": GLTFLoader,
        "gltf": GLTFLoader,
        "ktx2": ktxLoader,
        "obj": OBJLoader,
        "exr": EXRLoader
        
    }

    var assets = {};

    var total = 0, count = 0;

    function handle (cls, file, key) {
        if(cls === true) {
            total++;
            return fetch(file)
                .then(response => response.text())
                .then(data => {
                    count++;
                    assets[key] = data;
                    if(progressCb) progressCb({ count, total});
                });
        } else if (cls === ktxLoader) {

        }
        return new Promise(async function(resolve){
            var loader =  new cls();
            total++;
            if(cls === ktxLoader) {
                const obj = await ktxLoader.loadAsync(file);
                assets[key] = obj;
                resolve();
            } else {
                if(cls === GLTFLoader){
                    loader.setKTX2Loader(ktxLoader);
                }
            
                loader.load(file, function ( obj ) {
                        count++;
                        if(cls === GLTFLoader){
                            assets[key] = obj.scene;
                            obj.scene.gltf = obj;    
                        } else {
                            assets[key] = obj;
                        }
                        //console.log(assets[key]);
                        if(progressCb) progressCb({ count, total});
                        resolve();
                    },
                    undefined,
                    function ( err ) {
                        console.error( 'LOAD URL ERROR: ' + file, err  );
                    }
                );
            }
        });
        
    }

    var wp = [];
    const yp = [];

    for( var k in files) {
        var url = files[k];
        var ext = url.split(".").pop().toLowerCase();
        if(ext in handlers) {
            if (ext === "ktx2") {
                yp.push([k, url]);
            } else {
                wp.push(handle(handlers[ext], "/assets/" + url, k));
            }
        } else {
            console.warn( 'LOAD EXTENSION UNHANDLED: ' + url );
        }
    }

    async function handleBasis(arr) {
        for(let i=0; i< arr.length; i++) {
            assets[arr[i][0]] = await ktxLoader.loadAsync("/assets/" + arr[i][1]);
        }
    }

    if(yp.length) wp.push(handleBasis(yp));

    return document.fonts.ready.then(() => { 
        return Promise.all(wp).then(function () { 
            return assets; 
        });
    });
}