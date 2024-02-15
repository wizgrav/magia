import { AnimationMixer, DynamicDrawUsage, Line3, MathUtils, Matrix4, MeshBasicMaterial, MeshPhongMaterial, Vector2 } from "three";
import { Vector3, Mesh, PlaneBufferGeometry, MeshStandardMaterial, DoubleSide, Color } from "three";
import App from "./app";
import { iMesh } from "./mesh";

const tempColor = new Color();
const tempVec3 = new Vector3();
const tempCam = new Vector3();

class Animal extends iMesh {

    constructor(k, obstacles) {

        const orig = App.assets[k];

        //console.log("ANIMAL",orig);
        const g = orig.children[0].geometry;
        const m = orig.children[0].material;
        
        g.computeBoundingBox();
        
        const bb = g.boundingBox;
                
        super(g, m, 160);

        this.zlen = (bb.max.z - bb.min.z) / 500;

        this.position.z = -250;
        
        this.dummy = orig.children[0];
        
        this.dummy.position.set(0, 0, 0);
            
        this.dummy.lookAt(0, 0 , 1);

        this.length = bb.max.z - bb.min.z;
        
        this.obstacles = obstacles || [];
       
        this.frustumCulled = false;
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
        
        const fix = this.isBear ? 1.33 : 1.12;

        for(let i = 0; i < this.obstacles.length; i++) {
            
            const ox = this.obstacles[i];

            const dx = origin.x - ox;

            if(Math.abs(dx) < fix) {
                
                if(this.isBird) {
                    origin.y += 1;    
                } else {
                    origin.x = dx > 0 ? ox + fix : ox - fix;
                }
            }
        }
        
        color = color || new Color(0, Math.random() / 3, 0.2 + Math.random() / 3);

        this.objects.unshift({  position: new Vector3(), color, origin, timeOffset: Math.random() * this.duration });
    }

    update() {

        this.sorted.length = 0;
        
        const dt = App.currentTime;
            
        tempCam.copy(App.cameraPosition);

        tempCam.z += 250;

        this.objects.forEach((o) => {
            
            o.position.set(0, 0, 1).multiplyScalar(dt * this.speed);

            o.position.add(o.origin);
            
            o.position.z -= 300;
            
            o.animTime = (dt + o.timeOffset) % this.duration;

            
            const z = o.position.z % 500;

            if(App.screenshot) {
            
                o.scale = 1;
            
            } else {
            
                o.scale = Math.min( MathUtils.inverseLerp(1, 2, z), 1 - MathUtils.inverseLerp(498, 499, z) );

                o.scale = Math.max(0, Math.min(1, o.scale));
            
            }
            
            if(o.scale === 0) return;

            const pc = o.animTime / this.duration;

            let po = Math.abs(0.5 - ( this.isBear ? 2 * (pc % 0.5) : pc));

            po = this.iHop ? 0.5 - po : po;

            po = Math.pow(po, 4);

            if (this.isBird ) o.position.y +=  0.66 * po;

            o.position.z -= (this.isBear ? 0.2 : 1) * this.zlen * po;

            if(o.position.z > 500) o.position.z %= 500;

            o.dist = tempCam.distanceToSquared(o.position);
            
            if(o.dist < 64) {

                this.sorted.push(o);

            } else {

                const dp = tempVec3.copy(o.position).sub(tempCam).normalize().dot(App.cameraDirection);
                if(dp > 0) this.sorted.push(o);

            }
           
        })
        
        this.sorted.sort((a,b) => { return a.dist - b.dist });
        
        this.clear();
        
        this.sorted.forEach((o) => {
            
            this.dummy.position.copy(o.position);
            
            this.dummy.scale.set(1, 1, 1).multiplyScalar(0.013 * o.scale);

            this.instance(this.dummy, o.color, this.mixer, o.animTime);

        });

        
    }
}


export { Animal };