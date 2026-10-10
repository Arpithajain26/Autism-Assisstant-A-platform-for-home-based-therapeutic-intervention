/**
 * Therapist matching utilities.
 * Therapist accounts are created through the application; this module does
 * not supply or seed demo therapist records.
 */

function getAgeGroupString(childAge) {
  const age = Number(childAge) || 4;
  if (age <= 5) return "Age Group 1 — Age 2 to 5 years (Toddlers)";
  if (age <= 9) return "Age Group 2 — Age 6 to 9 years (Early School)";
  return "Age Group 3 — Age 10 to 12 years (Older Children)";
}

function findBestTherapistForChild(childAge, childLevel, therapists = []) {
  if (!therapists.length) return null;

  const age = Number(childAge) || 4;
  const level = Number(childLevel) || 1;
  const inAgeRange = therapists.filter(
    (therapist) => age >= therapist.targetAgeMin && age <= therapist.targetAgeMax
  );
  const ageCandidates = inAgeRange.length ? inAgeRange : therapists;
  const withCapacity = ageCandidates.filter(
    (therapist) => (therapist.assignedChildren?.length || 0) < (therapist.maxPatients || 15)
  );
  const candidates = withCapacity.length ? withCapacity : ageCandidates;

  return candidates.find((therapist) => therapist.targetLevels?.includes(level))
    || [...candidates].sort(
      (a, b) => (a.assignedChildren?.length || 0) - (b.assignedChildren?.length || 0)
    )[0];
}

// Kept for compatibility with current callers. New installations start empty.
async function seedTherapists() {
  return [];
}

module.exports = { seedTherapists, findBestTherapistForChild, getAgeGroupString, THERAPISTS: [] };
