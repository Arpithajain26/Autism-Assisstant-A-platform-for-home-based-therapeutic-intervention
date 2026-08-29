const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Child = require("../models/Child");

const THERAPISTS = [
  {
    name: "Dr. Ananya Sharma",
    email: "ananya.sharma@autismassistant.com",
    specialization: "Pediatric Behavioral Therapy (BCBA)",
    profilePhoto: "https://images.unsplash.com/photo-1594824813591-9486c4f03932?w=200&auto=format&fit=crop&q=80",
    phone: "+91 98765 43210",
  },
  {
    name: "Dr. Rajesh Kulkarni",
    email: "rajesh.kulkarni@autismassistant.com",
    specialization: "Sensory Integration & Occupational Therapy",
    profilePhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
    phone: "+91 98765 43211",
  },
  {
    name: "Dr. Meera Nambiar",
    email: "meera.nambiar@autismassistant.com",
    specialization: "Speech & AAC Communication Specialist",
    profilePhoto: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80",
    phone: "+91 98765 43212",
  },
  {
    name: "Dr. Vikram Sengupta",
    email: "vikram.sengupta@autismassistant.com",
    specialization: "Early Intervention & TEACCH Framework",
    profilePhoto: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80",
    phone: "+91 98765 43213",
  },
  {
    name: "Dr. Priyanka Hegde",
    email: "priyanka.hegde@autismassistant.com",
    specialization: "Developmental Clinical Psychology & Floortime",
    profilePhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    phone: "+91 98765 43214",
  },
];

async function seedTherapists() {
  try {
    const existingCount = await User.countDocuments({ role: "therapist" });
    if (existingCount > 0) {
      return;
    }

    console.log("🌱 Seeding 5 initial Therapist profiles...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    const createdTherapists = [];
    for (const t of THERAPISTS) {
      const user = await User.create({
        name: t.name,
        email: t.email,
        password: hashedPassword,
        role: "therapist",
        specialization: t.specialization,
        profilePhoto: t.profilePhoto,
        phone: t.phone,
        isVerified: true,
      });
      createdTherapists.push(user);
    }

    // Link any existing children without a therapist
    const childrenWithoutTherapist = await Child.find({ therapistId: null });
    if (childrenWithoutTherapist.length > 0 && createdTherapists.length > 0) {
      for (let i = 0; i < childrenWithoutTherapist.length; i++) {
        const assignedTherapist = createdTherapists[i % createdTherapists.length];
        childrenWithoutTherapist[i].therapistId = assignedTherapist._id;
        await childrenWithoutTherapist[i].save();
        await User.findByIdAndUpdate(assignedTherapist._id, {
          $addToSet: { assignedChildren: childrenWithoutTherapist[i]._id },
        });
      }
      console.log(`🔗 Assigned ${childrenWithoutTherapist.length} children to therapists.`);
    }

    console.log("✅ 5 Therapists seeded successfully (password: password123)");
  } catch (error) {
    console.error("❌ Seed therapists error:", error.message);
  }
}

module.exports = seedTherapists;
