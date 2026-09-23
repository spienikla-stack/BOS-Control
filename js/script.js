// ==========================================
// 1. SOUND & AUDIO ENGINE
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playBeep(freq, type, duration, vol, startTimeOffset = 0) {
    if (settings.sound !== 'on') return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTimeOffset);
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime + startTimeOffset);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTimeOffset + duration);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + startTimeOffset);
    osc.stop(audioCtx.currentTime + startTimeOffset + duration);
}

function soundAlarm() {
    playBeep(1060, 'sine', 0.5, 0.1, 0);
    playBeep(1160, 'sine', 0.5, 0.1, 0.1);
    playBeep(1530, 'sine', 1.0, 0.1, 0.4);
}

function soundSiren() {
    playBeep(435, 'square', 0.4, 0.05, 0);
    playBeep(580, 'square', 0.4, 0.05, 0.4);
}

// ==========================================
// 2. WETTER & TAG/NACHT
// ==========================================
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
    if (now - lastWeatherChangeMs > 43200000) {
        lastWeatherChangeMs = now;
        let rand = Math.random();
        if (rand < 0.5) currentWeather = WEATHERS[0];
        else if (rand < 0.75) currentWeather = WEATHERS[1];
        else if (rand < 0.9) currentWeather = WEATHERS[3];
        else currentWeather = WEATHERS[2];
        const disp = document.getElementById('weather-display');
        if (disp) disp.innerHTML = `${currentWeather.icon} ${currentWeather.name}`;
    }
}

function updateDayNightCycle() {
    let hour = simTime.getHours();
    let mapEl = document.getElementById('map');
    if (!mapEl) return;
    if (hour >= 20 || hour < 6) {
        mapEl.style.filter = 'brightness(0.55) contrast(1.15)';
    } else {
        mapEl.style.filter = 'brightness(1) contrast(1)';
    }
}

// ==========================================
// 3. STAMM- UND FAHRZEUGDATEN
// ==========================================
const ORGS = {
    'fw': { name: 'Feuerwehr', color: '#e74c3c', funfname: 'Florian' },
    'rd': { name: 'Rettungsdienst', color: '#e67e22', funfname: 'Rotkreuz' },
    'pol': { name: 'Polizei', color: '#2980b9', funfname: 'Peter' },
    'bpol': { name: 'Bundespolizei', color: '#16a085', funfname: 'BP' },
    'thw': { name: 'THW', color: '#2c3e50', funfname: 'Heros' },
    'dlrg': { name: 'DLRG', color: '#f1c40f', funfname: 'Pelikan' },
    'bw': { name: 'Bergwacht', color: '#27ae60', funfname: 'Bergwacht' },
    'seg': { name: 'SEG/KatS', color: '#d35400', funfname: 'Rotkreuz' },
    'luft': { name: 'Luftrettung', color: '#c0392b', funfname: 'Christoph' }
};

const VEHICLES = {
    // FEUERWEHR
    'KdoW': { name: 'KdoW', bw_name: '10', org: 'fw', speed: 90, crew: 1, reqQual: null, price: 40000, upkeep: 100 },
    'ELW1': { name: 'ELW 1', bw_name: '11', org: 'fw', speed: 85, crew: 2, reqQual: 'Zugführer', price: 80000, upkeep: 150 },
    'HLF20': { name: 'HLF 20', bw_name: '46', org: 'fw', speed: 70, crew: 9, reqQual: 'Atemschutz', price: 350000, upkeep: 500 },
    'LF10': { name: 'LF 10', bw_name: '42', org: 'fw', speed: 70, crew: 9, reqQual: 'Atemschutz', price: 250000, upkeep: 350 },
    'MLF': { name: 'MLF', bw_name: '40', org: 'fw', speed: 75, crew: 6, reqQual: 'Atemschutz', price: 180000, upkeep: 250 },
    'TSFW': { name: 'TSF-W', bw_name: '48', org: 'fw', speed: 75, crew: 6, reqQual: 'Atemschutz', price: 110000, upkeep: 180 },
    'TSF': { name: 'TSF', bw_name: '47', org: 'fw', speed: 80, crew: 6, reqQual: null, price: 90000, upkeep: 150 },
    'DLK': { name: 'DLK 23/12', bw_name: '33', org: 'fw', speed: 65, crew: 3, reqQual: 'Drehleitermaschinist', price: 600000, upkeep: 800 },
    'RW': { name: 'RW', bw_name: '52', org: 'fw', speed: 70, crew: 3, reqQual: null, price: 350000, upkeep: 450 },

    // RETTUNGSDIENST
    'RTW': { name: 'RTW', bw_name: '83', org: 'rd', speed: 90, crew: 2, reqQual: null, price: 150000, upkeep: 250 },
    'KTW': { name: 'KTW', bw_name: '85', org: 'rd', speed: 85, crew: 2, reqQual: null, price: 80000, upkeep: 150 },
    'NEF': { name: 'NEF', bw_name: '82', org: 'rd', speed: 100, crew: 2, reqQual: 'Notarzt', price: 90000, upkeep: 200 },
    
    // POLIZEI (LAND)
    'FuStW': { name: 'FuStW (Land)', bw_name: 'Streife', org: 'pol', speed: 95, crew: 2, reqQual: null, price: 60000, upkeep: 150 },
    'GefKw': { name: 'GefKw (Land)', bw_name: 'GefKw', org: 'pol', speed: 75, crew: 2, reqQual: null, price: 80000, upkeep: 150 },
    
    // BUNDESPOLIZEI
    'BP_FuStW': { name: 'BP-FuStW', bw_name: 'Streife', org: 'bpol', speed: 95, crew: 2, reqQual: null, price: 65000, upkeep: 160 },
    'BP_GefKw': { name: 'BP-GefKw', bw_name: 'GefKw', org: 'bpol', speed: 75, crew: 2, reqQual: null, price: 85000, upkeep: 160 },
    'BP_WaWe': { name: 'BP-WaWe 10000', bw_name: 'WaWe', org: 'bpol', speed: 70, crew: 4, reqQual: null, price: 280000, upkeep: 350 },
    'BP_DHF': { name: 'BP-DHF', bw_name: 'Streife', org: 'bpol', speed: 95, crew: 2, reqQual: null, price: 65000, upkeep: 160 }
};

