/**
 * F1赛程数据爬取与页面更新工具
 * 从ESPN获取F1赛程数据并更新网站显示
 */

// 使用Proxy解决跨域问题
const CORS_PROXY = 'https://corsproxy.io/?';
const ESPN_F1_SCHEDULE_URL = 'https://www.espn.com/f1/schedule/_/year/2025';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查本地存储中的缓存数据和上次更新时间
    checkAndFetchRaceSchedule();
});

/**
 * 检查并获取赛程数据
 * - 检查本地存储中是否有缓存
 * - 如果缓存不存在或已过期，则重新获取数据
 */
function checkAndFetchRaceSchedule() {
    const cachedSchedule = localStorage.getItem('f1ScheduleData');
    const lastUpdated = localStorage.getItem('f1ScheduleLastUpdated');
    const currentTime = new Date().getTime();
    
    // 如果没有缓存，或者缓存已经超过24小时，重新获取数据
    if (!cachedSchedule || !lastUpdated || (currentTime - parseInt(lastUpdated)) > 24 * 60 * 60 * 1000) {
        fetchRaceSchedule();
    } else {
        // 使用缓存数据更新页面
        try {
            const scheduleData = JSON.parse(cachedSchedule);
            updatePageWithRaceData(scheduleData);
        } catch (error) {
            console.error('缓存数据格式错误，重新获取数据', error);
            fetchRaceSchedule();
        }
    }
}

/**
 * 从ESPN获取F1赛程数据
 */
async function fetchRaceSchedule() {
    try {
        // 显示加载状态
        showLoadingState();
        
        // 使用代理解决跨域问题请求ESPN赛程页面
        const response = await fetch(CORS_PROXY + encodeURIComponent(ESPN_F1_SCHEDULE_URL));
        
        if (!response.ok) {
            throw new Error('获取赛程数据失败: ' + response.status);
        }
        
        const htmlText = await response.text();
        
        // 解析HTML获取赛程数据
        const scheduleData = parseESPNScheduleHtml(htmlText);
        
        // 更新本地存储
        localStorage.setItem('f1ScheduleData', JSON.stringify(scheduleData));
        localStorage.setItem('f1ScheduleLastUpdated', new Date().getTime().toString());
        
        // 更新页面显示
        updatePageWithRaceData(scheduleData);
        
    } catch (error) {
        console.error('获取赛程数据出错:', error);
        showErrorMessage('无法获取最新赛程数据，请稍后再试');
        
        // 尝试使用可能存在的缓存数据
        const cachedSchedule = localStorage.getItem('f1ScheduleData');
        if (cachedSchedule) {
            try {
                const scheduleData = JSON.parse(cachedSchedule);
                updatePageWithRaceData(scheduleData);
            } catch (e) {
                console.error('使用缓存数据失败', e);
            }
        }
    } finally {
        // 隐藏加载状态
        hideLoadingState();
    }
}

/**
 * 解析ESPN HTML页面，提取赛程数据
 * @param {string} htmlText - ESPN页面的HTML内容
 * @return {Array} 解析后的赛程数据数组
 */
