// script.js (replace your current file with this)

// --- Global state ---
let audioContext, analyser, dataArray, mic, stream;
let listening = false;
let currentStep = 1;
let candlesLeft = 8;

let selections = {
    base: null,
    topping: null,
    candle: null
};

// --- Cached DOM elements ---
let cakeBaseEl, cakeToppingEl, cakeToppingBackEl, candleBackEl, candleFrontEl;
let next1Btn, next2Btn, customiseDoneBtn;
let customiseBtn, blowBtn, resetBtn;
let back2Btn, back3Btn;

const canvas = document.getElementById("pixel-bg");
const ctx = canvas.getContext("2d");

const img = new Image();
img.src = "surprise/assets/bg2.jpg"; // your background image

img.onload = () => {
    console.log("✅ Image loaded:", img.width, "x", img.height);
    resizeCanvas();
};
img.onerror = () => {
    console.error("❌ Could not load image:", img.src);
};


function resizeCanvas() {
    const scale = 4; // higher = chunkier pixels
    const smallW = Math.floor(window.innerWidth / scale);
    const smallH = Math.floor(window.innerHeight / scale);

    // canvas internal resolution (small)
    canvas.width = smallW;
    canvas.height = smallH;

    ctx.imageSmoothingEnabled = false;

    // Fit and crop image
    const imgRatio = img.width / img.height;
    const screenRatio = smallW / smallH;

    let drawW, drawH, offsetX, offsetY;

    if (imgRatio > screenRatio) {
        drawH = smallH;
        drawW = Math.floor(drawH * imgRatio);
        offsetX = (smallW - drawW) / 2;
        offsetY = 0;
    } else {
        drawW = smallW;
        drawH = Math.floor(drawW / imgRatio);
        offsetX = 0;
        offsetY = (smallH - drawH) / 2;
    }

    ctx.clearRect(0, 0, smallW, smallH);
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
}


window.addEventListener("resize", resizeCanvas);



// --- Setup ---
function setupDOM() {
    // Cache cake layers
    cakeBaseEl = document.getElementById("cake-base");
    cakeToppingEl = document.getElementById("cake-topping");
    cakeToppingBackEl = document.getElementById("cake-topping-back");
    candleBackEl = document.getElementById("candle-back");
    candleFrontEl = document.getElementById("candle-front");

    // Cache navigation buttons (may be missing in some builds)
    next1Btn = document.getElementById("next-1");
    next2Btn = document.getElementById("next-2");
    customiseDoneBtn = document.getElementById("customise-done");

    back2Btn = document.getElementById("back-2");
    back3Btn = document.getElementById("back-3");

    // Cache menu buttons (reset might not exist in your HTML)
    customiseBtn = document.getElementById("customise-btn");
    blowBtn = document.getElementById("blow-btn");
    resetBtn = document.getElementById("reset"); // optional
    blowDoneBtn = document.getElementById("blow-done"); // optional

    const step1 = document.getElementById("step-1");
    const step2 = document.getElementById("step-2");
    const step3 = document.getElementById("step-3");

    step1.classList.add("active");
    step2.classList.add("exit-right");
    step3.classList.add("exit-right");

    attachEvents();

    console.log("setupDOM finished. Elements found:",
        { cakeBaseEl: !!cakeBaseEl, cakeToppingEl: !!cakeToppingEl, next1Btn: !!next1Btn, customiseBtn: !!customiseBtn, resetBtn: !!resetBtn });
}

