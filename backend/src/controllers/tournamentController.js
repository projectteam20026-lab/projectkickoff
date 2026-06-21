const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Match = require('../models/Match');
const Notification = require('../models/Notification');

// @desc    Get my tournaments (created by current user)
// @route   GET /api/tournaments/mine
// @access  Private
exports.getMyTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({})
      .populate('registeredTeams', 'name logo wins losses draws points')
      .sort('-createdAt');
    res.json({ success: true, data: tournaments.map(toFrontend) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete tournament (creator or admin only)
// @route   DELETE /api/tournaments/:id
// @access  Private
exports.deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });

    const createdBy = tournament.createdBy?.toString() || '';
    if (createdBy !== req.user._id.toString() && req.user.role !== 'مسؤول') {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بحذف هذه البطولة' });
    }

    await tournament.deleteOne();
    res.json({ success: true, message: 'تم حذف البطولة' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Public
exports.getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate('registeredTeams', 'name logo wins losses draws points')
      .sort('-createdAt');

    res.json({ success: true, data: tournaments.map(toFrontend) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single tournament
// @route   GET /api/tournaments/:id
// @access  Public
exports.getTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate(
      'registeredTeams',
      'name logo wins losses draws points'
    );
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
    res.json({ success: true, data: toFrontend(tournament) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create tournament
// @route   POST /api/tournaments
// @access  Private (admin/organizer)
exports.createTournament = async (req, res) => {
  try {
    const {
      name, sport, status, maxTeams, startDate, prizePool,
      format, fieldType, endDate, regDeadline, entryFee,
      prize1, prize2, prize3, prizeDesc, fieldId,
      preferredDays, preferredTime, notes,
      organizerName, organizerPhone, organizerEmail, phone,
    } = req.body;

    if (!name || !startDate) {
      return res.status(400).json({ success: false, error: 'اسم البطولة وتاريخ البدء مطلوبان' });
    }

    const tournament = await Tournament.create({
      name,
      sport: sport || 'كرة القدم',
      status: status || 'التسجيل متاح',
      maxTeams: maxTeams || 8,
      startDate,
      prizePool: prizePool || prize1 || '0 JD',
      createdBy: req.user._id,
      format: format || 'league',
      fieldType: fieldType || '7v7',
      endDate: endDate || '',
      regDeadline: regDeadline || '',
      entryFee: entryFee || '0',
      prize1: prize1 || '',
      prize2: prize2 || '',
      prize3: prize3 || '',
      prizeDesc: prizeDesc || '',
      fieldId: fieldId || '',
      preferredDays: preferredDays || [],
      preferredTime: preferredTime || 'مسائي',
      notes: notes || '',
      organizerName: organizerName || '',
      organizerPhone: organizerPhone || phone || '',
      organizerEmail: organizerEmail || '',
    });

    res.status(201).json({ success: true, data: toFrontend(tournament) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update tournament
// @route   PUT /api/tournaments/:id
// @access  Private
exports.updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('registeredTeams', 'name logo wins losses draws points');

    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
    res.json({ success: true, data: toFrontend(tournament) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Register a team into tournament
// @route   POST /api/tournaments/:id/register
// @access  Private
exports.registerTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });

    if (tournament.status !== 'التسجيل متاح') {
      return res.status(400).json({ success: false, error: 'التسجيل مغلق لهذه البطولة' });
    }

    if (tournament.registeredTeams.length >= tournament.maxTeams) {
      return res.status(400).json({ success: false, error: 'اكتمل عدد الفرق المسموح به' });
    }

    const alreadyRegistered = tournament.registeredTeams.some((t) => t.toString() === teamId);
    if (alreadyRegistered) {
      return res.status(400).json({ success: false, error: 'الفريق مسجل بالفعل في هذه البطولة' });
    }

    tournament.registeredTeams.push(teamId);
    await tournament.save();

    const updated = await Tournament.findById(req.params.id).populate(
      'registeredTeams',
      'name logo wins losses draws points'
    );

    // Notify team owner
    const team = await Team.findById(teamId);
    if (team) {
      await Notification.create({
        userId: team.userId,
        title: 'تم تسجيل فريقك',
        message: `تم تسجيل فريق "${team.name}" في بطولة "${tournament.name}"`,
        type: 'league',
        date: new Date().toLocaleDateString('ar-JO'),
      });
    }

    res.json({ success: true, data: toFrontend(updated) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Auto-generate round-robin matches for a tournament
// @route   POST /api/tournaments/:id/generate-matches
// @access  Private (admin)
exports.generateMatches = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate('registeredTeams');
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });

    if (tournament.matchesGenerated) {
      return res.status(400).json({ success: false, error: 'تم توليد المباريات مسبقاً لهذه البطولة' });
    }

    const teams = tournament.registeredTeams;
    if (teams.length < 2) {
      return res.status(400).json({ success: false, error: 'يجب أن يكون هناك فريقان على الأقل' });
    }

    // Round-robin algorithm
    const matches = [];
    const startDate = new Date(tournament.startDate);

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const matchDate = new Date(startDate);
        matchDate.setDate(matchDate.getDate() + matches.length * 3); // space out matches by 3 days

        matches.push({
          leagueId: tournament._id,
          homeTeamId: teams[i]._id,
          awayTeamId: teams[j]._id,
          homeTeam: teams[i].name,
          awayTeam: teams[j].name,
          date: matchDate.toISOString().split('T')[0],
          status: 'مجدولة',
        });
      }
    }

    await Match.insertMany(matches);

    tournament.matchesGenerated = true;
    tournament.status = 'جارية';
    await tournament.save();

    res.json({ success: true, message: `تم توليد ${matches.length} مباراة`, count: matches.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Generate knockout (cup) first-round matches
// @route   POST /api/tournaments/:id/generate-knockout
// @access  Private
exports.generateKnockoutMatches = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate('registeredTeams');
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
    if (tournament.matchesGenerated)
      return res.status(400).json({ success: false, error: 'تم توليد المباريات مسبقاً' });

    const teams = [...tournament.registeredTeams].sort(() => Math.random() - 0.5);
    if (teams.length < 2) return res.status(400).json({ success: false, error: 'يجب فريقان على الأقل' });

    const n = teams.length;
    const round =
      n >= 16 ? 'دور الـ 16' :
      n >= 8  ? 'ربع النهائي' :
      n >= 4  ? 'نصف النهائي' : 'النهائي';

    const matches = [];
    const startDate = new Date(tournament.startDate);
    for (let i = 0; i < teams.length - 1; i += 2) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + Math.floor(i / 2) * 3);
      matches.push({
        leagueId: tournament._id,
        homeTeamId: teams[i]._id,
        awayTeamId: teams[i + 1]._id,
        homeTeam: teams[i].name,
        awayTeam: teams[i + 1].name,
        date: d.toISOString().split('T')[0],
        status: 'مجدولة',
        round,
      });
    }

    await Match.insertMany(matches);
    tournament.matchesGenerated = true;
    tournament.status = 'جارية';
    await tournament.save();

    res.json({ success: true, message: `تم توليد ${matches.length} مباراة في ${round}`, count: matches.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Advance to next knockout round using match winners
// @route   POST /api/tournaments/:id/advance-round
// @access  Private
exports.advanceKnockoutRound = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });

    const allMatches = await Match.find({ leagueId: req.params.id }).sort('date');
    const roundOrder = ['دور الـ 16', 'ربع النهائي', 'نصف النهائي', 'النهائي'];

    const rounds = [...new Set(allMatches.map(m => m.round).filter(Boolean))];
    const lastRound = rounds.sort((a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b)).at(-1);
    const currentRoundMatches = allMatches.filter(m => m.round === lastRound);

    const unfinished = currentRoundMatches.filter(m => m.status !== 'انتهت');
    if (unfinished.length > 0)
      return res.status(400).json({ success: false, error: `لا تزال ${unfinished.length} مباراة لم تنته في الدور الحالي` });

    const winners = currentRoundMatches.map(m => {
      if (m.homeScore > m.awayScore) return { id: m.homeTeamId, name: m.homeTeam };
      if (m.awayScore > m.homeScore) return { id: m.awayTeamId, name: m.awayTeam };
      return Math.random() > 0.5
        ? { id: m.homeTeamId, name: m.homeTeam }
        : { id: m.awayTeamId, name: m.awayTeam };
    });

    if (winners.length < 2)
      return res.json({ success: true, message: 'البطولة اكتملت!', finished: true });

    const nextRoundIdx = roundOrder.indexOf(lastRound) + 1;
    if (nextRoundIdx >= roundOrder.length)
      return res.json({ success: true, message: 'البطولة اكتملت!', finished: true });

    const nextRound = roundOrder[nextRoundIdx];
    const startDate = new Date();
    const matches = [];
    for (let i = 0; i < winners.length - 1; i += 2) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + Math.floor(i / 2) * 3 + 7);
      matches.push({
        leagueId: tournament._id,
        homeTeamId: winners[i].id,
        awayTeamId: winners[i + 1].id,
        homeTeam: winners[i].name,
        awayTeam: winners[i + 1].name,
        date: d.toISOString().split('T')[0],
        status: 'مجدولة',
        round: nextRound,
      });
    }

    await Match.insertMany(matches);
    res.json({ success: true, message: `تم توليد ${matches.length} مباراة في ${nextRound}`, round: nextRound });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get tournament standings
// @route   GET /api/tournaments/:id/standings
// @access  Public
exports.getStandings = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate(
      'registeredTeams',
      'name logo wins losses draws points'
    );
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });

    const standings = tournament.registeredTeams
      .map((t) => ({
        id: t._id,
        name: t.name,
        logo: t.logo,
        wins: t.wins,
        losses: t.losses,
        draws: t.draws,
        points: t.points,
      }))
      .sort((a, b) => b.points - a.points);

    res.json({ success: true, data: standings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Submit a registration request (public — no auth required)
// @route   POST /api/tournaments/:id/apply
// @access  Public
exports.applyTournament = async (req, res) => {
  try {
    const { teamName, captainName, phone, email, playerCount, note, teamId } = req.body;
    if (!teamName) return res.status(400).json({ success: false, error: 'اسم الفريق مطلوب' });

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });

    if (tournament.status !== 'التسجيل متاح') {
      return res.status(400).json({ success: false, error: 'التسجيل مغلق لهذه البطولة' });
    }

    const alreadyPending = tournament.pendingRegistrations.some(
      r => r.teamName === teamName && r.status === 'pending'
    );
    if (alreadyPending) {
      return res.status(400).json({ success: false, error: 'تم إرسال طلب تسجيل لهذا الفريق مسبقاً' });
    }

    const alreadyApproved = tournament.registeredTeams.some(
      t => teamId && t.toString() === teamId
    );
    if (alreadyApproved) {
      return res.status(400).json({ success: false, error: 'الفريق مسجل بالفعل في هذه البطولة' });
    }

    tournament.pendingRegistrations.push({
      teamName,
      captainName: captainName || '',
      phone: phone || '',
      email: email || '',
      playerCount: playerCount || 0,
      note: note || '',
      teamId: teamId || null,
      status: 'pending',
    });
    await tournament.save();

    res.status(201).json({ success: true, message: 'تم إرسال طلب التسجيل بنجاح، سيتم مراجعته من قِبل المنظِّم' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all registration requests for a tournament
// @route   GET /api/tournaments/:id/registrations
// @access  Private (owner/admin)
exports.getRegistrations = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });
    res.json({ success: true, data: tournament.pendingRegistrations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Approve a registration request
// @route   POST /api/tournaments/:id/registrations/:regId/approve
// @access  Private (owner/admin)
exports.approveRegistration = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });

    const reg = tournament.pendingRegistrations.id(req.params.regId);
    if (!reg) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });

    if (tournament.registeredTeams.length >= tournament.maxTeams) {
      return res.status(400).json({ success: false, error: 'اكتمل عدد الفرق المسموح به' });
    }

    reg.status = 'approved';

    if (reg.teamId) {
      const alreadyIn = tournament.registeredTeams.some(t => t.toString() === reg.teamId.toString());
      if (!alreadyIn) tournament.registeredTeams.push(reg.teamId);

      const team = await Team.findById(reg.teamId);
      if (team) {
        await Notification.create({
          userId: team.userId,
          title: 'تم قبول طلب التسجيل',
          message: `تم قبول فريق "${reg.teamName}" في بطولة "${tournament.name}"`,
          type: 'league',
          date: new Date().toLocaleDateString('ar-JO'),
        });
      }
    }

    await tournament.save();
    res.json({ success: true, message: 'تم قبول الطلب', data: tournament.pendingRegistrations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Reject a registration request
// @route   POST /api/tournaments/:id/registrations/:regId/reject
// @access  Private (owner/admin)
exports.rejectRegistration = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'البطولة غير موجودة' });

    const reg = tournament.pendingRegistrations.id(req.params.regId);
    if (!reg) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });

    reg.status = 'rejected';
    await tournament.save();

    res.json({ success: true, message: 'تم رفض الطلب', data: tournament.pendingRegistrations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

function toFrontend(t) {
  const obj = t.toObject ? t.toObject() : t;
  return {
    id: obj._id,
    name: obj.name,
    sport: obj.sport,
    status: obj.status,
    teamsCount: (obj.registeredTeams || []).length,
    maxTeams: obj.maxTeams,
    startDate: obj.startDate,
    prizePool: obj.prizePool,
    createdBy: obj.createdBy ? obj.createdBy.toString() : '',
    registeredTeams: (obj.registeredTeams || []).map((team) =>
      typeof team === 'object' && team._id
        ? { id: team._id, name: team.name, logo: team.logo, wins: team.wins, losses: team.losses, draws: team.draws, points: team.points }
        : team
    ),
    matchesGenerated: obj.matchesGenerated,
    format: obj.format,
    fieldType: obj.fieldType,
    endDate: obj.endDate,
    regDeadline: obj.regDeadline,
    entryFee: obj.entryFee,
    prize1: obj.prize1,
    prize2: obj.prize2,
    prize3: obj.prize3,
    prizeDesc: obj.prizeDesc,
    fieldId: obj.fieldId,
    preferredDays: obj.preferredDays,
    preferredTime: obj.preferredTime,
    organizerName: obj.organizerName,
    organizerPhone: obj.organizerPhone,
    organizerEmail: obj.organizerEmail,
  };
}
