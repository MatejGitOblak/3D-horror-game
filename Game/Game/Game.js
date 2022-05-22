import { Application } from '../../common/engine/Application.js'
import { vec3, mat4, quat } from '../../lib/gl-matrix-module.js'
import { GUI } from '../../lib/dat.gui.module.js'
import { GLTFLoader } from './GLTFLoader.js'
import { Renderer } from './Renderer.js'
import { Physics } from './Physics.js'
import { Light } from './Light.js'

class App extends Application {
    async start() {
        
        this.loader = new GLTFLoader()
        
        await this.loader.load('../common/models/room/popravljeno.gltf')
        
        this.scene = await this.loader.loadScene(this.loader.defaultScene)

        this.sphere1 = await this.loader.loadNode('Sphere1')
        this.sphere2 = await this.loader.loadNode('Sphere2')
        this.sphere3 = await this.loader.loadNode('Sphere3')
        this.sphere4 = await this.loader.loadNode('Lestenec4')
        this.enableCamera = false

        this.luci = []

        this.luc1 = new Light();
        this.luc2 = new Light();
        this.luc3 = new Light();
        this.luc4 = new Light();
        this.luc5 = new Light();
        
        this.luc1Pos = [...this.sphere1.translation];
        this.luc2Pos = [...this.sphere2.translation];
        this.luc3Pos = [...this.sphere3.translation];
        this.luc4Pos = [...this.sphere4.translation];
        this.luc5Pos = [...this.sphere4.translation];
        this.luc1Pos[1] += 0.5
        this.luc2Pos[1] += 0.5
        this.luc3Pos[1] += 0.5
        this.luc4Pos[1] += 0.5
        this.luc5Pos[1] += 10.2
        this.luc5Pos[0] = -12
        this.luc5Pos[2] = -6.5
        this.luc5.attenuatuion[2] = 0.001
        this.luc1.position = [...this.luc1Pos];
        this.luc2.position = [...this.luc2Pos];
        this.luc3.position = [...this.luc3Pos];
        this.luc4.position = [...this.luc4Pos];
        this.luc5.position = [...this.luc5Pos];
        this.luci.push(this.luc1)
        this.luci.push(this.luc2)
        this.luci.push(this.luc3)
        this.luci.push(this.luc4)
        this.luci.push(this.luc5)

        this.lightFlicker = false
        this.lightStevecUp = 0
        this.lightStevecDown = 0
        this.lightStevec = 0

        this.camera = await this.loader.loadNode('Camera')
        this.camera.camera.far = Infinity
        this.camera.camera.updateMatrix()
        this.koti = [this.camera.rotation[0],this.camera.rotation[1]]
        this.camera.translation[1] += 1.7
        this.camera.updateMatrix()
        this.zacetnaTrans = this.camera.translation[1]

        // Nalozim vsa vrata v array vrat
        this.door1 = await this.loader.loadNode('Vrata1')
        this.door2 = await this.loader.loadNode('Vrata2')
        this.door3 = await this.loader.loadNode('Vrata3')
        this.door4 = await this.loader.loadNode('Vrata4')
        this.doors = [this.door1, this.door2, this.door3, this.door4]
        this.doorCounters = [0,0,0,0]
        this.doorOpens = [false,false,false,false]
        this.doorMoves = [false,false,false,false]
        this.first = true
        

        this.x = this.camera.translation[0]
        this.y = this.camera.translation[1]
        this.z = this.camera.translation[2]

        this.doorOpen = false
        this.moveDoor = false
        this.stevecDoor = 0
        this.soba = 1
        this.time = Date.now()
        this.startTime = this.time
        this.stevecCas = 0
        this.stevecThunder = 0
        this.items = {}

        mat4.rotate(this.camera.matrix, this.camera.matrix, 1.57, [1,0,0])
        this.camera.updateTransform()
        this.camera.translation = [3.4557180404663086, 1.7963054180145264, -4.639586448669434]
        
        this.camera.updateMatrix()
        this.startHeight = this.camera.translation[1]
        this.stena = 'null'

        this.keys = {
            'KeyW': false,
            'KeyA': false,
            'KeyS': false,
            'KeyD': false,
            'Space': false,
            'ShiftLeft': false,
            'ArrowUp': false,
            'ArrowDown': false,
            'Digit1': false,
            'Digit2': false,
            'Digit3': false,
            'Digit4': false
        };

        if (!this.scene || !this.camera) {
            throw new Error('Scene or Camera not present in glTF')
        }

        if (!this.camera.camera) {
            throw new Error('Camera node does not contain a camera reference')
        }

        document.addEventListener('mousemove', (e) => this.mousemovehandler(e, this))
        document.addEventListener('keydown', (e) => this.keydownhandler(e, this))
        document.addEventListener('keyup', (e) => this.keyuphandler(e, this))
        this.pointerlockchangeHandler = this.pointerlockchangeHandler.bind(this)
        document.addEventListener('pointerlockchange', this.pointerlockchangeHandler)

        this.stev = 0;
        this.stevilka = 0
        this.stevilkaVrat = 0
        this.napredovanje = 1

        this.buttons = [
            document.getElementById("button1"),
            document.getElementById("button2"),
            document.getElementById("button3"),
            document.getElementById("button4")
        ]

        this.buttons[0].addEventListener("click", () => this.btn1Handler())
        this.buttons[1].addEventListener("click", () => this.btn2Handler())
        this.buttons[2].addEventListener("click", () => this.btn3Handler())
        this.buttons[3].addEventListener("click", () => this.btn4Handler())

        this.objekti = [
            document.getElementById("stol1")
        ]

        this.objBtns = [
            document.getElementById('stol1')
        ]

        this.papers = [
            document.getElementById("papir1"),
            document.getElementById("papir2"),
            document.getElementById("papir3"),
            document.getElementById("papir4")
        ]

        this.roomObjects1 = {
            'stolVeliki': await this.loader.loadNode("Stol_navaden"),
            'postelja': await this.loader.loadNode("Metal_Bed1")
        }
        this.roomButtons1 = {
            'stol': document.getElementById('stol1')
        }
        this.roomObjects2 = {
            'disk': await this.loader.loadNode("Gramofon_disk"),
            'bucket': await this.loader.loadNode("Bucket2")
        }
        this.naselNamig2 = false
        this.premikajBucket = false
        this.premakniBucket = false
        this.bucketStevec = 0
        this.prvotneKoorBucket = [
            this.roomObjects2.bucket.translation[0],
            this.roomObjects2.bucket.translation[1],
            this.roomObjects2.bucket.translation[2]
        ]
        this.prvotneRotBucket = [
            this.roomObjects2.bucket.rotation[0],
            this.roomObjects2.bucket.rotation[1],
            this.roomObjects2.bucket.rotation[2],
            this.roomObjects2.bucket.rotation[3]
        ]

        this.roomButtons2 = {
            'bucket': document.getElementById("bucketBtn")
        }
        this.premikajBucket = false

        this.roomObjects3 = {
            'hook': await this.loader.loadNode("Chain_move"),
            'lever': await this.loader.loadNode("Lever_rocica3"),
            'noz': await this.loader.loadNode('Rezilo32'),
            'zaboj': await this.loader.loadNode('Zaklad3')
        }
        this.roomButtons3 = {
            'noz': document.getElementById('nozBtn'),
            'zaboj': document.getElementById('chestBtn'),
            'lever': document.getElementById('leverBtn')
        }

        this.moveNoz = false
        this.nozMoved = false
        this.nozCounter = 0
        this.moveZaboj = false
        this.zabojMoved = false
        this.zabojCounter = 0
        this.moveLever = false
        this.leverMoved = false
        this.leverCounter = 0
        this.premikajHook = false
        this.hookCounter = 0

        this.roomObjects4 = {
            "zaklad": await this.loader.loadNode("Zaklad4_pokrov"),
            'platnica1': await this.loader.loadNode('Platnica41'),
            'platnica2': await this.loader.loadNode('Platnica42')
        }

        this.prvotneKoorPlat1 = [...this.roomObjects4.platnica1.translation]
        this.prvotneRotPlat1 = [...this.roomObjects4.platnica1.rotation]
        this.prvotneKoorPlat2 = [...this.roomObjects4.platnica2.translation]
        this.prvotneRotPlat2 = [...this.roomObjects4.platnica2.rotation]

        this.roomButtons4 = {
            'zaklad': document.getElementById("zakladBtn"),
            'knjiga': document.getElementById('bookBtn')
        }

        this.premakniKnjigo = false
        this.premikajKnjigo = false
        this.knjigaOdprta = false
        this.knjigaCounter = 0
        this.naselKljuc = false

        this.odpri = false
        this.zapri = false
        this.odpriCounter = 0
        this.zapriCounter = 0
        this.neOdpri = false

        this.zakladCounter = 0
        this.odpriZaklad = false
        this.enableZaklad = true
        this.odprtZaklad = false

        this.bedCounter = 0
        this.bedMoved = true

        this.premikajStol1 = false
        this.premakniStol1 = false
        this.stolStevec = 0
        this.prvotneKoorStol1 = [...this.roomObjects1.stolVeliki.translation]
        this.prvotneRotStol1 = [...this.roomObjects1.stolVeliki.rotation]

        this.objBtns[0].addEventListener('click', () => this.btnObj1())
        this.roomButtons3.noz.addEventListener('click', () => this.premakniNoz())
        this.roomButtons3.zaboj.addEventListener('click', () => this.premakniZaboj())
        this.roomButtons3.lever.addEventListener('click', () => this.premakniRocico())
        this.roomButtons4.zaklad.addEventListener('click', () => this.zakladBtn())
        this.roomButtons4.knjiga.addEventListener('click', () => this.knjigaBtn())
        this.roomButtons2.bucket.addEventListener('click', () => this.bucketBtn())

        this.izzivi = [
            document.getElementById("overlay1"),
            document.getElementById("overlay2"),
            document.getElementById("overlay3"),
            document.getElementById("overlay4"),
            document.getElementById("overlay5")
        ]

        this.kode = [
            document.getElementById("code1"),
            document.getElementById("code2"),
            document.getElementById("code3"),
            document.getElementById("code4"),
            document.getElementById("chestCode")
        ]

        this.fadeinStevec = 0
        this.fadeinSt = 0
        this.fadeoutStevec = 0
        this.fadeinBool = false

        this.amb = [...this.luci[0].ambientColor]
        this.diff = [...this.luci[0].diffuseColor]
        this.spec = [...this.luci[0].specularColor]

        this.sound('../../common/sounds/rain.ogg', true, 0.2)
        
        this.heart = new Audio('../../common/sounds/heartbeat.ogg')
        this.heart.loop = true
        this.heart.volume = 0
        this.heart.play()

        this.creepy = new Audio('../../common/sounds/gramofon.ogg')
        this.creepy.loop = true
        this.creepy.volume = 0

        this.zacetek = true

        this.dead = false

        this.pogled = false
        this.zacetneKoorCamera = [...this.camera.translation]

        this.end = 0

        this.health = document.getElementById("healthCount")

        this.renderer = new Renderer(this.gl);
        this.renderer.prepareScene(this.scene);
        this.resize();
    }