const GROUPS = {
    'LF_Group': ['HLF20', 'LF10', 'MLF', 'TSFW', 'TSF'],
    'ELW_Group': ['ELW1', 'KdoW'],
    'RW_Group': ['RW'],
    'DLK_Group': ['DLK'],
    'RTW_Group': ['RTW'],
    'Streife_Group': ['FuStW', 'BP_FuStW'],
    'BP_DHF_Group': ['BP-DHF']
};

const STATION_TYPES = {
    // HIER WURDE DIE FREIWILLIGE FEUERWEHR ZUSAMMENGELEGT:
    'fw_ff': { name: 'Freiwillige Feuerwehr', org: 'fw', icon: '🚒', delay: true, initStaff: 25, vehicles: ['KdoW', 'ELW1', 'HLF20', 'LF10', 'MLF', 'TSFW', 'TSF', 'DLK', 'RW'], buildCost: 150000 },
    
    'fw_bf': { name: 'Berufsfeuerwehr', org: 'fw', icon: '🏢', delay: false, initStaff: 50, vehicles: ['KdoW', 'ELW1', 'HLF20', 'DLK', 'RW'], buildCost: 1000000 },
    'rd_wache': { name: 'Rettungswache', org: 'rd', icon: '🚑', delay: false, initStaff: 20, vehicles: ['RTW', 'KTW', 'NEF'], buildCost: 200000 },
    'rd_kh': { name: 'Krankenhaus', org: 'rd', icon: '🏥', delay: false, initStaff: 100, vehicles: ['NEF'], buildCost: 5000000 },
    'pol_wache': { name: 'Polizeirevier', org: 'pol', icon: '🚓', delay: false, initStaff: 30, vehicles: ['FuStW'], buildCost: 300000 },
    'pol_bepo': { name: 'Bereitschaftspolizei', org: 'pol', icon: '🛡️', delay: false, initStaff: 60, vehicles: ['FuStW', 'GefKw'], buildCost: 500000 },
    'bpol_revier': { name: 'Bundespolizeirevier', org: 'bpol', icon: '👮‍♂️', delay: false, initStaff: 25, vehicles: ['BP_FuStW', 'BP_GefKw', 'BP_DHF'], buildCost: 350000 },
    'bpol_inspektion': { name: 'Bundespolizeiinspektion', org: 'bpol', icon: '🏢', delay: false, initStaff: 60, vehicles: ['BP_FuStW', 'BP_GefKw', 'BP_WaWe', 'BP_DHF'], buildCost: 750000 }
};

