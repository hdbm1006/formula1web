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
    const carsContainer = document.querySelector('.pixel-cars-container');
    
    // 为赛车添加速度线
    createSpeedLines(document.querySelectorAll('.pixel-car'));
    
    // 一次性绑定悬停事件
    if(ferrariLeftImg) {
        ferrariLeftImg.addEventListener('mouseenter', function() {
            this.style.animationPlayState = 'paused'; // 暂停动画
            const baseTransform = this.style.transform.replace(' scale(1.05)', '');
            this.style.transform = `${baseTransform} scale(1.05)`;
        });
        
        ferrariLeftImg.addEventListener('mouseleave', function() {
            this.style.animationPlayState = 'running'; // 恢复动画
            const baseTransform = this.style.transform.replace(' scale(1.05)', '');
            this.style.transform = baseTransform;
        });
    }
    
    if(mclarenImg) {
        mclarenImg.addEventListener('mouseenter', function() {
            this.style.animationPlayState = 'paused'; // 暂停动画
            const baseTransform = this.style.transform.replace(' scale(1.05)', '');
            this.style.transform = `${baseTransform} scale(1.05)`;
        });
        
        mclarenImg.addEventListener('mouseleave', function() {
            this.style.animationPlayState = 'running'; // 恢复动画
            const baseTransform = this.style.transform.replace(' scale(1.05)', '');
            this.style.transform = baseTransform;
        });
    }
    
    // 添加滚动事件监听
    window.addEventListener('scroll', function() {
        handleParallaxScroll();
    });
    
    // 初始触发一次，确保页面加载时就应用视差效果
    handleParallaxScroll();
}

// 创建速度线条
function createSpeedLines(carElements) {
    if (!carElements || carElements.length === 0) return;
    
    carElements.forEach(car => {
        // 创建速度线容器
        const speedLines = document.createElement('div');
        speedLines.className = 'speed-lines';
        car.appendChild(speedLines);
        
        // 创建15-20条随机分布的速度线
        const linesCount = Math.floor(Math.random() * 6) + 15; // 15-20条线
        
        for (let i = 0; i < linesCount; i++) {
            const line = document.createElement('div');
            line.className = 'speed-line';
            
            // 随机设置线条位置、长度、延迟和透明度
            const left = Math.random() * 100;
            const height = Math.random() * 60 + 20; // 20-80px
            const delay = Math.random() * 0.8; // 0-0.8s
            const opacity = Math.random() * 0.4 + 0.2; // 0.2-0.6
            
            line.style.left = `${left}%`;
            line.style.height = `${height}px`;
            line.style.animationDelay = `${delay}s`;
            line.style.opacity = opacity;
            
            speedLines.appendChild(line);
        }
    });
}

function handleParallaxScroll() {
    const scrolled = window.scrollY;
    
    // 设置滚动偏移量为CSS变量，用于悬停效果
    document.documentElement.style.setProperty('--scroll-offset', scrolled);
    
    // 左侧法拉利视差 - 130%速度（相对页面向上移动）
    const ferrariLeftImg = document.querySelector('.pixel-car img.ferrari-left');
    if(ferrariLeftImg) {
        // 计算Y轴位移，不再设置完整transform以保持动画效果
        ferrariLeftImg.style.marginTop = `${scrolled * -0.3}px`;
    }
    
    // 右侧迈凯轮视差 - 115%速度（相对页面向上移动，略慢于左侧法拉利）
    const mclarenImg = document.querySelector('.pixel-car img.mclaren');
    if(mclarenImg) {
        // 计算Y轴位移
        mclarenImg.style.marginTop = `${scrolled * -0.15}px`;
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