const Match = require('../models/Match');
const Team = require('../models/Team');

// @desc    Get matches by tournament
// @route   GET /api/matches?leagueId=
// @access  Public
exports.getMatches = async (req, res) => {
  try {
    const { leagueId } = req.query;
    const filter = leagueId ? { leagueId } : {};
    const matches = await Match.find(filter)
      .populate('homeTeamId', 'name logo')
      .populate('awayTeamId', 'name logo')
      .sort('date');

    res.json({ success: true, data: matches.map(toFrontend) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create a match manually
// @route   POST /api/matches
// @access  Private (admin)
exports.createMatch = async (req, res) => {
  try {
    const { leagueId, homeTeamId, awayTeamId, date } = req.body;
    if (!leagueId || !homeTeamId || !awayTeamId || !date) {
      return res.status(400).json({ success: false, error: 'جميع الحقول مطلوبة' });
    }

    const [home, away] = await Promise.all([Team.findById(homeTeamId), Team.findById(awayTeamId)]);
    if (!home || !away) return res.status(404).json({ success: false, error: 'أحد الفريقين غير موجود' });

    const match = await Match.create({
      leagueId, homeTeamId, awayTeamId,
      homeTeam: home.name, awayTeam: away.name,
      date, status: 'مجدولة',
    });

    res.status(201).json({ success: true, data: toFrontend(match) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update match result
// @route   PUT /api/matches/:id/result
// @access  Private (admin)
exports.updateResult = async (req, res) => {
  try {
    const { homeScore, awayScore, status } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: 'المباراة غير موجودة' });

    match.homeScore = homeScore ?? match.homeScore;
    match.awayScore = awayScore ?? match.awayScore;
    match.status = status || match.status;
    await match.save();

    // Update team standings when match ends
    if (match.status === 'انتهت' && match.homeScore !== null && match.awayScore !== null) {
      await updateStandings(match);
    }

    res.json({ success: true, data: toFrontend(match) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

async function updateStandings(match) {
  const homeTeam = await Team.findById(match.homeTeamId);
  const awayTeam = await Team.findById(match.awayTeamId);
  if (!homeTeam || !awayTeam) return;

  if (match.homeScore > match.awayScore) {
    homeTeam.wins += 1; homeTeam.points += 3;
    awayTeam.losses += 1;
  } else if (match.awayScore > match.homeScore) {
    awayTeam.wins += 1; awayTeam.points += 3;
    homeTeam.losses += 1;
  } else {
    homeTeam.draws += 1; homeTeam.points += 1;
    awayTeam.draws += 1; awayTeam.points += 1;
  }

  await Promise.all([homeTeam.save(), awayTeam.save()]);
}

function toFrontend(m) {
  return {
    id: m._id,
    leagueId: m.leagueId,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeTeamId: m.homeTeamId?._id || m.homeTeamId,
    awayTeamId: m.awayTeamId?._id || m.awayTeamId,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    date: m.date,
    status: m.status,
    round: m.round || '',
  };
}
