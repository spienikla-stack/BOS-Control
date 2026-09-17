// --- SOUND & WEATHER ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio() {
    if(!audioCtx) audioCtx = new AudioContext();
    if(audioCtx.state === 'suspended') audioCtx.resume();
}

function playBeep(freq, type, duration, vol, startTimeOffset=0) {
    if(settings.sound !== 'on') return;
    initAudio();
    const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTimeOffset);
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime + startTimeOffset);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTimeOffset + duration);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + startTimeOffset); osc.stop(audioCtx.currentTime + startTimeOffset + duration);
}
function soundAlarm() {
    playBeep(1060, 'sine', 0.5, 0.1, 0); playBeep(1160, 'sine', 0.5, 0.1, 0.1);
    playBeep(1530, 'sine', 1.0, 0.1, 0.4);
}
function soundSiren() {
    playBeep(435, 'square', 0.4, 0.05, 0); playBeep(580, 'square', 0.4, 0.05, 0.4);
}

const WEATHERS = [
    { id: 'sun', name: 'Sonnig', icon: '☀️', speedMod: 1.0 },
    { id: 'rain', name: 'Regen', icon: '🌧️', speedMod: 0.8 },
    { id: 'snow', name: 'Schnee', icon: '❄️', speedMod: 0.6 },
    { id: 'fog', name: 'Nebel', icon: '🌫️', speedMod: 0.7 }
];
let currentWeather = WEATHERS[0];
let lastWeatherChangeMs = 0;

function updateWeather() {
    let now = simTime.getTime();
    if(now - lastWeatherChangeMs > 43200000) {
        lastWeatherChangeMs = now;
        let rand = Math.random();
        if(rand < 0.5) currentWeather = WEATHERS[0];
        else if(rand < 0.75) currentWeather = WEATHERS[1];
        else if(rand < 0.9) currentWeather = WEATHERS[3];
        else currentWeather = WEATHERS[2];
        document.getElementById('weather-display').innerHTML = `${currentWeather.icon} ${currentWeather.name}`;
    }
}

function updateDayNightCycle() {
    let hour = simTime.getHours();
    let mapEl = document.getElementById('map');
    if(hour >= 20 || hour < 6) { mapEl.style.filter = 'brightness(0.5) contrast(1.2)'; } 
    else { mapEl.style.filter = 'brightness(1) contrast(1)'; }
}

// --- DATA DICTIONARIES ---
const ORGS = {
    'fw': { name: 'Feuerwehr', color: 'var(--org-fw)', funfname: 'Florian' },
    'rd': { name: 'Rettungsdienst', color: 'var(--org-rd)', funfname: 'Rotkreuz' },
    'pol': { name: 'Polizei', color: 'var(--org-pol)', funfname: 'Peter' },
    'bpol': { name: 'Bundespolizei', color: 'var(--org-bppol)', funfname: 'bp FuStW' },    
    'thw': { name: 'THW', color: 'var(--org-thw)', funfname: 'Heros' },
    'dlrg': { name: 'DLRG', color: 'var(--org-dlrg)', funfname: 'Pelikan' },
    'bw': { name: 'Bergwacht', color: 'var(--org-bw)', funfname: 'Bergwacht' },
    'seg': { name: 'SEG/KatS', color: 'var(--org-seg)', funfname: 'Rotkreuz' },
    'luft': { name: 'Luftrettung', color: 'var(--org-luft)', funfname: 'Christoph' },
    'school': { name: 'Schule', color: 'var(--org-school)', funfname: 'Schule' }
};

