/** Company-specific customer journey definitions (from the 4 weekly CSV exports). */

const NYUULY_JOURNEYS = [
  {
    id: 'awareness',
    title: 'Awareness & Arrival',
    subtitle: 'Social + Traffic',
    description: 'How users discover NyuuLy and which channels bring them to the site.',
    status: 'live',
    sources: ['social', 'traffic'],
    pagePatterns: [],
  },
  {
    id: 'explore-no-action',
    title: 'Explore — Browse Only',
    subtitle: 'Pages + Funnel + Traffic',
    description: 'Users browse NyuuLy pages (compass, info, mobile) without converting.',
    status: 'live',
    sources: ['pages', 'funnel', 'traffic'],
    pagePatterns: ['/', '/about', '/compass', '/info-hub', '/ja', '/info', '/mobile'],
    excludePatterns: ['/apply', '/welcome-package', '/mobile/sim/apply'],
  },
  {
    id: 'explore-convert',
    title: 'Explore → Subscribe',
    subtitle: 'Pages + Funnel',
    description: 'Users browse then subscribe to NyuuLy or start SIM / mobile paths.',
    status: 'live',
    sources: ['pages', 'funnel', 'traffic'],
    pagePatterns: ['/apply', '/mobile/sim/apply', '/compass/student', '/mobile/sim/plans', '/signup'],
    excludePatterns: [],
  },
  {
    id: 'welcome-package',
    title: 'Welcome Package',
    subtitle: 'Pages + Funnel',
    description: 'Welcome package journey — early / future flow.',
    status: 'future',
    sources: ['pages', 'funnel'],
    pagePatterns: ['/welcome-package'],
    excludePatterns: [],
  },
  {
    id: 'nyuuly-application',
    title: 'Mobile SIM Application',
    subtitle: 'Pages + Funnel',
    description: 'NyuuLy mobile SIM sign-up flow with step-by-step drop-off.',
    status: 'live',
    sources: ['pages', 'funnel'],
    pagePatterns: ['/mobile/sim'],
    excludePatterns: [],
    applicationSteps: [
      { label: 'Mobile / SIM interest', path: '/mobile' },
      { label: 'View SIM plans', path: '/mobile/sim/plans' },
      { label: 'Start application', path: '/mobile/sim/apply' },
      { label: 'Verify identity', path: '/mobile/sim/apply/verify' },
      { label: 'Support / contact', path: '/mobile/sim/support/contact' },
    ],
  },
];

const WORKJAPAN_JOURNEYS = [
  {
    id: 'awareness',
    title: 'Instagram → Website Arrival',
    subtitle: 'Social + Traffic',
    description: 'Job posts on @jobsforforeigners drive users to workjapan.jp via search, direct, and social channels.',
    status: 'live',
    sources: ['social', 'traffic'],
    pagePatterns: [],
  },
  {
    id: 'browse-jobs',
    title: 'Browse Jobs — No Application',
    subtitle: 'Pages + Funnel + Traffic',
    description: 'Users explore homepage, job listings, and jobseeker content without registering or applying.',
    status: 'live',
    sources: ['pages', 'funnel', 'traffic'],
    matcher: 'wj-browse',
  },
  {
    id: 'job-detail',
    title: 'Job Detail Views',
    subtitle: 'Pages + Traffic',
    description: 'Users view specific job postings (factory, warehouse, taxi, hotel, etc.) — top of the apply funnel.',
    status: 'live',
    sources: ['pages', 'traffic'],
    matcher: 'wj-job-detail',
  },
  {
    id: 'register-apply',
    title: 'Register & Apply',
    subtitle: 'Pages + Funnel',
    description: 'Users sign up and reach applicant dashboard — conversion from browsing to applying.',
    status: 'live',
    sources: ['pages', 'funnel'],
    pagePatterns: ['/register', '/jobseeker/how-to-find-job-and-apply', '/dashboard/applicants'],
    excludePatterns: [],
  },
  {
    id: 'employer',
    title: 'Employer Journey',
    subtitle: 'Pages + Traffic',
    description: 'Employers exploring hire-foreigner content, registration, and job dashboard.',
    status: 'live',
    sources: ['pages', 'traffic'],
    pagePatterns: ['/employer', '/dashboard/jobs', '/dashboard/billing'],
    excludePatterns: [],
  },
  {
    id: 'seeker-application',
    title: 'Job Seeker Application Funnel',
    subtitle: 'Pages + Funnel',
    description: 'Full path from homepage → job listings → job detail → register → applicant dashboard, with drop-off at each step.',
    status: 'live',
    sources: ['pages', 'funnel'],
    applicationSteps: [
      { label: 'Homepage', path: '/' },
      { label: 'Job listings (/jobs/)', path: '/jobs/', exact: true },
      { label: 'Job detail pages', path: '__job_detail_aggregate__' },
      { label: 'Register account', path: '/register' },
      { label: 'Applicant dashboard', path: '/dashboard/applicants' },
    ],
  },
];

