import { mat4, vec3 } from '../../lib/gl-matrix-module.js';

import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';
import { Light } from './Light.js';

// This class prepares all assets for use with WebGL
// and takes care of rendering.

export class Renderer {

    constructor(gl) {
        this.gl = gl;
        this.glObjects = new Map();
        this.programs = WebGL.buildPrograms(gl, shaders);

        gl.clearColor(0.6, 0.6, 0.4, 1);
        gl.enable(gl.DEPTH_TEST);
        //gl.enable(gl.CULL_FACE);
    }

    prepareBufferView(bufferView) {
        if (this.glObjects.has(bufferView)) {
            return this.glObjects.get(bufferView);
        }

        const buffer = new DataView(
            bufferView.buffer,
            bufferView.byteOffset,
            bufferView.byteLength);
        const glBuffer = WebGL.createBuffer(this.gl, {
            target : bufferView.target,
            data   : buffer
        });
        this.glObjects.set(bufferView, glBuffer);
        return glBuffer;
    }

    prepareSampler(sampler) {
        if (this.glObjects.has(sampler)) {
            return this.glObjects.get(sampler);
        }

        const glSampler = WebGL.createSampler(this.gl, sampler);
        this.glObjects.set(sampler, glSampler);
        return glSampler;
    }

    prepareImage(image) {
        if (this.glObjects.has(image)) {
            return this.glObjects.get(image);
        }

        const glTexture = WebGL.createTexture(this.gl, { image });
        this.glObjects.set(image, glTexture);
        return glTexture;
    }

    prepareTexture(texture) {
        const gl = this.gl;

        this.prepareSampler(texture.sampler);
        const glTexture = this.prepareImage(texture.image);

        const mipmapModes = [
            gl.NEAREST_MIPMAP_NEAREST,
            gl.NEAREST_MIPMAP_LINEAR,
            gl.LINEAR_MIPMAP_NEAREST,
            gl.LINEAR_MIPMAP_LINEAR,
        ];

        if (!texture.hasMipmaps && mipmapModes.includes(texture.sampler.min)) {
            gl.bindTexture(gl.TEXTURE_2D, glTexture);
            gl.generateMipmap(gl.TEXTURE_2D);
            texture.hasMipmaps = true;
        }
    }

    prepareMaterial(material) {
        if (material.baseColorTexture) {
            this.prepareTexture(material.baseColorTexture);
        }
        if (material.metallicRoughnessTexture) {
            this.prepareTexture(material.metallicRoughnessTexture);
        }
        if (material.normalTexture) {
            this.prepareTexture(material.normalTexture);
        }
        if (material.occlusionTexture) {
            this.prepareTexture(material.occlusionTexture);
        }
        if (material.emissiveTexture) {
            this.prepareTexture(material.emissiveTexture);
        }
    }

    preparePrimitive(primitive) {
        if (this.glObjects.has(primitive)) {
            return this.glObjects.get(primitive);
        }

        this.prepareMaterial(primitive.material);

        const gl = this.gl;
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        if (primitive.indices) {
            const bufferView = primitive.indices.bufferView;
            bufferView.target = gl.ELEMENT_ARRAY_BUFFER;
            const buffer = this.prepareBufferView(bufferView);
            gl.bindBuffer(bufferView.target, buffer);
        }

        // this is an application-scoped convention, matching the shader
        const attributeNameToIndexMap = {
            POSITION   : 0,
            NORMAL     : 1,
            TEXCOORD_0 : 2,
        };

        for (const name in primitive.attributes) {
            const accessor = primitive.attributes[name];
            const bufferView = accessor.bufferView;
            const attributeIndex = attributeNameToIndexMap[name];

            if (attributeIndex !== undefined) {
                bufferView.target = gl.ARRAY_BUFFER;
                const buffer = this.prepareBufferView(bufferView);
                gl.bindBuffer(bufferView.target, buffer);
                gl.enableVertexAttribArray(attributeIndex);
                gl.vertexAttribPointer(
                    attributeIndex,
                    accessor.numComponents,
                    accessor.componentType,
                    accessor.normalized,
                    bufferView.byteStride,
                    accessor.byteOffset);
            }
        }

        this.glObjects.set(primitive, vao);
        return vao;
    }

    prepareMesh(mesh) {
        for (const primitive of mesh.primitives) {
            this.preparePrimitive(primitive);
        }
    }

    prepareNode(node) {
        if (node.mesh) {
            this.prepareMesh(node.mesh);
        }
        for (const child of node.children) {
            this.prepareNode(child);
        }
    }

    prepareScene(scene) {
        for (const node of scene.nodes) {
            this.prepareNode(node);
        }
    }

