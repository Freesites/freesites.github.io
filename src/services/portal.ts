import type { ContentJson } from '../schemas/content.schema';

export interface DashboardData {
  siteId: string;
  businessName: string;
  deployedUrl: string | null;
  deploymentStatus: string;
  lastDeployedAt: string | null;
  planTier: string;
  isFounderMember: boolean;
  activatedAt: string | null;
  lastChangeNote: string | null;
  isGenerating: boolean;
}

export function buildDashboardData(content: ContentJson): DashboardData {
  const { deployment, deploymentStatus } = content;

  const lastChangeNote =
    content.changeHistory.length > 0
      ? content.changeHistory[content.changeHistory.length - 1].note
      : null;

  const isGenerating =
    deploymentStatus === 'generating' ||
    deploymentStatus === 'generated' ||
    deploymentStatus === 'deploying';

  return {
    siteId: content.siteId,
    businessName: content.business.name,
    deployedUrl: deployment.deployedUrl,
    deploymentStatus,
    lastDeployedAt: deployment.deployedAt,
    planTier: content.planTier,
    isFounderMember: content.isFounderMember,
    activatedAt: content.billing.activatedAt,
    lastChangeNote,
    isGenerating,
  };
}