const VEHICLES = {
    // FEUERWEHR
    'KdoW': { name: 'KdoW', bw_name: '10', org: 'fw', speed: 90, crew: 1, reqQual: null, price: 40000, upkeep: 100 },
    'ELW1': { name: 'ELW 1', bw_name: '11', org: 'fw', speed: 85, crew: 2, reqQual: 'Zugführer', price: 80000, upkeep: 150 },
    'HLF20': { 
        name: 'HLF 20', bw_name: '46', org: 'fw', speed: 70, crew: 9, reqQual: 'Atemschutz', price: 350000, upkeep: 500,
        possibleUpgrades: { 'th_satz': { name: 'TH-Satz (VU)', price: 45000, provides: 'RW_Group' } }
    },
    'LF10': { 
        name: 'LF 10', bw_name: '42', org: 'fw', speed: 70, crew: 9, reqQual: 'Atemschutz', price: 250000, upkeep: 350,
        possibleUpgrades: { 'th_satz': { name: 'TH-Satz (Klein)', price: 30000, provides: 'RW_Group' } }
    },
    'MLF': { name: 'MLF', bw_name: '40', org: 'fw', speed: 75, crew: 6, reqQual: 'Atemschutz', price: 180000, upkeep: 250 },
    'TSFW': { name: 'TSF-W', bw_name: '48', org: 'fw', speed: 75, crew: 6, reqQual: 'Atemschutz', price: 110000, upkeep: 180 },
    'TSF': { name: 'TSF', bw_name: '47', org: 'fw', speed: 80, crew: 6, reqQual: null, price: 90000, upkeep: 150 },
    'DLK': { name: 'DLK 23/12', bw_name: '33', org: 'fw', speed: 65, crew: 3, reqQual: 'Drehleitermaschinist', price: 600000, upkeep: 800 },
    'RW': { name: 'RW', bw_name: '52', org: 'fw', speed: 70, crew: 3, reqQual: null, price: 350000, upkeep: 450 },

    // RETTUNGSDIENST
    'RTW': { name: 'RTW', bw_name: '83', org: 'rd', speed: 90, crew: 2, reqQual: null, price: 150000, upkeep: 250 },
    'KTW': { name: 'KTW', bw_name: '85', org: 'rd', speed: 85, crew: 2, reqQual: null, price: 80000, upkeep: 150 },
    'NEF': { name: 'NEF', bw_name: '82', org: 'rd', speed: 100, crew: 2, reqQual: 'Notarzt', price: 90000, upkeep: 200 },
    
    // POLIZEI
    'FuStW': { name: 'FuStW', bw_name: 'Streife', org: 'pol', speed: 95, crew: 2, reqQual: null, price: 60000, upkeep: 150 },
    'GefKw': { name: 'GefKw', bw_name: 'GefKw', org: 'pol', speed: 75, crew: 2, reqQual: null, price: 80000, upkeep: 150 },
    
    // BUNDESPOLIZEI (Korrigierte IDs, damit sie nicht Polizei überschreiben!)
    'BP_FuStW': { name: 'BP-FuStW', bw_name: 'Streife', org: 'bpol', speed: 95, crew: 2, reqQual: null, price: 60000, upkeep: 150 },
    'BP_GefKw': { name: 'BP-GefKw', bw_name: 'GefKw', org: 'bpol', speed: 75, crew: 2, reqQual: null, price: 80000, upkeep: 150 }
};

const GROUPS = {
    'LF_Group': ['HLF20', 'LF10', 'MLF', 'TSFW', 'TSF'],
    'ELW_Group': ['ELW1', 'KdoW'],
    'RW_Group': ['RW'],
    'DLK_Group': ['DLK'],
    'RTW_Group': ['RTW']
};

const STATION_TYPES = {
    'fw_ff_klein': { name: 'Freiwillige Feuerwehr (Klein)', org: 'fw', icon: '🚒', delay: true, initStaff: 15, vehicles: ['TSF', 'TSFW', 'MLF', 'LF10'], buildCost: 100000 },
    'fw_ff': { name: 'Freiwillige Feuerwehr', org: 'fw', icon: '🚒', delay: true, initStaff: 30, vehicles: ['KdoW', 'ELW1', 'HLF20', 'DLK', 'RW'], buildCost: 250000 },
    'fw_bf': { name: 'Berufsfeuerwehr', org: 'fw', icon: '🏢', delay: false, initStaff: 50, vehicles: ['KdoW', 'ELW1', 'HLF20', 'DLK', 'RW'], buildCost: 1000000 },
    'rd_wache': { name: 'Rettungswache', org: 'rd', icon: '🚑', delay: false, initStaff: 20, vehicles: ['RTW', 'KTW', 'NEF'], buildCost: 200000 },
    'rd_kh': { name: 'Krankenhaus', org: 'rd', icon: '🏥', delay: false, initStaff: 100, vehicles: ['NEF'], buildCost: 5000000 },
    'pol_wache': { name: 'Polizeirevier', org: 'pol', icon: '🚓', delay: false, initStaff: 30, vehicles: ['FuStW'], buildCost: 300000 },
    'pol_bepo': { name: 'Bereitschaftspolizei', org: 'pol', icon: '🛡️', delay: false, initStaff: 60, vehicles: ['FuStW', 'GefKw'], buildCost: 500000 },
    'bpol_wache': { name: 'Bundespolizei', org: 'bpol', icon: '🛡️', delay: false, initStaff: 60, vehicles: ['BP_FuStW', 'BP_GefKw'], buildCost: 500000 }
};

