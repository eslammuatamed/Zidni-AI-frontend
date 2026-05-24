import { useRouter } from 'vue-router';

/**
 * Teacher dashboard navigation actions.
 *
 * Centralizes router.push calls for cards on the teacher dashboard. Each
 * extracted dashboard component imports this composable and picks out the
 * actions it needs.
 */
export function useTeacherDashboardActions() {
  const router = useRouter();

  return {
    goToCourses: () => router.push({ name: 'teacher-courses' }),
    goToLiveSessions: () => router.push({ name: 'teacher-live-sessions' }),
    goToTutoring: () => router.push({ name: 'teacher-tutoring' }),
    goToQuestionBanks: () => router.push({ name: 'teacher-question-banks' }),
    goToAssessments: () => router.push({ name: 'teacher-assessments' }),
    goToReports: () => router.push({ name: 'teacher-reports' }),
    goToBranding: () => router.push({ name: 'teacher-landing-content' }),
    goToLearning: () => router.push({ name: 'teacher-learning' }),
    goToAssistantTeam: () =>
      router.push({ name: 'teacher-assistants', hash: '#assistant-team' }),
    goToAssistantRoles: () =>
      router.push({ name: 'teacher-assistants', hash: '#assistant-roles' }),
  };
}