    pointerlockchangeHandler() {
        if (!this.camera) {
            return
        }
        this.enableCamera = !this.enableCamera
    }

    fixCursor() {
        this.canvas.requestPointerLock();
    }

    getForward() {
        const x = this.camera.rotation[0];
        const y = this.camera.rotation[1];
        const z = this.camera.rotation[2];
        const w = this.camera.rotation[3];
        const forward = vec3.set(
            vec3.create(),
            2 * (x*z + w*y),
            2 * (y*z - w*x),
            1 - 2 * (x*x + y*y)    
        )
        return forward;
    }

    getLeft() {
        const x = this.camera.rotation[0];
        const y = this.camera.rotation[1];
        const z = this.camera.rotation[2];
        const w = this.camera.rotation[3];
        const left = vec3.set(
            vec3.create(),
            1 - 2 * (y*y + z*z),
            2 * (x*y + w*z),
            2 * (x*z - w*y)
        )
        return left;
    }

    render() {
        if (this.renderer) {

            if (this.napredovanje == 5) {
                this.end++
            }

            if (this.end > 400) {
                this.restart()
            }

            if (this.lightFlicker) {
                this.flick()
            }


            const forward = this.getForward();
            const left = this.getLeft();
            if (this.keys['ShiftLeft']) {
                vec3.scale(forward, forward, 0.08);
                vec3.scale(left, left, 0.08);
            }
            else if (!this.keys['ShiftLeft']) {
                vec3.scale(forward, forward, 0.05);
                vec3.scale(left, left, 0.05);
            }

            if (this.keys['KeyA']) {
                vec3.sub(this.camera.translation, this.camera.translation, left);
                if (this.napredovanje <= 4) {
                    this.zaletel(this.napredovanje)
                }
                else if (this.napredovanje > 4) {
                    this.zaletel(5)
                }
            }
            if (this.keys['KeyW']) {
                vec3.sub(this.camera.translation, this.camera.translation, forward);
                if (this.napredovanje <= 4) {
                    this.zaletel(this.napredovanje)
                }
                else if (this.napredovanje > 4) {
                    this.zaletel(5)
                }
            }
            if (this.keys['KeyS']) {
                vec3.add(this.camera.translation, this.camera.translation, forward);
                if (this.napredovanje <= 4) {
                    this.zaletel(this.napredovanje)
                }
                else if (this.napredovanje > 4) {
                    this.zaletel(5)
                }
            }
            if (this.keys['KeyD']) {
                vec3.add(this.camera.translation, this.camera.translation, left);
                if (this.napredovanje <= 4) {
                    this.zaletel(this.napredovanje)
                }
                else if (this.napredovanje > 4) {
                    this.zaletel(5)
                }
            }

            if (this.stevilkaVrat == 1) {
                this.openDoor(1)
            }
            else if (this.stevilkaVrat == 3) {
                this.openDoor(2)
            }
            else if (this.stevilkaVrat == 5) {
                this.openDoor(3)
            }
            else if (this.stevilkaVrat == 7) {
                this.openDoor(4)
            }
            if (!this.bedMoved) {
                this.moveBed()
            }
            if (this.premikajStol1) {
                this.moveStol1()
            }
            if (this.premikajBucket) {
                this.moveBucket()
            }
            if (this.premakniBucket) {
                this.premakniBucket1()
            }
            if (this.napredovanje >= 2) {
                this.rotateDisk()
            }
            if (this.premakniStol1) {
                this.premakniStol()
            }
            if (this.premakniKnjigo) {
                this.moveKnjiga()
            }
            if (this.odpriZaklad) {
                this.openZaklad()
            }
            if (this.premikajKnjigo && !this.knjigaOdprta) {
                this.obracajKnjigo()
            }
            if (this.moveNoz) {
                this.premikajNoz()
            }
            if (this.moveZaboj) {
                this.premikajZaboj()
            }
            if (this.moveLever) {
                this.premikajRocico()
            }
            if (this.premikajHook) {
                this.premakniHook()
            }
            if (this.odpri && !this.neOdpri) {
                this.odpriKnjigo()
            }

            quat.fromEuler(this.camera.rotation, this.koti[0], this.koti[1], 0)
            this.camera.translation[1] = this.zacetnaTrans
            this.zacetnaTrans = this.camera.translation[1]

            this.roomObjects1.stolVeliki.updateMatrix()
            this.roomObjects1.postelja.updateMatrix()
            this.roomObjects2.bucket.updateMatrix()
            this.roomObjects2.disk.updateMatrix()
            this.roomObjects3.zaboj.updateMatrix()
            this.roomObjects3.lever.updateMatrix()
            this.roomObjects3.noz.updateMatrix()
            this.roomObjects3.hook.updateMatrix()
            this.roomObjects4.zaklad.updateMatrix()
            this.roomObjects4.platnica1.updateMatrix()
            this.roomObjects4.platnica2.updateMatrix()
            this.camera.updateMatrix()
            this.renderer.render(this.scene, this.camera, this.luci);   
        }
    }

