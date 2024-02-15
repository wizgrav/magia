
import { Clock, EventDispatcher, Vector3 } from "three";

class APP extends EventDispatcher {

    constructor() {
        
        super();
        
        this.cameraDirection = new Vector3();
        this.cameraPosition = new Vector3();
        this.clock = new Clock(true);
        this.currentTime = 0;
        this.deltaTime = 0;
        this.screenshot = !! new URLSearchParams(window.location.search).get("shot");
    }

    update() {

        const delta = this.clock.getDelta();

        App.currentTime += delta;

        App.deltaTime = delta;

     }

}

const App = new APP();

export default App;