    getViewProjectionMatrix(camera) {
        const mvpMatrix = mat4.clone(camera.matrix);
        let parent = camera.parent;
        while (parent) {
            mat4.mul(mvpMatrix, parent.matrix, mvpMatrix);
            parent = parent.parent;
        }
        mat4.invert(mvpMatrix, mvpMatrix);
        mat4.mul(mvpMatrix, camera.camera.matrix, mvpMatrix);
        return mvpMatrix;
    }

    getModelViewMatrix(node, camera) {

        const viewMatrix = mat4.clone(camera.matrix)
        mat4.invert(viewMatrix, viewMatrix)
        const modelMatrix = mat4.clone(node.matrix)
        let parent = node.parent;
        while (parent) {
            mat4.mul(modelMatrix, parent.matrix, modelMatrix);
            parent = parent.parent;
        }
        
        return mat4.mul(mat4.create(), viewMatrix, modelMatrix)
    }

    render(scene, camera, luci) {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const program = this.programs.simple;
        gl.useProgram(program.program);
        let projMatrix = mat4.clone(camera.camera.matrix)
        gl.uniformMatrix4fv(program.uniforms.uProjection, false, projMatrix);
        let ambArr = []
        let diffArr = []
        let specArr = []
        let posArr = []
        let shArr = []
        let attArr = []
        for (let i = 0; i < luci.length; i++) {
            let col = vec3.clone(luci[i].ambientColor)
            vec3.scale(col, col, 1.0/255)
            ambArr.push(col)
            col = vec3.clone(luci[i].diffuseColor)
            vec3.scale(col, col, 1.0/255)
            diffArr.push(col)
            col = vec3.clone(luci[i].specularColor)
            vec3.scale(col, col, 1.0/255)
            specArr.push(col)
            posArr.push(luci[i].position)
            shArr.push(luci[i].shininess)
            attArr.push(luci[i].attenuatuion)
        }

        let location = gl.getUniformLocation(program.program, 'uAmbientColor')
        gl.uniform3fv(location, [...ambArr[0], ...ambArr[1], ...ambArr[2], ...ambArr[3], ...ambArr[4]])
        location = gl.getUniformLocation(program.program, 'uDiffuseColor')
        gl.uniform3fv(location, [...diffArr[0], ...diffArr[1], ...diffArr[2], ...diffArr[3], ...diffArr[4]])
        location = gl.getUniformLocation(program.program, 'uSpecularColor')
        gl.uniform3fv(location, [...specArr[0], ...specArr[1], ...specArr[2], ...specArr[3], ...specArr[4]])
        location = gl.getUniformLocation(program.program, 'uLightPosition')
        gl.uniform3fv(location, [...posArr[0], ...posArr[1], ...posArr[2], ...posArr[3], ...posArr[4]])
        location = gl.getUniformLocation(program.program, 'uLightAttenuation')
        gl.uniform3fv(location, [...attArr[0], ...attArr[1], ...attArr[2], ...attArr[3], ...attArr[4]])

        location = gl.getUniformLocation(program.program, 'uShininess')
        gl.uniform1fv(location, shArr)
        gl.uniform1i(program.uniforms.uTexture, 0);
        const mvpMatrix = this.getViewProjectionMatrix(camera);
        for (const node of scene.nodes) {
            this.renderNode(node, camera);
        }
    }

    renderNode(node, camera) {
        const gl = this.gl;

        //mvpMatrix = mat4.clone(mvpMatrix);
        //mat4.mul(mvpMatrix, mvpMatrix, node.matrix);

        const viewModelMatrix = this.getModelViewMatrix(node, camera);

        if (node.mesh) {
            const program = this.programs.simple;
            gl.uniformMatrix4fv(program.uniforms.uViewModel, false, viewModelMatrix);
            for (const primitive of node.mesh.primitives) {
                this.renderPrimitive(primitive);
            }
        }

        for (const child of node.children) {
            this.renderNode(child, camera);
        }
    }

    renderPrimitive(primitive) {
        const gl = this.gl;

        const vao = this.glObjects.get(primitive);
        const material = primitive.material;
        const texture = material.baseColorTexture;
        const glTexture = this.glObjects.get(texture.image);
        const glSampler = this.glObjects.get(texture.sampler);

        gl.bindVertexArray(vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.bindSampler(0, glSampler);

        if (primitive.indices) {
            const mode = primitive.mode;
            const count = primitive.indices.count;
            const type = primitive.indices.componentType;
            gl.drawElements(mode, count, type, 0);
        } else {
            const mode = primitive.mode;
            const count = primitive.attributes.POSITION.count;
            gl.drawArrays(mode, 0, count);
        }
    }

}