    flick() {
        if (this.lightStevecUp < 5) {
            if (this.lightStevecDown == 0) {
                for (let i = 0; i < this.luci.length-1; i++) {
                    this.luci[i].ambientColor[0] -= 10 
                    this.luci[i].ambientColor[1] -= 10 
                    this.luci[i].ambientColor[2] -= 10
                    this.luci[i].diffuseColor[0] -= 10
                    this.luci[i].diffuseColor[1] -= 10
                    this.luci[i].diffuseColor[2] -= 10
                    this.luci[i].specularColor[0] -= 10
                    this.luci[i].specularColor[1] -= 10
                    this.luci[i].specularColor[2] -= 10
                }
            }
            this.lightStevecUp++
        }
        else if (this.lightStevecUp >= 5 && this.lightStevecUp < 10) {
            for (let i = 0; i < this.luci.length-1; i++) {
                this.luci[i].ambientColor[0] += 10 
                this.luci[i].ambientColor[1] += 10 
                this.luci[i].ambientColor[2] += 10
                this.luci[i].diffuseColor[0] += 10
                this.luci[i].diffuseColor[1] += 10
                this.luci[i].diffuseColor[2] += 10
                this.luci[i].specularColor[0] += 10
                this.luci[i].specularColor[1] += 10
                this.luci[i].specularColor[2] += 10
            }
            this.lightStevecUp++
        }
        else if (this.lightStevecUp >= 10 && this.lightStevecUp < 15) {
            for (let i = 0; i < this.luci.length-1; i++) {
                this.luci[i].ambientColor[0] -= 10 
                this.luci[i].ambientColor[1] -= 10 
                this.luci[i].ambientColor[2] -= 10
                this.luci[i].diffuseColor[0] -= 10
                this.luci[i].diffuseColor[1] -= 10
                this.luci[i].diffuseColor[2] -= 10
                this.luci[i].specularColor[0] -= 10
                this.luci[i].specularColor[1] -= 10
                this.luci[i].specularColor[2] -= 10
            }
            this.lightStevecUp++
        }
        else if (this.lightStevecUp >= 15 && this.lightStevecUp < 20) {
            for (let i = 0; i < this.luci.length-1; i++) {
                this.luci[i].ambientColor[0] += 10 
                this.luci[i].ambientColor[1] += 10 
                this.luci[i].ambientColor[2] += 10
                this.luci[i].diffuseColor[0] += 10
                this.luci[i].diffuseColor[1] += 10
                this.luci[i].diffuseColor[2] += 10
                this.luci[i].specularColor[0] += 10
                this.luci[i].specularColor[1] += 10
                this.luci[i].specularColor[2] += 10
            }
            this.lightStevecUp++
        }
        else if (this.lightStevecUp >= 20 && this.lightStevecUp < 25) {
            for (let i = 0; i < this.luci.length-1; i++) {
                this.luci[i].ambientColor[0] -= 10 
                this.luci[i].ambientColor[1] -= 10 
                this.luci[i].ambientColor[2] -= 10
                this.luci[i].diffuseColor[0] -= 10
                this.luci[i].diffuseColor[1] -= 10
                this.luci[i].diffuseColor[2] -= 10
                this.luci[i].specularColor[0] -= 10
                this.luci[i].specularColor[1] -= 10
                this.luci[i].specularColor[2] -= 10
            }
            this.lightStevecUp++
        }
        else if (this.lightStevecUp >= 25 && this.lightStevecUp < 30) {
            for (let i = 0; i < this.luci.length-1; i++) {
                this.luci[i].ambientColor[0] += 10 
                this.luci[i].ambientColor[1] += 10 
                this.luci[i].ambientColor[2] += 10
                this.luci[i].diffuseColor[0] += 10
                this.luci[i].diffuseColor[1] += 10
                this.luci[i].diffuseColor[2] += 10
                this.luci[i].specularColor[0] += 10
                this.luci[i].specularColor[1] += 10
                this.luci[i].specularColor[2] += 10
            }
            this.lightStevecUp++
        }
        else if (this.lightStevecUp == 30) {
            this.lightFlicker = false
            this.lightStevecUp = 0
            if (this.lightStevecDown == 0) {
                for (let i = 0; i < this.luci.length-1; i++) {
                    this.luci[i].ambientColor = [15, 15, 15]
                    this.luci[i].diffuseColor = [0, 0, 0]
                    this.luci[i].specularColor = [0, 0, 0]
                }
            } else {
                for (let i = 0; i < this.luci.length-1; i++) {
                    this.luci[i].ambientColor = this.amb
                    this.luci[i].diffuseColor = this.diff
                    this.luci[i].specularColor = this.spec
                }
            }
        }
    }

    restart() {
        for (let i = 0; i < this.luci.length; i++) {
            this.luci[i].ambientColor[0] -= 0.5
            this.luci[i].ambientColor[1] -= 0.5 
            this.luci[i].ambientColor[2] -= 0.5
            this.luci[i].diffuseColor[0] -= 0.5
            this.luci[i].diffuseColor[1] -= 0.5
            this.luci[i].diffuseColor[2] -= 0.5
            this.luci[i].specularColor[0] -= 0.5
            this.luci[i].specularColor[1] -= 0.5
            this.luci[i].specularColor[2] -= 0.5
        }
        if (this.end > 560) {
            location.reload()
        }
    }

