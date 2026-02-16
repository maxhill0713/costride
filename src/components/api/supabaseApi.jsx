import { base44 } from '@/api/base44Client';

// ===== SAVE/CREATE FUNCTIONS =====
export const saveCheckIn = (data) => 
  base44.functions.invoke('saveSupabaseCheckIn', data);

export const saveLift = (data) => 
  base44.functions.invoke('saveSupabaseLift', data);

export const saveGoal = (data) => 
  base44.functions.invoke('saveSupabaseGoal', data);

export const savePost = (data) => 
  base44.functions.invoke('saveSupabasePost', data);

export const saveBrandDiscountCode = (data) => 
  base44.functions.invoke('saveSupabaseBrandDiscountCode', data);

export const saveCoach = (data) => 
  base44.functions.invoke('saveSupabaseCoach', data);

export const saveChallengeParticipant = (data) => 
  base44.functions.invoke('saveSupabaseChallengeParticipant', data);

export const saveClaimedBonus = (data) => 
  base44.functions.invoke('saveSupabaseClaimedBonus', data);

export const saveGroup = (data) => 
  base44.functions.invoke('saveSupabaseGroup', data);

export const saveGymClass = (data) => 
  base44.functions.invoke('saveSupabaseGymClass', data);

export const saveGymMember = (data) => 
  base44.functions.invoke('saveSupabaseGymMember', data);

export const saveGymRating = (data) => 
  base44.functions.invoke('saveSupabaseGymRating', data);

export const saveGymStat = (data) => 
  base44.functions.invoke('saveSupabaseGymStat', data);

export const savePayment = (data) => 
  base44.functions.invoke('saveSupabasePayment', data);

export const savePaymentMethod = (data) => 
  base44.functions.invoke('saveSupabasePaymentMethod', data);

export const savePoll = (data) => 
  base44.functions.invoke('saveSupabasePoll', data);

export const saveReferral = (data) => 
  base44.functions.invoke('saveSupabaseReferral', data);

export const saveReward = (data) => 
  base44.functions.invoke('saveSupabaseReward', data);

export const saveSubscription = (data) => 
  base44.functions.invoke('saveSupabaseSubscription', data);

export const saveWorkoutLog = (data) => 
  base44.functions.invoke('saveSupabaseWorkoutLog', data);

export const saveAchievement = (data) => 
  base44.functions.invoke('saveSupabaseAchievement', data);

export const saveEvent = (data) => 
  base44.functions.invoke('saveSupabaseEvent', data);

export const saveFriend = (data) => 
  base44.functions.invoke('saveSupabaseFriend', data);

export const saveGym = (data) => 
  base44.functions.invoke('saveSupabaseGym', data);

export const saveMembership = (data) => 
  base44.functions.invoke('saveSupabaseMembership', data);

export const saveMessage = (data) => 
  base44.functions.invoke('saveSupabaseMessage', data);

export const saveNotification = (data) => 
  base44.functions.invoke('saveSupabaseNotification', data);

export const saveChallenge = (data) => 
  base44.functions.invoke('saveSupabaseChallenge', data);

// ===== GET/READ FUNCTIONS =====
export const getCheckIns = (params = {}) => 
  base44.functions.invoke('getSupabaseCheckIns', params);

export const getLifts = (params = {}) => 
  base44.functions.invoke('getSupabaseLifts', params);

export const getGoals = (params = {}) => 
  base44.functions.invoke('getSupabaseGoals', params);

export const getPosts = (params = {}) => 
  base44.functions.invoke('getSupabasePosts', params);

export const getBrandDiscountCodes = (params = {}) => 
  base44.functions.invoke('getSupabaseBrandDiscountCodes', params);

export const getAchievements = (params = {}) => 
  base44.functions.invoke('getSupabaseAchievements', params);

export const getChallengeParticipants = (params = {}) => 
  base44.functions.invoke('getSupabaseChallengeParticipants', params);

export const getClaimedBonuses = (params = {}) => 
  base44.functions.invoke('getSupabaseClaimedBonuses', params);

export const getCoaches = (params = {}) => 
  base44.functions.invoke('getSupabaseCoaches', params);

export const getChallenges = (params = {}) => 
  base44.functions.invoke('getSupabaseChallenges', params);

export const getEvents = (params = {}) => 
  base44.functions.invoke('getSupabaseEvents', params);

export const getFriends = (params = {}) => 
  base44.functions.invoke('getSupabaseFriends', params);

export const getGyms = (params = {}) => 
  base44.functions.invoke('getSupabaseGyms', params);

export const getMemberships = (params = {}) => 
  base44.functions.invoke('getSupabaseMemberships', params);

export const getMessages = (params = {}) => 
  base44.functions.invoke('getSupabaseMessages', params);

export const getNotifications = (params = {}) => 
  base44.functions.invoke('getSupabaseNotifications', params);

export const getGroups = (params = {}) => 
  base44.functions.invoke('getSupabaseGroups', params);

export const getGymClasses = (params = {}) => 
  base44.functions.invoke('getSupabaseGymClasses', params);

export const getGymMembers = (params = {}) => 
  base44.functions.invoke('getSupabaseGymMembers', params);

export const getGymRatings = (params = {}) => 
  base44.functions.invoke('getSupabaseGymRatings', params);

export const getGymStats = (params = {}) => 
  base44.functions.invoke('getSupabaseGymStats', params);

export const getPaymentMethods = (params = {}) => 
  base44.functions.invoke('getSupabasePaymentMethods', params);

export const getPayments = (params = {}) => 
  base44.functions.invoke('getSupabasePayments', params);

export const getPolls = (params = {}) => 
  base44.functions.invoke('getSupabasePolls', params);

export const getReferrals = (params = {}) => 
  base44.functions.invoke('getSupabaseReferrals', params);

export const getRewards = (params = {}) => 
  base44.functions.invoke('getSupabaseRewards', params);

export const getSubscriptions = (params = {}) => 
  base44.functions.invoke('getSupabaseSubscriptions', params);

export const getWorkoutLogs = (params = {}) => 
  base44.functions.invoke('getSupabaseWorkoutLogs', params);

// ===== UPDATE FUNCTIONS =====
export const updateRecord = (table, id, updates) => 
  base44.functions.invoke('updateSupabaseRecord', { table, id, updates });

export const updateGoal = (goalId, updates) => 
  base44.functions.invoke('updateSupabaseGoal', { goal_id: goalId, updates });

// ===== DELETE FUNCTIONS =====
export const deleteRecord = (table, id) => 
  base44.functions.invoke('deleteSupabaseRecord', { table, id });