// ==========================================
// MISSIONS-POOL (MIT MIN-XP LEVELN)
// ==========================================
const MISSIONS = [
    // --- STUFE 1: EINSTEIGER / BASIS (0 - 200 XP) ---
        // FEUERWEHR
    { name: 'Brennt Mülleimer', minXp: 0, reqs: { 'LF_Group': 1 }, time: 15, orgs: ['fw'], reward: 650, xpReward: 10 },
    { name: 'Ölspur klein', minXp: 0, reqs: { 'LF_Group': 1 }, time: 20, orgs: ['fw'], reward: 800, xpReward: 15 },
        // RETTUNGSDIENST
    { name: 'Akute Atemnot', minXp: 0, reqs: { 'RTW_Group': 1 }, time: 20, orgs: ['rd'], reward: 1100, xpReward: 20 },
    { name: 'Krankentransport dringlich', minXp: 0, reqs: { 'KTW': 1 }, time: 25, orgs: ['rd'], reward: 600, xpReward: 10 },
      // POLIZEI (LAND)  
    { name: 'Ruhestörung / Nachbarschaftsstreit', minXp: 0, reqs: { 'FuStW': 1 }, time: 15, orgs: ['pol'], reward: 750, xpReward: 15 },
        // BUNDESPOLIZEI
    { name: 'Fahrkartenkontrolle eskaliert', minXp: 0, reqs: { 'BP_FuStW': 1 }, time: 18, orgs: ['bpol'], reward: 850, xpReward: 15 },
    { name: 'Fahrkartenkontrolle am HBF', minXp: 0, reqs: { 'BP_FuStW': 1, 'BP_DHF_Group': 1, }, time: 18, orgs: ['bpol'], reward: 850, xpReward: 15 },
    // --- STUFE 2: FORTGESCHRITTEN (200 - 800 XP) ---
        // FEUERWEHR
    { name: 'Containerbrand am Gebäude', minXp: 200, reqs: { 'LF_Group': 2 }, time: 25, orgs: ['fw'], reward: 1500, xpReward: 30 },
    { name: 'Baum auf Fahrbahn (Sturmschaden)', minXp: 200, reqs: { 'LF_Group': 1, 'RW_Group': 1 }, time: 25, orgs: ['fw'], reward: 1800, xpReward: 35 },
       // RETTUNGSDIENST 
    { name: 'Herzinfarkt / Reanimation', minXp: 200, reqs: { 'RTW_Group': 1, 'NEF': 1 }, time: 30, orgs: ['rd'], reward: 2400, xpReward: 50 },
       // POLIZEI (LAND) 
    { name: 'Verkehrsunfall PKW', minXp: 300, reqs: { 'LF_Group': 1, 'RTW_Group': 1, 'FuStW': 1 }, time: 30, orgs: ['fw', 'rd', 'pol'], reward: 2800, xpReward: 60 },
       // POLIZEI (LAND) 
    { name: 'Einbruchdiebstahl Gewerbeobjekt', minXp: 300, reqs: { 'FuStW': 2 }, time: 25, orgs: ['pol'], reward: 1700, xpReward: 40 },
       // BUNDESPOLIZEI 
    { name: 'Personen im Gleisbereich', minXp: 300, reqs: { 'BP_FuStW': 2 }, time: 25, orgs: ['bpol'], reward: 2200, xpReward: 45 },
    { name: 'Taschendiebstahl Serie am Bahnhof', minXp: 400, reqs: { 'BP_FuStW': 2, 'BP_GefKw': 1 }, time: 30, orgs: ['bpol'], reward: 2900, xpReward: 55 },

    // --- STUFE 3: ERFAHREN / GROSSEINSÄTZE (800 - 2500 XP) ---
        // FEUERWEHR
    { name: 'Zimmerbrand mit Menschenrettung', minXp: 800, reqs: { 'ELW_Group': 1, 'LF_Group': 2, 'DLK_Group': 1, 'RTW_Group': 1, 'NEF': 1 }, time: 45, orgs: ['fw', 'rd'], reward: 4800, xpReward: 110 },
    { name: 'Schwerer Verkehrsunfall (mehrere PKW eingeklemmt)', minXp: 1000, reqs: { 'LF_Group': 2, 'RW_Group': 1, 'RTW_Group': 2, 'NEF': 1, 'FuStW': 2 }, time: 50, orgs: ['fw', 'rd', 'pol'], reward: 6200, xpReward: 140 },
        // POLIZEI (LAND)
    { name: 'Razzia / Durchsuchungsbeschluss', minXp: 1200, reqs: { 'FuStW': 3, 'GefKw': 1 }, time: 40, orgs: ['pol'], reward: 3900, xpReward: 85 },
     // BUNDESPOLIZEI   
    { name: 'Herrenloses Gepäckstück (Sprengstoffverdacht)', minXp: 1200, reqs: { 'BP_FuStW': 3, 'BP_GefKw': 1, 'RTW_Group': 1 }, time: 45, orgs: ['bpol', 'rd'], reward: 4500, xpReward: 100 },
    { name: 'Schlägerei rivalisierender Fangruppen im Bahnhof', minXp: 1500, reqs: { 'BP_FuStW': 4, 'BP_GefKw': 2, 'RTW_Group': 2 }, time: 50, orgs: ['bpol', 'rd'], reward: 5800, xpReward: 130 },

    // --- STUFE 4: ELITE / GROSSSCHADENSLAGEN (> 2500 XP) ---
        // FEUERWEHR
    { name: 'Dachstuhlbrand Schule/Mehrfamilienhaus', minXp: 2500, reqs: { 'ELW_Group': 1, 'LF_Group': 4, 'DLK_Group': 2, 'RW_Group': 1, 'RTW_Group': 3, 'NEF': 1, 'FuStW': 2 }, time: 65, orgs: ['fw', 'rd', 'pol'], reward: 9500, xpReward: 220 },
    { name: 'Großbrand Lagerhalle (Industriegebiet)', minXp: 3500, reqs: { 'ELW_Group': 1, 'LF_Group': 5, 'DLK_Group': 2, 'RW_Group': 1, 'RTW_Group': 2, 'NEF': 1, 'FuStW': 3 }, time: 80, orgs: ['fw', 'rd', 'pol'], reward: 12500, xpReward: 300 },
    { name: 'Zugkollision Rangierbahnhof', minXp: 4000, reqs: { 'ELW_Group': 1, 'LF_Group': 3, 'RW_Group': 1, 'RTW_Group': 3, 'NEF': 2, 'BP_FuStW': 3, 'BP_GefKw': 1 }, time: 85, orgs: ['fw', 'rd', 'bpol'], reward: 14000, xpReward: 350 },
        // BUNDESPOLIZEI
    { name: 'Schwere Ausschreitungen vor Bundesgebäude / Bahnhof', minXp: 5000, reqs: { 'BP_FuStW': 4, 'BP_GefKw': 2, 'BP_WaWe': 1, 'RTW_Group': 3, 'NEF': 1 }, time: 90, orgs: ['bpol', 'rd'], reward: 16000, xpReward: 400 }
];

// ==========================================
// 4. STATUS & INITIALISIERUNG
// ==========================================
let simTime = new Date();
let timeScale = 1;
let lastRealTime = performance.now();
let isLiveTime = false;

let stations = [];
let missions = [];
let globalVehicles = [];

let buildMode = null;
let stIdCtr = 1;
let vIdCtr = 1;
let mIdCtr = 1;

let activeDispatchMissionId = null;
let activeStationModalId = null;
let einsatzstop = false;

let settings = { design: 'standard', theme: 'dark', sound: 'on', mapstyle: 'streets' };
let credits = 25000000;
let xp = 0;

let nextMissionSpawnCounter = 5;

function updateEconomyUI() {
    const elCr = document.getElementById('ui-credits');
    const elXp = document.getElementById('ui-xp');
    if (elCr) elCr.innerText = Math.floor(credits).toLocaleString('de-DE');
    if (elXp) elXp.innerText = Math.floor(xp).toLocaleString('de-DE');
}

// ==========================================
// 5. KARTEN-SETUP
// ==========================================
const googleStreets = L.tileLayer('https://mt0.google.com/vt/lyrs=m&hl=de&x={x}&y={y}&z={z}', { maxZoom: 20 });
const googleSatellite = L.tileLayer('https://mt0.google.com/vt/lyrs=s&hl=de&x={x}&y={y}&z={z}', { maxZoom: 20 });
let currentMapLayer = googleStreets;

const map = L.map('map').setView([48.8319, 9.3615], 13);
currentMapLayer.addTo(map);