const FILE_TYPES = ['social', 'funnel', 'traffic', 'pages'];

const FILE_TYPE_LABELS = {
  social: 'Social Media Posts',
  funnel: 'Funnel Data (GA4)',
  traffic: 'Traffic Acquisition (GA4)',
  pages: 'Pages & Screens (GA4)',
};

const LANDING_PAGE_PATHS = {
  nyuuly: ['/', '/ja', '/mobile', '/compass', '/welcome-package', '/about', '/info-hub'],
  workjapan: ['/', '/jobs/', '/jobseeker/'],
};

const COMPANY_LABELS = {
  nyuuly: 'NyuuLy',
  workjapan: 'WORK JAPAN',
};

function getJourneys(company) {
  if (company === 'workjapan') return WORKJAPAN_JOURNEYS;
  if (company === 'nyuuly') return NYUULY_JOURNEYS;
  return WORKJAPAN_JOURNEYS;
}

function resolveCompany(company) {
  return company === 'all' ? 'workjapan' : company;
}

function isJobDetailPage(path) {
  if (!path || !path.startsWith('/jobs/')) return false;
  const normalized = path.endsWith('/') && path !== '/jobs/' ? path.slice(0, -1) : path;
  return normalized !== '/jobs';
}

function isWjBrowsePage(path) {
  if (!path) return false;
  if (path === '/' || path === '/jobs/' || path === '/jobs') return true;
  if (path.startsWith('/jobseeker')) return true;
  if (isJobDetailPage(path)) return false;
  if (path === '/register' || path.startsWith('/dashboard') || path.startsWith('/employer')) return false;
  return false;
}

function pathMatches(path, patterns, excludePatterns = []) {
  if (!path) return false;
  if (excludePatterns.some((ex) => path === ex || path.startsWith(`${ex}/`))) return false;
  return patterns.some((p) => path === p || path.startsWith(`${p}/`));
}

function aggregatePagesForJourney(pages, journey) {
  if (!journey) {
    return { pages: [], totalViews: 0, totalUsers: 0, totalKeyEvents: 0 };
  }

  let matched;
  if (journey.matcher === 'wj-browse') {
    matched = pages.filter((p) => isWjBrowsePage(p.page_path));
  } else if (journey.matcher === 'wj-job-detail') {
    matched = pages.filter((p) => isJobDetailPage(p.page_path));
  } else {
    matched = pages.filter((p) =>
      pathMatches(p.page_path, journey.pagePatterns || [], journey.excludePatterns || [])
    );
  }

  return {
    pages: matched.sort((a, b) => b.views - a.views),
    totalViews: matched.reduce((s, p) => s + (p.views || 0), 0),
    totalUsers: matched.reduce((s, p) => s + (p.active_users || 0), 0),
    totalKeyEvents: matched.reduce((s, p) => s + (p.key_events || 0), 0),
  };
}

function aggregateJobDetails(pages) {
  const jobDetails = pages.filter((p) => isJobDetailPage(p.page_path));
  return {
    pages: jobDetails.sort((a, b) => b.views - a.views),
    totalViews: jobDetails.reduce((s, p) => s + (p.views || 0), 0),
    totalUsers: jobDetails.reduce((s, p) => s + (p.active_users || 0), 0),
  };
}

