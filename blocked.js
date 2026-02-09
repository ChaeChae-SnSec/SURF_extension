import { CONFIG } from './config.js';

window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const domain = params.get('domain') || 'unknown';
    const prob = parseFloat(params.get('prob')) || 0;

    document.getElementById('domain-name').innerText = domain;
    updateUI(prob);

    function updateUI(prob) {
        document.getElementById('prob-value').innerText = prob + '%';
        const fill = document.getElementById('gauge-fill');
        const level = document.getElementById('risk-level');

        let color = '#eab308';
        let label = 'LOW';

        if (prob >= 70) {
            color = '#ef4444';
            label = 'HIGH';
        } else if (prob >= 40) {
            color = '#f97316';
            label = 'MIDDLE';
        }

        level.innerText = label;
        level.style.color = color;
        document.getElementById('prob-value').style.color = color;
        fill.style.setProperty('--color', color);

        // 게이지 애니메이션 실행
        requestAnimationFrame(animateGauge(performance.now(), prob));
    }

    function animateGauge(startTime, targetProb) {
        const duration = 1500;
        const fill = document.getElementById('gauge-fill');

        return function frame(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = targetProb * eased;

            fill.style.setProperty('--percent', current);
            if (progress < 1) requestAnimationFrame(frame);
        };
    }

    // ===== 이하 체크박스 및 버튼 로직 =====
    const check = document.getElementById('agree-check');
    const btnTemp = document.getElementById('btn-temp');
    const btnPerm = document.getElementById('btn-perm');

    check.addEventListener('change', function () {
        if (this.checked) {
            btnTemp.classList.add('active');
            btnTemp.style.cursor = 'pointer';
            btnPerm.classList.add('active');
            btnPerm.style.cursor = 'pointer';
            btnTemp.disabled = false;
            btnPerm.disabled = false;
        } else {
            btnTemp.classList.remove('active');
            btnTemp.style.cursor = 'not-allowed';
            btnPerm.classList.remove('active');
            btnPerm.style.cursor = 'not-allowed';
            btnTemp.disabled = true;
            btnPerm.disabled = true;
        }
    });

    // ===== 오탐 신고 로직 =====
    const btnReport = document.getElementById('btn-report');

    if (btnReport) {
        btnReport.onclick = () => {
            btnReport.disabled = true;
            btnReport.innerText = "신고 중...";

            fetch(`${CONFIG.API_BASE_URL}/report-false-positive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: domain })
            })
                .then(res => res.json())
                .then(data => {
                    alert("오탐 신고가 성공적으로 접수되었습니다.");
                    btnReport.innerText = "신고 완료";
                    btnReport.style.color = "#999";
                })
                .catch(err => {
                    console.error("신고 실패:", err);
                    alert("신고 중 오류가 발생했습니다.");
                    btnReport.disabled = false;
                    btnReport.innerText = "오탐 신고";
                });
        };
    }

    function sendAllow(mode) {
        if (!check.checked) return;

        fetch(`${CONFIG.API_BASE_URL}/allow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: domain, mode: mode })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                window.location.href = `https://${domain}`;
            });
    }

    document.getElementById('btn-temp').onclick = () => sendAllow('temp');
    document.getElementById('btn-perm').onclick = () => sendAllow('perm');
});