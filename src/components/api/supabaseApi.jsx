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
export const getCheckIns = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseCheckIns', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getLifts = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseLifts', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getGoals = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseGoals', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getPosts = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabasePosts', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getBrandDiscountCodes = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseBrandDiscountCodes', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getAchievements = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseAchievements', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getChallengeParticipants = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseChallengeParticipants', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getClaimedBonuses = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseClaimedBonuses', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getCoaches = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseCoaches', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getChallenges = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseChallenges', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getEvents = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseEvents', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getFriends = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseFriends', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getGyms = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseGyms', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getMemberships = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseMemberships', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getMessages = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseMessages', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getNotifications = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseNotifications', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getGroups = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseGroups', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getGymClasses = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseGymClasses', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getGymMembers = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseGymMembers', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getGymRatings = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseGymRatings', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getGymStats = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseGymStats', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getPaymentMethods = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabasePaymentMethods', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getPayments = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabasePayments', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getPolls = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabasePolls', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getReferrals = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseReferrals', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getRewards = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseRewards', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getSubscriptions = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseSubscriptions', params);
  return Array.isArray(response?.data) ? response.data : [];
};

export const getWorkoutLogs = async (params = {}) => {
  const response = await base44.functions.invoke('getSupabaseWorkoutLogs', params);
  return Array.isArray(response?.data) ? response.data : [];
};

// ===== UPDATE FUNCTIONS =====
export const updateRecord = (table, id, updates) => 
  base44.functions.invoke('updateSupabaseRecord', { table, id, updates });

export const updateGoal = (goalId, updates) => 
  base44.functions.invoke('updateSupabaseGoal', { goal_id: goalId, updates });

// ===== DELETE FUNCTIONS =====
export const deleteRecord = (table, id) => 
  base44.functions.invoke('deleteSupabaseRecord', { table, id });