map.on('click', function(e) {
    if (buildMode) {
        buildStationAt(e.latlng.lat, e.latlng.lng, buildMode);
        setBuildMode(null);
    }
});

// ==========================================
// 6. STEUERUNG & ZEIT
// ==========================================
function setLiveTime() {
    isLiveTime = true;
    timeScale = 1;
    document.querySelectorAll('.time-controls .btn-nav').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('ts-live');
    if (btn) btn.classList.add('active');
    showToast("Uhrzeit auf Live synchronisiert.");
}

function setTimeScale(s) {
    isLiveTime = false;
    timeScale = s;
    document.querySelectorAll('.time-controls .btn-nav').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('ts-' + s);
    if (btn) btn.classList.add('active');
    showToast(`Zeitbeschleunigung: ${s}x`);
}

function formatTime(d) {
    return d.getHours().toString().padStart(2, '0') + ':' +
           d.getMinutes().toString().padStart(2, '0') + ':' +
           d.getSeconds().toString().padStart(2, '0');
}

function toggleEinsatzstop() {
    einsatzstop = !einsatzstop;
    const btn = document.getElementById('btn-einsatzstop');
    if (btn) {
        btn.innerText = einsatzstop ? "⏸️ Einsatzstop Aktiv" : "▶️ Einsätze Aktiv";
        btn.className = einsatzstop ? "btn-nav btn-stop active" : "btn-nav";
    }
}

function getVehicleName(v, stObj) {
    if (v.customName && v.customName.trim() !== '') return v.customName;
    const vDef = VEHICLES[v.type];
    const town = stObj ? stObj.town.split(' ')[0] : 'Wache';
    if (settings.design === 'bw') {
        const orgFmt = ORGS[vDef.org] ? ORGS[vDef.org].funfname : 'Florian';
        return `${orgFmt} ${town} 1/${vDef.bw_name}-${v.number}`;
    }
    return `${vDef.name} (${town}) - ${v.number}`;
}

function getFMS(status) {
    const mapFms = {
        'free': 2,
        'waiting_crew': 6,
        'en_route_mission': 3,
        'arrived': 4,
        'working': 4,
        'transport_hospital': 7,
        'at_hospital': 8,
        'en_route_home': 1
    };
    return mapFms[status] || 2;
}

// ==========================================
// 7. WACHEN- & BAUSYSTEM
// ==========================================
function setBuildMode(type, btnElement) {
    if (buildMode === type) {
        buildMode = null;
        document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('active'));
        return;
    }
    buildMode = type;
    document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    if (type) showToast("Klicke auf die Karte, um das Gebäude zu platzieren.");
}

function buildStationAt(lat, lng, type) {
    const def = STATION_TYPES[type];
    if (!def) return;
    if (credits < def.buildCost) {
        showToast("Nicht genügend Credits!");
        return;
    }

    credits -= def.buildCost;
    updateEconomyUI();

    const station = {
        id: stIdCtr++,
        type: type,
        name: `${def.name} #${stIdCtr - 1}`,
        town: 'Standort',
        lat: lat,
        lng: lng,
        staff: def.initStaff,
        hireMode: 'auto',
        youthActive: false,
        vehicleCountByType: {}
    };

    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            html: `<div style="font-size:22px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${def.icon}</div>`,
            className: 'station-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        })
    }).addTo(map);

    marker.on('click', () => openStationModal(station.id));
    marker.bindTooltip(station.name, { permanent: false, direction: 'top' });
    station.marker = marker;

    stations.push(station);
    updateStationListUI();
    showToast(`${def.name} errichtet!`);
}

function updateStationListUI() {
    const countEl = document.getElementById('station-count');
    if (countEl) countEl.innerText = stations.length;
    const list = document.getElementById('station-list');
    if (!list) return;

    list.innerHTML = '';
    stations.forEach(st => {
        const sDef = STATION_TYPES[st.type];
        const vCount = globalVehicles.filter(v => v.stId === st.id).length;
        const item = document.createElement('div');
        item.className = 'station-item';
        item.style.cursor = 'pointer';
        item.innerHTML = `<strong>${sDef.icon} ${st.name}</strong><br><small>${vCount} Fahrzeuge | ${st.staff} Personal</small>`;
        item.onclick = () => {
            map.flyTo([st.lat, st.lng], 15);
            openStationModal(st.id);
        };
        list.appendChild(item);
    });
}

// ==========================================
// 8. FAHRZEUGE & WACHEN-MODAL
// ==========================================
function openStationModal(stId) {
    const st = stations.find(s => s.id === stId);
    if (!st) return;
    activeStationModalId = stId;

    const sDef = STATION_TYPES[st.type];
    document.getElementById('station-modal-title').innerText = `${sDef.icon} ${st.name}`;
    document.getElementById('station-modal-address').innerText = `Koordinaten: ${st.lat.toFixed(4)}, ${st.lng.toFixed(4)}`;
    document.getElementById('station-staff-count').innerText = `${st.staff} Mitarbeiter`;
    document.getElementById('station-youth-status').innerText = st.youthActive ? 'Aktiv (+1 Personal/Zyklus)' : 'Inaktiv';

    renderStationVehicles(st);
    renderStationShop(st);

    document.getElementById('station-modal').style.display = 'flex';
}

function renderStationVehicles(st) {
    const list = document.getElementById('station-vehicles-list');
    const vehs = globalVehicles.filter(v => v.stId === st.id);
    document.getElementById('station-veh-count').innerText = vehs.length;
    list.innerHTML = '';

    if (vehs.length === 0) {
        list.innerHTML = '<div style="padding:8px; color:#888;">Keine Fahrzeuge vorhanden.</div>';
        return;
    }

    vehs.forEach(v => {
        const row = document.createElement('div');
        row.className = 'station-veh-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.padding = '6px';
        row.style.borderBottom = '1px solid #333';
        row.innerHTML = `
            <span><b>${getVehicleName(v, st)}</b> (Status ${getFMS(v.status)})</span>
            <button class="btn-nav" onclick="openVehicleEditModal(${v.id})">✏️ Bearbeiten</button>
        `;
        list.appendChild(row);
    });
}

