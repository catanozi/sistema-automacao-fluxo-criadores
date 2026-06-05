
import pb from '@/lib/pocketbaseClient';

export const normalizeString = (str) => {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, ' ').toLowerCase();
};

export const normalizePhone = (phone) => {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
};

export const normalizeTikTok = (username) => {
  if (!username) return '';
  return String(username).replace(/^@/, '').trim().toLowerCase();
};

export const findDuplicateCreators = (creators) => {
  console.log('Finding duplicates in', creators.length, 'creators...');
  const groups = {};
  
  creators.forEach(creator => {
    const normName = normalizeString(creator.name);
    const normPhone = normalizePhone(creator.phone);
    const normTikTok = normalizeTikTok(creator.tiktok_username);

    // Group by the most unique identifier available
    const key = normTikTok ? `tiktok:${normTikTok}` : (normPhone ? `phone:${normPhone}` : `name:${normName}`);

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(creator);
  });

  const duplicates = Object.values(groups).filter(group => group.length > 1);
  console.log(`Found ${duplicates.length} groups of duplicates.`);
  return duplicates;
};

export const cleanupDuplicates = async (userId) => {
  console.log('Starting cleanupDuplicates for user:', userId);
  try {
    // Fetch all creators for the user, sorted by newest first
    const creators = await pb.collection('creators').getFullList({
      filter: `user_id="${userId}"`,
      sort: '-created_at',
      $autoCancel: false
    });

    const duplicateGroups = findDuplicateCreators(creators);
    let deletedCount = 0;

    for (const group of duplicateGroups) {
      // Since the original array was sorted by -created_at, the first item is the newest
      const [keep, ...toDelete] = group;
      console.log(`Duplicate group found for "${keep.name}". Keeping ID: ${keep.id}. Deleting ${toDelete.length} older records.`);

      for (const record of toDelete) {
        await pb.collection('creators').delete(record.id, { $autoCancel: false });
        console.log(`Deleted duplicate record ID: ${record.id}`);
        deletedCount++;
      }
    }

    console.log(`Cleanup complete. Total deleted records: ${deletedCount}`);
    return deletedCount;
  } catch (error) {
    console.error('Error in cleanupDuplicates:', error);
    return 0;
  }
};
