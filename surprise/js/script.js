// ---------------------------------------------------------
//  VARIABLES DECLARATION
//----------------------------------------------------------

// --- DOM elements ---
let overlay, letterIcon, letter, letterPopup, closePopup, letterDotIcon, videoIcon, video, videoDotIcon, videoElement, closeVideo;
let cakeBaseEl, cakeToppingEl, cakeToppingBackEl, candleBackEl, candleFrontEl;
let customiseBtn, blowBtn;
let step1, step2, step3;
let next1Btn, back2Btn, next2Btn, back3Btn, customiseDoneBtn;

// --- Cake customisation variables ---
let currentStep = 1;
let selections = {
    base: null,
    topping: null,
    candle: null
};

// --- Blow candles variables ---
let audioContext, analyser, dataArray, mic, stream;
let listening = false;
let blowing = false;
let blowStartTime = null;
let cooldown = false;
let candlesLeft = 8;

// --- Confetti variable ---
let confettiAnimating = false;
const colors = ["rgba(255, 213, 0, 1)", "rgba(228, 136, 228, 1)", "rgba(0, 190, 190, 1)", "rgba(136, 255, 0, 1)", "rgba(255, 54, 54, 1)", "rgba(41, 41, 255, 1)", "#ffa600ff"];





// ---------------------------------------------------------
//  SETUP
//----------------------------------------------------------

// --- Cache DOM elements ---
function setupDOM() {
    overlay = document.getElementById("overlay");
    letterIcon = document.getElementById("letter-icon");
    letter = document.getElementById("letter");
    letterDotIcon = document.getElementById("letter-dot-icon");
    letterPopup = document.getElementById("letter-popup");
    closePopup = document.getElementById("close-popup");

    videoIcon = document.getElementById("video-icon");
    video = document.getElementById("video");
    videoDotIcon = document.getElementById("video-dot-icon");
    videoElement = document.getElementById("popup-video");
    closeVideo = document.getElementById("close-video");

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
    blowAgainBtn = document.getElementById("blow-again"); // optional
    blowDoneBtn = document.getElementById("blow-done"); // optional

    step1 = document.getElementById("step-1");
    step2 = document.getElementById("step-2");
    step3 = document.getElementById("step-3");

    step1.classList.add("active");
    step2.classList.add("exit-right");
    step3.classList.add("exit-right");

    attachEvents();
}

// --- Attach button events ---
function attachEvents() {
    // Letter icon
    if (letterIcon && overlay && letterPopup && closePopup) {
        letterIcon.addEventListener("click", () => {
            overlay.classList.add("active");
            letterPopup.classList.add("active");
            overlay.classList.remove("hidden");
            letterPopup.classList.remove("hidden");
            letter.classList.remove("closed");
            letterDotIcon.classList.remove("not-opened");
        });

        function hidePopup() {
            overlay.classList.remove("active");
            letterPopup.classList.remove("active");
            letter.classList.add("closed")
            setTimeout(() => {
                overlay.classList.add("hidden");
                letterPopup.classList.add("hidden");
            }, 400);
        }

        overlay.addEventListener("click", hidePopup);
        closePopup.addEventListener("click", hidePopup);
    }

    // Video 
    if (videoIcon && overlay && closeVideo) {
        // --- Open video ---
        function openVideoPopup() {
            overlay.classList.add("active");
            videoElement.classList.add("active");
            overlay.classList.remove("hidden");
            videoElement.classList.remove("hidden");
            closeVideo.classList.remove("hidden");
            videoElement.currentTime = 0;
            videoElement.play();
            videoDotIcon.classList.remove("not-played");
            videoDotIcon.classList.add("played");
        }

        videoIcon.addEventListener("click", openVideoPopup);

        // --- Close video ---
        function closeVideoPopup() {
            overlay.classList.remove("active");
            videoElement.classList.remove("active");
            videoElement.pause();
            closeVideo.classList.add("hidden");
            setTimeout(() => {
                overlay.classList.add("hidden");
                videoElement.classList.add("hidden");
            }, 400);
        }

        overlay.addEventListener("click", closeVideoPopup);
        closeVideo.addEventListener("click", closeVideoPopup);
    }

    // Main menu screen Customisation button
    if (customiseBtn) {
        customiseBtn.addEventListener("click", () => {
            resetSelections();
            showScreens(["customise-screen"]);
            setFadingText(".title h1", "Customise your cake!");
            currentStep = 1;

            // reset steps positions
            step1.classList.remove("exit-left", "exit-right");
            step2.classList.remove("active", "exit-left");
            step3.classList.remove("active", "exit-left");
            step1.classList.add("active");
            step2.classList.add("exit-right");
            step3.classList.add("exit-right");
        });
    }
    // Main menu screen Blow Candles button
    if (blowBtn) {
        blowBtn.addEventListener("click", () => {
            candlesLeft = 8;
            setFadingText(".candle-text h2", "Try blow into the microphone!")
            startMic();
            showScreens(["blow-candle-screen"]);
        });
    }

    // Customisation scrren Step Navigation buttons
    if (next1Btn) next1Btn.onclick = () => showStep(2, "next");
    if (back2Btn) back2Btn.onclick = () => showStep(1, "back");
    if (next2Btn) next2Btn.onclick = () => showStep(3, "next");
    if (back3Btn) back3Btn.onclick = () => showStep(2, "back");

    // Blow candles screen Again button
    if (blowAgainBtn) {
        blowAgainBtn.addEventListener("click", () => {
            resetCandles();
            setFadingText(".candle-text h2", "Try blow into the microphone!");
        });
    }

    // Common done button
    const doneButtons = [customiseDoneBtn, blowDoneBtn];
    doneButtons.forEach(btn => {
        if (!btn) return;

        btn.addEventListener("click", () => {
            if (btn == blowDoneBtn) stopMic();
            showScreens(["menu-screen"]);
            resetCandles();
            setFadingText(".title h1", "Happy Birthday!");
            launchConfetti();
        });
    });

}