    zakladBtn() {
        this.sound('../common/sounds/chestOpen.ogg', false, 0.4)
        this.odpriZaklad = true
        this.enableZaklad = false
    }

    openZaklad() {
        if (this.zakladCounter < 60) {
            const zaklad = this.roomObjects4.zaklad.rotation
            quat.rotateX(zaklad, zaklad, 0.02)
            this.zakladCounter++
        } else {
            this.odpriZaklad = false
            this.zakladCounter = 0
            this.odprtZaklad = true
            this.roomButtons4.zaklad.style.display = "none"
        }
    }

    rotateDisk() {
        const disk = this.roomObjects2.disk.rotation
        quat.rotateY(disk, disk, 0.07)
    }

    moveBed() {
        this.bedCounter++
        if (this.bedCounter < 32) {
            const bedVec = this.roomObjects1.postelja
            quat.rotateY(
                bedVec.rotation,
                bedVec.rotation,
                -0.1
            )
            if (this.bedCounter < 10) {
                bedVec.translation[1] += 0.04
                bedVec.translation[0] += 0.04
            } else {
                bedVec.translation[1] -= 0.04
                bedVec.translation[0] += 0.04
            }
        }
    }

    btn1Handler() {
        const input = document.getElementById("in1")
        const str = input.value
        if (!this.doorOpens[0] && str == "8271") {
            this.sound('../common/sounds/bedFall.ogg', false, 0.2)
            this.bedMoved = false
        }
        else if (!this.doorOpens[0] && str == "42") {
            document.getElementById("code1").style.display = "none"
            this.creepy.play()
            this.openDoor(1)
            this.stevilkaVrat++
            this.napredovanje++
            this.lightFlicker = true
            this.lightStevecDown = 0
            this.sound('../common/sounds/flicker.ogg', false, 0.4)
        }
        else {
            this.sound('../common/sounds/heartLoss.ogg', false, 0.3)
            this.heart.volume += 0.2
            const num = parseInt(this.health.innerHTML)
            this.health.innerHTML = num - 1
            if (this.health.innerHTML <= 0) {
                this.dead = true
                document.getElementById("code1").style.display = "none"
                this.napredovanje = 5
                this.end = 400
            }
            for (let i = 0; i < this.luci.length; i++) {
                this.luci[i].ambientColor[0] += 5         
                this.luci[i].ambientColor[1] -= 5   
                this.luci[i].ambientColor[2] -= 5          
            }
            this.amb = [...this.luci[0].ambientColor]
            this.diff = [...this.luci[0].diffuseColor]
            this.spec = [...this.luci[0].specularColor]
        }
    }

    btn2Handler() {
        const input = document.getElementById("in2")
        const str = input.value
        if (!this.doorOpens[1] && str == "7532") {
            document.getElementById("code2").style.display = "none"
            this.openDoor(2)
            this.stevilkaVrat++
            this.napredovanje++
            this.lightFlicker = true
            this.lightStevecDown = 1
            this.sound('../common/sounds/flicker.ogg', false, 0.4)
        }
        else {
            this.sound('../common/sounds/heartLoss.ogg', false, 0.3)
            this.heart.volume += 0.2
            const num = parseInt(this.health.innerHTML)
            this.health.innerHTML = num - 1
            if (this.health.innerHTML <= 0) {
                this.dead = true
                document.getElementById("code2").style.display = "none"
                this.napredovanje = 5
                this.end = 400
            }
            for (let i = 0; i < this.luci.length; i++) {
                this.luci[i].ambientColor[0] += 5         
                this.luci[i].ambientColor[1] -= 5   
                this.luci[i].ambientColor[2] -= 5          
            }
            this.amb = [...this.luci[0].ambientColor]
            this.diff = [...this.luci[0].diffuseColor]
            this.spec = [...this.luci[0].specularColor]
        }
    }

    btn3Handler() {
        const input = document.getElementById("in3")
        const str = input.value
        if (!this.doorOpens[2] && str == "8945") {
            document.getElementById("code3").style.display = "none"
            this.openDoor(3)
            this.stevilkaVrat++
            this.napredovanje++
        }
        else {
            this.sound('../common/sounds/heartLoss.ogg', false, 0.3)
            this.heart.volume += 0.2
            const num = parseInt(this.health.innerHTML)
            this.health.innerHTML = num - 1
            if (this.health.innerHTML <= 0) {
                this.dead = true
                document.getElementById("code3").style.display = "none"
                this.napredovanje = 5
                this.end = 400
            }
            for (let i = 0; i < this.luci.length; i++) {
                this.luci[i].ambientColor[0] += 5         
                this.luci[i].ambientColor[1] -= 5   
                this.luci[i].ambientColor[2] -= 5          
            }
            this.amb = [...this.luci[0].ambientColor]
            this.diff = [...this.luci[0].diffuseColor]
            this.spec = [...this.luci[0].specularColor]
        }
    }

    btn4Handler() {
        const input = document.getElementById("in4")
        const str = input.value
        if (!this.doorOpens[3] && str == "4913") {
            document.getElementById("code4").style.display = "none"
            this.openDoor(4)
            this.stevilkaVrat++
            this.napredovanje++
        }
        else {
            this.sound('../common/sounds/heartLoss.ogg', false, 0.3)
            this.heart.volume += 0.2
            const num = parseInt(this.health.innerHTML)
            this.health.innerHTML = num - 1
            if (this.health.innerHTML <= 0) {
                this.dead = true
                document.getElementById("code4").style.display = "none"
                this.napredovanje = 5
                this.end = 400
            }
            for (let i = 0; i < this.luci.length; i++) {
                this.luci[i].ambientColor[0] += 5         
                this.luci[i].ambientColor[1] -= 5   
                this.luci[i].ambientColor[2] -= 5          
            }
            this.amb = [...this.luci[0].ambientColor]
            this.diff = [...this.luci[0].diffuseColor]
            this.spec = [...this.luci[0].specularColor]
        }
    }

    btnObj1() {
        if (!this.premikajStol1) {
            this.objBtns[0].style.display = 'none'
            this.prvotneKoorStol1 = [...this.roomObjects1.stolVeliki.translation]
            this.prvotneRotStol1 = [...this.roomObjects1.stolVeliki.rotation]
            this.premikajStol1 = true
            this.premakniStol1 = true
            document.getElementById("navodila1").style.display = "block"
        } else if (this.premikajStol1) {
            document.getElementById("navodila1").style.display = "none"
            this.objBtns[0].innerHTML = 'PREMAKNI STOL'
            this.premikajStol1 = false
            this.roomObjects1.stolVeliki.translation = this.prvotneKoorStol1
            this.roomObjects1.stolVeliki.rotation = this.prvotneRotStol1
        }
    }

