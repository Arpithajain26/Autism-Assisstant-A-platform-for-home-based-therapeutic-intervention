const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Child = require("../models/Child");

const THERAPISTS = [
  {
    name: "Dr. Ananya Sharma",
    email: "ananya.sharma@autismassistant.com",
    qualification: "BCBA-D, M.Phil Clinical Psychology",
    specialization: "Early Intervention & Applied Behavior Analysis (ABA)",
    bio: "Specializes in foundational joint attention protocols, early verbal behavior, and PECS communication for toddlers and early preschoolers.",
    profilePhoto: "https://images.unsplash.com/photo-1594824813591-9486c4f03932?w=400&auto=format&fit=crop&q=80",
    yearsOfExperience: 12,
    languages: ["English", "Hindi", "Kannada"],
    clinic: "NIMHANS & Child Neurodevelopment Hub, Bengaluru",
    phone: "+91 98765 43210",
    targetAgeMin: 2,
    targetAgeMax: 5,
    targetLevels: [1, 2],
  },
  {
    name: "Dr. Rajesh Kulkarni",
    email: "rajesh.kulkarni@autismassistant.com",
    qualification: "MOT (Pediatrics), Sensory Integration Certified (USC/WPS)",
    specialization: "Sensory Integration Therapy & Motor Coordination",
    bio: "Expert in vestibular-proprioceptive modulation diets, sensory regulation spaces, and fine/gross motor praxis for high-support children.",
    profilePhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
    yearsOfExperience: 14,
    languages: ["English", "Kannada", "Marathi"],
    clinic: "Apollo Pediatric Neuro-Rehab Centre",
    phone: "+91 98765 43211",
    targetAgeMin: 3,
    targetAgeMax: 7,
    targetLevels: [2, 3],
  },
  {
    name: "Dr. Meera Nambiar",
    email: "meera.nambiar@autismassistant.com",
    qualification: "MASLP, CCC-SLP (Speech-Language Pathologist)",
    specialization: "Speech-Language Pathology & AAC Communication",
    bio: "Pioneers multi-modal AAC digital communication boards, social reciprocity scripts, and expressive language scaffolding.",
    profilePhoto: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
    yearsOfExperience: 10,
    languages: ["English", "Malayalam", "Hindi", "Kannada"],
    clinic: "Manipal Institute of Speech & Hearing",
    phone: "+91 98765 43212",
    targetAgeMin: 4,
    targetAgeMax: 8,
    targetLevels: [1, 2],
  },
  {
    name: "Dr. Vikram Sengupta",
    email: "vikram.sengupta@autismassistant.com",
    qualification: "Ph.D. Developmental Behavioral Pediatrics, TEACCH Certified",
    specialization: "TEACCH Structured Teaching & Routine Engineering",
    bio: "Specializes in structured workspace environments, visual schedule automation, and functional life skill independence for school-age children.",
    profilePhoto: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80",
    yearsOfExperience: 16,
    languages: ["English", "Bengali", "Hindi"],
    clinic: "Fortis Child Neuroscience & Autism Centre",
    phone: "+91 98765 43213",
    targetAgeMin: 5,
    targetAgeMax: 9,
    targetLevels: [2, 3],
  },
  {
    name: "Dr. Priyanka Hegde",
    email: "priyanka.hegde@autismassistant.com",
    qualification: "M.Sc. Clinical Psychology, Floortime / DIR Certified",
    specialization: "Floortime (DIR), Emotional Regulation & Social Circles",
    bio: "Facilitates shared emotional regulation, peer social engagement, Theory of Mind storytelling, and Zones of Regulation coping.",
    profilePhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    yearsOfExperience: 9,
    languages: ["English", "Kannada", "Tulu"],
    clinic: "Rainbow Children's Neurodevelopmental Centre",
    phone: "+91 98765 43214",
    targetAgeMin: 6,
    targetAgeMax: 10,
    targetLevels: [1, 2],
  },
  {
    name: "Dr. Aarav Menon",
    email: "aarav.menon@autismassistant.com",
    qualification: "Psy.D. Clinical Psychology, BCBA",
    specialization: "Adolescent Executive Function & CBT for Neurodiversity",
    bio: "Focuses on executive functioning coaching, self-advocacy, emotional de-escalation, and community independence for pre-teens and teens.",
    profilePhoto: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80",
    yearsOfExperience: 11,
    languages: ["English", "Hindi", "Tamil"],
    clinic: "Aster CMI Neurodevelopmental Centre",
    phone: "+91 98765 43215",
    targetAgeMin: 8,
    targetAgeMax: 14,
    targetLevels: [2, 3],
  },
];

