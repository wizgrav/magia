
import { Clock, EventDispatcher, Vector3 } from "three";

class APP extends EventDispatcher {

    constructor() {
        
        super();
        
        const params = new URLSearchParams(window.location.search);
        this.cameraDirection = new Vector3();
        this.cameraPosition = new Vector3();
        this.clock = new Clock(true);
        this.currentTime = 0;
        this.deltaTime = 0;
        this.screenshot = params.get("shot") == "1";
        this.waves = !! params.get("waves") ? Math.min( 120, parseInt( params.get("waves") )): 20;
    }

    update() {

        const delta = this.clock.getDelta();

        App.currentTime += delta;

        App.deltaTime = delta;

     }

}

const App = new APP();

export default App;