    bucketBtn() {
        if (!this.premikajBucket) {
            this.roomButtons2.bucket.style.display = "none"
            this.prvotneKoorBucket = [...this.roomObjects2.bucket.translation]
            this.prvotneRotBucket = [...this.roomObjects2.bucket.rotation]
            this.premikajBucket = true
            this.premakniBucket = true
            document.getElementById("navodila1").style.display = "block"
        } else if (this.premikajBucket) {
            document.getElementById("navodila1").style.display = "none"
            this.roomButtons2.bucket.innerHTML = 'PREMAKNI VEDRO'
            this.premikajBucket = false
            this.roomObjects2.bucket.translation = this.prvotneKoorBucket
            this.roomObjects2.bucket.rotation = this.prvotneRotBucket
        }
    }

    premakniBucket1() {
        if (this.bucketStevec <= 100) {
            this.roomObjects2.bucket.translation[1] += 0.01
            this.bucketStevec++
        }
        else if (this.bucketStevec > 100) {
            this.roomButtons2.bucket.style.display = "block"
            this.roomButtons2.bucket.innerHTML = "POSTAVI VEDRO NAZAJ"
            this.bucketStevec = 0
            this.premakniBucket = false
        }
    }

    knjigaBtn() {
        if (!this.premikajKnjigo) {
            this.sound('../common/sounds/bookMove.ogg', false, 0.5)
            this.roomButtons4.knjiga.style.display = 'none'
            this.prvotneKoorPlat1 = [...this.roomObjects4.platnica1.translation]
            this.prvotneRotPlat1 = [...this.roomObjects4.platnica1.rotation]
            this.prvotneKoorPlat2 = [...this.roomObjects4.platnica2.translation]
            this.prvotneRotPlat2 = [...this.roomObjects4.platnica2.rotation]
            this.premikajKnjigo = true
            this.premakniKnjigo = true
            document.getElementById("navodila2").style.display = "block"
        } else if (this.premikajKnjigo) {
            document.getElementById("navodila2").style.display = "none"
            this.roomButtons4.knjiga.innerHTML = 'INTERACT'
            this.premikajKnjigo = false
            this.roomObjects4.platnica1.translation = this.prvotneKoorPlat1
            this.roomObjects4.platnica1.rotation = this.prvotneRotPlat1
            this.roomObjects4.platnica2.translation = this.prvotneKoorPlat2
            this.roomObjects4.platnica2.rotation = this.prvotneRotPlat2
        }
    }

    moveKnjiga() {
        if (this.knjigaCounter < 60) {
            this.roomObjects4.platnica1.translation[2] += 0.02
            this.roomObjects4.platnica2.translation[2] += 0.02
            this.knjigaCounter++
        } else {
            this.roomButtons4.knjiga.style.display = "block"
            this.roomButtons4.knjiga.innerHTML = "MOVE BACK"
            this.knjigaCounter = 0
            this.premakniKnjigo = false
        }
    }
    

    premakniStol() {
        if (this.stolStevec <= 100) {
            this.roomObjects1.stolVeliki.translation[1] += 0.01
            this.stolStevec++
        }
        else if (this.stolStevec > 100) {
            this.objBtns[0].style.display = 'block'
            this.objBtns[0].innerHTML = "POSTAVI STOL NAZAJ"
            this.stolStevec = 0
            this.premakniStol1 = false
        }
    }

    premakniNoz() {
        this.moveNoz = true
        this.nozMoved = true
        this.roomButtons3.noz.style.display = "none"
    }

    premikajNoz() {
        if (this.nozCounter < 60) {
            this.roomObjects3.noz.translation[1] += 0.01
            this.nozCounter++
        } else {
            this.nozCounter = 0
            this.moveNoz = false
        }
    }

    premakniZaboj() {
        if (document.getElementById("in5").value == "318") {
            this.moveZaboj = true
            this.zabojMoved = true
            this.leverMoved = false
            this.sound('../common/sounds/moveChest.ogg', false, 0.7)
            document.getElementById("chestCode").style.display = "none"
        }
        else {
            this.sound('../common/sounds/heartLoss.ogg', false, 0.3)
            this.heart.volume += 0.2
            const num = parseInt(this.health.innerHTML)
            this.health.innerHTML = num - 1
            if (this.health.innerHTML <= 0) {
                this.dead = true
                document.getElementById("chestCode").style.display = "none"
                this.napredovanje = 5
                this.end = 400
            }
            for (let i = 0; i < this.luci.length; i++) {
                this.luci[i].ambientColor[0] += 5         
                this.luci[i].ambientColor[1] -= 5   
                this.luci[i].ambientColor[2] -= 5          
            }
            this.amb = [...this.luci[0].ambientColor]
            this.diff = [...this.luci[0].diffuseColor]
            this.spec = [...this.luci[0].specularColor]
        }
    }

    premikajZaboj() {
        if (this.zabojCounter < 60) {
            this.roomObjects3.zaboj.translation[2] -= 0.03
            this.zabojCounter++
        } else {
            this.zabojCounter = 0
            this.moveZaboj = false
        }
    }

    premakniRocico() {
        this.moveLever = true
        this.leverMoved = true
        this.roomButtons3.lever.style.display = "none"
        this.sound('../common/sounds/lever.ogg', false, 0.3)
    }

    premikajRocico() {
        if (this.leverCounter < 60) {
            quat.rotateX(
                this.roomObjects3.lever.rotation,
                this.roomObjects3.lever.rotation,
                0.05
            )
            this.leverCounter++ 
        }
        else {
            this.sound('../common/sounds/chains.ogg', false, 0.3)
            this.leverCounter = 0
            this.moveLever = false
            this.premikajHook = true
        }
    }

    premakniHook() {
        if (this.hookCounter < 180) {
            this.roomObjects3.hook.translation[1] -= 0.01
            this.hookCounter++
        } else {
            this.hookCounter = 0
            this.premikajHook = false
        }
    }

    obracajKnjigo() {
        const pl1 = this.roomObjects4.platnica1.rotation
        const pl2 = this.roomObjects4.platnica2.rotation
        if (this.keys['ArrowUp']) {
            quat.rotateZ(
                pl1,
                pl1,
                0.05
            )
            quat.rotateZ(
                pl2,
                pl2,
                0.05
            )
        }
        if (this.keys['ArrowDown']) {
            quat.rotateZ(
                pl1,
                pl1,
                -0.05
            )
            quat.rotateZ(
                pl2,
                pl2,
                -0.05
            )
        }
        if (this.keys['ArrowLeft']) {
            quat.rotateY(
                pl1,
                pl1,
                -0.05
            )
            quat.rotateY(
                pl2,
                pl2,
                -0.05
            )
        }
        if (this.keys['ArrowRight']) {
            quat.rotateY(
                pl1,
                pl1,
                0.05
            )
            quat.rotateY(
                pl2,
                pl2,
                0.05
            )
        }
        if (this.keys['KeyO']) {
            quat.rotateY(
                pl1,
                pl1,
                -0.05
            )
            quat.rotateY(
                pl2,
                pl2,
                +0.05
            )
        }
        if (this.keys['KeyC']) {
            const x = 1
        }
    }

    odpriKnjigo() {
        const pl1 = this.roomObjects4.platnica1.rotation
        const pl2 = this.roomObjects4.platnica2.rotation
        if (this.odpriCounter < 20) {
            quat.rotateY(
                pl1,
                pl1,
                -0.05
            )
            quat.rotateY(
                pl2,
                pl2,
                0.05
            )
            this.odpriCounter++
        } else {
            this.odpriCounter = 0
            this.odpri = false
            this.neOdpri = true
            this.naselKljuc = true
        }
    }

    

