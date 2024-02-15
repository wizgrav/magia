import { Vector3 } from "three";
import { InstancedMesh } from "three";
import App from './app';

const V3 = new Vector3();

export class iMesh extends InstancedMesh {
    constructor(g,m,c) {
    
        super(g,m,c);
    
        this.frustumCulled = false;
    
    }
     clear() {
    
        this.count = 0;
    
        this.visible = false;
    
    }

    instance(dummy, color, mixer, time) {
        
        this.visible = true;
        
        dummy.updateMatrix();
        
        this.setMatrixAt(this.count, dummy.matrix);
        
        this.instanceMatrix.needsUpdate = true;
        
        if(color) {
            
            this.setColorAt(this.count, color);
            
            this.instanceColor.needsUpdate = true;
        
        }
        
        if(mixer) {
            
            mixer.setTime(time);
            
            this.setMorphAt(this.count, dummy);
            
            this.morphTexture.needsUpdate = true;
        
        }
        
        return ++this.count;
    }
}
