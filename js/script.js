// --- SOUND SYSTEM ---
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
    playBeep(1270, 'sine', 0.5, 0.1, 0.2); playBeep(1400, 'sine', 0.5, 0.1, 0.3); playBeep(1530, 'sine', 1.0, 0.1, 0.4);
}
function soundSiren() {
    playBeep(435, 'square', 0.4, 0.05, 0); playBeep(580, 'square', 0.4, 0.05, 0.4);
    playBeep(435, 'square', 0.4, 0.05, 0.8); playBeep(580, 'square', 0.4, 0.05, 1.2);
}

// --- WEATHER SYSTEM ---
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
    'bpol': { name: 'bpol', color: 'var(--org-bp-pol)', funfname: 'bp FuStW' },	
	
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
    'ELW2': { name: 'ELW 2', bw_name: '12', org: 'fw', speed: 75, crew: 3, reqQual: 'Zugführer', price: 150000, upkeep: 250 },
    'MTF': { name: 'MTF', bw_name: '19', org: 'fw', speed: 85, crew: 4, reqQual: null, price: 35000, upkeep: 80 },
    
    // NEU: Upgrades in HLF20 und LF10 integriert
    'HLF20': { 
        name: 'HLF 20', bw_name: '46', org: 'fw', speed: 70, crew: 9, reqQual: 'Atemschutz', price: 350000, upkeep: 500,
        possibleUpgrades: {
            'th_satz': { name: 'TH-Satz (VU)', price: 45000, provides: 'RW_Group' },
            'haspel': { name: 'Ein-Personen-Haspel', price: 10000, provides: 'GWL_Group' },
            'tank3000': { name: '3000L Wassertank', price: 25000, provides: 'TLF_Group' }
        }
    },
    'HLF10': { name: 'HLF 10', bw_name: '43', org: 'fw', speed: 70, crew: 9, reqQual: 'Atemschutz', price: 280000, upkeep: 400 },
    'LF10': { 
        name: 'LF 10', bw_name: '42', org: 'fw', speed: 70, crew: 9, reqQual: 'Atemschutz', price: 250000, upkeep: 350,
        possibleUpgrades: {
            'th_satz': { name: 'TH-Satz (Klein)', price: 30000, provides: 'RW_Group' }
        }
    },
    'LF20': { name: 'LF 20', bw_name: '44', org: 'fw', speed: 70, crew: 9, reqQual: 'Atemschutz', price: 320000, upkeep: 450 },
    'LF20KatS': { name: 'LF 20 KatS', bw_name: '45', org: 'fw', speed: 65, crew: 9, reqQual: 'Atemschutz', price: 290000, upkeep: 400 },
    'MLF': { name: 'MLF', bw_name: '40', org: 'fw', speed: 75, crew: 6, reqQual: 'Atemschutz', price: 180000, upkeep: 250 },
    'TSF': { name: 'TSF', bw_name: '47', org: 'fw', speed: 80, crew: 6, reqQual: null, price: 90000, upkeep: 150 },
    'TSFW': { name: 'TSF-W', bw_name: '48', org: 'fw', speed: 75, crew: 6, reqQual: 'Atemschutz', price: 110000, upkeep: 180 },
    'KLF': { name: 'KLF', bw_name: '41', org: 'fw', speed: 80, crew: 4, reqQual: null, price: 100000, upkeep: 150 },
    'TLF2000': { name: 'TLF 2000', bw_name: '21', org: 'fw', speed: 70, crew: 3, reqQual: null, price: 220000, upkeep: 350 },
    'TLF3000': { name: 'TLF 3000', bw_name: '23', org: 'fw', speed: 70, crew: 3, reqQual: null, price: 300000, upkeep: 450 },
    'TLF4000': { name: 'TLF 4000', bw_name: '24', org: 'fw', speed: 65, crew: 3, reqQual: null, price: 380000, upkeep: 550 },
    'DLK': { name: 'DLK 23/12', bw_name: '33', org: 'fw', speed: 65, crew: 3, reqQual: 'Drehleitermaschinist', price: 600000, upkeep: 800 },
    'DLAK': { name: 'DLA(K) 23/12', bw_name: '33', org: 'fw', speed: 65, crew: 3, reqQual: 'Drehleitermaschinist', price: 650000, upkeep: 850 },
    'TBM': { name: 'TM 32', bw_name: '35', org: 'fw', speed: 60, crew: 3, reqQual: 'Drehleitermaschinist', price: 750000, upkeep: 900 },
    'VRW': { name: 'VRW', bw_name: '50', org: 'fw', speed: 85, crew: 3, reqQual: null, price: 120000, upkeep: 200 },
    'RW': { name: 'RW', bw_name: '52', org: 'fw', speed: 70, crew: 3, reqQual: null, price: 350000, upkeep: 450 },
    'SW2000': { name: 'SW 2000', bw_name: '62', org: 'fw', speed: 65, crew: 3, reqQual: null, price: 250000, upkeep: 300 },
    'GWL1': { name: 'GW-L1', bw_name: '73', org: 'fw', speed: 75, crew: 3, reqQual: null, price: 150000, upkeep: 250 },
    'GWL2': { name: 'GW-L2', bw_name: '74', org: 'fw', speed: 70, crew: 3, reqQual: null, price: 200000, upkeep: 300 },
    'GWT': { name: 'GW-T', bw_name: '74', org: 'fw', speed: 70, crew: 3, reqQual: null, price: 180000, upkeep: 250 },
    'GWA': { name: 'GW-A', bw_name: '56', org: 'fw', speed: 70, crew: 2, reqQual: 'Atemschutz', price: 180000, upkeep: 250 },
    'GWG': { name: 'GW-G', bw_name: '54', org: 'fw', speed: 65, crew: 2, reqQual: 'Gefahrgut', price: 300000, upkeep: 400 },
    'GWMess': { name: 'GW-Mess', bw_name: '93', org: 'fw', speed: 75, crew: 2, reqQual: 'Gefahrgut', price: 150000, upkeep: 200 },
    'FwK': { name: 'FwK (Kran)', bw_name: '71', org: 'fw', speed: 55, crew: 2, reqQual: 'Kranführer', price: 1200000, upkeep: 1500 },
    'WLF': { name: 'WLF', bw_name: '65', org: 'fw', speed: 65, crew: 2, reqQual: 'WLF-Maschinist', price: 200000, upkeep: 350 },
    'ABRuest': { name: 'AB-Rüst', bw_name: 'AB', org: 'fw', speed: 0, crew: 0, isAB: true, reqQual: null, price: 80000, upkeep: 50 },
    'ABAtemschutz': { name: 'AB-Atemschutz', bw_name: 'AB', org: 'fw', speed: 0, crew: 0, isAB: true, reqQual: null, price: 70000, upkeep: 50 },
    'ABGefahrgut': { name: 'AB-Gefahrgut', bw_name: 'AB', org: 'fw', speed: 0, crew: 0, isAB: true, reqQual: null, price: 90000, upkeep: 50 },
    'ABWasser': { name: 'AB-Wasser', bw_name: 'AB', org: 'fw', speed: 0, crew: 0, isAB: true, reqQual: null, price: 50000, upkeep: 20 },
    'ABSchlauch': { name: 'AB-Schlauch', bw_name: 'AB', org: 'fw', speed: 0, crew: 0, isAB: true, reqQual: null, price: 40000, upkeep: 20 },
    'ABEinsatzleitung': { name: 'AB-EL', bw_name: 'AB', org: 'fw', speed: 0, crew: 0, isAB: true, reqQual: null, price: 120000, upkeep: 80 },

    // RD & SEG
    'RTW': { name: 'RTW', bw_name: '83', org: 'rd', speed: 90, crew: 2, reqQual: null, price: 150000, upkeep: 250 },
    'SRTW': { name: 'S-RTW', bw_name: '83-2', org: 'rd', speed: 75, crew: 2, reqQual: null, price: 180000, upkeep: 300 },
    'GRTW': { name: 'GRTW', bw_name: '89-2', org: 'rd', speed: 65, crew: 3, reqQual: null, price: 400000, upkeep: 600 },
    'KTW': { name: 'KTW', bw_name: '85', org: 'rd', speed: 85, crew: 2, reqQual: null, price: 80000, upkeep: 150 },
    'KTWB': { name: 'KTW Typ B', bw_name: '85-2', org: 'seg', speed: 80, crew: 2, reqQual: null, price: 85000, upkeep: 150 },
    'KTW4': { name: 'KTW 4', bw_name: '85-4', org: 'seg', speed: 75, crew: 2, reqQual: null, price: 70000, upkeep: 120 },
    'NEF': { name: 'NEF', bw_name: '82', org: 'rd', speed: 100, crew: 2, reqQual: 'Notarzt', price: 90000, upkeep: 200 },
    'NAW': { name: 'NAW', bw_name: '81', org: 'rd', speed: 85, crew: 3, reqQual: 'Notarzt', price: 170000, upkeep: 300 },
    'FR': { name: 'First Responder', bw_name: '79', org: 'rd', speed: 100, crew: 1, reqQual: null, price: 30000, upkeep: 50 },
    'LNA': { name: 'LNA', bw_name: '9', org: 'rd', speed: 95, crew: 1, reqQual: 'LNA Qualifikation', price: 50000, upkeep: 100 },
    'OrgL': { name: 'OrgL', bw_name: '9-2', org: 'rd', speed: 95, crew: 1, reqQual: 'OrgL Qualifikation', price: 50000, upkeep: 100 },
    'GWSan': { name: 'GW-San', bw_name: '89', org: 'seg', speed: 70, crew: 6, reqQual: null, price: 150000, upkeep: 200 },
    'GWBetreuung': { name: 'GW-Betreuung', bw_name: '89', org: 'seg', speed: 70, crew: 3, reqQual: null, price: 140000, upkeep: 200 },
    'MTWBt': { name: 'MTW-Bt', bw_name: '19', org: 'seg', speed: 80, crew: 4, reqQual: null, price: 40000, upkeep: 80 },

    // LUFTRETTUNG
    'RTH': { name: 'RTH', bw_name: '', org: 'luft', speed: 220, isAir: true, crew: 3, reqQual: 'Notarzt', price: 4500000, upkeep: 5000 },
    'ITH': { name: 'ITH', bw_name: '', org: 'luft', speed: 250, isAir: true, crew: 3, reqQual: 'Notarzt', price: 6000000, upkeep: 6500 },

    // POLIZEI
    'FuStW': { name: 'FuStW (Audi e-tron)', bw_name: 'Streife', org: 'pol', speed: 95, crew: 2, reqQual: null, img: 'img/image-removebg-preview.jpg', price: 60000, upkeep: 150 },
    'GefKw': { name: 'GefKw', bw_name: 'GefKw', org: 'pol', speed: 75, crew: 2, reqQual: null, price: 80000, upkeep: 150 },
    'GruKw': { name: 'GruKw', bw_name: 'GruKw', org: 'pol', speed: 75, crew: 9, reqQual: null, price: 120000, upkeep: 250 },
    'WaWe': { name: 'WaWe 10000', bw_name: 'WaWe', org: 'pol', speed: 55, crew: 5, reqQual: 'Sonderfahrzeug-Polizei', price: 800000, upkeep: 1000 },
    'BeDoKw': { name: 'BeDoKw', bw_name: 'BeDoKw', org: 'pol', speed: 80, crew: 4, reqQual: null, price: 150000, upkeep: 200 },
    'Krad': { name: 'Krad', bw_name: 'Krad', org: 'pol', speed: 110, crew: 1, reqQual: null, price: 25000, upkeep: 50 },
    'Zivil': { name: 'Zivil (Kripo)', bw_name: 'Kripo', org: 'pol', speed: 95, crew: 2, reqQual: null, price: 45000, upkeep: 100 },
    // BUNESPOLIZEI
    'FuStW': { name: 'BP-FuStW', bw_name: 'Streife', org: 'bpol', speed: 95, crew: 2, reqQual: null, img: 'img/image-removebg-preview.jpg', price: 60000, upkeep: 150 },
    'GefKw': { name: 'GefKw', bw_name: 'GefKw', org: 'bpol', speed: 75, crew: 2, reqQual: null, price: 80000, upkeep: 150 },
    'GruKw': { name: 'GruKw', bw_name: 'GruKw', org: 'bpol', speed: 75, crew: 9, reqQual: null, price: 120000, upkeep: 250 },
    'WaWe': { name: 'WaWe 10000', bw_name: 'WaWe', org: 'bpol', speed: 55, crew: 5, reqQual: 'Sonderfahrzeug-Polizei', price: 800000, upkeep: 1000 },
    'BeDoKw': { name: 'BeDoKw', bw_name: 'BeDoKw', org: 'bpol', speed: 80, crew: 4, reqQual: null, price: 150000, upkeep: 200 },
    'Krad': { name: 'BP-Krad', bw_name: 'Krad', org: 'bpol', speed: 110, crew: 1, reqQual: null, price: 25000, upkeep: 50 },
    'Zivil': { name: 'BP-Zivil (Kripo)', bw_name: 'Kripo', org: 'bpol', speed: 95, crew: 2, reqQual: null, price: 45000, upkeep: 100 },
    'DHuFu': { name: 'BP-DHuFu', bw_name: 'Streife', org: 'bpol', speed: 95, crew: 2, reqQual: null, img: 'img/image-removebg-preview.jpg', price: 60000, upkeep: 150 },

    // THW
    'MTWTZ': { name: 'MTW-TZ', bw_name: '86', org: 'thw', speed: 80, crew: 4, reqQual: null, price: 45000, upkeep: 80 },
    'GKW': { name: 'GKW', bw_name: '22/51', org: 'thw', speed: 70, crew: 9, reqQual: null, price: 300000, upkeep: 400 },
    'MzGW': { name: 'MzGW', bw_name: '24/54', org: 'thw', speed: 65, crew: 7, reqQual: null, price: 280000, upkeep: 380 },
    'LKWK9': { name: 'LKW K 9', bw_name: '41/61', org: 'thw', speed: 65, crew: 3, reqQual: 'THW Kranführer', price: 220000, upkeep: 300 },

    // DLRG
    'GWWR': { name: 'GW-W', bw_name: '91', org: 'dlrg', speed: 75, crew: 4, reqQual: 'Strömungsretter', price: 140000, upkeep: 200 },
    'GWTauchen': { name: 'GW-Tauchen', bw_name: '92', org: 'dlrg', speed: 75, crew: 3, reqQual: 'Einsatztaucher', price: 160000, upkeep: 220 },
    'MTWWR': { name: 'MTW-WR', bw_name: '19', org: 'dlrg', speed: 85, crew: 4, reqQual: null, price: 40000, upkeep: 80 },
    'RTB': { name: 'Anh. RTB', bw_name: 'Anh', org: 'dlrg', speed: 0, isAnh: true, crew: 0, reqQual: null, price: 25000, upkeep: 30 },
    
    // BERGWACHT
    'GW Berg': { name: 'GW-Berg', bw_name: '95', org: 'bw', speed: 75, crew: 4, reqQual: 'Bergretter', price: 110000, upkeep: 150 },
    'ATV': { name: 'ATV / Quad', bw_name: 'ATV', org: 'bw', speed: 60, crew: 1, reqQual: null, price: 15000, upkeep: 40 }
};

