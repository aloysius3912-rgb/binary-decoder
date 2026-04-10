// bg-animation.js

// 1. Load Three.js dynamically so you don't need to add it to every HTML head manually
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
script.onload = initBackground; // Wait for Three.js to load, then start
document.head.appendChild(script);

function initBackground() {
    // --- CONFIGURATION ---
    const config = {
        speed: 5,
        scale: 1,
        color: 0x17369b, // Dark Blue
        noiseIntensity: 0.2,
        rotation: 0
    };

    // --- CREATE CONTAINER IF IT DOESN'T EXIST ---
    let container = document.getElementById('canvas-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'canvas-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.zIndex = '-1'; // Behind everything
        document.body.prepend(container);
    }

    // --- SHADERS ---
    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uSpeed;
        uniform float uScale;
        uniform float uRotation;
        uniform float uNoiseIntensity;
        
        const float e = 2.71828182845904523536;
        
        float noise(vec2 texCoord) {
            float G = e;
            vec2 r = (G * sin(G * texCoord));
            return fract(r.x * r.y * (1.0 + texCoord.x));
        }
        
        vec2 rotateUvs(vec2 uv, float angle) {
            float c = cos(angle);
            float s = sin(angle);
            mat2 rot = mat2(c, -s, s, c);
            return rot * uv;
        }
        
        void main() {
            float rnd = noise(gl_FragCoord.xy);
            vec2 uv = rotateUvs(vUv * uScale, uRotation);
            vec2 tex = uv * uScale;
            float tOffset = uSpeed * uTime;
            
            tex.y += 0.03 * sin(8.0 * tex.x - tOffset);
            
            float pattern = 0.6 + 0.4 * sin(5.0 * (tex.x + tex.y + cos(3.0 * tex.x + 5.0 * tex.y) + 0.02 * tOffset) + sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));
            
            vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
            col.a = 1.0;
            gl_FragColor = col;
        }
    `;

    // --- THREE.JS SETUP ---
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(config.color) },
            uSpeed: { value: config.speed },
            uScale: { value: config.scale },
            uRotation: { value: config.rotation },
            uNoiseIntensity: { value: config.noiseIntensity }
        }
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        material.uniforms.uTime.value = clock.getElapsedTime() * 0.1;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}