    moveBucket() {
        const bucket = this.roomObjects2.bucket.rotation
        if (this.keys['ArrowUp']) {
            quat.rotateZ(
                bucket,
                bucket,
                0.05
            )
        }
        if (this.keys['ArrowDown']) {
            quat.rotateZ(
                bucket,
                bucket,
                -0.05
            )
        }
        if (this.keys['ArrowLeft']) {
            quat.rotateY(
                bucket,
                bucket,
                -0.05
            )
        }
        if (this.keys['ArrowRight']) {
            quat.rotateY(
                bucket,
                bucket,
                0.05
            )
        }
    }

    moveStol1() {
        if (this.keys['ArrowUp']) {
            quat.rotateZ(
                this.roomObjects1.stolVeliki.rotation,
                this.roomObjects1.stolVeliki.rotation,
                0.05
            )
        }
        if (this.keys['ArrowDown']) {
            quat.rotateZ(
                this.roomObjects1.stolVeliki.rotation,
                this.roomObjects1.stolVeliki.rotation,
                -0.05
            )
        }
        if (this.keys['ArrowLeft']) {
            quat.rotateY(
                this.roomObjects1.stolVeliki.rotation,
                this.roomObjects1.stolVeliki.rotation,
                -0.05
            )
        }
        if (this.keys['ArrowRight']) {
            quat.rotateY(
                this.roomObjects1.stolVeliki.rotation,
                this.roomObjects1.stolVeliki.rotation,
                0.05
            )
        }
    }