function getTopJobCategories(pages, limit = 10) {
  const counts = {};
  for (const p of pages) {
    if (!isJobDetailPage(p.page_path)) continue;
    const match = p.page_path.match(/^\/jobs\/([^/]+)/);
    if (!match) continue;
    const category = match[1].replace(/-/g, ' ');
    if (!counts[category]) counts[category] = { category, views: 0, users: 0, jobs: 0 };
    counts[category].views += p.views || 0;
    counts[category].users += p.active_users || 0;
    counts[category].jobs += 1;
  }
  return Object.values(counts).sort((a, b) => b.views - a.views).slice(0, limit);
}

function buildApplicationFunnel(pages, steps) {
  if (!steps) return [];
  const jobDetailAgg = aggregateJobDetails(pages);

  const funnel = steps.map((step) => {
    if (step.path === '__job_detail_aggregate__') {
      return {
        label: step.label,
        path: '/jobs/*',
        views: jobDetailAgg.totalViews,
        users: jobDetailAgg.totalUsers,
        keyEvents: 0,
      };
    }

    const row = step.exact
      ? pages.find((p) => p.page_path === step.path || p.page_path === step.path.replace(/\/$/, ''))
      : pages.find((p) => p.page_path === step.path)
        || pages.find((p) => p.page_path.startsWith(`${step.path}/`));

    return {
      label: step.label,
      path: step.path,
      views: row?.views || 0,
      users: row?.active_users || 0,
      keyEvents: row?.key_events || 0,
    };
  });

  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1].users || funnel[i - 1].views || 1;
    const curr = funnel[i].users || funnel[i].views || 0;
    funnel[i].dropOffPct = prev > 0 ? Math.round((1 - curr / prev) * 1000) / 10 : 0;
    funnel[i].retentionPct = prev > 0 ? Math.round((curr / prev) * 1000) / 10 : 0;
  }
  if (funnel.length) {
    funnel[0].dropOffPct = 0;
    funnel[0].retentionPct = 100;
  }

  return funnel;
}

function buildGa4FunnelSteps(funnelRows) {
  const totals = funnelRows.filter((r) => r.device_category === 'Total');
  return totals
    .map((r) => ({
      step: r.step,
      stepLabel: (r.step || '').replace(/^\d+\.\s*/, ''),
      users: r.active_users || 0,
      completionRate: r.completion_rate || 0,
      abandonments: r.abandonments || 0,
      abandonmentRate: r.abandonment_rate || 0,
    }))
    .sort((a, b) => (a.step || '').localeCompare(b.step || ''));
}

function getLandingPages(pages, company) {
  const key = company === 'nyuuly' ? 'nyuuly' : 'workjapan';
  const paths = LANDING_PAGE_PATHS[key];

  return pages
    .filter((p) => paths.includes(p.page_path) || (key === 'nyuuly' && p.page_path.match(/^\/(about|info-hub)/)))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8)
    .map((p) => ({
      path: p.page_path,
      views: p.views,
      users: p.active_users,
      viewsPerUser: p.views_per_user,
      nextLikely: getNextLikelyPages(p, pages, company),
    }));
}

function getNextLikelyPages(landing, allPages, company) {
  if (company === 'workjapan') {
    if (landing.page_path === '/') return ['/jobs/', '/jobseeker/'];
    if (landing.page_path === '/jobs/') {
      return allPages
        .filter((p) => isJobDetailPage(p.page_path))
        .sort((a, b) => b.views - a.views)
        .slice(0, 3)
        .map((p) => p.page_path);
    }
    if (landing.page_path.startsWith('/jobseeker')) return ['/jobs/', '/register'];
  }

  return allPages
    .filter((other) => other.page_path !== landing.page_path && other.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 3)
    .map((o) => o.page_path);
}

module.exports = {
  NYUULY_JOURNEYS,
  WORKJAPAN_JOURNEYS,
  FILE_TYPES,
  FILE_TYPE_LABELS,
  COMPANY_LABELS,
  getJourneys,
  resolveCompany,
  pathMatches,
  aggregatePagesForJourney,
  aggregateJobDetails,
  getTopJobCategories,
  buildApplicationFunnel,
  buildGa4FunnelSteps,
  getLandingPages,
  isJobDetailPage,
};
