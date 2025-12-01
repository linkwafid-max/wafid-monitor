(function () {

    // ================== CONFIG ==================
    const ACTIVATION_CODES_URL =
        "https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/wafid-monitor/main/activation/activation-codes.json";

    const TRIAL_KEY = "wafid_trial_info_v1";
    const LICENSE_KEY = "wafid_license_status_v1";
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

    function getTrialInfo() {
        const raw = localStorage.getItem(TRIAL_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function startTrialIfNeeded() {
        let info = getTrialInfo();
        if (!info) {
            info = {
                startedAt: Date.now(),
                everExpired: false
            };
            localStorage.setItem(TRIAL_KEY, JSON.stringify(info));
        }
        return info;
    }

    function isTrialActive() {
        const info = getTrialInfo();
        if (!info) return false;
        const elapsed = Date.now() - info.startedAt;
        if (elapsed < TRIAL_DURATION_MS && !info.everExpired) {
            return true;
        } else {
            // mark expired (one time only)
            if (!info.everExpired) {
                info.everExpired = true;
                localStorage.setItem(TRIAL_KEY, JSON.stringify(info));
            }
            return false;
        }
    }

    function secondsLeftInTrial() {
        const info = getTrialInfo();
        if (!info) return 0;
        const elapsed = Date.now() - info.startedAt;
        const remain = TRIAL_DURATION_MS - elapsed;
        return remain > 0 ? Math.ceil(remain / 1000) : 0;
    }

    // GitHub থেকে activation-codes.json ফেচ করে চেক করার ফাংশন
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

    function renderMainCenter(center, modeInfo) {
        const session = genTok(30);
        const token = genTok(45);
        const hash = genHex(36);
        const load = Math.floor(Math.random() * 100);
        const slot = `${Math.floor(Math.random() * 12) + 1}:${Math.floor(Math.random() * 59)
            .toString().padStart(2, "0")} PM`;
        const latency = Math.floor(Math.random() * 300) + 80;

        const modeLabel = modeInfo.mode === "trial" ? "Trial Mode · " : "Licensed · ";
        const extra = modeInfo.mode === "trial"
            ? `Trial time left: ${modeInfo.left}s`
            : `Activation: OK`;

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
                ${modeLabel} Live Status Mirror · Passive DB Feed
            </div>

            <div style="font-size:12px;margin-bottom:10px;color:#79e2c4;">
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
                    Access Restricted
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
                Your free 1-minute trial has expired on this browser.
            </div>

            <div style="font-size:13px;margin-bottom:10px;color:#8bd6e6;">
                To continue using the system, please pay with <b>USDT (TRC20)</b> and then
                activate using your activation code.
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

    // ---------- Rotation Logic (runs only if licensed OR trial active) ----------

    let rotateTimer = null;

    function startRotation(modeInfo) {
        // প্রথমে একবারই সেন্টার রেন্ডার করি
        function step() {
            const center = centers[Math.floor(Math.random() * centers.length)];

            let mInfo = modeInfo;
            if (modeInfo.mode === "trial") {
                const left = secondsLeftInTrial();
                if (left <= 0) {
                    clearTimeout(rotateTimer);
                    rotateTimer = null;
                    renderTrialExpired();
                    return;
                }
                mInfo = { mode: "trial", left };
            }

            renderMainCenter(center, mInfo);

            const next = Math.floor(Math.random() * 8000) + 5000;
            rotateTimer = setTimeout(step, next);
        }

        step();
    }

    // ---------- Activation flow ----------

    async function askForActivation() {
        const code = window.prompt("Enter activation code:");
        if (!code) return;

        renderActivating();
        const ok = await validateActivationCode(code.trim());
        if (ok) {
            setLicenseActive(code.trim());
            const modeInfo = { mode: "licensed" };
            startRotation(modeInfo);
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
            // Already licensed
            startRotation({ mode: "licensed" });
            return;
        }

        // Trial হিসেব শুরু করতে হবে
        const info = startTrialIfNeeded();

        if (isTrialActive()) {
            const left = secondsLeftInTrial();
            startRotation({ mode: "trial", left });
        } else {
            // ট্রায়াল এক্সপায়ার্ড
            renderTrialExpired();
        }
    })();

})();