const MISSIONS = [
    { name: 'Mülleimerbrand', reqs: {'LF_Group': 1}, time: 300, orgs: ['fw'], reward: 800, xpReward: 15 },
    { name: 'Zimmerbrand', reqs: {'ELW_Group': 1, 'LF_Group': 2, 'DLK_Group': 1, 'RTW_Group': 1, 'FuStW': 1}, time: 800, orgs: ['fw', 'rd'], reward: 4500, xpReward: 100 },
    { name: 'Verkehrsunfall (Eingeklemmt)', reqs: {'LF_Group': 1, 'RW_Group': 1, 'RTW_Group': 2, 'NEF': 1, 'FuStW': 2}, time: 900, orgs: ['fw', 'rd', 'pol'], reward: 5500, xpReward: 120 },
    { name: 'Herzinfarkt', reqs: {'RTW_Group': 1, 'NEF': 1}, time: 600, orgs: ['rd'], reward: 2500, xpReward: 50 },
    { name: 'Ruhestörung', reqs: {'FuStW': 1}, time: 300, orgs: ['pol'], reward: 800, xpReward: 15 }
];

// --- STATE & ECONOMY ---
let simTime = new Date(); 
let timeScale = 1; 
let lastRealTime = performance.now();
let isLiveTime = false; // NEU: Live-Zeit Tracking

let stations = []; let missions = []; let globalVehicles = []; 
let buildMode = null; let stIdCtr = 1; let vIdCtr = 1; let mIdCtr = 1;
let activeDispatchMissionId = null;
let einsatzstop = false;

let settings = { design: 'standard', theme: 'dark', sound: 'on', mapstyle: 'streets' };
let credits = 25000000;
let xp = 0;

function updateEconomyUI() {
    document.getElementById('ui-credits').innerText = Math.floor(credits).toLocaleString('de-DE');
    document.getElementById('ui-xp').innerText = Math.floor(xp).toLocaleString('de-DE');
}

// --- MAP SETUP ---
let googleStreets = L.tileLayer('http://mt0.google.com/vt/lyrs=m&hl=de&x={x}&y={y}&z={z}', { maxZoom: 20 });
let googleSatellite = L.tileLayer('http://mt0.google.com/vt/lyrs=s&hl=de&x={x}&y={y}&z={z}', { maxZoom: 20 });
let currentMapLayer = googleStreets;
const map = L.map('map').setView([48.8319, 9.3615], 12); 
currentMapLayer.addTo(map);

// --- CORE FUNCTIONS ---
function getVehicleName(v, stObj) {
    if (v.customName && v.customName.trim() !== '') return v.customName;
    const vDef = VEHICLES[v.type];
    if (settings.design === 'bw') return `${ORGS[vDef.org].funfname} ${stObj.town.split(' ')[0]} 1/${vDef.bw_name}-${v.number}`;
    return `${vDef.name} (${stObj.town}) - ${v.number}`;
}

function getFMS(status) {
    const map = { 'free': 2, 'waiting_crew': 6, 'en_route_mission': 3, 'working': 4, 'transport_hospital': 7, 'at_hospital': 8, 'en_route_home': 1 };
    return map[status] || 2;
}

// --- TIME & LOOP ---
function setLiveTime() {
    isLiveTime = true;
    timeScale = 1;
    document.querySelectorAll('.time-controls .btn-nav').forEach(b => b.classList.remove('active'));
    document.getElementById('ts-live').classList.add('active');
    showToast("Uhrzeit auf Live (Echtzeit) synchronisiert.");
}

