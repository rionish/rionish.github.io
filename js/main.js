/* ==========================================================================
   个人作品集网站 交互脚本
   --------------------------------------------------------------------------
   目前仅负责：移动端汉堡菜单的展开 / 收起。
   后续若要加「点击卡片进入详情页」等交互，在这里继续补充即可。
   ========================================================================== */

const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

// 点击汉堡按钮：切换菜单显示
hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// 点击任意导航链接后，自动收起移动端菜单（避免菜单挡住页面）
document.querySelectorAll('.nav-item').forEach((link) => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// 点击页面其他区域时，也收起菜单
document.addEventListener('click', (e) => {
    if (
        navMenu.classList.contains('active') &&
        !navMenu.contains(e.target) &&
        !hamburger.contains(e.target)
    ) {
        navMenu.classList.remove('active');
    }
});

// ===== 锚点跳转后清除地址栏哈希，避免 Live Server 刷新时自动跳回板块 =====
window.addEventListener('load', () => {
    // 页面加载后，若地址带 #xxx，平滑滚动到对应板块后清除哈希
    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) {
            setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', window.location.pathname + window.location.search);
            }, 100);
        }
    }
});

// ===== 灯箱：点击图片放大 =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

// 点击带 .lightbox-trigger 的图片时打开灯箱
document.querySelectorAll('.lightbox-trigger').forEach((img) => {
    img.addEventListener('click', (e) => {
        e.stopPropagation();
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || '';
        lightbox.classList.add('show');
        document.body.style.overflow = 'hidden'; // 放大时锁定背景滚动
    });
});

// 关闭灯箱
function closeLightbox() {
    lightbox.classList.remove('show');
    document.body.style.overflow = '';
}
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
    // 点击遮罩背景（非图片本身）时关闭
    if (e.target === lightbox) closeLightbox();
});
// 按 ESC 键关闭
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
});

// ===== 指标小方块 → 详情弹窗 =====
const detailModals = document.querySelectorAll('.detail-modal');

// 点击可点击指标卡片，打开对应弹窗
document.querySelectorAll('.metric-item.clickable').forEach((item) => {
    item.addEventListener('click', () => {
        const modal = document.getElementById(item.dataset.modal);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden'; // 锁定背景滚动
        }
    });
});

// 关闭单个详情弹窗
function closeDetailModal(modal) {
    modal.classList.remove('show');
    // 若没有其他弹窗/灯箱打开，恢复背景滚动
    const anyOpen = document.querySelector('.detail-modal.show, .lightbox.show');
    if (!anyOpen) document.body.style.overflow = '';
}

detailModals.forEach((modal) => {
    // 点右上角 × 关闭
    const closeBtn = modal.querySelector('.detail-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeDetailModal(modal));
    }
    // 点遮罩空白处关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeDetailModal(modal);
    });
});

// ===== 滚动入场动画 + 结果数字滚动计数 =====
(function () {
    // 浏览器不支持时直接跳过（元素保持正常显示，不做任何隐藏）
    if (!('IntersectionObserver' in window)) return;

    // 需要入场动画的区块：卡片类元素逐个上场
    const targets = [];
    document.querySelectorAll('.exp-card').forEach((el) => targets.push(el));
    document.querySelectorAll('.project-card').forEach((el) => targets.push(el));
    document.querySelectorAll('.skill-card').forEach((el) => targets.push(el));
    document.querySelectorAll('.other-card').forEach((el, i) => {
        el.dataset.delay = Math.min(i, 4);
        targets.push(el);
    });
    document.querySelectorAll('.hero-highlight').forEach((el) => targets.push(el));

    if (!targets.length) return;

    // 数字从 0 滚动到目标值，保留原文的 +、-、%、小数位
    function animateText(el, duration) {
        const nodes = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = walker.nextNode())) {
            if (/\d/.test(n.nodeValue)) nodes.push({ node: n, original: n.nodeValue });
        }
        if (!nodes.length) return;

        const t0 = performance.now();
        function tick(now) {
            const p = Math.min((now - t0) / duration, 1);
            // easeInOutCubic：起步缓、中段匀速、收尾缓，整个过程看得清
            const eased = p < 0.5
                ? 4 * p * p * p
                : 1 - Math.pow(-2 * p + 2, 3) / 2;
            nodes.forEach(({ node, original }) => {
                node.nodeValue = original.replace(/([-+]?\d+(?:\.\d+)?)/g, (m) => {
                    const val = parseFloat(m);
                    const dec = (m.split('.')[1] || '').length;
                    const cur = val * eased;
                    let out = dec ? cur.toFixed(dec) : String(Math.round(cur));
                    if (m.startsWith('+') && cur >= 0) out = '+' + out;
                    return out;
                });
            });
            if (p < 1) {
                requestAnimationFrame(tick);
            } else {
                // 收尾时把文本还原成精确原值，避免浮点误差
                nodes.forEach(({ node, original }) => { node.nodeValue = original; });
            }
        }
        requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;

            // 1) 淡入 + 上移
            el.classList.add('is-visible');

            // 2) 数字动效：只跑一次，只针对结果数字（.num），不碰正文
            if (el.dataset.counted !== 'true') {
                el.dataset.counted = 'true';
                el.querySelectorAll('.num').forEach((numEl) => animateText(numEl, 1800));
            }

            io.unobserve(el);
        });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

    targets.forEach((el) => {
        el.classList.add('reveal');
        io.observe(el);
    });
})();

// ===== 点击复制邮箱 / 电话，并弹出提示 =====
document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
        const text = btn.dataset.copy || '';
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            // 兜底：旧浏览器或非安全上下文
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta);
        }
        showToast('已复制：' + text);
    });
});

function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 1800);
}