    zaletel(sobe) {
        const cam = [
            this.camera.translation[0],
            this.camera.translation[2]
        ]
        
        const soba1 = (cam[0] < 8.7 && cam[0] > 0.5 && cam[1] < -0.3 && cam[1] > -8.9)
        const soba2 = (cam[0] < 8.7 && cam[0] > 0.5 && cam[1] < 8.4 && cam[1] > -0.1)
        const soba3 = (cam[0] < 0.4 && cam[0] > -7.9 && cam[1] < 8.4 && cam[1] > -0.1)
        const soba4 = (cam[0] < 0.4 && cam[0] > -7.9 && cam[1] < -0.3 && cam[1] > -8.9)
        const vrata1 = (cam[0] < 7 && cam[0] > 5.7 && cam[1] <= -0.1 && cam[1] >= -0.3)
        const vrata2 = (cam[0] <= 0.5 && cam[0] >= 0.4 && cam[1] < 6.5 && cam[1] > 5.5)
        const vrata3 = (cam[0] < -1.6 && cam[0] > -2.6 && cam[1] <= -0.1 && cam[1] >= -0.3)
        const vrata4 = (cam[0] <= -7.9 && cam[1] < -5.8 && cam[1] > -6.8)

        const doorCode1 = (cam[0] < 7 && cam[0] > 5.7 && cam[1] >= -2 && cam[1] <= -0.2)
        const doorCode2 = (cam[0] >= 0 && cam[0] <= 2.5 && cam[1] < 6.5 && cam[1] > 5.5)
        const doorCode3 = (cam[0] < -1.6 && cam[0] > -2.6 && cam[1] >= -0.6 && cam[1] <= 2)
        const doorCode4 = (cam[0] >= -8.4 && cam[0] <= -6.5 && cam[1] < -5.8 && cam[1] > -6.8)


        const s1 = {
            'bed': (cam[0] <= 3.7 && cam[0] >= 2.7 && cam[1] >= -4.2 && cam[1] <= -1.2)
        }
        const s2 = {
            'pec': (cam[0] <= 6.5 && cam[0] >= 5.5 && cam[1] >= 7.5 && cam[1] <= 8.25),
            'bucket': (cam[0] <= 7.7 && cam[0] >= 5.7 && cam[1] >= 1.3 && cam[1] <= 3.6)
        }
        const s3 = {
            'chest': (cam[0] <= -0.5 && cam[0] >= -1.5 && cam[1] >= 1.5 && cam[1] <= 3.5),
            'noz': (cam[0] <= -0.5 && cam[0] >= -2.5 && cam[1] >= 6 && cam[1] <= 7)
        }
        const s4 = {
            'zaklad': (cam[0] <= -5 && cam[0] >= -6.5 && cam[1] >= -2.3 && cam[1] <= -1.23),
            'knjiga': (cam[0] <= -4.3 && cam[0] >= -5.1 && cam[1] >= -8.3 && cam[1] <= -7.3)
        }

        if (s2.pec) {
            this.naselNamig2 = true
            this.papers[1].style.display = "block"
        }
        else {
            this.papers[1].style.display = "none"
        }

        if (s2.bucket && this.naselNamig2) {
            this.roomButtons2.bucket.style.display = "block"
        }
        else {
            this.roomButtons2.bucket.style.display = "none"
        }

        if (s3.noz && !this.nozMoved) {
            this.roomButtons3.noz.style.display = "block"
        } else {
            this.roomButtons3.noz.style.display = "none"
        }

        if (s3.chest && this.zabojMoved && !this.leverMoved) {
            this.roomButtons3.lever.style.display = "block"
        } else {
            this.roomButtons3.lever.style.display = "none"
        }

        if (s4.knjiga) {
            this.roomButtons4.knjiga.style.display = "block"
        } else {
            this.roomButtons4.knjiga.style.display = "none"
        }

        if (s4.zaklad && this.naselKljuc && !this.odprtZaklad) {
            this.roomButtons4.zaklad.style.display = "block"
        }
        else {
            this.roomButtons4.zaklad.style.display = "none"
        }

        if (s4.zaklad && this.naselKljuc && this.odprtZaklad) {
            this.papers[3].style.display = "block"
        }
        else {
            this.papers[3].style.display = "none"
        }

        if (s4.zaklad && !this.naselKljuc) {
            this.papers[2].style.display = "block"
        }
        else {
            this.papers[2].style.display = "none"
        }

        if (s1.bed && !this.bedMoved) {
            this.papers[0].style.display = "block"
        } else {
            this.papers[0].style.display = "none"
        }

        const obj = [
            (cam[0] <= 4.5 && cam[0] >= 3.5 && cam[1] <= -5.1 && cam[1] >= -6.1)
        ]

        for (let i = 0; i < obj.length; i++) {
            if (obj[i]) {
                this.objekti[i].style.display = 'block'
            } else {
                this.objekti[i].style.display = 'none'
            }
        }

        const displayCode = [
            (doorCode1 && !this.doorOpens[0] && !this.doorMoves[0]),
            (doorCode2 && !this.doorOpens[1] && !this.doorMoves[1]),
            (doorCode3 && !this.doorOpens[2] && !this.doorMoves[2]),
            (doorCode4 && !this.doorOpens[3] && !this.doorMoves[3]),
            (s3.chest && this.nozMoved && !this.zabojMoved)
        ]

        for (let i = 0; i < displayCode.length; i++) {
            if (displayCode[i]) {
                this.kode[i].style.display = "block"
            } else {
                this.kode[i].style.display = "none"
            }
        }

        for (let i = 0; i < this.izzivi.length; i++) {
            if (i+1 == sobe && !this.dead) {
                this.izzivi[i].style.display = "block"
            } else {
                this.izzivi[i].style.display = "none"
            }
        }

        if (soba1 && (sobe == 1 || sobe == 2 || sobe == 3 || sobe == 4 || sobe == 5)) {
            this.stevilka = 1
        }
        else if (soba2 && (sobe == 2 || sobe == 3 || sobe == 4 || sobe == 5)) {
            this.stevilka = 2
        }
        else if (soba3 && (sobe == 3 || sobe == 4 || sobe == 5)) {
            this.stevilka = 3
        }
        else if (soba4 && (sobe == 4 || sobe == 5)) {
            this.stevilka = 4
        }
        else if (vrata1 && (sobe == 2 || sobe == 3 || sobe == 4 || sobe == 5)) {
            this.stevilka = 5
        }
        else if (vrata2 && (sobe == 3 || sobe == 4 || sobe == 5)) {
            this.stevilka = 6
        }
        else if (vrata3 && (sobe == 4 || sobe == 5)) {
            this.stevilka = 7
        }
        else if (vrata4 && (sobe == 5)) {
            this.stevilka = 8
        }

        if (this.stevilka == 2) {
            if (this.creepy.volume < 0.6) {
                this.creepy.volume += 0.008
            }
        }

        if (this.stevilka != 2) {
            if (this.creepy.volume > 0.04) {
                this.creepy.volume -= 0.004
            }
        }

        if (sobe == 1) {
            if (soba1) {
                return true
            } else {
                if (this.stevilka == 1) {
                    if (!(cam[0] < 8.7)) {
                        this.camera.translation[0] = 8.65
                    }
                    else if(!(cam[0] > 0.5)) {
                        this.camera.translation[0] = 0.55
                    }
                    else if(!(cam[1] < -0.3)) {
                        this.camera.translation[2] = -0.35
                    }
                    else if(!(cam[1] > -8.9)) {
                        this.camera.translation[2] = -8.85
                    }
                }
                return false
            }
        }
        else if (sobe == 2) {
            if (soba1 || soba2 || vrata1) {
                return true
            } else {
                if (this.stevilka == 1) {
                    if (this.stevilka == 1) {
                        if (!(cam[0] < 8.7)) {
                            this.camera.translation[0] = 8.65
                        }
                        else if(!(cam[0] > 0.5)) {
                            this.camera.translation[0] = 0.55
                        }
                        else if(!(cam[1] < -0.3)) {
                            this.camera.translation[2] = -0.35
                        }
                        else if(!(cam[1] > -8.9)) {
                            this.camera.translation[2] = -8.85
                        }
                    }
                }
                else if (this.stevilka == 2) {
                    if (!(cam[0] < 8.7)) {
                        this.camera.translation[0] = 8.65
                    }
                    else if(!(cam[0] > 0.5)) {
                        this.camera.translation[0] = 0.55
                    }
                    else if(!(cam[1] < 8.4)) {
                        this.camera.translation[2] = 8.35
                    }
                    else if(!(cam[1] > -0.1)) {
                        this.camera.translation[2] = -0.05
                    }
                }
                else if (this.stevilka == 5) {
                    if (cam[0] < 5.7) {
                        this.camera.translation[0] = 5.75
                    }
                    else if (cam[0] > 7) {
                        this.camera.translation[0] = 6.95
                    }
                }
                return false
            }
        }
        else if (sobe == 3) {
            if (soba1 || soba2 || soba3 || vrata1 || vrata2) {
                return true
            } else {
                if (this.stevilka == 1) {
                    if (this.stevilka == 1) {
                        if (!(cam[0] < 8.7)) {
                            this.camera.translation[0] = 8.65
                        }
                        else if(!(cam[0] > 0.5)) {
                            this.camera.translation[0] = 0.55
                        }
                        else if(!(cam[1] < -0.3)) {
                            this.camera.translation[2] = -0.35
                        }
                        else if(!(cam[1] > -8.9)) {
                            this.camera.translation[2] = -8.85
                        }
                    }
                }
                else if (this.stevilka == 2) {
                    if (!(cam[0] < 8.7)) {
                        this.camera.translation[0] = 8.65
                    }
                    else if(!(cam[0] > 0.5)) {
                        this.camera.translation[0] = 0.55
                    }
                    else if(!(cam[1] < 8.4)) {
                        this.camera.translation[2] = 8.35
                    }
                    else if(!(cam[1] > -0.1)) {
                        this.camera.translation[2] = -0.05
                    }
                }
                else if (this.stevilka == 5) {
                    if (cam[0] < 5.7) {
                        this.camera.translation[0] = 5.75
                    }
                    else if (cam[0] > 7) {
                        this.camera.translation[0] = 6.95
                    }
                }
                else if (this.stevilka == 3) {
                    if (!(cam[0] < 0.4)) {
                        this.camera.translation[0] = 0.35
                    }
                    else if(!(cam[0] > -7.9)) {
                        this.camera.translation[0] = -7.85
                    }
                    else if(!(cam[1] < 8.4)) {
                        this.camera.translation[2] = 8.35
                    }
                    else if(!(cam[1] > -0.1)) {
                        this.camera.translation[2] = -0.05
                    }
                }
                else if (this.stevilka == 6) {
                    if (cam[1] > 6.5) {
                        this.camera.translation[2] = 6.45
                    }
                    else if (cam[1] < 5.5) {
                        this.camera.translation[2] = 5.55
                    }
                }
                return false
            }
        }
        else if (sobe == 4) {
            if (soba1 || soba2 || soba3 || soba4 || vrata1 || vrata2 || vrata3) {
                return true
            } else {
                if (this.stevilka == 1) {
                    if (this.stevilka == 1) {
                        if (!(cam[0] < 8.7)) {
                            this.camera.translation[0] = 8.65
                        }
                        else if(!(cam[0] > 0.5)) {
                            this.camera.translation[0] = 0.55
                        }
                        else if(!(cam[1] < -0.3)) {
                            this.camera.translation[2] = -0.35
                        }
                        else if(!(cam[1] > -8.9)) {
                            this.camera.translation[2] = -8.85
                        }
                    }
                }
                else if (this.stevilka == 2) {
                    if (!(cam[0] < 8.7)) {
                        this.camera.translation[0] = 8.65
                    }
                    else if(!(cam[0] > 0.5)) {
                        this.camera.translation[0] = 0.55
                    }
                    else if(!(cam[1] < 8.4)) {
                        this.camera.translation[2] = 8.35
                    }
                    else if(!(cam[1] > -0.1)) {
                        this.camera.translation[2] = -0.05
                    }
                }
                else if (this.stevilka == 5) {
                    if (cam[0] < 5.7) {
                        this.camera.translation[0] = 5.75
                    }
                    else if (cam[0] > 7) {
                        this.camera.translation[0] = 6.95
                    }
                }
                else if (this.stevilka == 3) {
                    if (!(cam[0] < 0.4)) {
                        this.camera.translation[0] = 0.35
                    }
                    else if(!(cam[0] > -7.9)) {
                        this.camera.translation[0] = -7.85
                    }
                    else if(!(cam[1] < 8.4)) {
                        this.camera.translation[2] = 8.35
                    }
                    else if(!(cam[1] > -0.1)) {
                        this.camera.translation[2] = -0.05
                    }
                }
                else if (this.stevilka == 6) {
                    if (cam[1] > 6.5) {
                        this.camera.translation[2] = 6.45
                    }
                    else if (cam[1] < 5.5) {
                        this.camera.translation[2] = 5.55
                    }
                }
                else if (this.stevilka == 4) {
                    if (!(cam[0] < 0.4)) {
                        this.camera.translation[0] = 0.35
                    }
                    else if(!(cam[0] > -7.9)) {
                        this.camera.translation[0] = -7.85
                    }
                    else if(!(cam[1] < -0.3)) {
                        this.camera.translation[2] = -0.35
                    }
                    else if(!(cam[1] > -8.9)) {
                        this.camera.translation[2] = -8.85
                    }
                }
                else if (this.stevilka == 7) {
                    if (cam[0] < -2.6) {
                        this.camera.translation[0] = -2.55
                    }
                    else if(cam[0] > -1.6) {
                        this.camera.translation[0] = -1.65
                    }
                }
                return false
            }
        }
        else if (sobe == 5) {
            if (soba1 || soba2 || soba3 || soba4 || vrata1 || vrata2 || vrata3 || vrata4) {
                return true
            } else {
                if (this.stevilka == 1) {
                    if (this.stevilka == 1) {
                        if (!(cam[0] < 8.7)) {
                            this.camera.translation[0] = 8.65
                        }
                        else if(!(cam[0] > 0.5)) {
                            this.camera.translation[0] = 0.55
                        }
                        else if(!(cam[1] < -0.3)) {
                            this.camera.translation[2] = -0.35
                        }
                        else if(!(cam[1] > -8.9)) {
                            this.camera.translation[2] = -8.85
                        }
                    }
                }
                else if (this.stevilka == 2) {
                    if (!(cam[0] < 8.7)) {
                        this.camera.translation[0] = 8.65
                    }
                    else if(!(cam[0] > 0.5)) {
                        this.camera.translation[0] = 0.55
                    }
                    else if(!(cam[1] < 8.4)) {
                        this.camera.translation[2] = 8.35
                    }
                    else if(!(cam[1] > -0.1)) {
                        this.camera.translation[2] = -0.05
                    }
                }
                else if (this.stevilka == 5) {
                    if (cam[0] < 5.7) {
                        this.camera.translation[0] = 5.75
                    }
                    else if (cam[0] > 7) {
                        this.camera.translation[0] = 6.95
                    }
                }
                else if (this.stevilka == 3) {
                    if (!(cam[0] < 0.4)) {
                        this.camera.translation[0] = 0.35
                    }
                    else if(!(cam[0] > -7.9)) {
                        this.camera.translation[0] = -7.85
                    }
                    else if(!(cam[1] < 8.4)) {
                        this.camera.translation[2] = 8.35
                    }
                    else if(!(cam[1] > -0.1)) {
                        this.camera.translation[2] = -0.05
                    }
                }
                else if (this.stevilka == 6) {
                    if (cam[1] > 6.5) {
                        this.camera.translation[2] = 6.45
                    }
                    else if (cam[1] < 5.5) {
                        this.camera.translation[2] = 5.55
                    }
                }
                else if (this.stevilka == 4) {
                    if (!(cam[0] < 0.4)) {
                        this.camera.translation[0] = 0.35
                    }
                    else if(!(cam[0] > -7.9)) {
                        this.camera.translation[0] = -7.85
                    }
                    else if(!(cam[1] < -0.3)) {
                        this.camera.translation[2] = -0.35
                    }
                    else if(!(cam[1] > -8.9)) {
                        this.camera.translation[2] = -8.85
                    }
                }
                else if (this.stevilka == 7) {
                    if (cam[0] < -2.6) {
                        this.camera.translation[0] = -2.55
                    }
                    else if(cam[0] > -1.6) {
                        this.camera.translation[0] = -1.65
                    }
                }
                else if (this.stevilka == 8) {
                    if (cam[1] < -6.8) {
                        this.camera.translation[2] = -6.75
                    }
                    else if(cam[1] > -5.8) {
                        this.camera.translation[2] = -5.85
                    }
                }
                return false
            }
        }
    }
    
