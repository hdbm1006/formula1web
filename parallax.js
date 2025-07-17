/**
 * 视差滚动效果
 * - 左侧法拉利：130%速度（快速向上）
 * - 右侧迈凯轮：115%速度（中速向上）
 * - 全屏Logo：40%速度（向上）
 */

// 页面加载完成后初始化视差效果
document.addEventListener('DOMContentLoaded', initParallax);

function initParallax() {
    // 获取元素
    const ferrariLeftImg = document.querySelector('.pixel-car img.ferrari-left');
    const mclarenImg = document.querySelector('.pixel-car img.mclaren');
    const checkeredBar = document.querySelector('.checkered-bar');
    
    // 记录方格条的初始位置
    let checkeredBarInitialPosition = 0;
    if(checkeredBar) {
        checkeredBarInitialPosition = checkeredBar.offsetTop;
    }
    
    // 一次性绑定悬停事件
    if(ferrariLeftImg) {
        ferrariLeftImg.addEventListener('mouseenter', function() {
            const baseTransform = this.style.transform.replace(' scale(1.05)', '');
            this.style.transform = `${baseTransform} scale(1.05)`;
        });
        
        ferrariLeftImg.addEventListener('mouseleave', function() {
            const baseTransform = this.style.transform.replace(' scale(1.05)', '');
            this.style.transform = baseTransform;
        });
    }
    
    if(mclarenImg) {
        mclarenImg.addEventListener('mouseenter', function() {
            const baseTransform = this.style.transform.replace(' scale(1.05)', '');
            this.style.transform = `${baseTransform} scale(1.05)`;
        });
        
        mclarenImg.addEventListener('mouseleave', function() {
            const baseTransform = this.style.transform.replace(' scale(1.05)', '');
            this.style.transform = baseTransform;
        });
    }
    
    // 添加滚动事件监听
    window.addEventListener('scroll', function() {
        handleParallaxScroll();
        handleStickyCheckeredBar(checkeredBar, checkeredBarInitialPosition);
    });
    
    // 初始触发一次，确保页面加载时就应用视差效果
    handleParallaxScroll();
    handleStickyCheckeredBar(checkeredBar, checkeredBarInitialPosition);
}

// 处理方格条吸顶效果
function handleStickyCheckeredBar(checkeredBar, initialPosition) {
    if(!checkeredBar) return;
    
    const scrolled = window.scrollY;
    const navbarHeight = document.querySelector('.navbar').offsetHeight;
    
    // 当滚动超过方格条初始位置时，添加吸顶样式
    if(scrolled > initialPosition - navbarHeight) {
        checkeredBar.classList.add('sticky');
        
        // 添加占位高度，防止内容跳动
        if(!document.getElementById('checkeredBarPlaceholder')) {
            const placeholder = document.createElement('div');
            placeholder.id = 'checkeredBarPlaceholder';
            placeholder.style.height = checkeredBar.offsetHeight + 'px';
            placeholder.style.display = 'none';
            checkeredBar.parentNode.insertBefore(placeholder, checkeredBar);
        }
        document.getElementById('checkeredBarPlaceholder').style.display = 'block';
    } else {
        // 移除吸顶样式
        checkeredBar.classList.remove('sticky');
        
        // 隐藏占位元素
        const placeholder = document.getElementById('checkeredBarPlaceholder');
        if(placeholder) {
            placeholder.style.display = 'none';
        }
    }
}

function handleParallaxScroll() {
    const scrolled = window.scrollY;
    
    // 设置滚动偏移量为CSS变量，用于悬停效果
    document.documentElement.style.setProperty('--scroll-offset', scrolled);
    
    // 左侧法拉利视差 - 130%速度（相对页面向上移动）
    const ferrariLeftImg = document.querySelector('.pixel-car img.ferrari-left');
    if(ferrariLeftImg) {
        // 计算变换值
        const ferrariTransform = `translateY(${scrolled * -0.3}px) translateZ(0)`;
        // 应用变换，保留可能存在的scale效果
        if(ferrariLeftImg.style.transform.includes('scale')) {
            ferrariLeftImg.style.transform = `${ferrariTransform} scale(1.05)`;
        } else {
            ferrariLeftImg.style.transform = ferrariTransform;
        }
    }
    
    // 右侧迈凯轮视差 - 115%速度（相对页面向上移动，略慢于左侧法拉利）
    const mclarenImg = document.querySelector('.pixel-car img.mclaren');
    if(mclarenImg) {
        // 计算变换值（保持旋转）
        const mclarenTransform = `rotate(180deg) translateY(${scrolled * -0.15}px) translateZ(0)`;
        // 应用变换，保留可能存在的scale效果
        if(mclarenImg.style.transform.includes('scale')) {
            mclarenImg.style.transform = `${mclarenTransform} scale(1.05)`;
        } else {
            mclarenImg.style.transform = mclarenTransform;
        }
    }
    
    // 全屏Logo区域视差 - 40%速度（相对页面向上移动）
    const logoContainer = document.querySelector('.logo-container');
    if(logoContainer) {
        // 计算相对于logo区域的滚动位置
        const logoSection = document.querySelector('.fullscreen-section');
        if(logoSection) {
            const logoOffset = logoSection.offsetTop;
            const relativeScroll = scrolled - logoOffset;
            
            // 只在logo区域可见时应用视差效果
            if(relativeScroll > -window.innerHeight && relativeScroll < logoSection.offsetHeight) {
                // 上移效果，给人视觉上浮的感觉
                logoContainer.style.transform = `translateY(${relativeScroll * -0.4}px)`;
            }
        }
    }
} 