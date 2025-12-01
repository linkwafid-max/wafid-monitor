(function () {

    // ================== CONFIG ==================
    const ACTIVATION_CODES_URL =
        "https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/wafid-monitor/main/activation/activation-codes.json";

    const TRIAL_START_KEY   = "wafid_trial_started_at_v1";
    const TRIAL_EXPIRED_KEY = "wafid_trial_expired_v1";
    const LICENSE_KEY       = "wafid_license_status_v1";

    const TRIAL_DURATION_MS = 60 * 1000; // ১ মিনিট
    // ===========================================


    // ---------- ছোট utility ----------
    function genHex(n) {
        let s = "", c = "abcdef0123456789";
        for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)];
        return s;
    }

    function genTok(n) {
        const C = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz";
        let t = "";
        for (let i = 0; i < n; i++) t += C[Math.floor(Math.random() * C.length)];
        return t;
    }

    // ---------- License / Trial Logic ----------

    function getLicenseStatus() {
        const lic = localStorage.getItem(LICENSE_KEY);
        if (lic === "active") return "active";
        return "none";
    }

    function setLicenseActive(code) {
        const data = {
            status: "active",
            activatedAt: Date.now(),
            code: code || null
        };
        localStorage.setItem(LICENSE_KEY, "active");
        localStorage.setItem(LICENSE_KEY + "_meta", JSON.stringify(data));
    }

    function hasTrialExpired() {
        return localStorage.getItem(TRIAL_EXPIRED_KEY) === "1";
    }

    function markTrialExpired() {
        localStorage.setItem(TRIAL_EXPIRED_KEY, "1");
    }

    function getTrialStart() {
        const raw = localStorage.getItem(TRIAL_START_KEY);
        if (!raw) return null;
        const t = parseInt(raw, 10);
        return isNaN(t) ? null : t;
    }

    function ensureTrialStart() {
        let start = getTrialStart();
        if (!start) {
            start = Date.now();
            localStorage.setItem(TRIAL_START_KEY, String(start));
        }
        return start;
    }

    function secondsLeftInTrial() {
        const start = getTrialStart();
        if (!start) return 0;
        const elapsed = Date.now() - start;
        const remain = TRIAL_DURATION_MS - elapsed;
        return remain > 0 ? Math.ceil(remain / 1000) : 0;
    }

    async function validateActivationCode(code) {
        try {
            const res = await fetch(ACTIVATION_CODES_URL + "?_=" + Date.now()); // cache bust
            if (!res.ok) throw new Error("Cannot load activation list");
            const data = await res.json();
            if (!data || !Array.isArray(data.codes)) {
                throw new Error("Invalid activation-codes.json structure");
            }
            return data.codes.includes(code);
        } catch (err) {
            console.error("Activation validation error:", err);
            return false;
        }
    }

    // ---------- UI Panel Create / Update ----------

    function createPanel() {
        let div = document.getElementById("___rotSim");
        if (div) return div;

        div = document.createElement("div");
        div.id = "___rotSim";
        div.style.cssText = `
            position:fixed;
            top:20px;
            right:20px;
            width:430px;
            padding:18px;
            background:rgba(3,10,23,0.95);
            color:#dff8ff;
            border-radius:12px;
            box-shadow:0 0 28px rgba(0,0,0,0.55);
            font-family:'Consolas', monospace;
            z-index:99999999;
        `;
        document.body.appendChild(div);
        return div;
    }

    const panel = createPanel();

    const centers = [
        "Bengal Medical Center",
        "Freedom Health Center",
        "Labcloud Chattogram",
        "Talukder Medical Center",
        "Urban Medical Center",
        "Actual Medical Network",
        "Faith Medical Centre",
        "Alabeer Medical Center",
        "Infinity Lab",
        "Royal Medical Center",
        "Irfan Medical Centre",
        "Sherpur Medical Point",
        "Tanjim Medical Center",
        "Zobeda Samad Center",
        "Mohsinia Diagnostic Center",
        "Akota Diagnostic Center"
    ];

    function renderMainCenter(center, mode) {
        // mode = "licensed" | "trial"
        const session = genTok(30);
        const token   = genTok(45);
        const hash    = genHex(36);
        const load    = Math.floor(Math.random() * 100);
        const slot    = `${Math.floor(Math.random() * 12) + 1}:${Math.floor(Math.random() * 59)
            .toString().padStart(2, "0")} PM`;
        const latency = Math.floor(Math.random() * 300) + 80;

        const isTrial = mode === "trial";
        const leftSec = isTrial ? secondsLeftInTrial() : null;

        const modeLabel = isTrial ? "Trial Mode · 1 minute limit" : "Licensed · Full Access";
        const extra = isTrial
            ? `Free trial running. Time left: <span id="___trial_left">${leftSec}</span>s`
            : `Activation: OK · Unlimited usage on this browser`;

        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="font-size:17px;font-weight:700;">
                    ${center}
                </div>
                <button id="___wafid_close" style="
                    background:transparent;
                    border:none;
                    color:#6ea5b6;
                    font-size:16px;
                    cursor:pointer;
                ">&#10005;</button>
            </div>

            <div style="font-size:13px;margin-bottom:8px;color:#8bd6e6;">
                ${modeLabel} · Live Status Mirror · Passive DB Feed
            </div>

            <div style="font-size:12px;margin-bottom:10px;color:${isTrial ? "#ffcb77" : "#79e2c4"};">
                ${extra}
            </div>

            <div style="font-size:13px;margin-bottom:10px;">
                Payment Required: <b style="color:#ffcb77">$10 USD (USDT TRC20)</b>
            </div>

            <div style="font-size:11px;margin-bottom:14px;color:#f5f5f5;">
                Payment Hash / Memo: <b>de6447d333c8ab484770eff186a73500</b>
            </div>

            <div style="font-size:13px;margin-bottom:6px;">
                Availability Load: <b>${load}%</b>
            </div>

            <div style="height:8px;background:#112a33;border-radius:5px;margin-bottom:10px;overflow:hidden;">
                <div style="height:8px;width:${load}%;background:#46c3c3;border-radius:5px;"></div>
            </div>

            <div style="font-size:13px;margin-bottom:6px;">
                Server Latency: <b>${latency} ms</b>
            </div>

            <div style="font-size:13px;margin-bottom:6px;">
                Next Slot Window: <b>${slot}</b>
            </div>

            <div style="font-size:13px;margin-top:12px;">
                <div>session_key:</div>
                <div style="background:#021b29;padding:6px;border-radius:6px;font-size:12px;margin-bottom:8px;">
                    ${session}
                </div>

                <div>payment_token:</div>
                <div style="background:#021b29;padding:6px;border-radius:6px;font-size:12px;margin-bottom:8px;">
                    ${token}
                </div>

                <div>booking_hash:</div>
                <div style="background:#021b29;padding:6px;border-radius:6px;font-size:12px;">
                    ${hash}
                </div>
            </div>

            <div style="margin-top:14px;font-size:11px;color:#7fadc0;">
                Have activation code? Press <b>Ctrl+Shift+A</b> to activate.
            </div>
        `;

        const closeBtn = document.getElementById("___wafid_close");
        if (closeBtn) {
            closeBtn.onclick = () => {
                panel.remove();
            };
        }
    }

    function renderTrialExpired() {
        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="font-size:17px;font-weight:700;">
                    Trial Expired
                </div>
                <button id="___wafid_close" style="
                    background:transparent;
                    border:none;
                    color:#6ea5b6;
                    font-size:16px;
                    cursor:pointer;
                ">&#10005;</button>
            </div>

            <div style="font-size:13px;margin-bottom:10px;color:#ff9f9f;">
                Your free 1-minute trial for this browser has expired.
            </div>

            <div style="font-size:13px;margin-bottom:10px;color:#8bd6e6;">
                To continue using the system on this browser, please pay with
                <b>USDT (TRC20)</b> and then activate using your activation code.
            </div>

            <div style="font-size:12px;margin-bottom:10px;">
                Payment Hash / Memo:<br>
                <b>de6447d333c8ab484770eff186a73500</b>
            </div>

            <div style="font-size:12px;margin-bottom:10px;color:#9ed9ff;">
                After payment, contact admin to receive your activation code.
            </div>

            <div style="font-size:11px;margin-top:8px;color:#7fadc0;">
                To enter activation code later, press <b>Ctrl+Shift+A</b>.
            </div>
        `;
        const closeBtn = document.getElementById("___wafid_close");
        if (closeBtn) {
            closeBtn.onclick = () => {
                panel.remove();
            };
        }
    }

    function renderActivating() {
        panel.innerHTML = `
            <div style="font-size:17px;font-weight:700;margin-bottom:8px;">
                Activating...
            </div>
            <div style="font-size:13px;margin-bottom:10px;color:#8bd6e6;">
                Checking activation code with remote registry.
            </div>
            <div style="height:6px;background:#112a33;border-radius:5px;overflow:hidden;">
                <div style="height:6px;width:65%;background:#46c3c3;border-radius:5px;
                    animation:___wafid_bar 1s infinite alternate;"></div>
            </div>
            <style>
                @keyframes ___wafid_bar {
                    from { width:20%; }
                    to   { width:90%; }
                }
            </style>
        `;
    }

    function renderActivationFailed(msg) {
        panel.innerHTML = `
            <div style="font-size:17px;font-weight:700;margin-bottom:8px;color:#ff9f9f;">
                Activation Failed
            </div>
            <div style="font-size:13px;margin-bottom:10px;color:#ffb1b1;">
                ${msg}
            </div>
            <div style="font-size:11px;color:#8bd6e6;margin-bottom:6px;">
                Please check your activation code or contact support.
            </div>
            <div style="font-size:11px;margin-top:8px;color:#7fadc0;">
                Try again: press <b>Ctrl+Shift+A</b>.
            </div>
        `;
    }

    // ---------- Rotation + Trial Timer Logic ----------

    let rotateTimer = null;
    let trialTimer  = null;
    let currentMode = null; // "licensed" | "trial"

    function stopRotation() {
        if (rotateTimer) {
            clearTimeout(rotateTimer);
            rotateTimer = null;
        }
    }

    function startRotation(mode) {
        currentMode = mode;

        function step() {
            if (currentMode === "trial" && hasTrialExpired()) {
                stopRotation();
                renderTrialExpired();
                return;
            }

            const center = centers[Math.floor(Math.random() * centers.length)];
            renderMainCenter(center, currentMode);

            const next = Math.floor(Math.random() * 4000) + 3000; // ৩–৭ সেকেন্ড
            rotateTimer = setTimeout(step, next);
        }

        step();
    }

    function startTrialCountdown() {
        if (trialTimer) clearInterval(trialTimer);

        trialTimer = setInterval(() => {
            const left = secondsLeftInTrial();
            const span = document.getElementById("___trial_left");
            if (span) span.textContent = String(left);

            if (left <= 0) {
                clearInterval(trialTimer);
                trialTimer = null;
                markTrialExpired();
                stopRotation();
                renderTrialExpired();
            }
        }, 1000);
    }

    // ---------- Activation flow ----------

    async function askForActivation() {
        const code = window.prompt("Enter activation code:");
        if (!code) return;

        renderActivating();
        const ok = await validateActivationCode(code.trim());
        if (ok) {
            setLicenseActive(code.trim());
            markTrialExpired(); // লাইসেন্স হলে আর ট্রায়াল দরকার নেই
            if (trialTimer) {
                clearInterval(trialTimer);
                trialTimer = null;
            }
            stopRotation();
            startRotation("licensed");
        } else {
            renderActivationFailed("Invalid or unknown activation code.");
        }
    }

    // কিবোর্ড শর্টকাট: Ctrl+Shift+A -> activation prompt
    window.addEventListener("keydown", function (e) {
        if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
            e.preventDefault();
            askForActivation();
        }
    });

    // ---------- Initial boot logic ----------

    (function init() {
        const status = getLicenseStatus();
        if (status === "active") {
            // ইতিমধ্যেই লাইসেন্স আছে
            startRotation("licensed");
            return;
        }

        // লাইসেন্স নাই -> ট্রায়াল চেক
        if (hasTrialExpired()) {
            // আগে একবার trial শেষ হয়েছে => এই ব্রাউজারে আর ফ্রি ট্রায়াল না
            renderTrialExpired();
            return;
        }

        // নতুন বা চলমান trial
        ensureTrialStart();
        const left = secondsLeftInTrial();
        if (left <= 0) {
            // সময় শেষ হয়ে গেছে, এক্সপায়ার্ড মার্ক করে দেই
            markTrialExpired();
            renderTrialExpired();
            return;
        }

        // Trial শুরু বা চালিয়ে যাচ্ছে
        startRotation("trial");
        startTrialCountdown();
    })();

})();
