import { Node } from './Node.js';

export class Light extends Node {

    constructor() {
        super();

        Object.assign(this, {
            ambientColor     : [51, 51, 51],
            diffuseColor     : [50, 50, 50],
            specularColor    : [50, 50 ,50],
            shininess        : 10,
            attenuatuion     : [1.0, 0, 0.02]
        });
    }
}