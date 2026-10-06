import { prisma } from '../prisma.js';

const SAMPLE_OPPORTUNITIES = [
  { company: "Google", role: "Software Engineer Intern", type: "INTERNSHIP", description: "Join Google's engineering team for a summer internship. Work on scalable systems serving billions of users.", location: "Bangalore, India", salary: "₹80,000/month", skills: ["DSA", "System Design", "Python", "C++"] },
  { company: "Microsoft", role: "SDE Intern", type: "INTERNSHIP", description: "Build cloud-first solutions at Microsoft. Work with Azure and .NET technologies.", location: "Hyderabad, India", salary: "₹75,000/month", skills: ["C#", "Azure", "DSA", "SQL"] },
  { company: "Amazon", role: "SDE-1", type: "PLACEMENT", description: "Full-time Software Development Engineer role. Build and maintain Amazon's e-commerce platform.", location: "Bangalore, India", salary: "₹16-25 LPA", skills: ["Java", "DSA", "System Design", "AWS"] },
  { company: "TCS", role: "Digital Engineer", type: "PLACEMENT", description: "Join TCS Digital division working on cutting-edge technology solutions.", location: "Multiple Locations", salary: "₹7-9 LPA", skills: ["Java", "Python", "SQL", "Agile"] },
  { company: "Infosys", role: "Systems Engineer", type: "PLACEMENT", description: "Work on enterprise solutions and digital transformation projects.", location: "Pune, India", salary: "₹6.5-8 LPA", skills: ["Java", "Python", "SQL", "Cloud"] },
  { company: "Goldman Sachs", role: "Analyst - Engineering", type: "PLACEMENT", description: "Join the engineering division building fintech solutions.", location: "Bangalore, India", salary: "₹20-30 LPA", skills: ["Java", "Python", "DSA", "Finance"] },
  { company: "IEEE", role: "Technical Paper Contest", type: "EVENT", description: "Annual IEEE technical paper presentation competition. Present innovative research.", location: "Mumbai, India", skills: ["Research", "Technical Writing"] },
  { company: "HackerEarth", role: "Code Sprint 2024", type: "EVENT", description: "24-hour coding hackathon with prizes worth ₹5,00,000.", location: "Online", skills: ["DSA", "Problem Solving", "Competitive Programming"] },
  { company: "Flipkart", role: "SDE Intern", type: "INTERNSHIP", description: "6-month internship at Flipkart working on e-commerce backend.", location: "Bangalore, India", salary: "₹60,000/month", skills: ["Java", "Spring Boot", "DSA", "MySQL"] },
  { company: "Wipro", role: "Project Engineer", type: "PLACEMENT", description: "Entry-level engineering role working on client projects.", location: "Multiple Locations", salary: "₹6-7 LPA", skills: ["Java", "SQL", "Agile", "Cloud"] },
];

export const getOpportunities = async (req, res) => {
  try {
    let opportunities = await prisma.opportunity.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Seed if empty
    if (opportunities.length === 0) {
      for (const opp of SAMPLE_OPPORTUNITIES) {
        await prisma.opportunity.create({ data: opp });
      }
      opportunities = await prisma.opportunity.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
    }

    // Apply filters
    const { type, search } = req.query;
    if (type && type !== 'ALL') {
      opportunities = opportunities.filter(o => o.type === type);
    }
    if (search) {
      const s = search.toLowerCase();
      opportunities = opportunities.filter(o =>
        o.company.toLowerCase().includes(s) ||
        o.role.toLowerCase().includes(s) ||
        o.description.toLowerCase().includes(s)
      );
    }

    res.json(opportunities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch opportunities.' });
  }
};

export const createOpportunity = async (req, res) => {
  try {
    const opp = await prisma.opportunity.create({ data: req.body });
    res.status(201).json(opp);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create opportunity.' });
  }
};