function renderStationShop(st) {
    const shop = document.getElementById('station-shop-list');
    shop.innerHTML = '';
    const sDef = STATION_TYPES[st.type];

    (sDef.vehicles || []).forEach(vType => {
        const vDef = VEHICLES[vType];
        if (!vDef) return;
        const btn = document.createElement('button');
        btn.className = 'btn-action';
        btn.style.margin = '4px';
        btn.innerHTML = `Kaufen: ${vDef.name} (${vDef.price.toLocaleString('de-DE')} Cr)`;
        btn.onclick = () => buyVehicle(st.id, vType);
        shop.appendChild(btn);
    });
}

function buyVehicle(stId, vType) {
    const st = stations.find(s => s.id === stId);
    const vDef = VEHICLES[vType];
    if (!st || !vDef) return;

    if (credits < vDef.price) {
        showToast("Nicht genügend Credits!");
        return;
    }

    credits -= vDef.price;
    updateEconomyUI();

    st.vehicleCountByType[vType] = (st.vehicleCountByType[vType] || 0) + 1;

    const newVeh = {
        id: vIdCtr++,
        stId: st.id,
        type: vType,
        number: st.vehicleCountByType[vType],
        customName: '',
        customImage: null,
        status: 'free',
        lat: st.lat,
        lng: st.lng,
        targetMissionId: null,
        marker: null,
        targetLat: null,
        targetLng: null
    };

    globalVehicles.push(newVeh);
    renderStationVehicles(st);
    showToast(`${vDef.name} erfolgreich gekauft!`);
}

function hireStaffManual() {
    const st = stations.find(s => s.id === activeStationModalId);
    if (!st) return;
    if (credits < 5000) {
        showToast("Nicht genügend Credits!");
        return;
    }
    credits -= 5000;
    st.staff += 5;
    updateEconomyUI();
    document.getElementById('station-staff-count').innerText = `${st.staff} Mitarbeiter`;
    showToast("5 Mitarbeiter eingestellt!");
}

function toggleYouthSection() {
    const st = stations.find(s => s.id === activeStationModalId);
    if (!st || st.youthActive) return;
    if (credits < 25000) {
        showToast("Nicht genügend Credits!");
        return;
    }
    credits -= 25000;
    st.youthActive = true;
    updateEconomyUI();
    document.getElementById('station-youth-status').innerText = 'Aktiv';
    showToast("Jugendabteilung erfolgreich gegründet!");
}

function toggleHireMode() {
    const st = stations.find(s => s.id === activeStationModalId);
    if (!st) return;
    st.hireMode = document.getElementById('station-hire-mode').value;
}

// ==========================================
// 9. FILTER & BESITZPRÜFUNG FÜR EINSÄTZE (NEU UND STRIKT)
// ==========================================

function getOwnedCountForRequirement(reqKey) {
    if (GROUPS[reqKey]) {
        const allowedTypes = GROUPS[reqKey];
        return globalVehicles.filter(v => allowedTypes.includes(v.type)).length;
    }
    return globalVehicles.filter(v => v.type === reqKey).length;
}

// Strikte Prüfung, ob der Einsatz machbar ist
function canSpawnMission(mTemplate) {
    // 1. Level-Check (XP)
    if (xp < (mTemplate.minXp || 0)) return false;

    // 2. Gebäude-Check: Hast du überhaupt eine Wache der Organisation gebaut?
    if (mTemplate.orgs && mTemplate.orgs.length > 0) {
        for (const org of mTemplate.orgs) {
            const hasOrgStation = stations.some(s => {
                const sDef = STATION_TYPES[s.type];
                return sDef && sDef.org === org;
            });
            if (!hasOrgStation) return false;
        }
    }

    // 3. Fahrzeug-Check: Sind die Fahrzeuge für die Anforderungen WIRKLICH im Besitz?
    for (const [reqKey, requiredCount] of Object.entries(mTemplate.reqs)) {
        const owned = getOwnedCountForRequirement(reqKey);
        if (owned < requiredCount) {
            return false;
        }
    }
    
    // Alles geprüft, Einsatz darf generiert werden!
    return true;
}

