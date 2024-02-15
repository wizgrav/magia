import { PlaneGeometry, SphereGeometry, DoubleSide, Material, PlaneBufferGeometry, BackSide,ConeGeometry, Vector2, Color, ShaderChunk, Object3D } from "three";
import { MeshStandardMaterial } from "three";
import { Mesh } from "three";
import { iMesh } from "./mesh";
import App from "./app";

const g = new ConeGeometry(2,2,16,16, true);

g.translate(0, 1, 0);
g.scale(1,0.5, 1);

const a = g.getAttribute("position");
const arr = a.array;


for(let i=0; i < a.count; i++) {
    const index = 3 * i;
    const y = arr[index + 1];
    arr[index + 1] = 0.5 * Math.pow(y, 5);
}

a.needsUpdate = true;
g.needsUpdate = true;

g.computeVertexNormals();

export class Bump extends iMesh {
    constructor() {
        const m = new MeshStandardMaterial({
            color: new Color(0xEEEEEE),
            normalMap: App.assets["ground/normal"],
            roughness: 0.66,
            metalness: 0,
            dithering: true,
            normalScale: new Vector2(3,3),
            envMap: App.assets.envMap
        });

        const seed = App.assets["seed"];
        m.onBeforeCompile = (s) => {
            s.uniforms.seed = { value:  seed};
            s.vertexShader = s.vertexShader.replace("#include <common>", `//glsl
                #include <common>
                varying vec2 wPosition;
            `).replace("#include <fog_vertex>", `//glsl
                #include <fog_vertex>
                vec4 worldPosition2 = vec4( transformed, 1.0 );
                vec4 wp4 = instanceMatrix * worldPosition2;
                wPosition.xy = wp4.xz;
                vNormalMapUv = abs(wp4.xz) / 5.;
            `);
            s.fragmentShader = s.fragmentShader.replace("#include <common>", `//glsl
            #define IS_GROUND 1    
            #include <common>
                uniform vec2 seed;
                varying vec2 wPosition;
                
               #include <noise>

            `).replace("#include <lights_physical_fragment>", `//glsl
            float nv = abs(snoise((wPosition.xy + seed) / 40.));
            nv = mix(0.5, 1., nv * nv);
            normal = mix( normal, nonPerturbedNormal, 1. - nv * nv);
            normal = normalize(normal);
            #include <lights_physical_fragment>
            `);
        };
        const dummy = new Object3D();
        super(g, m, 6);
        this.dummy = dummy;
        this.receiveShadow = true;
        this.renderOrder = -1;
    }
}
