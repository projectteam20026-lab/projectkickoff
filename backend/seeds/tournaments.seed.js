'use strict';

/**
 * Full tournament seed: 2 leagues + 2 cups with simulated results.
 * Run: node seeds/tournaments.seed.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Tournament = require('../src/models/Tournament');
const Team       = require('../src/models/Team');
const Match      = require('../src/models/Match');

const OWNER_ID = '6a368b4bf83409b554582afa'; // a@a.com

// ── Helpers ────────────────────────────────────────────────────────────────
function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function simulateScore() {
  const h = rnd(0, 5), a = rnd(0, 4);
  return { h, a };
}

// ── Team definitions ───────────────────────────────────────────────────────
const TEAMS_SET_A = [
  { name: 'نادي الوحدات',      logo: '🏆' },
  { name: 'الفيصلي الأردني',  logo: '⭐' },
  { name: 'شباب الأردن',      logo: '💚' },
  { name: 'نادي الرمثا',      logo: '🔵' },
  { name: 'العربي عمان',       logo: '🟡' },
  { name: 'نادي السلط',        logo: '🔴' },
  { name: 'شبيبة الزرقاء',    logo: '💎' },
  { name: 'نادي إربد',         logo: '🌟' },
  { name: 'شباب العقبة',       logo: '☀️' },
  { name: 'نادي الجزيرة',      logo: '🏅' },
];

const TEAMS_SET_B = [
  { name: 'أبطال عمان',         logo: '🏆' },
  { name: 'فريق الزرقاء',      logo: '💙' },
  { name: 'نادي جرش',           logo: '🌿' },
  { name: 'شباب عجلون',         logo: '⛰️' },
  { name: 'نادي مادبا',         logo: '🌾' },
  { name: 'فريق الكرك',         logo: '🏰' },
  { name: 'نادي الطفيلة',       logo: '🌄' },
  { name: 'شباب المفرق',        logo: '⚡' },
];

const TEAMS_SET_C = [
  { name: 'نادي الاتحاد',       logo: '🤝' },
  { name: 'التضامن الرياضي',   logo: '💪' },
  { name: 'النهضة الأردنية',   logo: '🌅' },
  { name: 'الأمل الرياضي',     logo: '🎯' },
  { name: 'فريق الوفاء',        logo: '❤️' },
  { name: 'نادي الشباب',        logo: '🔥' },
  { name: 'التقدم الرياضي',    logo: '📈' },
  { name: 'الاستقلال عمان',    logo: '🇯🇴' },
];

const TEAMS_SET_D = [
  { name: 'المنتخب الأزرق',    logo: '🔵' },
  { name: 'الهلال الأردني',    logo: '🌙' },
  { name: 'نجوم الشمال',       logo: '⭐' },
  { name: 'فريق الجنوب',       logo: '🏅' },
  { name: 'الوطن الرياضي',     logo: '💚' },
  { name: 'نادي الأردن',        logo: '🇯🇴' },
  { name: 'فجر الرياضة',        logo: '🌅' },
  { name: 'نادي الاتحاد الثاني', logo: '🤝' },
  { name: 'شباب الوسط',         logo: '⚡' },
  { name: 'النصر الأردني',      logo: '🏆' },
  { name: 'الرياضي عمان',       logo: '🎽' },
  { name: 'نادي الإخاء',        logo: '🤲' },
  { name: 'شباب الوادي',        logo: '🌊' },
  { name: 'الأهلي الأردني',    logo: '❤️' },
  { name: 'الجيل الجديد',       logo: '🌟' },
  { name: 'نادي الرافدين',      logo: '💧' },
];

// ── Create teams ───────────────────────────────────────────────────────────
async function createTeams(defs) {
  const teams = [];
  for (const def of defs) {
    const existing = await Team.findOne({ name: def.name, createdBy: OWNER_ID });
    if (existing) {
      teams.push(existing);
    } else {
      const t = await Team.create({ ...def, createdBy: OWNER_ID });
      teams.push(t);
    }
  }
  return teams;
}

// ── Simulate league matches ─────────────────────────────────────────────────
async function simulateLeagueMatches(tournamentId, teams, startDate, completedPct) {
  const matches = [];
  let dayOffset = 0;

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        leagueId:   tournamentId,
        homeTeamId: teams[i]._id,
        awayTeamId: teams[j]._id,
        homeTeam:   teams[i].name,
        awayTeam:   teams[j].name,
        date:       addDays(startDate, dayOffset),
        status:     'مجدولة',
        homeScore:  null,
        awayScore:  null,
      });
      dayOffset += 3;
    }
  }

  const totalToComplete = Math.floor(matches.length * completedPct);
  const goalMap = {}; // teamName → { for, against }
  teams.forEach(t => { goalMap[t.name] = { for: 0, against: 0 }; });

  for (let idx = 0; idx < matches.length; idx++) {
    if (idx < totalToComplete) {
      const { h, a } = simulateScore();
      matches[idx].homeScore = h;
      matches[idx].awayScore = a;
      matches[idx].status = 'انتهت';
      matches[idx].date = addDays(startDate, idx * 2 - 30);
      goalMap[matches[idx].homeTeam].for     += h;
      goalMap[matches[idx].homeTeam].against += a;
      goalMap[matches[idx].awayTeam].for     += a;
      goalMap[matches[idx].awayTeam].against += h;
    } else {
      matches[idx].date = addDays(new Date().toISOString().split('T')[0], (idx - totalToComplete) * 3 + 1);
    }
  }

  await Match.insertMany(matches);

  // Update team standings
  const standingMap = {};
  teams.forEach(t => { standingMap[t.name] = { wins: 0, losses: 0, draws: 0, points: 0 }; });

  for (const m of matches.filter(m => m.status === 'انتهت')) {
    const h = m.homeScore, a = m.awayScore;
    if (h > a) {
      standingMap[m.homeTeam].wins++;   standingMap[m.homeTeam].points += 3;
      standingMap[m.awayTeam].losses++;
    } else if (a > h) {
      standingMap[m.awayTeam].wins++;   standingMap[m.awayTeam].points += 3;
      standingMap[m.homeTeam].losses++;
    } else {
      standingMap[m.homeTeam].draws++;  standingMap[m.homeTeam].points += 1;
      standingMap[m.awayTeam].draws++;  standingMap[m.awayTeam].points += 1;
    }
  }

  for (const team of teams) {
    const s = standingMap[team.name] || {};
    await Team.findByIdAndUpdate(team._id, {
      wins: s.wins || 0, losses: s.losses || 0,
      draws: s.draws || 0, points: s.points || 0,
    });
  }
}

// ── Simulate cup bracket ────────────────────────────────────────────────────
async function simulateCupBracket(tournamentId, teams, startDate) {
  const ROUND_ORDER = ['دور الـ 16', 'ربع النهائي', 'نصف النهائي', 'النهائي'];
  let currentTeams = [...teams].sort(() => Math.random() - 0.5);
  let dayOffset = 0;

  const n = currentTeams.length;
  let roundIdx =
    n >= 16 ? 0 :
    n >= 8  ? 1 :
    n >= 4  ? 2 : 3;

  // For 16 teams: simulate R16 and QF done, SF upcoming
  // For 8 teams: simulate QF done, SF upcoming
  const totalRounds = ROUND_ORDER.length - roundIdx;
  const roundsToComplete = totalRounds >= 3 ? totalRounds - 1 : totalRounds - 1;

  let round = 0;
  while (currentTeams.length >= 2) {
    const roundName = ROUND_ORDER[roundIdx + round];
    if (!roundName) break;

    const shouldComplete = round < roundsToComplete;
    const matches = [];
    const winners = [];

    for (let i = 0; i + 1 < currentTeams.length; i += 2) {
      const d = addDays(startDate, dayOffset);
      dayOffset += 4;

      const home = currentTeams[i];
      const away = currentTeams[i + 1];

      let homeScore = null, awayScore = null, status = 'مجدولة';
      let winner = null;

      if (shouldComplete) {
        const date = addDays(new Date().toISOString().split('T')[0], -30 + round * 10);
        let h = rnd(0, 4), a = rnd(0, 3);
        // ensure no draw in cup
        if (h === a) { Math.random() > 0.5 ? h++ : a++; }
        homeScore = h; awayScore = a; status = 'انتهت';
        winner = h > a ? home : away;
        matches.push({
          leagueId: tournamentId,
          homeTeamId: home._id, awayTeamId: away._id,
          homeTeam: home.name, awayTeam: away.name,
          date, status, round: roundName, homeScore, awayScore,
        });
        winners.push(winner);
      } else {
        const futureDate = addDays(new Date().toISOString().split('T')[0], dayOffset);
        matches.push({
          leagueId: tournamentId,
          homeTeamId: home._id, awayTeamId: away._id,
          homeTeam: home.name, awayTeam: away.name,
          date: futureDate, status: 'مجدولة', round: roundName,
          homeScore: null, awayScore: null,
        });
      }
    }

    await Match.insertMany(matches);

    if (!shouldComplete || winners.length < 2) break;
    currentTeams = winners;
    round++;
  }
}

// ── Main seed ───────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clean up existing seeded tournaments
  const existing = await Tournament.find({ createdBy: OWNER_ID });
  if (existing.length > 0) {
    const ids = existing.map(t => t._id);
    await Match.deleteMany({ leagueId: { $in: ids } });
    await Tournament.deleteMany({ _id: { $in: ids } });
    console.log(`Deleted ${existing.length} existing tournaments and their matches`);
  }

  // ─── 1. دوري المحترفين الشتوي (League, 10 teams, 70% done) ────────────
  console.log('\n[1/4] Creating دوري المحترفين الشتوي...');
  const teamsA = await createTeams(TEAMS_SET_A);
  const t1 = await Tournament.create({
    name: 'دوري المحترفين الشتوي',
    sport: 'كرة القدم', format: 'league', status: 'جارية',
    maxTeams: 10, startDate: '2026-09-10', endDate: '2027-01-20',
    prizePool: 'JD 500', prize1: 'JD 500', prize2: 'JD 250', prize3: 'JD 100',
    entryFee: '25', preferredTime: 'مسائي',
    preferredDays: ['الجمعة', 'السبت'],
    fieldType: '7v7', matchesGenerated: true,
    organizerName: 'أحمد الكرمي', organizerPhone: '0791234567',
    organizerEmail: 'ahmad@kickoff.jo',
    registeredTeams: teamsA.map(t => t._id),
    createdBy: OWNER_ID,
  });
  await simulateLeagueMatches(t1._id, teamsA, '2026-09-10', 0.70);
  console.log('  ✓ 10 teams, 70% matches done');

  // ─── 2. كأس الأبطال الشبابي (Cup, 16 teams) ───────────────────────────
  console.log('[2/4] Creating كأس الأبطال الشبابي...');
  const teamsD = await createTeams(TEAMS_SET_D);
  const t2 = await Tournament.create({
    name: 'كأس الأبطال الشبابي',
    sport: 'كرة القدم', format: 'cup', status: 'جارية',
    maxTeams: 16, startDate: '2026-08-01', endDate: '2026-10-25',
    prizePool: 'JD 500', prize1: 'JD 500', prize2: 'JD 200',
    entryFee: '20', preferredTime: 'مسائي',
    preferredDays: ['الخميس', 'الجمعة', 'السبت'],
    fieldType: '7v7', matchesGenerated: true,
    organizerName: 'خالد المنصور', organizerPhone: '0799876543',
    organizerEmail: 'khalid@kickoff.jo',
    registeredTeams: teamsD.map(t => t._id),
    createdBy: OWNER_ID,
  });
  await simulateCupBracket(t2._id, teamsD, '2026-08-01');
  console.log('  ✓ 16 teams, دور الـ 16 + ربع النهائي done, نصف النهائي upcoming');

  // ─── 3. دوري الشباب الصيفي (League, 8 teams, 55% done) ────────────────
  console.log('[3/4] Creating دوري الشباب الصيفي...');
  const teamsB = await createTeams(TEAMS_SET_B);
  const t3 = await Tournament.create({
    name: 'دوري الشباب الصيفي',
    sport: 'كرة القدم', format: 'league', status: 'جارية',
    maxTeams: 8, startDate: '2026-06-01', endDate: '2026-09-30',
    prizePool: 'JD 300', prize1: 'JD 300', prize2: 'JD 150',
    entryFee: '15', preferredTime: 'مسائي',
    preferredDays: ['الثلاثاء', 'الجمعة'],
    fieldType: '5v5', matchesGenerated: true,
    organizerName: 'سامر الرشيد', organizerPhone: '0795555666',
    organizerEmail: 'samer@kickoff.jo',
    registeredTeams: teamsB.map(t => t._id),
    createdBy: OWNER_ID,
  });
  await simulateLeagueMatches(t3._id, teamsB, '2026-06-01', 0.55);
  console.log('  ✓ 8 teams, 55% matches done');

  // ─── 4. كأس الاستقلال (Cup, 8 teams) ─────────────────────────────────
  console.log('[4/4] Creating كأس الاستقلال...');
  const teamsC = await createTeams(TEAMS_SET_C);
  const t4 = await Tournament.create({
    name: 'كأس الاستقلال',
    sport: 'كرة القدم', format: 'cup', status: 'جارية',
    maxTeams: 8, startDate: '2026-05-25', endDate: '2026-07-10',
    prizePool: 'JD 400', prize1: 'JD 400', prize2: 'JD 175',
    entryFee: '30', preferredTime: 'مسائي',
    preferredDays: ['الأربعاء', 'السبت'],
    fieldType: '7v7', matchesGenerated: true,
    organizerName: 'نادر العبيدي', organizerPhone: '0796668888',
    organizerEmail: 'nader@kickoff.jo',
    registeredTeams: teamsC.map(t => t._id),
    createdBy: OWNER_ID,
  });
  await simulateCupBracket(t4._id, teamsC, '2026-05-25');
  console.log('  ✓ 8 teams, ربع النهائي done, نصف النهائي upcoming');

  // ── Summary ─────────────────────────────────────────────────────────────
  const tCount = await Tournament.countDocuments({ createdBy: OWNER_ID });
  const mCount = await Match.countDocuments({
    leagueId: { $in: [t1._id, t2._id, t3._id, t4._id] }
  });
  const doneCount = await Match.countDocuments({
    leagueId: { $in: [t1._id, t2._id, t3._id, t4._id] },
    status: 'انتهت',
  });

  console.log('\n✅ Done!');
  console.log(`   Tournaments : ${tCount}`);
  console.log(`   Total matches: ${mCount} (${doneCount} completed, ${mCount - doneCount} scheduled)`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
