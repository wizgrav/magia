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
                
        super(g, m, 160);

        this.frustumCulled = false;

        this.zlen = (bb.max.z - bb.min.z) / 500;

        this.position.z = -250;
        
        this.dummy = orig.children[0];
        
        this.dummy.position.set(0, 0, 0);
        
        this.dummy.lookAt(0, 0 , 1);

        this.dummy.scale.set(1, 1, 1).multiplyScalar(0.013);

        this.dummy.updateMatrix();

        this.obstacles = obstacles || [];
       
        this.receiveShadow = true;
        this.castShadow = true;
        this.instanceMatrix.setUsage( DynamicDrawUsage );
        this.setMorphAt(0, this.dummy );
        this.setColorAt(0, tempColor);
        this.instanceColor.setUsage( DynamicDrawUsage );
        this.renderOrder = k === "bear" ? 4 : 5;
        this.objects = [];
        this.mixer = new AnimationMixer(orig);
        this.action = this.mixer.clipAction(orig.gltf.animations[0]);
        this.duration = this.action.getClip().duration;
        this.action.play();
        this.speed = 3;
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

        this.sorted = new Array(160);
    }

    spawn(origin, color) {
        
        const fix = this.isBear ? 1.4 : 1.2;

        for(let i = 0; i < this.obstacles.length; i++) {
            
            const ox = this.obstacles[i];

            const dx = origin.x - ox;

            if(Math.abs(dx) < fix) {
                
                if(this.isBird) {
                    origin.y += 1.3;    
                } else {
                    origin.x = dx > 0 ? ox + fix : ox - fix;
                }
            }
        }
        
        color = color || new Color(0, Math.random() / 3, 0.2 + Math.random() / 3);

        this.objects.unshift({  position: new Vector3(), color, origin, timeOffset: Math.random() * this.duration });
    }

    init() {}

    update() {

        this.sorted.length = 0;
        
        const dt = App.currentTime;
            
        tempCam.copy(App.cameraPosition);

        tempCam.z += 250;

        const dpt = App.renderer.xr.isPresenting ? 0.6 : 0.1;

        this.objects.forEach((o) => {
            
            o.position.set(
                o.origin.x, 
                o.origin.y, 
                o.origin.z + dt * this.speed - 300
            );
            
            o.animTime = (dt + o.timeOffset) % this.duration;

            const z = o.position.z % 500;

            if(App.screenshot) {
            
                o.scale = 1;
            
            } else {
            
                o.scale = Math.min( MathUtils.inverseLerp(0, 10, z), 1 - MathUtils.inverseLerp(490, 500, z) );

                o.scale = Math.max(0, Math.min(1, o.scale));
            
            }
            
            if(o.scale === 0) return;

            const pc = o.animTime / this.duration;

            let po = Math.abs(0.5 - ( this.isBear ? 2 * (pc % 0.5) : pc));

            po = this.iHop ? 0.5 - po : po;

            po = Math.pow(po,  4);

            if (this.isBird ) o.position.y +=  0.5 * po;

            o.position.z -= (this.isBear ? 0.1 : 1) * this.zlen * po;

            if(o.position.z > 500) o.position.z %= 500;

            o.dist = tempCam.distanceToSquared(o.position);
            
            if(o.dist < 64) {

                this.sorted.push(o);

            } else {

                const dp = tempVec3.copy(o.position).sub(tempCam).normalize().dot(App.cameraDirection);

                if(dp > dpt) this.sorted.push(o);

            }
           
        })
        
        this.sorted.sort((a,b) => { return a.dist - b.dist });
        
        this.count = this.sorted.length;
        
        if(this.count === 0) {
            this.visible = false;
            return;
        } else {
            this.visible = true;
        }

        this.sorted.forEach((o, i) => {
            
            const te = this.dummy.matrix.elements;
            const sc = 0.013 * o.scale;
            
            te[0] = sc;
            te[5] = sc;
            te[10] = sc;

            te[12] = o.position.x;
            te[13] = o.position.y;
            te[14] = o.position.z;
            
            this.setMatrixAt(i, this.dummy.matrix);
            
            this.setColorAt(i, o.color);

            this.mixer.setTime(o.animTime);
            
            this.setMorphAt(i, this.dummy);

        });

        this.instanceMatrix.addUpdateRange(0, this.count * 16);

        this.instanceMatrix.needsUpdate = true;

        this.instanceColor.addUpdateRange(0, this.count * 3);
        
        this.instanceColor.needsUpdate = true;
        
        if(this.firstUpdate) this.morphTexture.image.height = this.count;

        this.firstUpdate = true;
    
        this.morphTexture.needsUpdate = true;
    }
}


class Wanimal extends InstancedMesh {

    constructor(k, obstacles) {

        const orig = App.assets[k];

        const g = orig.children[0].geometry;
        
        const m = orig.children[0].material;
        
        g.computeBoundingBox();
        
        const bb = g.boundingBox;
                
        super(g, m, 160);

        this.memory = new WebAssembly.Memory({ initial: 1, maximum: 1 })

        this.wasm = new WebAssembly.Instance(App.assets.wasm, { js: { mem: this.memory } });

        this.frustumCulled = false;

        this.zlen = (bb.max.z - bb.min.z) / 500;

        this.position.z = -250;
        
        this.dummy = orig.children[0];
        
        this.obstacles = obstacles || [];
       
        this.receiveShadow = true;
        
        this.castShadow = true;
        
        this.instanceMatrix.setUsage( DynamicDrawUsage );
        
        this.setMorphAt(0, this.dummy );
        
        this.setColorAt(0, tempColor);
        
        this.instanceColor.setUsage( DynamicDrawUsage );
        
        this.renderOrder = k === "bear" ? 4 : 5;
        
        this.objects = [];
        
        this.duration = orig.gltf.animations[0].duration;
        
        this.speed = 3;
        
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

        this.instanceMatrix.array = new Float32Array(this.wasm.exports.memory.buffer, this.wasm.exports.getInstanceMatrices(), 160 * 16);

        this.instanceColor.array = new Float32Array(this.wasm.exports.memory.buffer, this.wasm.exports.getInstanceColors(), 160 * 3);

        this.morphTexture.image.data = new Float32Array(this.wasm.exports.memory.buffer, this.wasm.exports.getMorphs(), this.morphTexture.source.data.data.length );

        this.morphTexture.needsUpdate = true;
    
    }

    spawn(origin, color) {
        
        const fix = this.isBear ? 1.4 : 1.2;

        for(let i = 0; i < this.obstacles.length; i++) {
            
            const ox = this.obstacles[i];

            const dx = origin.x - ox;

            if(Math.abs(dx) < fix) {
                
                if(this.isBird) {
                    origin.y += 1.3;    
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
            
        tempCam.copy(App.cameraPosition);

        tempCam.z += 250;

        const dpt = App.renderer.xr.isPresenting ? 0.6 : 0.1;

        const cp = tempCam;

        const cd = App.cameraDirection;

        this.count = this.wasm.exports.update(dt, dpt, cp.x, cp.y, cp.z, cd.x, cd.y, cd.z);

        if ( this.count == 0) {
            
            this.visible = false;

            return;

        } else {

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


export { Animal, Wanimal };