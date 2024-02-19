import { Color, DirectionalLight, HalfFloatType, NearestFilter, RGFormat, RedFormat, Scene, Vector3, WebGLRenderTarget } from "three";
import App from "./app";
import { Dome } from "./dome";
import { Ground } from "./ground";
import { Animal } from "./animal";
import { genArray, shuffle } from "./util";
import { Bump } from "./bump";

export class World extends Scene {
    constructor() {
        super();
        App.addEventListener("ready", () => {
            
            const light = new DirectionalLight();
            light.castShadow = true;
            light.shadow.mapSize.width = 1024; // default
            light.shadow.mapSize.height = 1024; // default
            light.shadow.camera.near = 30; // default
            light.shadow.camera.far = 150; // default
            light.shadow.camera.left = -60;
            light.shadow.camera.right = 60;
            light.shadow.camera.bottom = -60;
            light.shadow.camera.top = 60;
            light.position.set(50, 70, -40);
            light.shadow.camera.updateProjectionMatrix();
            this.sunLight = light;
            this.add(this.sunLight);

            this.dome = new Dome();

            this.add(this.dome);

            this.ground = new Ground();

            this.add(this.ground);

            this.bump = new Bump();
            
            this.bump.clear();

            this.add(this.bump);
            
            const rodMesh = App.assets.rod.children[0].children[0];
            rodMesh.receiveShadow = true;
            const rodMaterial = rodMesh.material;
            rodMaterial.envMap = App.assets.envMap;
            rodMaterial.color.multiplyScalar(3);
            rodMaterial.normalScale.set(3,3);
            rodMaterial.aoMap = null;
            rodMaterial.normalMap = null;
            App.assets.rod.scale.set(1, 1, 1);
            App.assets.rod.frustumCulled = true;
            rodMesh.renderOrder = 6;
            this.add(App.assets.rod);

            const center = new Vector3( 0,0,0 );


            const tarr = [0,1,2,3];
            
            shuffle(tarr);

            // TOTEMS

            this.totems = [];

            const tot = (i, a, inv) => {
                
                let mesh = App.assets["totem" + tarr[i]].clone();
                mesh.position.set(Math.sin(a), 0, Math.cos(a)).multiplyScalar(inv ? -6 : 6);
                const o = mesh.children[0];
                o.material.envMap = App.assets.envMap;
                o.castShadow = true;
                o.receiveShadow = true;
                o.material.onBeforeCompile = (s) => {
                    s.fragmentShader = s.fragmentShader.replace("#include <map_fragment>", `//glsl
                        #include <map_fragment>
                        vec3 lum = vec3(0.21, 0.71, 0.07);
                        diffuseColor.rgb = min(vec3(1.), mix(diffuseColor.rgb, vec3(6. * dot(lum, diffuseColor.rgb)), 0.66));
                    `);
                }
                o.rotation.z = - Math.PI / 2;
                o.frustumCulled = true;
                o.renderOrder = 3;
                mesh.scale.set(1,1,1).multiplyScalar(0.3);
                mesh.lookAt(center);
                this.totems.push(mesh);
                this.add(mesh);

                this.bump.dummy.position.copy(mesh.position);
                this.bump.dummy.position.y = -0.01;
                this.bump.instance(this.bump.dummy);

            }

            for( let i = 0; i < 3; i ++ ) {
                const a = 2 * i * Math.PI / 3;
                tot(i, a, true);
                tot(i, a, false);
                
            }

            const obstacles = [0, 5.2, -5.2];

            // ANIMALS
            this.animals = [];
            [ "bear", "elk", "wolf", "fox", "raven", "owl", "eagle" ].forEach((k, i) => {
                const a = new Animal(k, obstacles);
                a.isBear = i === 0;
                a.isBird = i > 3;
                a.iHop = i > 1;
                a.speed = a.isBird ? 4.2 : 5.6;
                a.init();
                this.animals.push(a);
                this.add(a);
            });

            //GROUND ANIMALS

            let arr = genArray(4, 160);
            
            let wlen = arr.length / 20;
  
            for(let i=0; i < 20; i++) {
                for(let j=0; j < wlen; j++){
                    const index = arr[wlen * i + j];
                    const animal = this.animals[index];
                    const origin = new Vector3(
                        (6  * j + Math.random() * 4) - 96, 
                        0, 
                        i * 25 + Math.random() * 20
                    );
                    const color = index === 0 ? new Color(1, 0, 0) : new Color(index === 2 ? 0.1 + 0.1 * Math.random() : 0, 0.66 + Math.random() / 6, 0.1 + Math.random() / 3);
                    animal.spawn(origin, color);
                }
            }

            //BIRDS
            
            arr = genArray(3, 160);
            
            wlen = arr.length / 20;
  
            for(let i=0; i < 20; i++) {
                for(let j=0; j < wlen; j++){
                    const index = arr[wlen * i + j];
                    const animal = this.animals[index + 4];
                    const origin = new Vector3(
                        (6  * j + Math.random() * 4) - 96, 
                        2.4 + 3.3 * Math.random(), 
                        i * 25 + Math.random() * 20
                    );
                    const color = new Color(0, 0.66 + Math.random() / 6, 0.1 + Math.random() / 3);
                    animal.spawn(origin, color);
                }
            }

        });

       
    }

    update() {

        this.animals.forEach((a) => a.update());

        let tDist = 0;

        const cp = App.cameraPosition;

        this.totems.forEach((o) => {
            
            const dx = o.position.x - cp.x;
            const dz = o.position.z - cp.z;
            
            tDist = Math.max( tDist, dx * dx + dz * dz);
        
        });

        this.animals[0].renderOrder = this.animals[0].minDist <= tDist  ? 1 : 4;
    }
}