function parseESPNScheduleHtml(htmlText) {
    // 创建一个DOM解析器
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    
    // 找到所有赛程表格
    const scheduleTables = doc.querySelectorAll('.Table__Table');
    const races = [];
    
    // 遍历每个表格（每个表格通常包含一个赛事）
    scheduleTables.forEach(table => {
        // 获取表头信息以确认这是赛事表格
        const tableHeader = table.querySelector('.Table__Title');
        if (!tableHeader || !tableHeader.textContent.includes('Formula 1')) {
            return; // 跳过非F1赛事表格
        }
        
        // 获取表格中的所有行
        const rows = table.querySelectorAll('tbody tr');
        
        // 遍历行获取赛事信息
        rows.forEach(row => {
            try {
                // 获取日期单元格
                const dateCell = row.querySelector('td:nth-child(1)');
                // 获取赛事名称单元格
                const eventCell = row.querySelector('td:nth-child(2)');
                // 获取地点单元格
                const venueCell = row.querySelector('td:nth-child(3)');
                
                if (!dateCell || !eventCell || !venueCell) return;
                
                const dateText = dateCell.textContent.trim();
                const eventText = eventCell.textContent.trim();
                const venueText = venueCell.textContent.trim();
                
                // 获取详情链接
                const eventLink = eventCell.querySelector('a');
                const detailsUrl = eventLink ? eventLink.href : null;
                
                // 解析日期
                const dateParts = dateText.split(' ');
                const month = dateParts[0];
                const day = parseInt(dateParts[1]);
                
                // 创建一个赛事对象
                const race = {
                    date: dateText,
                    name: eventText,
                    venue: venueText,
                    detailsUrl: detailsUrl,
                    month: month,
                    day: day,
                    // 默认时间，如果能从详情页获取会更新
                    sessions: [
                        { name: '练习赛 1', day: -2, time: '11:30' },
                        { name: '练习赛 2', day: -2, time: '15:00' },
                        { name: '练习赛 3', day: -1, time: '10:30' },
                        { name: '排位赛', day: -1, time: '14:00' },
                        { name: '正赛', day: 0, time: '14:00' }
                    ]
                };
                
                races.push(race);
            } catch (error) {
                console.error('解析赛事行出错:', error);
            }
        });
    });
    
    // 按日期排序
    return races.sort((a, b) => {
        // 按月份名称排序（可以改进为按实际日期排序）
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthA = monthOrder.indexOf(a.month);
        const monthB = monthOrder.indexOf(b.month);
        
        if (monthA !== monthB) return monthA - monthB;
        return a.day - b.day;
    });
}

/**
 * 使用获取到的赛程数据更新页面
 * @param {Array} scheduleData - 解析后的赛程数据数组
 */
function updatePageWithRaceData(scheduleData) {
    if (!scheduleData || !scheduleData.length) {
        console.error('无有效赛程数据');
        return;
    }
    
    // 查找下一场比赛
    const nextRace = findNextRace(scheduleData);
    
    if (!nextRace) {
        console.error('未找到下一场比赛');
        return;
    }
    
    // 更新页面上的比赛信息
    updateRaceInfo(nextRace);
}

/**
 * 查找下一场比赛
 * @param {Array} races - 所有比赛数据
 * @return {Object} 下一场比赛的数据
 */
function findNextRace(races) {
    const today = new Date();
    
    // 将月份名称映射到数字
    const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    // 找到第一个还没有开始的比赛
    for (const race of races) {
        try {
            const raceMonth = monthMap[race.month];
            const raceDay = race.day;
            
            if (isNaN(raceDay) || raceMonth === undefined) continue;
            
            // 创建比赛日期对象（使用当前年份或下一年）
            let raceYear = today.getFullYear();
            if (raceMonth < today.getMonth()) {
                raceYear++; // 如果月份小于当前月份，说明是明年的比赛
            }
            
            const raceDate = new Date(raceYear, raceMonth, raceDay);
            
            // 如果比赛日期大于今天，则是下一场比赛
            if (raceDate > today) {
                return race;
            }
        } catch (error) {
            console.error('处理比赛日期出错:', error);
        }
    }
    
    // 如果所有比赛都已经过去，返回第一个比赛（循环到明年）
    return races[0];
}

/**
 * 更新页面上的比赛信息
 * @param {Object} race - 比赛数据
 */