const GROUPS = {
    'LF_Group': ['HLF20', 'HLF10', 'LF20', 'LF10', 'LF20KatS', 'MLF', 'TSFW', 'TSF', 'KLF'],
    'TLF_Group': ['TLF2000', 'TLF3000', 'TLF4000', 'LF20'],
    'ELW_Group': ['ELW1', 'ELW2', 'KdoW'],
    'RW_Group': ['RW', 'VRW', 'HLF20'],
    'DLK_Group': ['DLK', 'DLAK', 'TBM'],
    'GWL_Group': ['GWL1', 'GWL2', 'GWT'],
    'RTW_Group': ['RTW', 'NAW', 'SRTW']
};

const STATION_TYPES = {
    'fw_ff_klein': { name: 'Freiwillige Feuerwehr (Klein)', org: 'fw', icon: '🚒', delay: true, initStaff: 15, vehicles: ['TSF', 'TSFW', 'MLF', 'LF10', 'KLF', 'MTF', 'FR'], buildCost: 100000 },
    'fw_ff': { name: 'Freiwillige Feuerwehr', org: 'fw', icon: '🚒', delay: true, initStaff: 30, vehicles: ['KdoW', 'ELW1', 'HLF20', 'LF20', 'LF20KatS', 'DLK', 'RW', 'GWL2', 'TLF3000', 'TLF4000', 'GWA', 'SW2000'], buildCost: 250000 },
    'fw_bf': { name: 'Berufsfeuerwehr', org: 'fw', icon: '🏢', delay: false, initStaff: 50, vehicles: ['KdoW', 'ELW1', 'ELW2', 'HLF20', 'DLK', 'TBM', 'RW', 'WLF', 'ABRuest', 'ABAtemschutz', 'ABGefahrgut', 'ABWasser', 'ABSchlauch', 'ABEinsatzleitung', 'GWG', 'GWMess', 'FwK'], buildCost: 1000000 },
    'rd_wache': { name: 'Rettungswache', org: 'rd', icon: '🚑', delay: false, initStaff: 20, vehicles: ['RTW', 'SRTW', 'NAW', 'KTW', 'NEF', 'LNA', 'OrgL', 'GRTW'], buildCost: 200000 },
    'rd_kh': { name: 'Krankenhaus', org: 'rd', icon: '🏥', delay: false, initStaff: 100, vehicles: ['NEF', 'NAW', 'LNA'], buildCost: 5000000 },
    'luft_hub': { name: 'Luftrettungszentrum', org: 'luft', icon: '🚁', delay: false, initStaff: 10, vehicles: ['RTH', 'ITH'], buildCost: 2500000 },
    'pol_wache': { name: 'Polizeirevier', org: 'pol', icon: '🚓', delay: false, initStaff: 30, vehicles: ['FuStW', 'Krad', 'Zivil'], buildCost: 300000 },
    'pol_bepo': { name: 'Bereitschaftspolizei', org: 'pol', icon: '🛡️', delay: false, initStaff: 60, vehicles: ['FuStW', 'GefKw', 'GruKw', 'WaWe', 'BeDoKw'], buildCost: 500000 },
    'bpol_wache': { name: 'Bundespolizei', org: 'bpol', icon: '🛡️', delay: false, initStaff: 60, vehicles: ['FuStW', 'Krad', 'Zivil', 'DHuFu', 'BeDoKw'], buildCost: 500000 },
    'seg_wache': { name: 'KatS / SEG', org: 'seg', icon: '⛺', delay: true, initStaff: 25, vehicles: ['KTWB', 'KTW4', 'GWSan', 'GWBetreuung', 'MTWBt', 'KdoW'], buildCost: 150000 },
    'thw_ov': { name: 'THW Ortsverband', org: 'thw', icon: '⚙️', delay: true, initStaff: 35, vehicles: ['MTWTZ', 'GKW', 'MzGW', 'LKWK9'], buildCost: 250000 },
    'dlrg_wache': { name: 'DLRG Station', org: 'dlrg', icon: '🌊', delay: true, initStaff: 20, vehicles: ['MTWWR', 'GWWR', 'GWTauchen', 'RTB'], buildCost: 150000 },
    'bw_wache': { name: 'Bergwacht', org: 'bw', icon: '🏔️', delay: true, initStaff: 15, vehicles: ['GW Berg', 'ATV'], buildCost: 100000 },
    
    // SCHOOLS
    'school_fw': { name: 'Feuerwehrschule', org: 'school', icon: '🎓', delay: false, initStaff: 0, vehicles: [], buildCost: 500000 },
    'school_rd': { name: 'Rettungsdienstschule', org: 'school', icon: '🎓', delay: false, initStaff: 0, vehicles: [], buildCost: 500000 },
    'school_pol': { name: 'Polizeischule', org: 'school', icon: '🎓', delay: false, initStaff: 0, vehicles: [], buildCost: 500000 },
    'school_thw': { name: 'THW Bundesschule', org: 'school', icon: '🎓', delay: false, initStaff: 0, vehicles: [], buildCost: 500000 }
};

const COURSES = [
    { id: 'Atemschutz', name: 'Atemschutzgeräteträger', org: 'fw', durationDays: 3, cost: 1500 },
    { id: 'Zugführer', name: 'Zugführer / Einsatzleiter', org: 'fw', durationDays: 5, cost: 5000 },
    { id: 'Drehleitermaschinist', name: 'Drehleitermaschinist', org: 'fw', durationDays: 4, cost: 3500 },
    { id: 'Gefahrgut', name: 'Gefahrgut / CBRN', org: 'fw', durationDays: 5, cost: 4000 },
    { id: 'Kranführer', name: 'Feuerwehrkranführer', org: 'fw', durationDays: 3, cost: 2500 },
    { id: 'WLF-Maschinist', name: 'Wechsellader-Maschinist', org: 'fw', durationDays: 2, cost: 1500 },
    { id: 'Notarzt', name: 'Notarzt-Qualifikation', org: 'rd', durationDays: 7, cost: 10000 },
    { id: 'LNA Qualifikation', name: 'Leitender Notarzt', org: 'rd', durationDays: 5, cost: 8000 },
    { id: 'OrgL Qualifikation', name: 'OrgL Rettungsdienst', org: 'rd', durationDays: 5, cost: 6000 },
    { id: 'Sonderfahrzeug-Polizei', name: 'WaWe / Sonderkraftfahrzeug', org: 'pol', durationDays: 4, cost: 4500 },
    { id: 'THW Kranführer', name: 'THW Ladekran-Maschinist', org: 'thw', durationDays: 3, cost: 2500 },
    { id: 'Strömungsretter', name: 'Strömungsretter DLRG', org: 'dlrg', durationDays: 4, cost: 2000 },
    { id: 'Einsatztaucher', name: 'Einsatztaucher', org: 'dlrg', durationDays: 7, cost: 6000 },
    { id: 'Bergretter', name: 'Bergrettungsdienst', org: 'bw', durationDays: 5, cost: 3000 }
];

