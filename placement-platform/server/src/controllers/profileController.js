import { prisma } from '../prisma.js';

export const getProfile = async (req, res) => {
  try {
    let profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) {
      profile = await prisma.studentProfile.create({ data: { userId: req.user.id } });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true, email: true } });
    const submissions = await prisma.codingSubmission.findMany({
      where: { userId: req.user.id, status: 'ACCEPTED' },
      select: { createdAt: true }
    });

    res.json({ ...profile, user, submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { branch, year, cgpa, skills, targetCompanies, careerGoals } = req.body;
    const profile = await prisma.studentProfile.upsert({
      where: { userId: req.user.id },
      update: { branch, year: parseInt(year) || 3, cgpa: parseFloat(cgpa) || 0, skills: skills || [], targetCompanies: targetCompanies || [], careerGoals: careerGoals || '' },
      create: { userId: req.user.id, branch, year: parseInt(year) || 3, cgpa: parseFloat(cgpa) || 0, skills: skills || [], targetCompanies: targetCompanies || [], careerGoals: careerGoals || '' },
    });
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};