function updateRaceInfo(race) {
    // 获取比赛信息元素
    const raceNameElement = document.querySelector('.race-name');
    const raceCircuitElement = document.querySelector('.race-circuit');
    const raceDateElement = document.querySelector('.race-date');
    
    if (!raceNameElement || !raceCircuitElement || !raceDateElement) {
        console.error('未找到比赛信息显示元素');
        return;
    }
    
    // 更新比赛基本信息
    raceNameElement.textContent = race.name;
    raceCircuitElement.textContent = race.venue;
    
    // 格式化日期
    const monthNames = {
        'Jan': '1月', 'Feb': '2月', 'Mar': '3月', 'Apr': '4月', 'May': '5月', 'Jun': '6月',
        'Jul': '7月', 'Aug': '8月', 'Sep': '9月', 'Oct': '10月', 'Nov': '11月', 'Dec': '12月'
    };
    
    const year = new Date().getFullYear();
    const monthName = monthNames[race.month] || race.month;
    raceDateElement.textContent = `${year}年${monthName}${race.day}日`;
    
    // 更新各个环节的时间和倒计时
    updateSessionTimes(race);
}

/**
 * 更新各个赛事环节的时间
 * @param {Object} race - 比赛数据
 */
function updateSessionTimes(race) {
    // 获取比赛年份（当前年份或下一年）
    const today = new Date();
    let raceYear = today.getFullYear();
    
    // 将月份名称映射到数字
    const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const raceMonth = monthMap[race.month];
    
    // 如果比赛月份小于当前月份，可能是明年的比赛
    if (raceMonth < today.getMonth()) {
        raceYear++;
    }
    
    // 计算正赛日期
    const raceDate = new Date(raceYear, raceMonth, race.day);
    
    // 获取周几
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const raceWeekDay = weekDays[raceDate.getDay()];
    
    // 定义赛事环节和对应的DOM元素ID
    const sessions = [
        { name: '练习赛 1', element: 'fp1', offset: -2 },
        { name: '练习赛 2', element: 'fp2', offset: -2 },
        { name: '练习赛 3', element: 'fp3', offset: -1 },
        { name: '排位赛', element: 'quali', offset: -1 },
        { name: '正赛', element: 'race', offset: 0 }
    ];
    
    // 更新每个环节的信息
    sessions.forEach(session => {
        // 计算环节日期（相对于正赛日期的偏移）
        const sessionDate = new Date(raceDate);
        sessionDate.setDate(sessionDate.getDate() + session.offset);
        
        const sessionWeekDay = weekDays[sessionDate.getDay()];
        const sessionMonth = sessionDate.getMonth() + 1; // getMonth() 返回0-11
        const sessionDay = sessionDate.getDate();
        
        // 查找该环节在赛事数据中的详细信息
        const sessionData = race.sessions.find(s => s.name === session.name) || {
            time: session.name === '正赛' ? '14:00' : '11:00'
        };
        
        // 获取环节时间显示元素
        const dateElement = document.querySelector(`#${session.element}-user-time`).previousElementSibling.previousElementSibling;
        
        if (dateElement) {
            // 更新日期显示
            dateElement.textContent = `${sessionMonth}月${sessionDay}日 ${sessionWeekDay}`;
            
            // 更新本地时间
            const timeElement = document.querySelector(`#${session.element}-user-time`).previousElementSibling;
            if (timeElement) {
                const [hours, minutes] = sessionData.time.split(':');
                const isPM = parseInt(hours) >= 12;
                const displayHours = isPM ? (parseInt(hours) === 12 ? 12 : parseInt(hours) - 12) : parseInt(hours);
                
                timeElement.textContent = `${isPM ? '下午' : '上午'} ${displayHours}:${minutes}`;
                
                // 设置倒计时日期
                const countdownDate = new Date(sessionDate);
                countdownDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                
                // 保存倒计时目标时间
                window[`${session.element}TargetDate`] = countdownDate;
                
                // 更新用户本地时区时间
                updateUserLocalTime(session.element, countdownDate);
            }
        }
    });
    
    // 启动倒计时
    startCountdowns();
}

/**
 * 更新用户本地时区的时间显示
 * @param {string} sessionId - 环节ID
 * @param {Date} targetDate - 目标日期
 */