// ==========================================
// 10. EINSÄTZE & ALARMIERUNG (DISPATCH)
// ==========================================
function spawnRandomMission() {
    if (stations.length === 0 || einsatzstop) return;

    const maxMissions = Math.max(1, Math.floor(stations.length * 1.5));
    if (missions.length >= maxMissions) return;

    // Hier greift nun die strikte Filterung von oben
    const possibleMissions = MISSIONS.filter(m => canSpawnMission(m));
    if (possibleMissions.length === 0) return;

    const baseSt = stations[Math.floor(Math.random() * stations.length)];
    const mTemplate = possibleMissions[Math.floor(Math.random() * possibleMissions.length)];

    const dLat = (Math.random() - 0.5) * 0.04;
    const dLng = (Math.random() - 0.5) * 0.04;
    const mLat = baseSt.lat + dLat;
    const mLng = baseSt.lng + dLng;

    const mission = {
        id: mIdCtr++,
        name: mTemplate.name,
        reqs: JSON.parse(JSON.stringify(mTemplate.reqs)),
        workTimeTotal: mTemplate.time,
        workTimeRemaining: mTemplate.time,
        reward: mTemplate.reward,
        xpReward: mTemplate.xpReward,
        lat: mLat,
        lng: mLng,
        assignedVehicleIds: [],
        marker: null
    };

    const marker = L.marker([mLat, mLng], {
        icon: L.divIcon({
            html: `<div style="font-size:24px; animation: pulse 1s infinite;">🔥</div>`,
            className: 'mission-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        })
    }).addTo(map);

    marker.on('click', () => openDispatchModal(mission.id));
    marker.bindTooltip(`🚨 ${mission.name}`, { permanent: false, direction: 'top' });
    mission.marker = marker;

    missions.push(mission);
    soundAlarm();
    updateMissionsUI();
}

function updateMissionsUI() {
    const list = document.getElementById('mission-list');
    const countEl = document.getElementById('mission-count');
    if (countEl) countEl.innerText = missions.length;
    if (!list) return;

    list.innerHTML = '';
    if (missions.length === 0) {
        list.innerHTML = '<div class="empty-state">Keine offenen Einsätze vorhanden.</div>';
        return;
    }

    missions.forEach(m => {
        const item = document.createElement('div');
        item.className = 'mission-item';
        
        const workingVehicles = m.assignedVehicleIds.map(id => globalVehicles.find(v => v.id === id)).filter(v => v && v.status === 'working');
        const arrivedVehicles = m.assignedVehicleIds.map(id => globalVehicles.find(v => v.id === id)).filter(v => v && v.status === 'arrived');
        
        const isWorking = workingVehicles.length > 0;
        const hasArrived = arrivedVehicles.length > 0;

        if (hasArrived && !isWorking) {
            item.classList.add('mission-needs-orders');
        }

        let statusText = 'Wartet auf Kräfte';
        if (isWorking) {
            statusText = `In Arbeit (${Math.ceil(m.workTimeRemaining)}s)`;
        } else if (hasArrived) {
            statusText = `<span class="mission-needs-orders-text">Wartet auf Befehle!</span>`;
        }

        item.style.padding = '8px';
        item.style.margin = '4px 0';
        item.style.background = '#222';
        item.style.borderRadius = '4px';
        item.style.cursor = 'pointer';

        item.innerHTML = `
            <div style="font-weight:bold; color:#e74c3c;">🚨 ${m.name}</div>
            <small>Status: ${statusText}</small>
        `;
        item.onclick = () => {
            map.flyTo([m.lat, m.lng], 15);
            openDispatchModal(m.id);
        };
        list.appendChild(item);
    });
}

function openDispatchModal(mId) {
    const m = missions.find(x => x.id === mId);
    if (!m) return;
    activeDispatchMissionId = m.id;

    document.getElementById('dispatch-modal-title').innerText = `🚨 ${m.name}`;
    document.getElementById('dispatch-modal-address').innerText = `Einsatzort: ${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}`;

    const reqsEl = document.getElementById('dispatch-reqs');
    reqsEl.innerHTML = Object.entries(m.reqs).map(([req, count]) => `<span>${req}: ${count}x</span>`).join(' | ');

    const assignedList = document.getElementById('dispatch-assigned-list');
    assignedList.innerHTML = '';
    
    let hasArrivedVehicles = false;

    m.assignedVehicleIds.forEach(vid => {
        const v = globalVehicles.find(x => x.id === vid);
        if (v) {
            const st = stations.find(s => s.id === v.stId);
            const li = document.createElement('li');
            
            let activityText = "";
            if (v.status === 'arrived') activityText = " - Wartet auf Befehl!";
            if (v.status === 'working') activityText = ` - Führt aus: ${v.currentCommand || 'Arbeitet'}`;
            
            li.innerHTML = `${getVehicleName(v, st)} (Status ${getFMS(v.status)}) <b>${activityText}</b>`;
            assignedList.appendChild(li);

            if (v.status === 'arrived') hasArrivedVehicles = true;
        }
    });

    const cmdPanel = document.getElementById('dispatch-command-panel');
    if (hasArrivedVehicles) {
        cmdPanel.style.display = 'block';
    } else {
        cmdPanel.style.display = 'none';
    }

    const vList = document.getElementById('dispatch-vehicle-list');
    vList.innerHTML = '';

    globalVehicles.forEach(v => {
        const st = stations.find(s => s.id === v.stId);
        const distKm = (map.distance([v.lat, v.lng], [m.lat, m.lng]) / 1000).toFixed(1);
        const isFree = v.status === 'free';

        const row = document.createElement('div');
        row.className = 'dispatch-veh-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.padding = '4px 0';
        row.style.borderBottom = '1px solid #333';

        row.innerHTML = `
            <input type="checkbox" class="dispatch-checkbox" value="${v.id}" ${!isFree ? 'disabled' : ''} style="margin-right:8px;">
            <span style="flex:2;">${getVehicleName(v, st)}</span>
            <span style="flex:1;">Status ${getFMS(v.status)}</span>
            <span style="flex:1;">${distKm} km</span>
        `;
        vList.appendChild(row);
    });

    document.getElementById('dispatch-modal').style.display = 'flex';
}

function sendVehicles() {
    const m = missions.find(x => x.id === activeDispatchMissionId);
    if (!m) return;

    const checkedBoxes = document.querySelectorAll('.dispatch-checkbox:checked');
    let dispatchedAny = false;

    checkedBoxes.forEach(cb => {
        const vId = parseInt(cb.value);
        const v = globalVehicles.find(x => x.id === vId);
        if (v && v.status === 'free') {
            v.status = 'en_route_mission';
            v.targetMissionId = m.id;
            v.targetLat = m.lat;
            v.targetLng = m.lng;
            if (!m.assignedVehicleIds.includes(v.id)) {
                m.assignedVehicleIds.push(v.id);
            }
            createVehicleMarker(v);
            dispatchedAny = true;
        }
    });

    if (dispatchedAny) {
        soundSiren();
        showToast("Fahrzeuge alarmiert!");
        closeModal('dispatch-modal');
        updateMissionsUI();
    } else {
        showToast("Keine freien Fahrzeuge ausgewählt.");
    }
}

function issueCommand(cmdType) {
    const m = missions.find(x => x.id === activeDispatchMissionId);
    if (!m) return;

    let commandedCount = 0;

    m.assignedVehicleIds.forEach(vid => {
        const v = globalVehicles.find(x => x.id === vid);
        if (v && v.status === 'arrived') {
            v.status = 'working';
            v.currentCommand = cmdType;
            commandedCount++;
        }
    });

    if (commandedCount > 0) {
        showToast(`Befehl "${cmdType}" an ${commandedCount} Fahrzeug(e) erteilt. Arbeit beginnt!`);
        openDispatchModal(m.id);
        updateMissionsUI();
    }
}

// ==========================================
// 11. SIMULATIONSLOGIK (VEHICLES & MISSIONS)
// ==========================================
function updateVehicles(deltaMs) {
    const deltaSec = deltaMs / 1000;

    globalVehicles.forEach(v => {
        if (v.status === 'en_route_mission' || v.status === 'en_route_home') {
            const destLat = v.status === 'en_route_mission' ? v.targetLat : stations.find(s => s.id === v.stId).lat;
            const destLng = v.status === 'en_route_mission' ? v.targetLng : stations.find(s => s.id === v.stId).lng;

            const dLat = destLat - v.lat;
            const dLng = destLng - v.lng;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);

            const vDef = VEHICLES[v.type];
            const speed = (vDef ? vDef.speed : 60) * (currentWeather.speedMod || 1.0);
            const step = (speed / 3600) * 0.01 * deltaSec;

            if (dist <= step || dist < 0.0001) {
                v.lat = destLat;
                v.lng = destLng;

                if (v.status === 'en_route_mission') {
                    v.status = 'arrived'; 
                    const st = stations.find(s => s.id === v.stId);
                    showToast(`🚨 ${getVehicleName(v, st)} ist eingetroffen und wartet auf Befehle!`);
                    updateMissionsUI(); 
                    
                    if (activeDispatchMissionId === v.targetMissionId) {
                        openDispatchModal(activeDispatchMissionId);
                    }
                } else if (v.status === 'en_route_home') {
                    v.status = 'free';
                    if (v.marker) {
                        map.removeLayer(v.marker);
                        v.marker = null;
                    }
                }
            } else {
                v.lat += (dLat / dist) * step;
                v.lng += (dLng / dist) * step;
            }

            if (v.marker) {
                v.marker.setLatLng([v.lat, v.lng]);
            }
        }
    });
}

function updateMissions(deltaMs) {
    const deltaSec = deltaMs / 1000;

    nextMissionSpawnCounter -= deltaSec;
    if (nextMissionSpawnCounter <= 0) {
        spawnRandomMission();
        nextMissionSpawnCounter = 15 + Math.random() * 20;
    }

    missions.forEach((m, idx) => {
        const workingVehicles = m.assignedVehicleIds.map(id => globalVehicles.find(v => v.id === id)).filter(v => v && v.status === 'working');

        if (workingVehicles.length > 0) {
            m.workTimeRemaining -= deltaSec * workingVehicles.length;

            if (m.workTimeRemaining <= 0) {
                credits += m.reward;
                xp += m.xpReward;
                updateEconomyUI();

                if (m.marker) {
                    map.removeLayer(m.marker);
                }

                m.assignedVehicleIds.forEach(vid => {
                    const v = globalVehicles.find(x => x.id === vid);
                    if (v) {
                        v.status = 'en_route_home';
                        v.targetMissionId = null;
                        v.currentCommand = null;
                    }
                });

                missions.splice(idx, 1);
                showToast(`Einsatz abgeschlossen: +${m.reward} Cr! (+${m.xpReward} XP)`);
                updateMissionsUI();
            }
        }
    });
}

// ==========================================
// 12. FAHRZEUG-MARKER & CUSTOM ICONS
// ==========================================
function createVehicleMarker(v) {
    if (v.marker) return;
    const vDef = VEHICLES[v.type];
    const color = ORGS[vDef.org] ? ORGS[vDef.org].color : '#e74c3c';

    let cssClass = 'marker-normal';
    if (v.status === 'en_route_mission') cssClass = 'marker-blaulicht';
    if (v.status === 'transport_hospital') cssClass = 'marker-hospital';
    if (v.status === 'en_route_home') cssClass = 'marker-rückfahrt';

    if (v.customImage) {
        let icon = L.divIcon({
            html: `<img src="${v.customImage}" style="width:32px;height:32px;object-fit:cover;border-radius:50%;border:2px solid #fff;">`,
            className: cssClass + ' custom-veh-icon',
            iconSize: [32, 32]
        });
        v.marker = L.marker([v.lat, v.lng], { icon: icon }).addTo(map);
    } else {
        v.marker = L.circleMarker([v.lat, v.lng], {
            radius: 7,
            color: '#000',
            weight: 1,
            fillColor: color,
            fillOpacity: 1,
            className: cssClass
        }).addTo(map);
    }

    const st = stations.find(s => s.id === v.stId);
    v.marker.bindPopup(`<b>${getVehicleName(v, st)}</b><br>Status: ${getFMS(v.status)}`);
}

// ==========================================
// 13. FAHRZEUG BEARBEITEN
// ==========================================
let currentEditVehImageBase64 = null;

function openVehicleEditModal(vId) {
    const v = globalVehicles.find(x => x.id === vId);
    if (!v) return;

    document.getElementById('veh-edit-id').value = v.id;
    document.getElementById('veh-edit-name').value = v.customName || '';
    currentEditVehImageBase64 = v.customImage || null;

    let preview = document.getElementById('veh-edit-preview');
    if (currentEditVehImageBase64) {
        preview.src = currentEditVehImageBase64;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
    document.getElementById('vehicle-modal').style.display = 'flex';
}

const vehImgInput = document.getElementById('veh-edit-img');
if (vehImgInput) {
    vehImgInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
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
}

function saveVehicleEdit() {
    const vId = parseInt(document.getElementById('veh-edit-id').value);
    const v = globalVehicles.find(x => x.id === vId);
    if (!v) return;

    v.customName = document.getElementById('veh-edit-name').value.trim();
    v.customImage = currentEditVehImageBase64;

    if (v.marker) {
        map.removeLayer(v.marker);
        v.marker = null;
        if (v.status !== 'free') createVehicleMarker(v);
    }

    closeModal('vehicle-modal');
    showToast("Fahrzeug aktualisiert!");
}

// ==========================================
// 14. SETTINGS, MODALS & STORAGE
// ==========================================
function openFMSModal() {
    const grid = document.getElementById('fms-container');
    if (!grid) return;
    grid.innerHTML = '';

    globalVehicles.forEach(v => {
        const st = stations.find(s => s.id === v.stId);
        const card = document.createElement('div');
        card.style.padding = '6px';
        card.style.background = '#222';
        card.style.borderRadius = '4px';
        card.innerHTML = `<strong>${getVehicleName(v, st)}</strong>: <span class="fms-status-box fms-stat-${getFMS(v.status)}">${getFMS(v.status)}</span>`;
        grid.appendChild(card);
    });

    document.getElementById('fms-modal').style.display = 'flex';
}

function openSettingsModal() { document.getElementById('settings-modal').style.display = 'flex'; }
function openSchoolsModal() { document.getElementById('schools-modal').style.display = 'flex'; }
function openPresetsModal() { document.getElementById('presets-modal').style.display = 'flex'; }
function openMissionEditor() { document.getElementById('mission-editor-modal').style.display = 'flex'; }

function updateSettings() {
    settings.design = document.getElementById('setting-design').value;
    settings.theme = document.getElementById('setting-theme').value;
    settings.sound = document.getElementById('setting-sound').value;
    settings.mapstyle = document.getElementById('setting-mapstyle').value;

    document.documentElement.setAttribute('data-theme', settings.theme);

    if (settings.mapstyle === 'satellite') {
        map.removeLayer(currentMapLayer);
        currentMapLayer = googleSatellite.addTo(map);
    } else {
        map.removeLayer(currentMapLayer);
        currentMapLayer = googleStreets.addTo(map);
    }
}

function saveGame() {
    const saveState = {
        credits,
        xp,
        settings,
        stations: stations.map(s => ({
            id: s.id, type: s.type, name: s.name, town: s.town, lat: s.lat, lng: s.lng, staff: s.staff, youthActive: s.youthActive
        })),
        vehicles: globalVehicles.map(v => ({
            id: v.id, stId: v.stId, type: v.type, number: v.number, customName: v.customName, customImage: v.customImage
        }))
    };
    localStorage.setItem('leitstelle_save', JSON.stringify(saveState));
    showToast("Spielstand im Browser gespeichert!");
}

function loadGame() {
    const saved = localStorage.getItem('leitstelle_save');
    if (!saved) {
        showToast("Kein Spielstand gefunden.");
        return;
    }
    const data = JSON.parse(saved);
    credits = data.credits || 25000000;
    xp = data.xp || 0;
    settings = data.settings || settings;

    stations.forEach(s => s.marker && map.removeLayer(s.marker));
    missions.forEach(m => m.marker && map.removeLayer(m.marker));
    globalVehicles.forEach(v => v.marker && map.removeLayer(v.marker));

    stations = [];
    globalVehicles = [];
    missions = [];

    (data.stations || []).forEach(s => {
        stIdCtr = Math.max(stIdCtr, s.id + 1);
        
        // GANZ WICHTIG: Migriert alte kleine Wachen zur normalen Wache!
        if (s.type === 'fw_ff_klein') s.type = 'fw_ff';
        
        const def = STATION_TYPES[s.type];
        const marker = L.marker([s.lat, s.lng], {
            icon: L.divIcon({
                html: `<div style="font-size:22px;">${def ? def.icon : '🏢'}</div>`,
                className: 'station-marker',
                iconSize: [28, 28]
            })
        }).addTo(map);
        s.marker = marker;
        s.vehicleCountByType = {};
        marker.on('click', () => openStationModal(s.id));
        stations.push(s);
    });

    (data.vehicles || []).forEach(v => {
        vIdCtr = Math.max(vIdCtr, v.id + 1);
        const st = stations.find(s => s.id === v.stId);
        v.lat = st ? st.lat : 0;
        v.lng = st ? st.lng : 0;
        v.status = 'free';
        v.marker = null;
        globalVehicles.push(v);
    });

    updateEconomyUI();
    updateStationListUI();
    updateMissionsUI();
    closeModal('settings-modal');
    showToast("Spielstand erfolgreich geladen!");
}

function clearSave() {
    if (confirm("Möchtest du deinen Spielstand wirklich komplett löschen?")) {
        localStorage.removeItem('leitstelle_save');
        location.reload();
    }
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText = msg;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3000);
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

// ==========================================
// 15. GAME LOOP START
// ==========================================
function gameLoop(currentTime) {
    let deltaReal = currentTime - lastRealTime;
    lastRealTime = currentTime;

    if (isLiveTime) {
        simTime = new Date();
    } else {
        let deltaSim = deltaReal * timeScale;
        simTime = new Date(simTime.getTime() + deltaSim);
    }

    const clockEl = document.getElementById('clock');
    if (clockEl) clockEl.innerText = formatTime(simTime);

    updateWeather();
    updateDayNightCycle();

    let effectiveDelta = isLiveTime ? deltaReal : deltaReal * timeScale;
    updateVehicles(effectiveDelta);
    updateMissions(effectiveDelta);

    requestAnimationFrame(gameLoop);
}

// Start
updateEconomyUI();
requestAnimationFrame(gameLoop);
