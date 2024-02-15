import { FrontSide, MathUtils, MeshBasicMaterial, MeshPhongMaterial, PlaneGeometry, ShaderChunk, Vector2 } from "three";
import { BackSide, ShaderMaterial } from "three";
import { Vector3, Mesh, PlaneBufferGeometry, MeshStandardMaterial, DoubleSide, Color } from "three";
import App from "./app";

function randomize(arr) {
    
    function smoothstep(edge0, edge1, x) {
        if (!x && !edge0 && !edge1) return 0
        if (x.length) {
            if (edge0.length) return x.map(function (x, i) {
                return smoothstep(edge0[i], edge1[i], x);
            });
            return x.map(function (x, i) {
                return smoothstep(edge0, edge1, x);
            });
        }
        var t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0.0), 1.0);
        return t * t * (3.0 - 2.0 * t);
    }

    const len = arr.length / 3;

    const rar = [];

    for(let i = 0; i < len; i ++) {

        rar[i] = Math.random() / 100;
    
    }

    for(let i = 129; i < len - 129; i ++){
        
        let v = rar[i] * 0.4;
        v += rar[i + 1] * 0.3;
        v += rar[i - 1] * 0.3;
        v += rar[i + 128] * 0.3;
        v += rar[i - 128] * 0.3;
        v += rar[i + 1 + 128] * 0.225;
        v += rar[i - 1 + 128] * 0.225;
        v += rar[i + 1 - 128] * 0.225;
        v += rar[i - 1 - 128] * 0.225;
        
        arr[i * 3 + 2] = v / 2.5;
    } 
    
    for(let i = 0; i < len; i ++) {

        const i3 = i * 3;

        const x = arr[i3];

        const y = arr[i3 + 1];

        const z = arr[i3 + 2];

        let a = smoothstep(0.1, 0.2, Math.abs(x));

        a *= smoothstep(1, 0.9, Math.abs(y));

        arr[i3 + 2] = a * a * z;

    }
}


class Ground extends Mesh {
    constructor() {
        const material = 
            new MeshStandardMaterial({
                color: new Color(0xEEEEEE),
                normalMap: App.assets["ground/normal"],
                roughness: 0.66,
                normalScale: new Vector2(3,3),
                metalness: 0,
                side: FrontSide,
                dithering: true,
                envMap: App.assets.envMap
            });
        
        const seed = App.assets["seed"];
        material.onBeforeCompile = (s) => {
            s.uniforms.seed = { value: seed };
            
            s.vertexShader = s.vertexShader.replace("#include <common>", `//glsl
                #include <common>
                varying vec2 wPosition;
            `).replace("#include <fog_vertex>", `//glsl
                #include <fog_vertex>
                vec4 wp4 = modelMatrix * vec4( transformed, 1.0 );
                wPosition = wp4.xz;
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
        
        const g = new PlaneGeometry(1, 1, 8, 128);
        const a = g.getAttribute("position");
        const arr = a.array;

       randomize(arr);

        a.needsUpdate = true;
        g.needsUpdate = true;

        g.computeVertexNormals();

        super(g, material)
        this.frustumCulled = false;
        this.rotation.x = -Math.PI/2;
        this.receiveShadow = true;
        this.castShadow = false;
        this.scale.set(1000, 1000, 1000);
        this.renderOrder = 10;
    }
}

export { Ground };