// --- Attach button events (defensive) ---
function attachEvents() {
    if (customiseBtn) {
        customiseBtn.addEventListener("click", () => {
            resetSelections();
            showScreens(["customise-screen"]); // show customise screen
            setFadingText(".title h1", "Customise your cake!");
            const step1 = document.getElementById("step-1");
            currentStep = 1;
        });

    } else {
        console.warn("customiseBtn not found");
    }

    if (blowBtn) {
        blowBtn.addEventListener("click", () => {
            candlesLeft = 8;
            setFadingText(".candle-text h2", "Try blowing the candles!")
            showScreens(["blow-candle-screen"]); // show customise screen
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", resetCandles);
    } else {
        // not fatal — just log
        console.info("No reset button in DOM; skip reset binding");
    }

    // Step navigation (only attach if the elements exist)
    if (next1Btn) next1Btn.onclick = () => showStep(2, "next");
    if (back2Btn) back2Btn.onclick = () => showStep(1, "back");

    if (next2Btn) next2Btn.onclick = () => showStep(3, "next");
    if (back3Btn) back3Btn.onclick = () => showStep(2, "back");


    const doneButtons = [
        document.getElementById("customise-done"),            // customise screen
        document.getElementById("blow-done"),            // customise screen
    ];

    doneButtons.forEach(btn => {
        if (!btn) return;

        btn.addEventListener("click", () => {
            // Show main menu
            showScreens(["menu-screen"]);

            // Reset flames
            resetCandles();

            // Reset title text
            setFadingText(".title h1", "Happy Birthday!");

            // Launch confetti
            launchConfetti();
        });
    });

}


function setFadingText(selector, newText) {
    const el = document.querySelector(selector);
    if (!el) return;

    el.classList.add("fade-out");

    let transitioned = false;

    function handler(e) {
        if (e.propertyName === "opacity") {
            transitioned = true;
            el.textContent = newText;
            el.classList.remove("fade-out");
            el.removeEventListener("transitionend", handler);
        }
    }

    el.addEventListener("transitionend", handler);

    // fallback if transition never fires
    setTimeout(() => {
        if (!transitioned) {
            el.textContent = newText;
            el.classList.remove("fade-out");
        }
    }, 350); // match your CSS duration
}



// --- Reset selections ---
function resetSelections() {
    selections = { base: null, topping: null, candle: null };

    if (cakeBaseEl) cakeBaseEl.className = "cake-base";
    if (cakeToppingEl) cakeToppingEl.className = "cake-topping";
    if (cakeToppingBackEl) cakeToppingBackEl.className = "cake-topping-back";
    if (candleBackEl) candleBackEl.className = "candle-back";
    if (candleFrontEl) candleFrontEl.className = "candle-front";

    const flames = document.querySelectorAll(".flame"); // select all candles

    flames.forEach((flame) => {
        const id = flame.id;
        if (!id) return;
        flame.classList.add("hidden");
    });

    if (next1Btn) next1Btn.disabled = true;
    if (next2Btn) next2Btn.disabled = true;
    if (customiseDoneBtn) customiseDoneBtn.disabled = true;
}

// --- Choice functions (keep these global so inline onclick attributes still work) ---
function chooseBase(type) {
    selections.base = type;
    if (cakeBaseEl) cakeBaseEl.className = "cake-base " + type;
    if (next1Btn) next1Btn.disabled = false;
}

function chooseTopping(type) {
    selections.topping = type;
    if (cakeToppingEl) cakeToppingEl.className = "cake-topping " + type;
    if (cakeToppingBackEl) cakeToppingBackEl.className = "cake-topping-back " + type;
    if (next2Btn) next2Btn.disabled = false;
}

function chooseCandle(color) {
    selections.candle = color;
    if (candleBackEl) candleBackEl.className = "candle-back " + color;
    if (candleFrontEl) candleFrontEl.className = "candle-front " + color;
    if (customiseDoneBtn) customiseDoneBtn.disabled = false;
}

// --- Screen helpers ---
function showScreens(ids) {
    // Hide all
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    // Show only the ones in ids[]
    ids.forEach(id => {
        const el = document.getElementById(id);
        el.classList.remove("hidden");
    });
}

function showStep(n, direction = "next") {
    const currentEl = document.getElementById("step-" + currentStep);
    const nextEl = document.getElementById("step-" + n);
    if (!currentEl || !nextEl || currentEl === nextEl) return;

    // Clean old classes

    // 1️⃣ Position next step off-screen BEFORE making it visible

    nextEl.classList.remove(direction === "next" ? "exit-right" : "exit-left"); // remove all possible class, should cause no transition
    nextEl.classList.add("active");

    void nextEl.offsetWidth;

    // 3️⃣ Animate current step out
    currentEl.classList.remove("active"); // remove all possible class, should cause no transition
    currentEl.classList.add(direction === "next" ? "exit-left" : "exit-right");

    currentStep = n;
}






// --- Mic logic (unchanged) ---
function startMic() {
    if (listening) return;
    listening = true;

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(s => {
            stream = s;
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            mic = audioContext.createMediaStreamSource(stream);

            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            mic.connect(analyser);

            dataArray = new Uint8Array(analyser.fftSize);

            detectBlow();
        })
        .catch(err => console.error("Mic error:", err));
}

function stopMic() {
    if (!listening) return;
    listening = false;

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

function detectBlow() {
    if (!listening) return;

    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const value = (dataArray[i] - 128) / 128;
        sum += value * value;
    }
    const volume = Math.sqrt(sum / dataArray.length);

    if (volume > 0.1) {
        console.log("Blow detected!");
        tryBlowCandles();
    }

    requestAnimationFrame(detectBlow);
}

// --- Candles logic with GIF reset ---
function tryBlowCandles() {
    const flames = document.querySelectorAll(".flame");
    const ts = Date.now();

    flames.forEach((flame) => {
        if (!flame.classList.contains("flame-normal")) return;

        const id = flame.id;
        if (!id) return;

        const isBlowout = Math.random() > 0.3; // 70% blowout chance

        // Helper: set GIF with cache-busting query param
        function setGif(className, filename) {
            flame.classList.remove("flame-normal", "flame-lit", "flame-blowout", "flame-off");
            flame.classList.add(className, id);
            const url = `surprise/assets/${id}/${filename}`;
            flame.style.backgroundImage = `url('${url}')`;
        }

        if (isBlowout) {
            candlesLeft -= 1
            setGif("flame-blowout", `${id}-blowout.gif?${ts}")`);
            console.log(flame.className, "blown out!");

            // after blowout finishes, switch to off
            setTimeout(() => {
                flame.classList.remove("flame-blowout");
                flame.classList.add("flame-off");
                console.log(flame.className, "off.");
            }, 3200);
        } else {
            setGif("flame-lit", `${id}-lit.gif?${ts}")`);
            console.log(flame.className, "flickers but stays on!");

            // after flicker, back to normal
            setTimeout(() => {
                flame.classList.remove("flame-lit");
                flame.classList.add("flame-normal");
                flame.style.backgroundImage = `url('surprise/assets/${id}/${id}-normal.png')`;
                console.log(flame.className, "back to normal flame.");
            }, 3200);
        }
        setTimeout(() => {
            if (candlesLeft != 0) {
                setFadingText(".candle-text h2", `${candlesLeft} more to go!`);
                console.log(`Set candle-text ${candlesLeft} more to go!`);
            }
            else {
                setFadingText(".candle-text h2", `Yay hey!`);
            }
        }, 3000); // match your CSS duration


    });
}



function resetCandles() {
    candlesLeft = 8;
    const flames = document.querySelectorAll(".flame"); // select all candles

    // placeholder
    flames.forEach((flame) => {
        const id = flame.id;
        if (!id) return;
        flame.classList.remove("flame-lit", "flame-blowout", "flame-off", "hidden");
        flame.classList.add("flame-normal");
        flame.style.backgroundImage = `url('surprise/assets/${id}/${id}-normal.png')`;
    });
}

function launchConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["rgba(255, 213, 0, 1)", "rgba(228, 136, 228, 1)", "rgba(162, 255, 255, 1)", "rgba(177, 255, 87, 1)", "rgba(255, 54, 54, 1)", "rgba(41, 41, 255, 1)", "#ffa600ff"];
    const particles = [];

    let generating = true;

    // spawn function
    function addParticles(count) {
        const sizeBase = window.innerHeight * 0.006;

        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width; // start anywhere on top
            const y = -10;
            const center = canvas.width / 2;

            // drift toward center
            const dir = x < center ? 1 : -1;

            particles.push({
                x,
                y,
                size: sizeBase + Math.random() * sizeBase,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: 2 + Math.random() * 3,              // fall down
                speedX: dir * (0.5 + Math.random() * 1.5)  // inward drift
            });
        }
    }


    // start with a batch
    addParticles(20);

    let animationId;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (generating) {
            addParticles(1); // sprinkle more each frame
        }

        particles.forEach((p, i) => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            p.y += p.speedY;
            p.x += p.speedX;
        });

        // remove off-screen particles
        for (let i = particles.length - 1; i >= 0; i--) {
            if (particles[i].y > canvas.height) {
                particles.splice(i, 1);
            }
        }

        if (particles.length > 0 || generating) {
            animationId = requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // final cleanup
            cancelAnimationFrame(animationId);
        }
    }

    animate();

    // stop generating new ones after 3s
    setTimeout(() => {
        generating = false;
    }, 4000);
}




// --- Init ---
window.addEventListener("load", setupDOM);
