import { AnimationMixer, DynamicDrawUsage, InstancedMesh, Line3, MathUtils, Matrix4, MeshBasicMaterial, MeshPhongMaterial, Vector2 } from "three";
import { Vector3, Mesh, PlaneBufferGeometry, MeshStandardMaterial, DoubleSide, Color } from "three";
import App from "./app";

const tempColor = new Color();
const tempVec3 = new Vector3();
const tempCam = new Vector3();
class Animal extends InstancedMesh {

    constructor(k, obstacles) {

        const orig = App.assets[k];

        const g = orig.children[0].geometry;
        
        const m = orig.children[0].material;
        
        g.computeBoundingBox();
        
        const bb = g.boundingBox;
                
        super(g, m, App.waves * 8);

        this.memory = new WebAssembly.Memory({ initial: 1, maximum: 10 })

        this.wasm = new WebAssembly.Instance(App.assets.wasm, { js: { mem: this.memory } });

        this.frustumCulled = false;

        this.zlen = (bb.max.z - bb.min.z) / 666;

        //this.position.z = -250;
        
        this.dummy = orig.children[0];
        
        this.obstacles = obstacles || [];
       
        this.receiveShadow = true;
        
        this.castShadow = true;
        
        this.instanceMatrix.setUsage( DynamicDrawUsage );
        
        this.setMorphAt(0, this.dummy );
        
        this.setColorAt(0, tempColor);
        
        this.instanceColor.setUsage( DynamicDrawUsage );
        
        this.renderOrder = 5;
        
        this.objects = [];
        
        this.duration = orig.gltf.animations[0].duration;
        
        this.speed = 3;
        
        this.minDist = 0;

        this.material.dithering = true;
        
        this.material.onBeforeCompile = (s) => {
            s.vertexShader = s.vertexShader.replace("#include <color_vertex>", `//glsl
            {
                vColor = color;
                float g = dot(vColor.rgb, vec3(0.21, 0.71, 0.07));
                vColor.rgb = mix(vColor.rgb, vec3(g), instanceColor.g);
                vColor.rgb = mix(vColor.rgb, vColor.r > 0.33 ? vec3(0.) : vec3(1.), instanceColor.r);
                vColor.rgb *= 1. - instanceColor.b;
            }
            `);
            s.fragmentShader = s.fragmentShader.replace("#include <color_fragment>", `//glsl
            {
                diffuseColor.rgb = vColor;
            }
            `)    
        }

        this.material.envMap = App.assets.envMap;

    }

    init() {
    
        this.wasm.exports.init(this.isBear ? 1 : 0, this.isBird ? 1 : 0, this.iHop ? 1 : 0, this.zlen, this.speed, this.duration, this.dummy.morphTargetInfluences.length)

        this.instanceMatrix.array = new Float32Array(this.wasm.exports.memory.buffer, this.wasm.exports.getInstanceMatrices(), App.waves * 8 * 16);

        this.instanceColor.array = new Float32Array(this.wasm.exports.memory.buffer, this.wasm.exports.getInstanceColors(), App.waves * 8 * 3);

        this.morphTexture.image.data = new Float32Array(this.wasm.exports.memory.buffer, this.wasm.exports.getMorphs(), this.morphTexture.source.data.data.length );

        this.morphTexture.needsUpdate = true;
    
    }

    spawn(origin, color) {
        
        const fix = this.isBear ? 1.45 : 1.25;

        for(let i = 0; i < this.obstacles.length; i++) {
            
            const ox = this.obstacles[i];

            const dx = origin.x - ox;

            if(Math.abs(dx) < fix) {
                
                if(this.isBird) {
                    origin.y += 1.33;    
                } else {
                    origin.x = dx > 0 ? ox + fix : ox - fix;
                }
            }
        }
        
        color = color || new Color(0, Math.random() / 3, 0.2 + Math.random() / 3);
        
        this.wasm.exports.spawn(origin.x, origin.y, origin.z, color.r, color.g, color.b, Math.random() * this.duration);
    }

    update() {

        const dt = App.currentTime;
            
        const dpt = App.renderer.xr.isPresenting ? 0.56 : 0.12;

        const cp = App.cameraPosition;

        const cd = App.cameraDirection;

        const ret = this.wasm.exports.update(dt, dpt, cp.x, cp.y, cp.z, cd.x, cd.y, cd.z);

        this.count = ret & 0x0000FFFF;

        if ( this.count === 0) {
            
            this.visible = false;

            this.minDist = 1000;

            return;

        } else {

            this.minDist = (ret & 0xFFFF0000) >> 16;
            
            this.visible = true;

        }

        this.instanceMatrix.addUpdateRange(0, this.count * 16);

        this.instanceMatrix.needsUpdate = true;

        this.instanceColor.addUpdateRange(0, this.count * 3);
        
        this.instanceColor.needsUpdate = true;
        
        if(this.firstUpdate) this.morphTexture.image.height = this.count;

        this.firstUpdate = true;
    
        this.morphTexture.needsUpdate = true;
    }
}


export { Animal };