// --- Init ---
window.addEventListener("load", setupDOM);





// ---------------------------------------------------------
//  TEXT UPDATE
//----------------------------------------------------------

// --- Update title text with fade out and fade in ---
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
    }, 350); // match CSS duration
}




// To dad: Love you!



// ---------------------------------------------------------
//  Screen helpers
//----------------------------------------------------------

// --- Change between screens (main menu, customisation, blow candles) ---
function showScreens(ids) {
    // Hide all screens first
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    // Show only the ones specified
    ids.forEach(id => {
        const el = document.getElementById(id);
        el.classList.remove("hidden");
    });
}

// --- Navigate between customisation steps ---
function showStep(n, direction = "next") {
    const currentEl = document.getElementById("step-" + currentStep);
    const nextEl = document.getElementById("step-" + n);
    if (!currentEl || !nextEl || currentEl === nextEl) return;

    // Remove and add class for next step in order to trigger transition
    nextEl.classList.remove(direction === "next" ? "exit-right" : "exit-left");
    nextEl.classList.add("active");
    void nextEl.offsetWidth;

    // Remove and add class for current step in order to trigger transition
    currentEl.classList.remove("active");
    currentEl.classList.add(direction === "next" ? "exit-left" : "exit-right");

    currentStep = n;
}





// ---------------------------------------------------------
//  Cake customisation logic
//----------------------------------------------------------

// --- Clear selections ---
function resetSelections() {

    selections = { base: null, topping: null, candle: null };

    // Clear selection class
    if (cakeBaseEl) cakeBaseEl.className = "cake-base";
    if (cakeToppingEl) cakeToppingEl.className = "cake-topping";
    if (cakeToppingBackEl) cakeToppingBackEl.className = "cake-topping-back";
    if (candleBackEl) candleBackEl.className = "candle-back";
    if (candleFrontEl) candleFrontEl.className = "candle-front";

    // Hide flames for customisation screen
    const flames = document.querySelectorAll(".flame");
    flames.forEach((flame) => {
        const id = flame.id;
        if (!id) return;
        flame.classList.add("hidden");
    });

    // Disable buttons when nothing is selected yet
    if (next1Btn) next1Btn.disabled = true;
    if (next2Btn) next2Btn.disabled = true;
    if (customiseDoneBtn) customiseDoneBtn.disabled = true;
}

// --- Choice functions (enable next/done button only when something is selected)---
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





// ---------------------------------------------------------
//  Blow candle logic
//----------------------------------------------------------

// --- Connect to device microphone and start receiving input ---
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

// --- Pause microphone input ---
function stopMic() {
    if (!listening) return;
    listening = false;

    if (audioContext) {
        audioContext.suspend();
    }
}

