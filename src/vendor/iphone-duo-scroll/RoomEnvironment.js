// @ts-nocheck
// Vendored from three.js 0.186.0.
/*
Three.js r186
The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/import{BackSide,BoxGeometry,InstancedMesh,Mesh,MeshLambertMaterial,MeshStandardMaterial,PointLight,Scene,Object3D}from"./THREE.js";/**
 * This class represents a scene with a basic room setup that can be used as
 * input for {@link PMREMGenerator#fromScene}. The resulting PMREM represents the room's
 * lighting and can be used for Image Based Lighting by assigning it to {@link Scene#environment}
 * or directly as an environment map to PBR materials.
 *
 * The implementation is based on the [EnvironmentScene](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/three-components/EnvironmentScene.ts)
 * component from the `model-viewer` project.
 *
 * ```js
 * const environment = new RoomEnvironment();
 * const pmremGenerator = new THREE.PMREMGenerator( renderer );
 *
 * const envMap = pmremGenerator.fromScene( environment ).texture;
 * scene.environment = envMap;
 * ```
 *
 * @augments Scene
 * @three_import import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
 */class RoomEnvironment extends Scene{/**
     * Frees internal resources. This method should be called
     * when the environment is no longer required.
     */dispose(){const resources=new Set;this.traverse(object=>{if(object.isMesh){resources.add(object.geometry);resources.add(object.material);}});for(const resource of resources){resource.dispose();}}constructor(){super();this.name="RoomEnvironment";this.position.y=-3.5;const geometry=new BoxGeometry;geometry.deleteAttribute("uv");const roomMaterial=new MeshStandardMaterial({side:BackSide});const boxMaterial=new MeshStandardMaterial;const mainLight=new PointLight(16777215,900,28,2);mainLight.position.set(.418,16.199,.3);this.add(mainLight);const room=new Mesh(geometry,roomMaterial);room.position.set(-.757,13.219,.717);room.scale.set(31.713,28.305,28.591);this.add(room);const boxes=new InstancedMesh(geometry,boxMaterial,6);const transform=new Object3D;// box1
transform.position.set(-10.906,2.009,1.846);transform.rotation.set(0,-.195,0);transform.scale.set(2.328,7.905,4.651);transform.updateMatrix();boxes.setMatrixAt(0,transform.matrix);// box2
transform.position.set(-5.607,-.754,-.758);transform.rotation.set(0,.994,0);transform.scale.set(1.97,1.534,3.955);transform.updateMatrix();boxes.setMatrixAt(1,transform.matrix);// box3
transform.position.set(6.167,.857,7.803);transform.rotation.set(0,.561,0);transform.scale.set(3.927,6.285,3.687);transform.updateMatrix();boxes.setMatrixAt(2,transform.matrix);// box4
transform.position.set(-2.017,.018,6.124);transform.rotation.set(0,.333,0);transform.scale.set(2.002,4.566,2.064);transform.updateMatrix();boxes.setMatrixAt(3,transform.matrix);// box5
transform.position.set(2.291,-.756,-2.621);transform.rotation.set(0,-.286,0);transform.scale.set(1.546,1.552,1.496);transform.updateMatrix();boxes.setMatrixAt(4,transform.matrix);// box6
transform.position.set(-2.193,-.369,-5.547);transform.rotation.set(0,.516,0);transform.scale.set(3.875,3.487,2.986);transform.updateMatrix();boxes.setMatrixAt(5,transform.matrix);this.add(boxes);// -x right
const light1=new Mesh(geometry,createAreaLightMaterial(50));light1.position.set(-16.116,14.37,8.208);light1.scale.set(.1,2.428,2.739);this.add(light1);// -x left
const light2=new Mesh(geometry,createAreaLightMaterial(50));light2.position.set(-16.109,18.021,-8.207);light2.scale.set(.1,2.425,2.751);this.add(light2);// +x
const light3=new Mesh(geometry,createAreaLightMaterial(17));light3.position.set(14.904,12.198,-1.832);light3.scale.set(.15,4.265,6.331);this.add(light3);// +z
const light4=new Mesh(geometry,createAreaLightMaterial(43));light4.position.set(-.462,8.89,14.52);light4.scale.set(4.38,5.441,.088);this.add(light4);// -z
const light5=new Mesh(geometry,createAreaLightMaterial(20));light5.position.set(3.235,11.486,-12.541);light5.scale.set(2.5,2,.1);this.add(light5);// +y
const light6=new Mesh(geometry,createAreaLightMaterial(100));light6.position.set(0,20,0);light6.scale.set(1,.1,1);this.add(light6);}}function createAreaLightMaterial(intensity){// create an emissive-only material. see #31348
const material=new MeshLambertMaterial({color:0,emissive:16777215,emissiveIntensity:intensity});return material;}export{RoomEnvironment};
export const __FramerMetadata__ = {"exports":{"RoomEnvironment":{"type":"class","annotations":{"framerContractVersion":"1"}},"__FramerMetadata__":{"type":"variable"}}}
//# sourceMappingURL=./RoomEnvironment.map