    openDoor(x) {
        const vrata = this.doors[x-1]

        if (this.doorCounters[x-1] == 0) {
            this.sound('../../common/sounds/doorOpen.ogg', false, 0.2)
        }
        quat.rotateZ(
            vrata.rotation,
            vrata.rotation,
            -0.01
        );
        this.doorMoves[x-1] = true;
        this.doorCounters[x-1]++
        if (this.doorCounters[x-1] == 160) {
            this.doorCounters[x-1] = 0;
            this.doorOpens[x-1] = true;
            
            this.stevilkaVrat++
            if (x == 1) {
                this.keys.Digit1 = false
            }
            else if (x == 2) {
                this.keys.Digit2 = false
            }
            else if (x == 3) {
                this.keys.Digit3 = false
            }
            else if (x == 4) {
                this.keys.Digit4 = false
            }
        }
        vrata.updateMatrix();
    }

    closeDoor(x) {
        const vrata = this.doors[x-1]
        if (this.doorCounters[x-1] == 0) {
            this.sound('../../common/sounds/doorClose.ogg', false, 0.1)
        }
        quat.rotateZ(
            vrata.rotation,
            vrata.rotation,
            0.04
        );
        this.doorCounters[x-1]++
        if (this.doorCounters[x-1] == 40) {
            this.doorCounters[x-1] = 0;
            this.doorOpens[x-1] = false;
            this.doorMoves[x-1] = false;
            if (x == 1) {
                this.keys.Digit1 = false
            }
            else if (x == 2) {
                this.keys.Digit2 = false
            }
            else if (x == 3) {
                this.keys.Digit3 = false
            }
            else if (x == 4) {
                this.keys.Digit4 = false
            }
        }
        vrata.updateMatrix();
    }
    
    mousemovehandler(e, app) {
        if (this.enableCamera) {
            const dx = e.movementX
            const dy = e.movementY
            if (this.zacetek) {
                this.sound('../../common/sounds/rain.ogg', true, 0.2)
                this.zacetek = false
            }
            this.koti[0] -= dy * 0.03
            this.koti[1] -= dx * 0.03
        }
    }

    keydownhandler(e, app) {
        app.keys[e.code] = true;
    }

    keyuphandler(e, app) {
        app.keys[e.code] = false;
        if (e.code == "KeyO") {
            app.odpri = true
            app.knjigaOdprta = true
        }
    }

    sound(name, loop, volume) {
        var audio = new Audio(name);
        if (loop) {
            audio.loop = true
        }
        audio.volume = volume
        audio.play()
    }

    stop(audio) {
        audio.stop()
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspectRatio = w / h;
        if (this.camera) {
            this.camera.camera.aspect = aspectRatio;
            this.camera.camera.updateMatrix();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
    const gui = new GUI();
    gui.add(app, 'fixCursor');
});