/**
 * Intelligent Clinical Matching Algorithm
 * Matches a child to the optimal therapist based on Age and Support Level.
 */
function findBestTherapistForChild(childAge, childLevel, therapistsList) {
  const age = Number(childAge) || 6;
  const level = Number(childLevel) || 2;

  // 1. Exact clinical profile score matching
  let bestTherapist = null;
  let bestScore = -1;

  for (const t of therapistsList) {
    let score = 0;

    // Age proximity
    if (age >= t.targetAgeMin && age <= t.targetAgeMax) {
      score += 50;
    } else {
      const distance = Math.min(Math.abs(age - t.targetAgeMin), Math.abs(age - t.targetAgeMax));
      score += Math.max(0, 30 - distance * 10);
    }

    // Level alignment
    if (Array.isArray(t.targetLevels) && t.targetLevels.includes(level)) {
      score += 40;
    }

    // Prioritize therapist with fewer assigned children for load balancing
    const load = Array.isArray(t.assignedChildren) ? t.assignedChildren.length : 0;
    score -= load * 2;

    if (score > bestScore) {
      bestScore = score;
      bestTherapist = t;
    }
  }

  return bestTherapist || therapistsList[0];
}

async function seedTherapists() {
  try {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Upsert / Seed all 6 therapists idempotently
    const activeTherapists = [];
    for (const t of THERAPISTS) {
      let user = await User.findOne({ email: t.email });
      if (!user) {
        user = await User.create({
          name: t.name,
          email: t.email,
          password: hashedPassword,
          role: "therapist",
          specialization: t.specialization,
          qualification: t.qualification,
          bio: t.bio,
          profilePhoto: t.profilePhoto,
          yearsOfExperience: t.yearsOfExperience,
          languages: t.languages,
          clinic: t.clinic,
          phone: t.phone,
          targetAgeMin: t.targetAgeMin,
          targetAgeMax: t.targetAgeMax,
          targetLevels: t.targetLevels,
          isVerified: true,
        });
      } else {
        // Update profile fields
        user.specialization = t.specialization;
        user.qualification = t.qualification;
        user.bio = t.bio;
        user.profilePhoto = t.profilePhoto;
        user.yearsOfExperience = t.yearsOfExperience;
        user.languages = t.languages;
        user.clinic = t.clinic;
        user.targetAgeMin = t.targetAgeMin;
        user.targetAgeMax = t.targetAgeMax;
        user.targetLevels = t.targetLevels;
        await user.save();
      }
      activeTherapists.push(user);
    }

    // Assign all existing children based on Age & Level matching
    const allChildren = await Child.find({});
    if (allChildren.length > 0 && activeTherapists.length > 0) {
      for (const child of allChildren) {
        const matchedTherapist = findBestTherapistForChild(child.age, child.level || 2, activeTherapists);
        child.therapistId = matchedTherapist._id;
        await child.save();

        await User.findByIdAndUpdate(matchedTherapist._id, {
          $addToSet: { assignedChildren: child._id },
        });
      }
      console.log(`🔗 Clinically matched & assigned ${allChildren.length} children to 6 therapists based on Age & Level.`);
    }

    console.log("✅ 6 Specialized Therapists active (password: password123)");
  } catch (error) {
    console.error("❌ Seed therapists error:", error.message);
  }
}

module.exports = {
  seedTherapists,
  findBestTherapistForChild,
  THERAPISTS,
};
