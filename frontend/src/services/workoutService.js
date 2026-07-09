import apiClient from './apiClient';

export const workoutService = {
  // Admin Workout APIs
  getWorkouts: () => apiClient.get('/api/workouts'),
  
  getWorkoutById: (id) => apiClient.get(`/api/workouts/${id}`),
  
  createWorkout: (workoutData) => apiClient.post('/api/workouts', workoutData),
  
  updateWorkout: (id, workoutData) => apiClient.put(`/api/workouts/${id}`, workoutData),
  
  deleteWorkout: (id) => apiClient.delete(`/api/workouts/${id}`),

  // Workout Day APIs
  addWorkoutDay: (workoutId, dayData) => apiClient.post(`/api/workouts/${workoutId}/days`, dayData),
  
  updateWorkoutDay: (dayId, dayData) => apiClient.put(`/api/workouts/days/${dayId}`, dayData),
  
  deleteWorkoutDay: (dayId) => apiClient.delete(`/api/workouts/days/${dayId}`),

  // Assignment APIs
  assignMembers: (workoutId, memberIds) => apiClient.post(`/api/workouts/${workoutId}/assign`, { memberIds }),
  
  unassignMember: (workoutId, memberId) => apiClient.delete(`/api/workouts/${workoutId}/unassign/${memberId}`),

  // Member Portal APIs
  getMyWorkouts: () => apiClient.get('/api/my-workouts'),
  
  getMyWorkoutById: (id) => apiClient.get(`/api/my-workouts/${id}`),
};