function updateUserLocalTime(sessionId, targetDate) {
    const userTimeElement = document.getElementById(`${sessionId}-user-time`);
    
    if (userTimeElement) {
        const hours = targetDate.getHours();
        const minutes = targetDate.getMinutes();
        const amPm = hours >= 12 ? '下午' : '上午';
        const formattedHours = hours % 12 || 12; // 转换为12小时制
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        
        userTimeElement.textContent = `您的时间: ${amPm} ${formattedHours}:${formattedMinutes}`;
    }
}

/**
 * 启动所有倒计时
 */
function startCountdowns() {
    // 清除可能存在的倒计时间隔
    if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
    }
    
    // 更新所有倒计时
    updateAllCountdowns();
    
    // 设置倒计时间隔
    window.countdownInterval = setInterval(updateAllCountdowns, 1000);
}

/**
 * 更新所有倒计时显示
 */
function updateAllCountdowns() {
    const sessions = ['fp1', 'fp2', 'fp3', 'quali', 'race'];
    const now = new Date();
    
    sessions.forEach(session => {
        const targetDate = window[`${session}TargetDate`];
        
        if (!targetDate) return;
        
        // 计算剩余时间
        const diff = targetDate - now;
        
        // 获取倒计时元素
        const daysElement = document.getElementById(`${session}-days`);
        const hoursElement = document.getElementById(`${session}-hours`);
        const minutesElement = document.getElementById(`${session}-minutes`);
        const secondsElement = document.getElementById(`${session}-seconds`);
        
        if (!daysElement || !hoursElement || !minutesElement || !secondsElement) return;
        
        // 如果比赛已经开始，显示00:00:00:00
        if (diff <= 0) {
            daysElement.textContent = '00';
            hoursElement.textContent = '00';
            minutesElement.textContent = '00';
            secondsElement.textContent = '00';
            return;
        }
        
        // 计算剩余时间
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // 更新显示
        daysElement.textContent = days < 10 ? '0' + days : days;
        hoursElement.textContent = hours < 10 ? '0' + hours : hours;
        minutesElement.textContent = minutes < 10 ? '0' + minutes : minutes;
        secondsElement.textContent = seconds < 10 ? '0' + seconds : seconds;
    });
}

/**
 * 显示加载状态
 */
function showLoadingState() {
    const raceInfoContent = document.querySelector('.race-info-content');
    
    if (raceInfoContent) {
        // 添加加载指示器
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '获取最新赛程数据...';
        loadingIndicator.style.textAlign = 'center';
        loadingIndicator.style.padding = '20px';
        loadingIndicator.style.color = '#e53935';
        
        // 清空内容区域并显示加载指示器
        raceInfoContent.style.opacity = '0.6';
        raceInfoContent.appendChild(loadingIndicator);
    }
}

/**
 * 隐藏加载状态
 */
function hideLoadingState() {
    const raceInfoContent = document.querySelector('.race-info-content');
    
    if (raceInfoContent) {
        // 移除加载指示器
        const loadingIndicator = raceInfoContent.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
        
        raceInfoContent.style.opacity = '1';
    }
}

/**
 * 显示错误消息
 * @param {string} message - 错误消息
 */
function showErrorMessage(message) {
    console.error(message);
    
    // 创建一个临时提示元素
    const errorToast = document.createElement('div');
    errorToast.className = 'error-toast';
    errorToast.textContent = message;
    errorToast.style.position = 'fixed';
    errorToast.style.bottom = '20px';
    errorToast.style.left = '50%';
    errorToast.style.transform = 'translateX(-50%)';
    errorToast.style.background = 'rgba(229, 57, 53, 0.9)';
    errorToast.style.color = 'white';
    errorToast.style.padding = '10px 20px';
    errorToast.style.borderRadius = '4px';
    errorToast.style.zIndex = '2000';
    
    document.body.appendChild(errorToast);
    
    // 3秒后自动移除
    setTimeout(() => {
        errorToast.style.opacity = '0';
        errorToast.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            errorToast.remove();
        }, 500);
    }, 3000);
} 