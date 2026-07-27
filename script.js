// ================= KHO NHẠC MINI (PLAYLIST) =================
const playlist = [
    {
        title: "Lost within the end",
        audioFile: "ScreenRecording_07-26-2026 14-14-30_1.mp3",
        coverImage: "4F1632B1-6FA6-4871-902B-872597BDBE84.jpeg"
    }
];

let currentSongIndex = 0;
const bgMusic = document.getElementById('bg-music');
const musicTitle = document.getElementById('music-title');
const musicCover = document.getElementById('music-cover');
const musicProgress = document.getElementById('music-progress');
const musicCurrentTime = document.getElementById('music-current-time');
const musicTotalTime = document.getElementById('music-total-time');

// Hàm format giây thành dạng Phút:Giây (00:00)
function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function loadSong(index) {
    let song = playlist[index];
    bgMusic.src = song.audioFile;
    musicTitle.innerText = song.title;
    musicCover.src = song.coverImage;
}

loadSong(currentSongIndex);

// Hiển thị tổng thời lượng khi bài hát đã tải xong dữ liệu
bgMusic.addEventListener('loadedmetadata', () => {
    musicTotalTime.innerText = formatTime(bgMusic.duration);
});

bgMusic.addEventListener('timeupdate', () => {
    if (bgMusic.duration) {
        const progressPercent = (bgMusic.currentTime / bgMusic.duration) * 100;
        musicProgress.style.width = `${progressPercent}%`;
        musicCurrentTime.innerText = formatTime(bgMusic.currentTime);
    }
});

// ================= CHUYỂN TRANG MỞ NHẠC =================
function enterSite() {
    const entryScreen = document.getElementById('entry-screen');
    const mainContent = document.getElementById('main-content');
    
    entryScreen.style.opacity = '0';
    
    bgMusic.volume = 0.5;
    bgMusic.play().catch(e => console.log("Lỗi phát nhạc: " + e));

    setTimeout(() => {
        entryScreen.style.visibility = 'hidden';
        entryScreen.style.display = 'none';
        mainContent.style.display = 'block';
    }, 800);
}

// ================= CƠ CHẾ CUỘN MƯỢT VÀ SÁNG NÚT MENU =================
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

const sections = document.querySelectorAll('.scroll-section');
const tabBtns = document.querySelectorAll('.tab-btn');

const observerOptions = {
    root: null,
    rootMargin: '-90px 0px -50% 0px', 
    threshold: 0.1 
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            tabBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-target') === entry.target.id) {
                    btn.classList.add('active');
                }
            });
        }
    });
}, observerOptions);

sections.forEach(sec => observer.observe(sec));


// ================= LANYARD API (TRẠNG THÁI DISCORD) =================
const discordId = '1055476307372294155';
const defaultOfflineImg = '68249218-86E9-4EC4-9989-8F1EBC32B02A.jpeg';
const defaultOnlineImg = '06E93E45-AFA9-4F93-94D0-6549EDEF64BB.jpeg';
const ws = new WebSocket('wss://api.lanyard.rest/socket');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.op === 1) { 
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: discordId } }));
    } else if (data.op === 0) { 
        updateStatus(data.d);
    }
};

function updateStatus(d) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const statusDetails = document.getElementById('status-details');
    const statusImg = document.getElementById('status-img');

    const status = d.discord_status;
    let hasActivity = false;
    let activity = null;

    if (d.activities && d.activities.length > 0) {
        activity = d.activities.find(a => a.type !== 4) || d.activities[0];
        if (activity.type !== 4) {
            hasActivity = true;
        }
    }

    let dotColor = '#747f8d'; 
    let dotRgba = '116, 127, 141';

    if (status !== 'offline') {
        if (hasActivity) {
            dotColor = '#faa61a'; 
            dotRgba = '250, 166, 26';
        } else {
            dotColor = '#43b581'; 
            dotRgba = '67, 181, 129';
        }
        statusDot.classList.add('online-pulse');
    } else {
        statusDot.classList.remove('online-pulse');
    }

    statusDot.style.background = dotColor;
    statusDot.style.boxShadow = `0 0 8px ${dotColor}`;
    statusDot.style.setProperty('--pulse-color', `rgba(${dotRgba}, 0.7)`);

    if (hasActivity) {
        let typeName = activity.type === 2 ? 'Đang nghe' : 'Đang chơi';
        statusText.innerText = `${typeName} ${activity.name}`;
        statusDetails.innerText = activity.details || activity.state || 'Đang hoạt động';
        
        if (activity.assets && activity.assets.large_image) {
            let imgId = activity.assets.large_image;
            if (imgId.startsWith('spotify:')) {
                statusImg.src = `https://i.scdn.co/image/${imgId.split(':')[1]}`;
            } else if (imgId.startsWith('mp:external/')) {
                statusImg.src = `https://media.discordapp.net/external/${imgId.replace('mp:external/', '')}`;
            } else {
                statusImg.src = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${imgId}.png`;
            }
        } else {
            statusImg.src = defaultOnlineImg; 
        }
    } else if (status !== 'offline') {
        let customStatus = d.activities.find(a => a.type === 4);
        statusText.innerText = 'Online';
        statusDetails.innerText = customStatus && customStatus.state ? customStatus.state : 'Đang lướt web...';
        statusImg.src = defaultOnlineImg; 
    } else {
        statusText.innerText = 'Offline';
        statusDetails.innerText = 'Đã tắt mạng đi ngủ 💤';
        statusImg.src = defaultOfflineImg;
    }
}
