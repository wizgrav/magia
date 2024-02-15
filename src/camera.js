import { MathUtils, PerspectiveCamera, Quaternion, Vector3 } from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import App from "./app";
import { easeInCubic, easeInOutCubic, easeInOutExpo, easeInOutSine, easeInSine, easeOutCubic, easeOutExpo } from "./util";

export class CineCamera extends PerspectiveCamera {

    constructor(fov, aspect, near, far) {
        super(fov, aspect, near, far);
        
        this.controls = new OrbitControls(this, App.renderer.domElement);
        this.controls.target = new Vector3(0, 1.75, 0);
        this.controls.dampingFactor = 0.01;
        this.controls.enableDamping = true;
        this.controls.maxDistance = 5;
        this.controls.minDistance = 0.5;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
        this.controls.minPolarAngle = Math.PI / 2 - 0.1;
        this.controls.enabled = false;

        this.position.set(0, 32, 0);
        this.lookAt(0, 0, 0);
        this.q1 = this.quaternion.clone();
        this.p1 = this.position.clone();

        this.position.set(0, 8, 0);
        this.lookAt(0, 0, 0);
        this.q2 = this.quaternion.clone();
        this.p2 = this.position.clone();

        this.position.set(0, 1.75, 5);
        this.lookAt(0, 1.75, -1);
        this.q3 = this.quaternion.clone();
        this.p3 = this.position.clone();

        this.quaternion.copy(this.q1);
        this.position.set(0, 32, 0);
    }

    update() {

        this.updateMotion();
        
        if( App.renderer.xr.isPresenting ) {

            const cam = App.renderer.xr.getCamera();

            cam.getWorldDirection(App.cameraDirection);

            cam.getWorldPosition(App.cameraPosition);
        
        } else {
            
            this.getWorldDirection(App.cameraDirection);

            this.getWorldPosition(App.cameraPosition);
        
        }
               
    }

    updateMotion() {
        
        const t = App.currentTime;

        const dt = App.deltaTime;

        let v;

        if( t < 10 ) {

            
            if( t > 5 ) {
                
                const v = (t - 5) / 5;

                this.position.y = MathUtils.lerp(10, 1.75, easeOutExpo(v));

                this.position.z = MathUtils.lerp(0, 5, easeOutExpo(v));

                this.quaternion.copy(this.q2).slerp(this.q3, easeOutExpo(v));

            } else {
        
                this.position.y = MathUtils.lerp(32, 10, easeInSine(t / 5));
        
            }

        } else {
            
            if( ! this.controls.enabled ) this.controls.enabled = true;
            
            this.controls.update(App.deltaTime);

            return;
        }

    }
}