// --- Break link with microphone ---
function fullyStopMic() {
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

// --- Run for each frame to detect sound, trigger tryBlowCandles() with condition met ---
function detectBlow() {
    if (!listening) return;

    analyser.getByteTimeDomainData(dataArray);

    // Get volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const value = (dataArray[i] - 128) / 128;
        sum += value * value;
    }
    const volume = Math.sqrt(sum / dataArray.length);

    // Get sound duration
    const now = Date.now();

    // Trigger tryBlowCandles() animation if volumn and duration large enough
    if (!cooldown) {
        if (volume > 0.01) {
            if (!blowing) {
                blowing = true;
                blowStartTime = now;
            } else if (now - blowStartTime >= 350) {
                console.log("Strong blow detected.");
                tryBlowCandles();

                // start cooldown (not detect when animation is ongoing)
                cooldown = true;
                setTimeout(() => { cooldown = false; }, 3500); // animation duration is 3200

                blowing = false;
                blowStartTime = null;
            }
        } else {
            blowing = false;
            blowStartTime = null;
        }
    }

    // Run every frame
    requestAnimationFrame(detectBlow);
}

// --- Candles logic with GIF reset ---
function tryBlowCandles() {
    const flames = document.querySelectorAll(".flame");

    // For treating each GIF as a new GIF so that it would not froze after one animation (cache-busting)
    const ts = Date.now();

    // For each flame, randomly generate with it would blowout
    flames.forEach((flame) => {
        if (!flame.classList.contains("flame-normal")) return;

        const id = flame.id;
        if (!id) return;

        const isBlowout = Math.random() > 0.3; // 70% blowout chance

        // --- Set GIF with cache-busting query param ---
        function setGif(className, filename) {
            flame.classList.remove("flame-normal", "flame-lit", "flame-blowout", "flame-off");
            flame.classList.add(className, id);
            const url = `surprise/assets/${id}/${filename}`;
            flame.style.backgroundImage = `url('${url}')`;
        }

        if (isBlowout) {
            candlesLeft -= 1
            setGif("flame-blowout", `${id}-blowout.gif?${ts}`);
            console.log(flame.className, "blown out!");

            // after animation finishes, switch to off
            setTimeout(() => {
                flame.classList.remove("flame-blowout");
                flame.classList.add("flame-off");
                console.log(flame.className, "is now off.");
            }, 3200);
        }
        else {
            setGif("flame-lit", `${id}-lit.gif?${ts}`);
            console.log(flame.className, "flickers but stays on!");

            // after flicker, back to normal
            setTimeout(() => {
                flame.classList.remove("flame-lit");
                flame.classList.add("flame-normal");
                flame.style.backgroundImage = `url('surprise/assets/${id}/${id}-normal.png')`;
                console.log(flame.className, "back to normal flame.");
            }, 3200);
        }

        // Timeout for setting candles left text
        setTimeout(() => {
            if (candlesLeft != 0) {
                setFadingText(".candle-text h2", `${candlesLeft} more to go!`);
                console.log(`Set candle-text ${candlesLeft} more to go!`);
            }
            else {
                setFadingText(".candle-text h2", `Yay hey!`);
            }
        }, 3000); // animation duration is 3200

    });
}

// --- Reset candles to all lit-up ---
function resetCandles() {
    candlesLeft = 8;
    const flames = document.querySelectorAll(".flame");

    flames.forEach((flame) => {
        const id = flame.id;
        if (!id) return;
        flame.classList.remove("flame-lit", "flame-blowout", "flame-off", "hidden");
        flame.classList.add("flame-normal");
        flame.style.backgroundImage = `url('surprise/assets/${id}/${id}-normal.png')`;
    });
}




// ---------------------------------------------------------
//  Confetti logic
//----------------------------------------------------------

// --- Generate confetti ---
function launchConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    const ctx = canvas.getContext("2d");
    const particles = [];

    if (confettiAnimating) ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiAnimating = true;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // --- Add particles with speciic properties ---
    function addParticles(count) {
        const sizeBase = window.innerHeight * 0.005;
        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width / dpr;
            const y = -10;
            const center = canvas.width / (2 * dpr);
            const dir = x < center ? 1 : -1;
            particles.push({
                x, y,
                size: sizeBase + Math.random() * sizeBase,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: 2.5 + Math.random() * 3,
                speedX: dir * (0.5 + Math.random() * 1.5)
            });
        }
    }

    let generating = true;
    addParticles(20);

    let animationId;

    // --- Animate and keep adding particles ---
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (generating) addParticles(1);

        particles.forEach((p, i) => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            p.y += p.speedY;
            p.x += p.speedX;
        });

        for (let i = particles.length - 1; i >= 0; i--) {
            if (particles[i].y > canvas.height / dpr) particles.splice(i, 1);
        }

        if (particles.length > 0 || generating) {
            animationId = requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cancelAnimationFrame(animationId);
            confettiAnimating = false;
        }
    }

    animate();

    setTimeout(() => generating = false, 4000);
}