const PRESET_STATIONS = [
    { name: "Feuerwache 1 Süd", type: "fw_bf", lat: 48.7663, lng: 9.1764, town: "Stuttgart", initVehs: ["ELW1", "HLF20", "DLK", "RW", "RTW", "NEF"] },
    { name: "Feuerwache 2 West", type: "fw_bf", lat: 48.7758, lng: 9.1550, town: "Stuttgart", initVehs: ["ELW1", "HLF20", "DLK", "GWA", "WLF", "ABRuest"] },
    { name: "Feuerwache 3 Bad Cannstatt", type: "fw_bf", lat: 48.8010, lng: 9.2150, town: "Stuttgart", initVehs: ["ELW1", "HLF20", "DLK", "TLF4000", "GWG"] },
    { name: "Polizeipräsidium Stuttgart", type: "pol_wache", lat: 48.7784, lng: 9.1795, town: "Stuttgart", initVehs: ["FuStW", "FuStW", "FuStW", "Zivil"] },
    { name: "Katharinenhospital (Klinikum)", type: "rd_kh", lat: 48.7830, lng: 9.1740, town: "Stuttgart", initVehs: ["NEF"] },
    { name: "Luftrettungszentrum Christoph 41", type: "luft_hub", lat: 48.6900, lng: 9.2200, town: "Stuttgart-Flugplatz", initVehs: ["RTH", "NEF"] },
    { name: "FF Waiblingen Mitte", type: "fw_ff", lat: 48.8330, lng: 9.3170, town: "Waiblingen", initVehs: ["ELW1", "HLF20", "LF20", "DLK", "RW", "GWL2"] },
    { name: "FF Korb", type: "fw_ff_klein", lat: 48.8319, lng: 9.3615, town: "Korb", initVehs: ["LF10", "TSFW", 'FR'] },
    { name: "Rems-Murr-Klinikum Wache", type: "rd_wache", lat: 48.8820, lng: 9.4020, town: "Winnenden", initVehs: ["RTW", "RTW", "NEF", "LNA"] },
    { name: "Rems-Murr-Klinikum Winnenden", type: "rd_kh", lat: 48.8825, lng: 9.4010, town: "Winnenden", initVehs: [] },
    { name: "THW OV Schorndorf", type: "thw_ov", lat: 48.8020, lng: 9.5150, town: "Schorndorf", initVehs: ["MTWTZ", "GKW", "MzGW"] }
];

