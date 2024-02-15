export function genArray(a, c) {
    const arr = new Array(a * c);
    for(let i=0; i < a; i++) {
        for(let j=0; j < c; j++) {
            arr[i * c + j] = i;
        }    
    }
    shuffle(arr);
    return arr;
}

export function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

export function easeInSine(x) {
    return 1 - Math.cos((x * Math.PI) / 2);
}

export function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}