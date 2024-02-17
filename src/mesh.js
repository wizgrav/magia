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
        
        //dummy.updateMatrix();
        
        const te = dummy.matrix.elements;
        te[12] = dummy.position.x;
        te[13] = dummy.position.y;
        te[14] = dummy.position.z;
        
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