const MISSIONS = [
	// --- FW ---
    { name: 'Mülleimerbrand', reqs: {'LF_Group': 1}, time: 300, orgs: ['fw'], reward: 800, xpReward: 15 },
	{ name: 'Fahrzeugbrand', reqs: {'LF_Group': 1}, time: 300, orgs: ['fw'], reward: 800, xpReward: 15 },
	{ name: 'Müllcontainerbrand', reqs: {'LF_Group': 1, 'TLF_Group': 1}, time: 300, orgs: ['fw'], reward: 800, xpReward: 15 },
	{ name: 'Heckenbrand', reqs: {'LF_Group': 1}, time: 300, orgs: ['fw'], reward: 800, xpReward: 15 },
	{ name: 'Wohnungsbrand', reqs: {'LF_Group': 3, 'DLK_Group': 1, 'ELW_Group': 1}, time: 800, orgs: ['fw'], reward: 1000, xpReward: 25 },
	{ name: 'Kellerbrand', reqs: {'LF_Group': 3, 'DLK_Group': 1, 'ELW_Group': 1}, time: 800, orgs: ['fw'], reward: 1000, xpReward: 25 },
    { name: 'Brennender PKW', reqs: {'LF_Group': 1, 'FuStW': 1}, time: 400, orgs: ['fw', 'pol'], reward: 1800, xpReward: 35 },
    { name: 'Zimmerbrand', reqs: {'ELW_Group': 1, 'LF_Group': 2, 'DLK_Group': 1, 'RTW_Group': 1, 'FuStW': 1}, time: 800, orgs: ['fw', 'rd'], reward: 4500, xpReward: 100 },
    { name: 'Dachstuhlbrand', reqs: {'ELW_Group': 1, 'LF_Group': 3, 'DLK_Group': 2, 'GWA': 1, 'RTW_Group': 1, 'FuStW': 2}, time: 1200, orgs: ['fw', 'rd'], reward: 8500, xpReward: 180 },
	{ name: 'Industriebrand', reqs: {'ELW_Group': 1, 'LF_Group': 10, 'DLK_Group': 2, 'GWA': 1, 'RTW_Group': 3, 'FuStW': 4, 'GWMESS': 1}, time: 1200, orgs: ['fw', 'rd'], reward: 8500, xpReward: 180 },
    { name: 'Waldbrand', reqs: {'ELW_Group': 1, 'LF_Group': 2, 'TLF_Group': 2, 'GWL_Group': 1}, time: 1500, orgs: ['fw'], reward: 7000, xpReward: 150 },

	// --- FW TH ---	
    { name: 'Verkehrsunfall (Eingeklemmt)', reqs: {'LF_Group': 1, 'RW_Group': 1, 'RTW_Group': 2, 'NEF': 1, 'FuStW': 2}, time: 900, orgs: ['fw', 'rd', 'pol'], reward: 5500, xpReward: 120 },
	{ name: 'Kleine Ölspur', reqs: {'HLF_Group': 1}, time: 300, orgs: ['fw'], reward: 800, xpReward: 15 },
	{ name: 'PKW verliert Betriebsstoffe', reqs: {'HLF_Group': 2}, time: 400, orgs: ['fw'], reward: 850, xpReward: 20 },
	{ name: 'Baum auf Staße', reqs: {'HLF_Group': 1}, time: 300, orgs: ['fw'], reward: 800, xpReward: 15 },
	{ name: 'Kleiner Ast auf Straße', reqs: {'HLF_Group': 1}, time: 300, orgs: ['fw'], reward: 800, xpReward: 15 },
	{ name: 'Türöffnung', reqs: {'HLF_Group': 1}, time: 300, orgs: ['fw'], reward: 800, xpReward: 15 },
	{ name: 'Person hinter Tür', reqs: {'HLF_Group': 1, 'RTW_Group':1}, time: 300, orgs: ['fw', 'rd], reward: 800, xpReward: 15 }
	// --- RD ---		
    { name: 'Herzinfarkt', reqs: {'RTW_Group': 1, 'NEF': 1}, time: 600, orgs: ['rd'], reward: 2500, xpReward: 50 },
    { name: 'Krankentransport', reqs: {'KTW': 1}, time: 400, orgs: ['rd'], reward: 600, xpReward: 10 },
    { name: 'MANV 25 (Busunfall)', reqs: {'ELW2': 1, 'LF_Group': 3, 'RW_Group': 1, 'RTW_Group': 6, 'KTWB': 2, 'NEF': 4, 'LNA': 1, 'OrgL': 1, 'GWSan': 1, 'FuStW': 4}, time: 2500, orgs: ['fw', 'rd', 'seg', 'pol'], reward: 28000, xpReward: 600 },	
	// --- POL ---	
    { name: 'Schlägerei (Groß)', reqs: {'FuStW': 4, 'GruKw': 1, 'RTW_Group': 2}, time: 700, orgs: ['pol', 'rd'], reward: 3500, xpReward: 80 },
    { name: 'Demonstration eskaliert', reqs: {'FuStW': 5, 'GefKw': 2, 'GruKw': 3, 'WaWe': 1, 'BeDoKw': 1, 'GWSan': 1, 'RTW_Group': 2}, time: 1200, orgs: ['pol', 'seg'], reward: 12000, xpReward: 250 },
	// --- THW ---		
    { name: 'Gebäudeeinsturz', reqs: {'ELW1': 1, 'LF_Group': 2, 'RW_Group': 1, 'MTWTZ': 1, 'GKW': 1, 'MzGW': 1, 'RTW_Group': 3, 'NEF': 2, 'FuStW': 2}, time: 1800, orgs: ['fw', 'thw', 'rd'], reward: 22000, xpReward: 450 },
	// --- BPOL ---
	{ name: 'Person auf Gleis', reqs: {'FuStW': 1}, time: 300, orgs: ['bpol'], reward: 800, xpReward: 15 }
];

const AAO_LIST = [
    { name: 'Löschzug (LZ)', reqs: {'ELW1': 1, 'HLF20': 2, 'DLK_Group': 1} },
    { name: 'Rüstzug (RZ)', reqs: {'ELW1': 1, 'HLF20': 1, 'RW_Group': 1} },
    { name: 'Gefahrstoffzug', reqs: {'ELW1': 1, 'HLF20': 1, 'GWG': 1, 'GWMess': 1, 'GWA': 1} },
    { name: 'Notfalleinsatz', reqs: {'RTW_Group': 1, 'NEF': 1} },
    { name: 'MANV 10', reqs: {'LNA': 1, 'OrgL': 1, 'RTW_Group': 4, 'NEF': 2, 'GWSan': 1} },
    { name: 'BePo Zug', reqs: {'GefKw': 1, 'GruKw': 3} },
    { name: 'Technischer Zug', reqs: {'MTWTZ': 1, 'GKW': 1, 'MzGW': 1} }
];

// --- STATE & ECONOMY ---
let simTime = new Date(); simTime.setHours(12, 0, 0, 0); 
let timeScale = 1; let lastRealTime = performance.now();
let stations = []; let missions = []; let globalVehicles = []; 
let buildMode = null; let stIdCtr = 1; let vIdCtr = 1; let mIdCtr = 1;
let activeDispatchMissionId = null;
let einsatzstop = false;
let lastAutoHireSimMs = simTime.getTime();

let settings = { design: 'standard', theme: 'dark', sound: 'on', mapstyle: 'streets' };

let credits = 25000000;
let xp = 0;

function updateEconomyUI() {
    document.getElementById('ui-credits').innerText = Math.floor(credits).toLocaleString('de-DE');
    document.getElementById('ui-xp').innerText = Math.floor(xp).toLocaleString('de-DE');
}

// --- MAP SETUP ---
let googleStreets = L.tileLayer('http://mt0.google.com/vt/lyrs=m&hl=de&x={x}&y={y}&z={z}', { maxZoom: 20, attribution: '&copy; Google Maps' });
let googleSatellite = L.tileLayer('http://mt0.google.com/vt/lyrs=s&hl=de&x={x}&y={y}&z={z}', { maxZoom: 20, attribution: '&copy; Google Maps' });
let googleHybrid = L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=de&x={x}&y={y}&z={z}', { maxZoom: 20, attribution: '&copy; Google Maps' });
let googleTerrain = L.tileLayer('http://mt0.google.com/vt/lyrs=p&hl=de&x={x}&y={y}&z={z}', { maxZoom: 20, attribution: '&copy; Google Maps' });

let currentMapLayer = googleStreets;
const map = L.map('map').setView([48.8319, 9.3615], 12); 
currentMapLayer.addTo(map);

// --- CORE FUNCTIONS ---
function getVehicleName(v, stObj) {
    if (v.customName && v.customName.trim() !== '') return v.customName;
    
    const vDef = VEHICLES[v.type];
    if (settings.design === 'bw') {
        let town = ORGS[vDef.org].funfname;
        if(vDef.org === 'luft') return `${town} ${stObj.town.substring(0,3).toUpperCase()} ${v.number}`;
        if (stObj && stObj.address) {
            let parts = stObj.address.split(',');
            if(parts.length > 1) { town += " " + parts[1].trim().split(' ')[0]; } 
            else { town += " " + stObj.name; }
        }
        if(v.type === 'WLF') return `${town} 1/${vDef.bw_name}-${v.number}`;
        if(vDef.isAB) return `AB-${vDef.name.replace('AB-','')} (${stObj.town})`;
        if(vDef.isAnh) return `Anhänger ${vDef.name.replace('Anh. ','')} (${stObj.town})`;
        return `${town} 1/${vDef.bw_name}-${v.number}`;
    } else return `${vDef.name} (${stObj.town}) - ${v.number}`;
}

function getFMS(status) {
    if(status === 'free') return 2;
    if(status === 'waiting_crew') return 6; 
    if(status === 'en_route_mission') return 3;
    if(status === 'working') return 4;
    if(status === 'transport_hospital') return 7;
    if(status === 'at_hospital') return 8;
    if(status === 'en_route_home') return 1;
    return 2;
}

function toggleEinsatzstop() {
    einsatzstop = !einsatzstop;
    const btn = document.getElementById('btn-einsatzstop');
    if(einsatzstop) {
        btn.innerText = "⏸️ Einsatzstop Aktiv";
        btn.classList.add('btn-stop'); btn.classList.add('active');
        showToast("⚠️ Einsatzgenerierung gestoppt.");
    } else {
        btn.innerText = "▶️ Einsätze Aktiv";
        btn.classList.remove('btn-stop'); btn.classList.remove('active');
        showToast("▶️ Einsatzgenerierung wieder aktiv.");
    }
}

// --- ROUTING (OSRM) ---
async function getOsrmRoute(lat1, lon1, lat2, lon2) {
    try {
        let res = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`);
        let data = await res.json();
        if(data.routes && data.routes[0]) {
            return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        }
    } catch(e) {}
    return [[lat1, lon1], [lat2, lon2]]; 
}

function prepareRouteData(coords) {
    let segments = [0]; let total = 0;
    for(let i=0; i<coords.length-1; i++) {
        let d = getDistance(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1]);
        total += d; segments.push(total);
    }
    return { coords, segments, totalDist: total };
}

function getPositionAlongRoute(routeData, progress) {
    if(progress <= 0 || !routeData.coords || routeData.coords.length === 0) return routeData.coords[0];
    if(progress >= 1) return routeData.coords[routeData.coords.length-1];
    
    let targetDist = progress * routeData.totalDist;
    for(let i=0; i<routeData.segments.length-1; i++) {
        if(targetDist >= routeData.segments[i] && targetDist <= routeData.segments[i+1]) {
            let segmentLength = routeData.segments[i+1] - routeData.segments[i];
            let segmentProgress = segmentLength === 0 ? 0 : (targetDist - routeData.segments[i]) / segmentLength;
            let p1 = routeData.coords[i], p2 = routeData.coords[i+1];
            return [ p1[0] + (p2[0] - p1[0]) * segmentProgress, p1[1] + (p2[1] - p1[1]) * segmentProgress ];
        }
    }
    return routeData.coords[routeData.coords.length-1];
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// --- SETTINGS ---
function openSettingsModal() {
    document.getElementById('setting-design').value = settings.design;
    document.getElementById('setting-theme').value = settings.theme;
    document.getElementById('setting-sound').value = settings.sound;
    document.getElementById('setting-mapstyle').value = settings.mapstyle || 'streets';
    document.getElementById('settings-modal').style.display = 'flex';
}

function updateSettings() {
    settings.design = document.getElementById('setting-design').value;
    settings.theme = document.getElementById('setting-theme').value;
    settings.sound = document.getElementById('setting-sound').value;
    settings.mapstyle = document.getElementById('setting-mapstyle').value;
    
    updateMapStyle();
    applyTheme(); 
    updateStationList();
    
    if(currentStId) openStationModal(currentStId); 
    if(activeDispatchMissionId) openDispatchModal(activeDispatchMissionId);
    if(document.getElementById('fms-modal').style.display === 'flex') updateFMSModal();
    if(document.getElementById('dispatch-modal').style.display === 'flex' && !activeDispatchMissionId) openFullDispatchModal();
}

function updateMapStyle() {
    map.removeLayer(currentMapLayer);
    const style = settings.mapstyle || 'streets';
    if (style === 'streets') currentMapLayer = googleStreets;
    else if (style === 'satellite') currentMapLayer = googleSatellite;
    else if (style === 'hybrid') currentMapLayer = googleHybrid;
    else if (style === 'terrain') currentMapLayer = googleTerrain;
    currentMapLayer.addTo(map);
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', settings.theme);
    updateDayNightCycle();
}

// --- TIME & LOOP ---
function setTimeScale(s) {
    timeScale = s;
    document.querySelectorAll('.time-controls .btn-nav').forEach(b => b.classList.remove('active'));
    document.getElementById('ts-' + s).classList.add('active');
    showToast(`Zeitbeschleunigung: ${s}x`);
}
function formatTime(d) {
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ':' + d.getSeconds().toString().padStart(2, '0');
}

function gameLoop(currentTime) {
    let deltaReal = currentTime - lastRealTime; lastRealTime = currentTime;
    let deltaSim = deltaReal * timeScale;
    simTime = new Date(simTime.getTime() + deltaSim);
    document.getElementById('clock').innerText = formatTime(simTime);
    
    updateWeather();
    updateDayNightCycle();

    if(simTime.getTime() - lastAutoHireSimMs >= 86400000) {
        lastAutoHireSimMs = simTime.getTime();
        processAutoHiring();
    }

    updateVehicles(deltaSim);
    updateMissions(deltaSim);
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// --- DAILY UPKEEP & AUTO HIRING ---
function processAutoHiring() {
    stations.forEach(st => {
        if(st.hireMode === 'auto' && !st.type.startsWith('school_') && st.type !== 'rd_kh') {
            let gain = 1;
            if(st.youthActive) gain += 2; 
            st.staff += gain;
        }
    });

    let dailyUpkeep = 0;
    globalVehicles.forEach(v => {
        let vDef = VEHICLES[v.type];
        dailyUpkeep += vDef.upkeep || 150; 
    });

    if(dailyUpkeep > 0) {
        credits -= dailyUpkeep;
        updateEconomyUI();

        if(credits < 0) {
            showToast(`⚠️ ACHTUNG: Du bist pleite! (-${dailyUpkeep} Cr)`);
        } else {
            showToast(`📅 Tagesabrechnung: -${dailyUpkeep.toLocaleString('de-DE')} Cr für Fahrzeuginstandhaltung.`);
        }
    }

    if(currentStId) {
        let st = stations.find(s=>s.id===currentStId);
        if(st && document.getElementById('station-staff-count')) document.getElementById('station-staff-count').innerText = `${st.staff} Mitarbeiter`;
    }
}

async function fetchAddress(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        if(data && data.address) {
            let road = data.address.road || data.address.pedestrian || data.address.suburb || "Unbekannte Straße";
            let city = data.address.city || data.address.town || data.address.village || data.address.county || "Unbekannter Ort";
            return { full: `${road}, ${city}`, town: city };
        }
    } catch(e) {}
    return { full: "Adresse unbekannt", town: "Unbekannt" };
}

// --- BUILD ---
function setBuildMode(type, btn) {
    initAudio(); 
    document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('build-active'));
    if(buildMode === type) { buildMode = null; document.getElementById('map').style.cursor = ''; }
    else { buildMode = type; btn.classList.add('build-active'); document.getElementById('map').style.cursor = 'crosshair'; showToast('Klicke auf die Karte, um zu bauen.'); }
}

map.on('click', async function(e) {
    if(!buildMode) return;
    const typeDef = STATION_TYPES[buildMode];
    let cost = typeDef.buildCost || 250000;

    if(credits < cost) {
        showToast(`❌ Nicht genug Credits! Du benötigst ${cost.toLocaleString('de-DE')} Cr.`);
        buildMode = null; document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('build-active')); document.getElementById('map').style.cursor = '';
        return;
    }

    credits -= cost;
    updateEconomyUI();

    const lat = e.latlng.lat, lng = e.latlng.lng;
    
    const st = { 
        id: stIdCtr++, type: buildMode, lat: lat, lng: lng, 
        name: typeDef.name + ' ' + stIdCtr, address: 'Laden...', town: 'Laden', 
        vehicles: [], staff: typeDef.initStaff || 10, hireMode: 'auto', youthActive: false,
        qualifications: {} 
    };
    stations.push(st);
    createStationMarker(st);
    
    buildMode = null; document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('build-active')); document.getElementById('map').style.cursor = '';
    updateStationList(); showToast(`${st.name} gebaut! (-${cost.toLocaleString('de-DE')} Cr)`);
    
    let addr = await fetchAddress(lat, lng);
    st.address = addr.full; st.town = addr.town;
    updateStationList();
});

function createStationMarker(st) {
    const typeDef = STATION_TYPES[st.type];
    let sIcon = typeDef.icon;
    if(st.type === 'rd_kh') sIcon = '🏥';

    const icon = L.divIcon({ html: `<div style="font-size:24px; text-shadow: 0 0 5px #000;">${sIcon}</div>`, className: '', iconSize: [30,30] });
    st.marker = L.marker([st.lat, st.lng], {icon: icon}).addTo(map);
    
    if(st.type === 'rd_kh') {
        st.marker.bindPopup(`<b>${st.name}</b><br>Nimmt Patienten auf.`);
    } else {
        st.marker.on('click', () => openStationModal(st.id));
    }
}

function updateStationList() {
    const list = document.getElementById('station-list'); list.innerHTML = '';
    document.getElementById('station-count').innerText = stations.length;
    stations.forEach(st => {
        const div = document.createElement('div'); div.className = 'list-item'; 
        let borderColor = ORGS[STATION_TYPES[st.type].org]?.color || '#fff';
        if(st.type === 'rd_kh') borderColor = 'var(--color-hospital)';
        div.style.borderLeftColor = borderColor;
        
        let extra = st.type === 'rd_kh' || st.type.startsWith('school_') ? '' : `<span>Personal: 👥 ${st.staff}</span>`;

        div.innerHTML = `<strong>${STATION_TYPES[st.type].icon} ${st.name}</strong>
            <div class="list-address">${st.address}</div>
            <div class="staff-info">
                <span>Fahrzeuge: ${st.vehicles.length}</span>
                ${extra}
            </div>`;
        
        div.onclick = () => { 
            map.flyTo([st.lat, st.lng], 15); 
            if(st.type !== 'rd_kh') openStationModal(st.id); 
        };
        list.appendChild(div);
    });
}

// --- STATION MODAL ---
let currentStId = null;
function openStationModal(id) {
    currentStId = id; const st = stations.find(s => s.id === id);
    if(st.type === 'rd_kh') return;

    document.getElementById('station-modal-title').innerText = st.name;
    document.getElementById('station-modal-address').innerText = st.address;
    
    if(st.type.startsWith('school_')) {
        document.getElementById('staff-panel').style.display = 'none';
    } else {
        document.getElementById('staff-panel').style.display = 'block';
        document.getElementById('station-staff-count').innerText = `${st.staff} Mitarbeiter`;
        document.getElementById('station-hire-mode').value = st.hireMode;
        document.getElementById('station-youth-status').innerText = st.youthActive ? "🟢 Aktiv" : "🔴 Inaktiv";
    }

    renderStationVehicles(st);
    
    const shop = document.getElementById('station-shop-list'); shop.innerHTML = '';
    if(STATION_TYPES[st.type].vehicles.length === 0) {
        document.getElementById('shop-title').style.display = 'none';
    } else {
        document.getElementById('shop-title').style.display = 'block';
        STATION_TYPES[st.type].vehicles.forEach(vKey => {
            const vDef = VEHICLES[vKey]; const div = document.createElement('div'); div.className = 'vehicle-shop-item';
            let imgFallback = vDef.isAB ? '📦' : (vDef.isAnh ? '🪝' : (vDef.isAir ? '🚁' : '🚗'));
            if(vDef.org === 'fw' && !vDef.isAB) imgFallback = '🚒';
            if(vDef.org === 'rd' && !vDef.isAir) imgFallback = '🚑';
            if(vDef.org === 'pol') imgFallback = '🚓';
            
            let p = vDef.price || 50000;

            div.innerHTML = `
                <div style="display:flex; align-items:center;">
                    <div class="vehicle-shop-img" style="font-size:18px; text-align:center;">${imgFallback}</div>
                    <div>
                        <strong>${vDef.name}</strong><br>
                        <small style="color:var(--text-muted)">👥 ${vDef.crew} Pers. ${vDef.reqQual ? '| 🎓 ' + vDef.reqQual : ''}</small><br>
                        <small style="color:var(--color-success); font-weight:bold;">💰 ${p.toLocaleString('de-DE')} Cr</small>
                    </div>
                </div>
                <button class="btn-buy" onclick="buyVehicle('${vKey}')">Kaufen</button>
            `;
            shop.appendChild(div);
        });
    }
    document.getElementById('station-modal').style.display = 'flex';
}

function toggleHireMode() {
    if(!currentStId) return;
    let st = stations.find(s=>s.id===currentStId);
    st.hireMode = document.getElementById('station-hire-mode').value;
    showToast(`Rekrutierungs-Modus geändert.`);
}

function hireStaffManual() {
    if(!currentStId) return;
    let cost = 5000;
    if(credits < cost) { showToast("❌ Nicht genug Credits!"); return; }
    credits -= cost; updateEconomyUI();

    let st = stations.find(s=>s.id===currentStId);
    st.staff += 5;
    document.getElementById('station-staff-count').innerText = `${st.staff} Mitarbeiter`;
    updateStationList();
    showToast(`+5 Mitarbeiter angeworben (-${cost} Cr)!`);
}

function toggleYouthSection() {
    if(!currentStId) return;
    let st = stations.find(s=>s.id===currentStId);
    if(!st.youthActive) {
        let cost = 25000;
        if(credits < cost) { showToast("❌ Nicht genug Credits!"); return; }
        credits -= cost; updateEconomyUI();
        st.youthActive = true;
        showToast("Jugendfeuerwehr/Nachwuchs gegründet (-25.000 Cr)!");
    } else {
        st.youthActive = false;
        showToast("Jugendabteilung pausiert.");
    }
    document.getElementById('station-youth-status').innerText = st.youthActive ? "🟢 Aktiv (Erhöht Nachwuchs)" : "🔴 Inaktiv";
}

function renderStationVehicles(st) {
    const list = document.getElementById('station-vehicles-list');
    document.getElementById('station-veh-count').innerText = st.vehicles.length;
    if(st.vehicles.length === 0) { list.innerHTML = '<i>Keine Fahrzeuge vorhanden.</i>'; return; }
    
    list.innerHTML = st.vehicles.map(vId => {
        const v = globalVehicles.find(gv => gv.id === vId);
        let fms = getFMS(v.status);
        let statTxt = '🟢 Auf Wache';
        if(v.status === 'waiting_crew') statTxt = '🟡 Personal alarmiert';
        else if(v.status === 'en_route_mission') statTxt = '🔵 Anfahrt Einsatz';
        else if(v.status === 'working') statTxt = '🔴 Im Einsatz';
        else if(v.status === 'transport_hospital') statTxt = '🔵 Transport (Klinik)';
        else if(v.status === 'at_hospital') statTxt = '🟣 Am Krankenhaus';
        else if(v.status === 'en_route_home') statTxt = '🟢 Rückfahrt (Frei)';
        
        return `<div style="background:var(--bg-hover); padding:8px; border-radius:4px; display:flex; justify-content:space-between; border: 1px solid var(--border-color); align-items:center;">
            <span><span class="fms-status-box fms-stat-${fms}" style="display:inline-flex; width:20px; height:20px; font-size:0.8rem; margin-right:10px;">${fms}</span> ${getVehicleName(v, st)} <small style="color:var(--text-muted); margin-left:10px;">(👥 ${VEHICLES[v.type].crew})</small></span> 
            <div style="display:flex; align-items:center; gap: 10px;">
                <span>${statTxt}</span>
                <button class="btn-nav" style="padding: 3px 8px;" onclick="openVehicleEditModal(${v.id})" title="Fahrzeug bearbeiten">✏️</button>
            </div>
        </div>`;
    }).join('');
}

function buyVehicle(type) {
    const st = stations.find(s => s.id === currentStId);
    const vDef = VEHICLES[type];
    const price = vDef.price || 50000;
    
    if(credits < price) {
        showToast("❌ Nicht genug Credits!");
        return;
    }
    
    credits -= price;
    updateEconomyUI();

    let countOfSameType = st.vehicles.map(vid => globalVehicles.find(x=>x.id===vid)).filter(x=>x.type === type).length;
    
    const v = { 
        id: vIdCtr++, stId: st.id, type: type, number: countOfSameType + 1,
        status: 'free', lat: st.lat, lng: st.lng, missionId: null, 
        travelStartMs: 0, travelDurationMs: 0, marker: null, crewReadyMs: 0,
        route: null,
        installedUpgrades: [] // NEU: Upgrade Speicher
    };
    globalVehicles.push(v); st.vehicles.push(v.id);
    renderStationVehicles(st); updateStationList(); showToast(`${VEHICLES[type].name} gekauft! (-${price.toLocaleString('de-DE')} Cr)`);
}

function createVehicleMarker(v) {
    if(v.marker) return;
    const vDef = VEHICLES[v.type];
    if(vDef.isAB || vDef.isAnh) return;

    const color = v.status === 'en_route_home' ? 'var(--color-return)' : (v.status === 'transport_hospital' ? 'var(--color-hospital)' : ORGS[vDef.org].color); 
    const isAir = vDef.isAir;
    
    let cssClass = 'marker-normal'; 
    if(v.status === 'en_route_mission') cssClass = 'marker-blaulicht';
    if(v.status === 'transport_hospital') cssClass = 'marker-hospital';
    if(v.status === 'en_route_home') cssClass = 'marker-rückfahrt';
    if(v.status === 'waiting_crew') cssClass = 'blink-6';

    if(v.customImage) {
        let icon = L.divIcon({ 
            html: `<img src="${v.customImage}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">`, 
            className: cssClass + ' custom-veh-icon', 
            iconSize: [28, 28] 
        });
        v.marker = L.marker([v.lat, v.lng], {icon: icon}).addTo(map);
    } else {
        v.marker = L.circleMarker([v.lat, v.lng], { radius: isAir ? 8 : 6, color: '#000', weight: 1, fillColor: color, fillOpacity: 1, className: cssClass }).addTo(map);
    }
    v.marker.bindPopup(`<b>${getVehicleName(v, stations.find(s=>s.id===v.stId))}</b><br>Status: ${getFMS(v.status)}`);
}

// --- PRESETS MODAL (REAL STATIONS) ---
function openPresetsModal() {
    const cont = document.getElementById('presets-container');
    cont.innerHTML = '';
    
    PRESET_STATIONS.forEach(p => {
        let div = document.createElement('div');
        div.className = 'vehicle-shop-item';
        div.innerHTML = `
            <div>
                <strong>${p.name}</strong><br>
                <small style="color:var(--text-muted);">${p.town} | Fuhrpark: ${p.initVehs.join(', ')}</small>
            </div>
            <button class="btn-buy" onclick="buildPresetStation('${p.name}')">Bauen (Kostenlos für Tests)</button>
        `;
        cont.appendChild(div);
    });
    document.getElementById('presets-modal').style.display = 'flex';
}

async function buildPresetStation(presetName) {
    const p = PRESET_STATIONS.find(x=>x.name === presetName);
    if(!p) return;
    
    const typeDef = STATION_TYPES[p.type];
    const st = { 
        id: stIdCtr++, type: p.type, lat: p.lat, lng: p.lng, 
        name: p.name, address: p.town, town: p.town, 
        vehicles: [], staff: typeDef.initStaff || 30, hireMode: 'auto', youthActive: true,
        qualifications: { 'Atemschutz': 15, 'Notarzt': 5, 'Zugführer': 5, 'Drehleitermaschinist': 5 }
    };
    stations.push(st);
    createStationMarker(st);
    
    p.initVehs.forEach(vType => {
        let countOfSameType = st.vehicles.map(vid => globalVehicles.find(x=>x.id===vid)).filter(x=>x.type === vType).length;
        let v = {
            id: vIdCtr++, stId: st.id, type: vType, number: countOfSameType + 1,
            status: 'free', lat: st.lat, lng: st.lng, missionId: null,
            travelStartMs: 0, travelDurationMs: 0, marker: null, crewReadyMs: 0, route: null,
            installedUpgrades: [] // NEU: Upgrade Speicher
        };
        globalVehicles.push(v);
        st.vehicles.push(v.id);
    });

    let addr = await fetchAddress(p.lat, p.lng);
    st.address = addr.full; st.town = addr.town;
    
    updateStationList();
    showToast(`${st.name} erfolgreich gebaut!`);
    closeModal('presets-modal');
    map.flyTo([p.lat, p.lng], 14);
}

// --- SCHOOLS & COURSES MODAL ---
function openSchoolsModal() {
    const cont = document.getElementById('schools-container');
    cont.innerHTML = '';
    
    let schools = stations.filter(s => s.type.startsWith('school_'));
    if(schools.length === 0) {
        cont.innerHTML = `
            <div style="background:var(--bg-hover); padding:15px; border-radius:6px; border:1px solid var(--border-color);">
                <strong>Keine Schulen vorhanden!</strong><br>
                Baue im Bauwesen-Menü unter "Ausbildung & Schulen" eine Feuerwehrschule, Rettungsdienstschule etc., um Personal auf Lehrgänge zu schicken!
            </div>
        `;
    } else {
        schools.forEach(sc => {
            let html = `<div class="box-panel">
                <div class="box-title">
                    <span>${STATION_TYPES[sc.type].icon} ${sc.name} (${sc.town})</span>
                </div>
                <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">`;
            
            COURSES.filter(c => ORGS[c.org].color === ORGS[STATION_TYPES[sc.type].org]?.color || c.org === STATION_TYPES[sc.type].org).forEach(course => {
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-base); padding:8px; border-radius:4px; font-size:0.85rem;">
                        <div>
                            <strong>${course.name}</strong><br>
                            <small style="color:var(--text-muted)">Dauer: ${course.durationDays} Tage | Kosten: ${course.cost} Cr</small>
                        </div>
                        <button class="btn-action" onclick="startCourse('${sc.id}', '${course.id}')">Lehrgang starten</button>
                    </div>
                `;
            });

            html += `</div></div>`;
            cont.innerHTML += html;
        });
    }
    document.getElementById('schools-modal').style.display = 'flex';
}

function startCourse(schoolId, courseId) {
    let course = COURSES.find(c => c.id === courseId);
    if(credits < course.cost) { showToast("❌ Nicht genug Credits für den Lehrgang!"); return; }

    let eligibleStations = stations.filter(s => !s.type.startsWith('school_') && s.type !== 'rd_kh' && s.staff >= 5);
    if(eligibleStations.length === 0) { alert("Keine Wache mit mindestens 5 freien Mitarbeitern vorhanden!"); return; }
    
    credits -= course.cost; updateEconomyUI();

    let st = eligibleStations[Math.floor(Math.random()*eligibleStations.length)]; 
    if(!st.qualifications) st.qualifications = {};
    st.qualifications[courseId] = (st.qualifications[courseId] || 0) + 3; 
    showToast(`3 Mitarbeiter von ${st.name} zum Lehrgang '${courseId}' entsandt! (-${course.cost} Cr)`);
}

// --- FMS MODAL ---
function openFMSModal() {
    updateFMSModal();
    document.getElementById('fms-modal').style.display = 'flex';
}

function updateFMSModal() {
    const cont = document.getElementById('fms-container');
    cont.innerHTML = '';
    if(stations.length === 0) { cont.innerHTML = "Keine Wachen vorhanden."; return; }
    
    stations.forEach(st => {
        if(st.vehicles.length === 0 || st.type.startsWith('school_') || st.type === 'rd_kh') return;
        let html = `<div class="fms-card">
            <div class="fms-card-header" style="background:${ORGS[STATION_TYPES[st.type].org].color}44">${st.name} (${st.town})</div>`;
        
        st.vehicles.forEach(vid => {
            let v = globalVehicles.find(x=>x.id===vid);
            let fms = getFMS(v.status);
            let vName = getVehicleName(v, st);
            let dest = v.status === 'free' ? 'Wache' : (v.status === 'en_route_home' ? 'Rückfahrt' : (v.missionId ? 'Einsatz' : ''));
            if(v.status === 'waiting_crew') dest = 'Wartet auf Personal';
            if(v.status === 'transport_hospital') dest = 'Krankentransport';
            if(v.status === 'at_hospital') dest = 'Am Krankenhaus';
            
            html += `<div class="fms-vehicle">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="fms-status-box fms-stat-${fms}">${fms}</div>
                    <strong>${vName}</strong>
                </div>
                <span style="color:var(--text-muted); font-size:0.8rem;">${dest}</span>
            </div>`;
        });
        html += `</div>`;
        cont.innerHTML += html;
    });
}
setInterval(() => { if(document.getElementById('fms-modal').style.display === 'flex') updateFMSModal(); }, 2000);

// --- MISSIONS ---
setInterval(spawnMission, 25000); 

// NEU: Upgrade Hilfsfunktion
function vehicleSatisfiesReq(v, reqKey) {
    if (GROUPS[reqKey] && GROUPS[reqKey].includes(v.type)) return true;
    if (v.type === reqKey) return true;
    
    if (v.installedUpgrades && v.installedUpgrades.length > 0) {
        const vDef = VEHICLES[v.type];
        for (let upgKey of v.installedUpgrades) {
            if (vDef.possibleUpgrades && vDef.possibleUpgrades[upgKey] && vDef.possibleUpgrades[upgKey].provides === reqKey) {
                return true;
            }
        }
    }
    return false;
}

// ÜBERARBEITET: Nutzt nun die Hilfsfunktion
function fleetHasReqs(reqs) {
    for(let reqKey in reqs) {
        let needed = reqs[reqKey]; 
        let count = globalVehicles.filter(v => vehicleSatisfiesReq(v, reqKey)).length;
        if(count < needed) return false;
    }
    return true;
}

async function spawnMission() {
    if(einsatzstop) return; 
    if(stations.length === 0) return;
    
    let maxMissions = Math.max(5, stations.length * 3);
    if(missions.filter(m => m.status !== 'done').length >= maxMissions) return;
    
    let possibleMissions = MISSIONS.filter(m => fleetHasReqs(m.reqs));
    if(possibleMissions.length === 0) return;

    const validSts = stations.filter(s=>!s.type.startsWith('school_') && s.type !== 'rd_kh');
    if(validSts.length === 0) return;
    const st = validSts[Math.floor(Math.random() * validSts.length)];

    const def = possibleMissions[Math.floor(Math.random() * possibleMissions.length)];
    
    const r = 0.01 + Math.random() * 0.04; const theta = Math.random() * 2 * Math.PI;
    const lat = st.lat + r * Math.cos(theta); const lng = st.lng + r * Math.sin(theta);
    
    const m = {
        id: mIdCtr++, name: def.name, lat: lat, lng: lng, address: 'Laden...',
        reqs: JSON.parse(JSON.stringify(def.reqs)), assignedVehicles: [],
        status: 'new', workTimeRemaining: def.time * 1000, missingText: '',
        reward: def.reward, xpReward: def.xpReward
    };
    
    const mIcon = L.divIcon({ html: '🔥', className: '', iconSize: [24,24] });
    m.marker = L.marker([lat, lng], {icon: mIcon}).addTo(map);
    m.marker.on('click', () => openDispatchModal(m.id));
    
    missions.push(m); updateMissionList(); soundAlarm(); showToast(`🚨 NEUER EINSATZ: ${m.name}`);
    let addr = await fetchAddress(lat, lng);
    m.address = addr.full; updateMissionList();
    if(activeDispatchMissionId === m.id) document.getElementById('dispatch-modal-address').innerText = m.address;
}

function formatMissing(m) {
    if(!m.missingText) return '';
    return `<div class="missing-text">Wartet auf: ${m.missingText}</div>`;
}

function updateMissionList() {
    const list = document.getElementById('mission-list'); list.innerHTML = '';
    let activeMissions = missions.filter(m => m.status !== 'done');
    document.getElementById('mission-count').innerText = activeMissions.length;
    if(activeMissions.length === 0) { list.innerHTML = '<div style="color:var(--text-muted); text-align:center;">Keine offenen Einsätze</div>'; return; }
    
    activeMissions.forEach(m => {
        const div = document.createElement('div'); div.className = 'list-item';
        div.style.borderLeftColor = m.status === 'working' ? 'var(--color-success)' : 'var(--org-fw)';
        let statusBadge = '';
        if(m.status === 'new') statusBadge = '<span style="color:var(--color-danger)">🔴 Braucht Fahrzeuge</span>';
        else if(m.status === 'waiting_units') statusBadge = '<span style="color:var(--color-warning)">🟡 Fahrzeuge fehlen/auf Anfahrt</span>';
        else if(m.status === 'working') statusBadge = '<span style="color:var(--color-success)">🟢 In Bearbeitung</span>';

        div.innerHTML = `<strong>${m.name}</strong><br><div class="list-address">📍 ${m.address}</div><small>${statusBadge}</small>${formatMissing(m)}`;
        div.onclick = () => { map.flyTo([m.lat, m.lng], 15); openDispatchModal(m.id); };
        list.appendChild(div);
    });
}

function translateReq(reqKey) {
    if(GROUPS[reqKey]) {
        if(reqKey === 'LF_Group') return 'Löschfahrzeug (LF/HLF/MLF/TSF)';
        if(reqKey === 'TLF_Group') return 'Tanklöschfahrzeug';
        if(reqKey === 'ELW_Group') return 'Führungsfahrzeug (KdoW/ELW)';
        if(reqKey === 'RW_Group') return 'Rüstfahrzeug (RW/HLF/VRW)';
        if(reqKey === 'DLK_Group') return 'Hubrettungsfahrzeug (DLK/TM)';
        if(reqKey === 'GWL_Group') return 'Logistik (GW-L/GW-T)';
        if(reqKey === 'RTW_Group') return 'Rettungswagen (RTW/NAW)';
    }
    return VEHICLES[reqKey] ? VEHICLES[reqKey].name : reqKey;
}

function openFullDispatchModal() {
    activeDispatchMissionId = null;
    document.getElementById('dispatch-modal-title').innerText = "Gesamte Fahrzeugübersicht";
    document.getElementById('dispatch-modal-address').innerText = "Freie Alarmierung ohne Einsatz";
    document.getElementById('dispatch-reqs').innerText = "Freie Auswahl";
    document.getElementById('dispatch-assigned').style.display = 'none';
    document.getElementById('aao-container').innerHTML = '';
    
    const list = document.getElementById('dispatch-vehicle-list'); list.innerHTML = '';
    let allFree = globalVehicles.filter(v => v.status === 'free');
    
    if(allFree.length === 0) { list.innerHTML = '<div style="padding:15px; color:var(--org-fw); font-weight:bold;">Keine freien Fahrzeuge verfügbar!</div>'; }
    else {
        allFree.forEach(v => {
            const st = stations.find(s => s.id === v.stId);
            const vDef = VEHICLES[v.type]; const div = document.createElement('label'); div.className = 'dispatch-row';
            let stIcon = STATION_TYPES[st.type].delay ? '🏠' : '🏢'; 
            div.innerHTML = `
                <input type="checkbox" class="disp-cb" data-vid="${v.id}" disabled>
                <div class="v-name"><span class="badge" style="background:${ORGS[vDef.org].color}">${vDef.org.toUpperCase()}</span> ${getVehicleName(v, st)} <small style="color:var(--text-muted)">(👥 ${vDef.crew})</small></div>
                <div class="v-station">${stIcon} ${st.name}</div>
                <div class="v-dist">-</div>
            `;
            list.appendChild(div);
        });
    }
    
    document.getElementById('btn-do-dispatch').disabled = true;
    document.getElementById('dispatch-modal').style.display = 'flex';
}

function openDispatchModal(mId) {
    const m = missions.find(x => x.id === mId); if(m.status === 'done') return;
    activeDispatchMissionId = mId;
    document.getElementById('dispatch-modal-title').innerText = m.name;
    document.getElementById('dispatch-modal-address').innerText = m.address;
    document.getElementById('btn-do-dispatch').disabled = false;
    
    let reqArr = [];
    for(let key in m.reqs) reqArr.push(`${m.reqs[key]}x ${translateReq(key)}`);
    document.getElementById('dispatch-reqs').innerText = reqArr.length > 0 ? reqArr.join(', ') : 'Keine spezifischen Anforderungen mehr.';
    
    const assignedContainer = document.getElementById('dispatch-assigned');
    const assignedList = document.getElementById('dispatch-assigned-list');
    assignedList.innerHTML = '';
    if(m.assignedVehicles.length > 0) {
        assignedContainer.style.display = 'block';
        m.assignedVehicles.forEach(vId => {
            const v = globalVehicles.find(x => x.id === vId);
            if(v) {
                let li = document.createElement('li');
                let stxt = v.status === 'working' ? '✅ Vor Ort' : (v.status === 'transport_hospital' ? '🏥 Patiententransport' : '⏳ Auf Anfahrt');
                li.innerText = `${getVehicleName(v, stations.find(s=>s.id===v.stId))} - ${stxt}`;
                assignedList.appendChild(li);
            }
        });
    } else { assignedContainer.style.display = 'none'; }

    const aaoContainer = document.getElementById('aao-container'); aaoContainer.innerHTML = '';
    AAO_LIST.forEach(aao => {
        const btn = document.createElement('button'); btn.className = 'btn-aao';
        btn.innerHTML = `<span style="color:var(--text-muted)">■</span> ${aao.name}`;
        btn.onclick = () => triggerAAO(aao.reqs); aaoContainer.appendChild(btn);
    });

    renderDispatchVehicleList(m);
    document.getElementById('dispatch-modal').style.display = 'flex';
}

let sortedDispatchVehicles = [];

function renderDispatchVehicleList(m) {
    const list = document.getElementById('dispatch-vehicle-list'); list.innerHTML = '';
    sortedDispatchVehicles = globalVehicles.filter(v => v.status === 'free').map(v => {
        const st = stations.find(s => s.id === v.stId);
        const distKm = getDistance(st.lat, st.lng, m.lat, m.lng);
        const vDef = VEHICLES[v.type];
        let timeMins = Math.ceil((distKm / (vDef.speed * currentWeather.speedMod)) * 60);
        
        let delayMins = STATION_TYPES[st.type].delay ? 3 : 0;
        timeMins += delayMins;
        
        let hasStaff = st.staff >= vDef.crew;
        
        return { vObj: v, stObj: st, distKm, timeMins, isAir: !!vDef.isAir, isAB: !!vDef.isAB, isAnh: !!vDef.isAnh, hasStaff };
    });
    
    sortedDispatchVehicles.sort((a, b) => a.timeMins - b.timeMins);
    if(sortedDispatchVehicles.length === 0) { list.innerHTML = '<div style="padding:15px; color:var(--org-fw); font-weight:bold;">Keine freien Fahrzeuge verfügbar!</div>'; return; }
    
    sortedDispatchVehicles.forEach(item => {
        const vDef = VEHICLES[item.vObj.type]; const div = document.createElement('label'); div.className = 'dispatch-row';
        let stIcon = STATION_TYPES[item.stObj.type].delay ? '🏠' : '🏢'; 
        let fms = getFMS(item.vObj.status);
        let checkDisabled = (item.isAB || item.isAnh || !item.hasStaff) ? 'disabled title="Nur mit Personal / Zugfahrzeug alarmierbar"' : '';
        let staffWarning = !item.hasStaff ? '<span style="color:var(--color-danger); font-size:0.75rem; margin-left:5px;">⚠️ Zu wenig Personal auf Wache</span>' : '';

        div.innerHTML = `
            <input type="checkbox" class="disp-cb" data-vid="${item.vObj.id}" ${checkDisabled}>
            <div class="v-name">
                <span class="fms-status-box fms-stat-${fms}" style="display:inline-flex; width:18px;height:18px;font-size:0.75rem;">${fms}</span>
                ${vDef.img ? `<img src="${vDef.img}" style="height:20px; width:30px; object-fit:contain; background:#fff; border-radius:3px; padding:1px;">` : `<span class="badge" style="background:${ORGS[vDef.org].color}">${vDef.org.toUpperCase()}</span>`}
                ${getVehicleName(item.vObj, item.stObj)} <small style="color:var(--text-muted)">(👥 ${vDef.crew})</small> ${staffWarning}
            </div>
            <div class="v-station">${stIcon} ${item.stObj.name}</div>
            <div class="v-dist">${item.timeMins} Min.</div>
        `;
        div.querySelector('input').addEventListener('change', function() { if(this.checked) div.classList.add('selected'); else div.classList.remove('selected'); });
        list.appendChild(div);
    });
}

// ÜBERARBEITET: Nutzt nun die Hilfsfunktion für Upgrades
function triggerAAO(reqs) {
    const checkboxes = document.querySelectorAll('.disp-cb:not(:disabled)');
    checkboxes.forEach(cb => { cb.checked = false; cb.parentElement.classList.remove('selected'); });
    let tempReqs = JSON.parse(JSON.stringify(reqs));
    
    checkboxes.forEach(cb => {
        const vId = parseInt(cb.getAttribute('data-vid')); 
        const vItem = sortedDispatchVehicles.find(x => x.vObj.id === vId);
        if(!vItem) return; 
        
        let matchedKey = null;
        for(let r in tempReqs) {
            if(tempReqs[r] > 0 && vehicleSatisfiesReq(vItem.vObj, r)) { 
                matchedKey = r; 
                break; 
            }
        }

        if(matchedKey) { 
            cb.checked = true; 
            cb.parentElement.classList.add('selected'); 
            tempReqs[matchedKey]--; 
        }
    });
}

async function sendVehicles() {
    const m = missions.find(x => x.id === activeDispatchMissionId); if(!m) return;
    const checkboxes = document.querySelectorAll('.disp-cb:checked');
    if(checkboxes.length === 0) { alert("Bitte Fahrzeuge auswählen!"); return; }
    
    const btn = document.getElementById('btn-do-dispatch');
    btn.disabled = true; btn.innerText = "⏳ Berechne Routen...";
    
    let selected = [];
    checkboxes.forEach(cb => {
        let vId = parseInt(cb.getAttribute('data-vid'));
        selected.push(sortedDispatchVehicles.find(x => x.vObj.id === vId));
    });
    
    let routesCache = {};
    for(let item of selected) {
        if(item.isAir) {
            routesCache[item.stObj.id] = prepareRouteData([[item.stObj.lat, item.stObj.lng], [m.lat, m.lng]]);
        } else if(!routesCache[item.stObj.id]) {
            let coords = await getOsrmRoute(item.stObj.lat, item.stObj.lng, m.lat, m.lng);
            routesCache[item.stObj.id] = prepareRouteData(coords);
        }
    }

    let count = 0;
    for(let item of selected) {
        let v = item.vObj;
        v.missionId = m.id;
        v.route = routesCache[item.stObj.id];
        
        let isDelayed = STATION_TYPES[item.stObj.type].delay;
        let actualDuration = (v.route.totalDist / (VEHICLES[v.type].speed * currentWeather.speedMod)) * 60 * 60000;
        
        if(isDelayed) {
            v.status = 'waiting_crew';
            let delayMs = (Math.random() * 2 + 1) * 60000; 
            v.crewReadyMs = simTime.getTime() + delayMs;
            v.travelDurationMs = actualDuration;
        } else {
            v.status = 'en_route_mission';
            v.travelStartMs = simTime.getTime();
            v.travelDurationMs = actualDuration;
            createVehicleMarker(v);
            if(v.marker) { 
                let iconNode = v.marker._path || v.marker._icon;
                L.DomUtil.removeClass(iconNode, 'marker-normal'); 
                L.DomUtil.removeClass(iconNode, 'blink-6'); 
                L.DomUtil.removeClass(iconNode, 'marker-rückfahrt'); 
                L.DomUtil.addClass(iconNode, 'marker-blaulicht'); 
            }
        }
        m.assignedVehicles.push(v.id); count++;
    }
    
    if(m.status === 'new') m.status = 'waiting_units';
    soundSiren(); showToast(`${count} Fahrzeuge alarmiert!`); 
    
    btn.disabled = false; btn.innerText = "🚨 Ausgewählte Fahrzeuge alarmieren";
    closeModal('dispatch-modal'); updateMissionList();
}

// --- UPDATE LOOP (VEHICLES & MISSIONS) ---
function updateVehicles(deltaSimMs) {
    const now = simTime.getTime();
    
    globalVehicles.forEach(v => {
        if(v.status === 'waiting_crew') {
            if(now >= v.crewReadyMs) {
                v.status = 'en_route_mission'; v.travelStartMs = now;
                createVehicleMarker(v);
                if(v.marker) { 
                    let iconNode = v.marker._path || v.marker._icon;
                    L.DomUtil.removeClass(iconNode, 'marker-normal'); 
                    L.DomUtil.removeClass(iconNode, 'blink-6'); 
                    L.DomUtil.removeClass(iconNode, 'marker-rückfahrt'); 
                    L.DomUtil.addClass(iconNode, 'marker-blaulicht'); 
                }
            } else {
                createVehicleMarker(v);
                if(v.marker && !L.DomUtil.hasClass((v.marker._path || v.marker._icon), 'blink-6')) {
                    let iconNode = v.marker._path || v.marker._icon;
                    L.DomUtil.removeClass(iconNode, 'marker-normal');
                    L.DomUtil.addClass(iconNode, 'blink-6');
                }
            }
        }
        
        if(v.status === 'at_hospital') {
            if(now >= v.crewReadyMs) { 
                const st = stations.find(s => s.id === v.stId);
                v.status = 'en_route_home';
                v.travelStartMs = now;
                v.route = prepareRouteData([[v.lat, v.lng], [st.lat, st.lng]]); 
                v.travelDurationMs = (v.route.totalDist / (VEHICLES[v.type].speed * currentWeather.speedMod)) * 60 * 60000;
                if(v.marker) {
                    let iconNode = v.marker._path || v.marker._icon;
                    L.DomUtil.removeClass(iconNode, 'marker-hospital');
                    L.DomUtil.addClass(iconNode, 'marker-rückfahrt');
                    if(v.marker.setStyle) v.marker.setStyle({ fillColor: 'var(--color-return)' });
                }
            }
        }

        if(v.status === 'en_route_mission' || v.status === 'en_route_home' || v.status === 'transport_hospital') {
            let progress = (now - v.travelStartMs) / v.travelDurationMs;
            if(progress >= 1) progress = 1;
            
            let pos = getPositionAlongRoute(v.route, progress);
            v.lat = pos[0]; v.lng = pos[1];
            
            if(v.marker) {
                v.marker.setLatLng([v.lat, v.lng]);
                if(v.status === 'en_route_mission' && !L.DomUtil.hasClass((v.marker._path || v.marker._icon), 'marker-blaulicht')) {
                    let iconNode = v.marker._path || v.marker._icon;
                    L.DomUtil.removeClass(iconNode, 'marker-normal'); 
                    L.DomUtil.removeClass(iconNode, 'blink-6'); 
                    L.DomUtil.removeClass(iconNode, 'marker-rückfahrt');
                    L.DomUtil.addClass(iconNode, 'marker-blaulicht');
                    if(v.marker.setStyle) v.marker.setStyle({ fillColor: ORGS[VEHICLES[v.type].org].color });
                } else if(v.status === 'en_route_home' && !L.DomUtil.hasClass((v.marker._path || v.marker._icon), 'marker-rückfahrt')) {
                    let iconNode = v.marker._path || v.marker._icon;
                    L.DomUtil.removeClass(iconNode, 'marker-blaulicht'); 
                    L.DomUtil.removeClass(iconNode, 'blink-6'); 
                    L.DomUtil.removeClass(iconNode, 'marker-hospital'); 
                    L.DomUtil.addClass(iconNode, 'marker-rückfahrt');
                    if(v.marker.setStyle) v.marker.setStyle({ fillColor: 'var(--color-return)' });
                } else if(v.status === 'transport_hospital' && !L.DomUtil.hasClass((v.marker._path || v.marker._icon), 'marker-hospital')) {
                    let iconNode = v.marker._path || v.marker._icon;
                    L.DomUtil.removeClass(iconNode, 'marker-blaulicht'); 
                    L.DomUtil.removeClass(iconNode, 'marker-normal'); 
                    L.DomUtil.addClass(iconNode, 'marker-hospital');
                    if(v.marker.setStyle) v.marker.setStyle({ fillColor: 'var(--color-hospital)' });
                }
            }
            
            if(progress === 1) {
                if(v.status === 'en_route_mission') { 
                    v.status = 'working'; if(v.marker) map.removeLayer(v.marker); 
                } 
                else if(v.status === 'transport_hospital') {
                    v.status = 'at_hospital';
                    v.crewReadyMs = now + (3 * 60000); 
                }
                else if(v.status === 'en_route_home') { 
                    v.status = 'free'; v.missionId = null; if(v.marker) { map.removeLayer(v.marker); v.marker = null; } 
                }
            }
        }
    });
}

// ÜBERARBEITET: Berücksichtigt Upgrades bei der Fahrzeugberechnung am Einsatzort
function checkMissionReqs(m) {
    let fulfilled = true;
    let missingArr = [];
    
    let availableVehicles = m.assignedVehicles.map(vId => globalVehicles.find(x => x.id === vId)).filter(v => v && v.status === 'working');
    
    for(let reqKey in m.reqs) {
        let needed = m.reqs[reqKey]; 
        let arrived = 0;
        
        for (let i = availableVehicles.length - 1; i >= 0; i--) {
            if (vehicleSatisfiesReq(availableVehicles[i], reqKey)) {
                arrived++;
                availableVehicles.splice(i, 1);
                if (arrived >= needed) break;
            }
        }
        
        if(arrived < needed) { fulfilled = false; missingArr.push(`${needed - arrived}x ${translateReq(reqKey)}`); }
    }
    return { fulfilled, missingArr };
}

function updateMissions(deltaSimMs) {
    let listChanged = false;

    missions.forEach(m => {
        if(m.status === 'waiting_units' || m.status === 'working') {
            let reqCheck = checkMissionReqs(m);
            let newMissingText = reqCheck.missingArr.join(', ');
            
            if(m.missingText !== newMissingText) { m.missingText = newMissingText; listChanged = true; }

            if(reqCheck.fulfilled) {
                if(m.status !== 'working') { m.status = 'working'; listChanged = true; }
                m.workTimeRemaining -= deltaSimMs;
                
                if(m.workTimeRemaining <= 0) {
                    m.status = 'done'; map.removeLayer(m.marker); 
                    
                    let earnedCredits = m.reward || 1000;
                    let earnedXP = m.xpReward || 50;
                    credits += earnedCredits;
                    xp += earnedXP;
                    updateEconomyUI();
                    
                    showToast(`Einsatz beendet: ${m.name} (+${earnedCredits.toLocaleString('de-DE')} Cr)`); 
                    listChanged = true;
                    
                    let hospitals = stations.filter(s => s.type === 'rd_kh');

                    m.assignedVehicles.forEach(vId => {
                        const v = globalVehicles.find(x => x.id === vId);
                        const st = stations.find(s => s.id === v.stId);
                        
                        let needsTransport = ['RTW', 'KTW', 'KTWB', 'KTW4', 'SRTW', 'RTH', 'NAW'].includes(v.type);

                        if(needsTransport && hospitals.length > 0 && Math.random() > 0.3) {
                            let bestHosp = hospitals[0]; let minDist = 99999;
                            hospitals.forEach(h => { let d = getDistance(v.lat, v.lng, h.lat, h.lng); if(d < minDist) { minDist = d; bestHosp = h; } });
                            
                            v.status = 'transport_hospital';
                            v.targetLat = bestHosp.lat; v.targetLng = bestHosp.lng;
                            v.travelStartMs = simTime.getTime();
                            v.route = prepareRouteData([[v.lat, v.lng], [v.targetLat, v.targetLng]]);
                            v.travelDurationMs = (v.route.totalDist / (VEHICLES[v.type].speed * currentWeather.speedMod)) * 60 * 60000;
                            
                            createVehicleMarker(v); 
                            if(v.marker) { 
                                let iconNode = v.marker._path || v.marker._icon;
                                L.DomUtil.removeClass(iconNode, 'marker-blaulicht'); 
                                L.DomUtil.removeClass(iconNode, 'blink-6'); 
                                L.DomUtil.removeClass(iconNode, 'marker-rückfahrt'); 
                                L.DomUtil.addClass(iconNode, 'marker-hospital'); 
                                if(v.marker.setStyle) v.marker.setStyle({ fillColor: 'var(--color-hospital)' });
                            }

                        } else {
                            v.status = 'en_route_home'; 
                            v.travelStartMs = simTime.getTime();
                            if(v.route) {
                                let revCoords = [...v.route.coords].reverse();
                                v.route = prepareRouteData(revCoords);
                            }
                            createVehicleMarker(v); 
                            if(v.marker) { 
                                let iconNode = v.marker._path || v.marker._icon;
                                L.DomUtil.removeClass(iconNode, 'marker-blaulicht'); 
                                L.DomUtil.removeClass(iconNode, 'blink-6'); 
                                L.DomUtil.removeClass(iconNode, 'marker-hospital'); 
                                L.DomUtil.addClass(iconNode, 'marker-rückfahrt');
                                if(v.marker.setStyle) v.marker.setStyle({ fillColor: 'var(--color-return)' });
                            }
                        }
                    });
                }
            } else {
                if(m.status !== 'waiting_units') { m.status = 'waiting_units'; listChanged = true; }
            }
        }
    });
    if(listChanged) updateMissionList();
}

// --- SAVE & LOAD ---
function saveGame() {
    const data = {
        stations: stations.map(s => ({...s, marker: null})),
        missions: missions.map(m => ({...m, marker: null})),
        vehicles: globalVehicles.map(v => ({...v, marker: null, route: null})), 
        counters: { stIdCtr, vIdCtr, mIdCtr },
        simTime: simTime.getTime(), settings: settings, einsatzstop: einsatzstop,
        credits: credits, xp: xp
    };
    localStorage.setItem('leitstelle_save', JSON.stringify(data));
    showToast("💾 Spielstand erfolgreich gespeichert!"); closeModal('settings-modal');
}

function loadGame() {
    const saved = localStorage.getItem('leitstelle_save');
    if(!saved) { showToast("Kein Speicherstand gefunden."); return; }
    try {
        const data = JSON.parse(saved);
        stations.forEach(s => { if(s.marker) map.removeLayer(s.marker); });
        missions.forEach(m => { if(m.marker) map.removeLayer(m.marker); });
        globalVehicles.forEach(v => { if(v.marker) map.removeLayer(v.marker); });
        
        stations = data.stations || []; missions = data.missions || []; globalVehicles = data.vehicles || [];
        stIdCtr = data.counters.stIdCtr; vIdCtr = data.counters.vIdCtr; mIdCtr = data.counters.mIdCtr;
        simTime = new Date(data.simTime); if(data.settings) settings = data.settings;
        if(data.einsatzstop !== undefined && data.einsatzstop !== einsatzstop) toggleEinsatzstop();
        
        if(data.credits !== undefined) credits = data.credits;
        if(data.xp !== undefined) xp = data.xp;
        
        stations.forEach(s => createStationMarker(s));
        missions.forEach(m => { if(m.status !== 'done') createMissionMarker(m); });
        globalVehicles.forEach(v => { 
            if(!v.installedUpgrades) v.installedUpgrades = []; // Verhindert Fehler bei alten Spielständen
            if(v.status === 'en_route_mission' || v.status === 'en_route_home' || v.status === 'waiting_crew' || v.status === 'transport_hospital' || v.status === 'at_hospital') {
                if(!v.route) v.route = prepareRouteData([[v.lat, v.lng], [v.targetLat || v.lat, v.targetLng || v.lng]]);
                createVehicleMarker(v); 
            }
        });
        
        updateStationList(); updateMissionList(); updateSettings(); updateEconomyUI();
        showToast("📂 Spielstand geladen!"); closeModal('settings-modal');
    } catch(e) { showToast("Fehler beim Laden des Spielstands."); }
}

function clearSave() { if(confirm("Spielstand löschen und neu starten?")) { localStorage.removeItem('leitstelle_save'); location.reload(); } }
function showToast(msg) { const t = document.getElementById('toast'); t.innerText = msg; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 3000); }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// --- VEHICLE EDIT & UPGRADE SYSTEM ---
let currentEditVehImageBase64 = null;

// NEU: Kauf-Funktion für Upgrades
function buyUpgrade(vId, upgKey) {
    const v = globalVehicles.find(x => x.id === vId);
    const vDef = VEHICLES[v.type];
    const upg = vDef.possibleUpgrades[upgKey];

    if(credits < upg.price) {
        showToast("❌ Nicht genug Credits für dieses Upgrade!");
        return;
    }

    credits -= upg.price;
    updateEconomyUI();
    
    if(!v.installedUpgrades) v.installedUpgrades = [];
    v.installedUpgrades.push(upgKey);
    
    showToast(`✅ ${upg.name} installiert! (-${upg.price.toLocaleString('de-DE')} Cr)`);
    openVehicleEditModal(vId); 
}

function openVehicleEditModal(vId) {
    const v = globalVehicles.find(x => x.id === vId);
    if(!v) return;
    
    document.getElementById('veh-edit-id').value = v.id;
    document.getElementById('veh-edit-name').value = v.customName || '';
    document.getElementById('veh-edit-img').value = '';
    currentEditVehImageBase64 = v.customImage || null;
    
    let preview = document.getElementById('veh-edit-preview');
    if(currentEditVehImageBase64) {
        preview.src = currentEditVehImageBase64;
        preview.style.display = 'inline-block';
    } else {
        preview.style.display = 'none';
    }
    
    // Upgrades laden
    if(!v.installedUpgrades) v.installedUpgrades = [];
    const upgList = document.getElementById('veh-upgrades-list');
    upgList.innerHTML = '';
    const vDef = VEHICLES[v.type];
    
    if(vDef.possibleUpgrades) {
        for(let upgKey in vDef.possibleUpgrades) {
            let upg = vDef.possibleUpgrades[upgKey];
            let hasUpg = v.installedUpgrades.includes(upgKey);
            
            upgList.innerHTML += `
                <div style="display:flex; justify-content:space-between; background:var(--bg-hover); padding:8px; border-radius:4px; border:1px solid var(--border-color);">
                    <div>
                        <strong>${upg.name}</strong><br>
                        <small style="color:var(--text-muted)">Nutzen: Erfüllt Anforderung "${upg.provides ? translateReq(upg.provides) : 'Spezial'}"</small>
                    </div>
                    ${hasUpg 
                        ? `<span style="color:var(--color-success); font-weight:bold; align-self:center;">✅ Aktiv</span>` 
                        : `<button class="btn-action" style="align-self:center;" onclick="buyUpgrade(${v.id}, '${upgKey}')">💰 ${upg.price.toLocaleString('de-DE')} Cr</button>`
                    }
                </div>
            `;
        }
    } else {
        upgList.innerHTML = '<i style="color:var(--text-muted)">Für diesen Fahrzeugtyp gibt es keine Upgrades.</i>';
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
            preview.style.display = 'inline-block';
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
        if(v.status !== 'free' && v.status !== 'at_hospital') {
            createVehicleMarker(v);
        }
    }
    
    closeModal('vehicle-modal');
    if(currentStId) renderStationVehicles(stations.find(s => s.id === currentStId));
    if(document.getElementById('fms-modal').style.display === 'flex') updateFMSModal();
    showToast("Fahrzeug aktualisiert!");
}

// INIT
if(localStorage.getItem('leitstelle_save')) showToast("Spielstand gefunden. Gehe in die Einstellungen (⚙️) um ihn zu laden.");
applyTheme(); updateWeather(); updateDayNightCycle(); updateEconomyUI();