function setTimeScale(s) {
    isLiveTime = false;
    timeScale = s;
    document.querySelectorAll('.time-controls .btn-nav').forEach(b => b.classList.remove('active'));
    document.getElementById('ts-' + s).classList.add('active');
    showToast(`Zeitbeschleunigung: ${s}x`);
}

function formatTime(d) {
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ':' + d.getSeconds().toString().padStart(2, '0');
}

function gameLoop(currentTime) {
    let deltaReal = currentTime - lastRealTime; 
    lastRealTime = currentTime;
    
    if (isLiveTime) {
        simTime = new Date();
    } else {
        let deltaSim = deltaReal * timeScale;
        simTime = new Date(simTime.getTime() + deltaSim);
    }
    
    document.getElementById('clock').innerText = formatTime(simTime);
    updateWeather();
    updateDayNightCycle();
    
    // Simulations-Deltas für Fahrzeuge und Einsätze nutzen echtes Delta bei Live-Zeit
    let effectiveDelta = isLiveTime ? deltaReal : deltaReal * timeScale;
    updateVehicles(effectiveDelta);
    updateMissions(effectiveDelta);
    
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// --- VEHICLE MARKER & CUSTOM IMAGE ---
function createVehicleMarker(v) {
    if(v.marker) return;
    const vDef = VEHICLES[v.type];
    const color = ORGS[vDef.org].color; 
    
    let cssClass = 'marker-normal'; 
    if(v.status === 'en_route_mission') cssClass = 'marker-blaulicht';
    if(v.status === 'transport_hospital') cssClass = 'marker-hospital';
    if(v.status === 'en_route_home') cssClass = 'marker-rückfahrt';

    if(v.customImage) {
        let icon = L.divIcon({ 
            html: `<img src="${v.customImage}">`, 
            className: cssClass + ' custom-veh-icon', 
            iconSize: [32, 32] 
        });
        v.marker = L.marker([v.lat, v.lng], {icon: icon}).addTo(map);
    } else {
        v.marker = L.circleMarker([v.lat, v.lng], { radius: 7, color: '#000', weight: 1, fillColor: color, fillOpacity: 1, className: cssClass }).addTo(map);
    }
    v.marker.bindPopup(`<b>${getVehicleName(v, stations.find(s=>s.id===v.stId))}</b><br>Status: ${getFMS(v.status)}`);
}

// --- VEHICLE EDIT ---
let currentEditVehImageBase64 = null;

function openVehicleEditModal(vId) {
    const v = globalVehicles.find(x => x.id === vId);
    if(!v) return;
    
    document.getElementById('veh-edit-id').value = v.id;
    document.getElementById('veh-edit-name').value = v.customName || '';
    currentEditVehImageBase64 = v.customImage || null;
    
    let preview = document.getElementById('veh-edit-preview');
    if(currentEditVehImageBase64) {
        preview.src = currentEditVehImageBase64;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
    document.getElementById('vehicle-modal').style.display = 'flex';
}

document.getElementById('veh-edit-img').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            currentEditVehImageBase64 = evt.target.result;
            let preview = document.getElementById('veh-edit-preview');
            preview.src = currentEditVehImageBase64;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

function saveVehicleEdit() {
    const vId = parseInt(document.getElementById('veh-edit-id').value);
    const v = globalVehicles.find(x => x.id === vId);
    if(!v) return;
    
    v.customName = document.getElementById('veh-edit-name').value.trim();
    v.customImage = currentEditVehImageBase64;
    
    if(v.marker) {
        map.removeLayer(v.marker);
        v.marker = null;
        if(v.status !== 'free') createVehicleMarker(v);
    }
    
    closeModal('vehicle-modal');
    showToast("Fahrzeug aktualisiert!");
}

// --- HELPER / UI ---
function showToast(msg) { 
    const t = document.getElementById('toast'); 
    t.innerText = msg; t.style.display = 'block'; 
    setTimeout(() => t.style.display = 'none', 3000); 
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function toggleEinsatzstop() {
    einsatzstop = !einsatzstop;
    const btn = document.getElementById('btn-einsatzstop');
    btn.innerText = einsatzstop ? "⏸️ Einsatzstop Aktiv" : "▶️ Einsätze Aktiv";
    btn.className = einsatzstop ? "btn-nav btn-stop active" : "btn-nav";
}

// Ensure init
updateEconomyUI();
