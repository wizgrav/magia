import { MeshBasicMaterial, SphereGeometry } from "three";
import { BackSide, Mesh } from "three";
import App from "./app";

const geometry = new SphereGeometry(10000);


class Dome extends Mesh {
    constructor() {
        const material = new MeshBasicMaterial({
            map: App.assets.sky,
            side: BackSide,
            depthTest: true,
            depthWrite: true
        });

        super(geometry,material);


        this.renderOrder = 100;
    }
}

export { Dome };
