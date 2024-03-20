#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include  <string.h>
#include <emscripten/emscripten.h>


#define SIZE 1024

int isBear, isBird, iHop;

float zlen, speed, duration;

typedef struct Vec4 {
    float x;
    float y;
    float z;
    float w;
} Vec4;

typedef struct Mat4 {
    float te[16];
} Mat4;


typedef struct Object {
    Vec4 origin;
    Vec4 color;
    Vec4 position;
    float timeOffset;
    float animTime;
    float scale;
} Object;

int objectCount = 0;

Object objects[SIZE];

Vec4 *instancePositions = {0};
Vec4 *instanceColors = {0};


int morphCount;


typedef struct Sorty {
    unsigned short index;
    unsigned short value;
} Sorty;

Sorty sorted[SIZE];

//UTILS

int cmpfunc (const void * a, const void * b) {
   
   return ( ((Sorty*) a )->value - ((Sorty*) b )->value );

}

float inverseLerp( float x, float y, float value ) {

	if ( x != y ) {

		return ( value - x ) / ( y - x );

	} else {

		return 0;

	}

}

float distanceToSquared(float x1, float y1, float z1, float x2, float y2, float z2){
    float dx = x1 - x2;
    float dy = y1 - y2;
    float dz = z1 - z2;

    return dx * dx + dy * dy + dz * dz;
    
}


//API

EMSCRIPTEN_KEEPALIVE void init(int _isBear, int _isBird, int _iHop, float _zlen, float _speed, float _duration, int _morphCount){
    isBear = _isBear;
    isBird = _isBird;
    iHop = _iHop;
    zlen = _zlen;
    speed = _speed;
    duration = _duration;
    morphCount = _morphCount;

    instancePositions = (Vec4 *) malloc(sizeof(Vec4) * SIZE);
    instanceColors = (Vec4 *) malloc(sizeof(Vec4) * SIZE);

}

EMSCRIPTEN_KEEPALIVE void spawn(float ox, float oy, float oz, float cx, float cy, float cz, float to){
    Object *ob = objects + objectCount;
    
    ob->origin.x = ox;
    ob->origin.y = oy;
    ob->origin.z = oz;
    ob->color.x = cx;
    ob->color.y = cy;
    ob->color.z = cz;
    ob->timeOffset = to;

    objectCount++;
}

EMSCRIPTEN_KEEPALIVE int update(float dt, float dpt, float cpx, float cpy, float cpz, float cdx, float cdy, float cdz){
    
    int sortedCount = 0;
    
    for(int i=0; i < objectCount; i++) {
        Object *o = objects + i;
        o->position.x = o->origin.x;
        o->position.y = o->origin.y;
        o->position.z = fmod(o->origin.z + dt * speed - 300., 500.) - 250.; 
        o->animTime = fmod((dt + o->timeOffset), duration);
        o->scale =  fmax( 0., fmin( 1., fmin( inverseLerp(-250., -240., o->position.z), 1. - inverseLerp(240., 250., o->position.z) ) ) );

        if(o->scale == 0.) continue;

        float pc = o->animTime / duration;

        float po = fabs(0.5 -  ( pc) );

        po = iHop ? 0.5 - po : po;

        po = pow(po,  4.2);

        if (isBird ) o->position.y +=  0.5 * po;

        o->position.z -= (isBear ? 0.01 : 1.) * zlen * po;

        float dist = distanceToSquared(cpx, cpy, cpz, o->position.x, o->position.y, o->position.z);

        if(dist < 64.) {

            sorted[sortedCount].index = (unsigned short) i;
            sorted[sortedCount].value = (unsigned short) fmin(65534., dist);
        
            sortedCount++;
        
        } else {

            float dx = o->position.x - cpx;
            float dy = o->position.y - cpy;
            float dz = o->position.z - cpz;
            
            float len = sqrt(dx * dx + dy * dy + dz * dz);

            dx /= len;
            dy /= len;
            dz /= len;

            float dp = cdx * dx + cdy * dy + cdz * dz;

            if(dp > dpt) {
                 
                sorted[sortedCount].index = (unsigned short) i;
                sorted[sortedCount].value = (unsigned short) fmin(65534., dist);
        
                sortedCount++;
            }

        }
    }

    qsort(sorted, sortedCount, sizeof(Sorty), cmpfunc);

    for(int i=0; i < sortedCount; i++) {
        
        int index = sorted[i].index;
        
        Object *o = objects + index;
        
        
        instancePositions[i] = o->position;

        instancePositions[i].w = 0.013 * o->scale;

        instanceColors[i] = o->color;

        instanceColors[i].w = o->animTime;

    }

    return sortedCount | ( sorted[0].value << 16 );
}

EMSCRIPTEN_KEEPALIVE void *getInstancePositions(void){
    return (void *) instancePositions;
}

EMSCRIPTEN_KEEPALIVE void *getInstanceColors(void){
    return (void *) instanceColors;
}