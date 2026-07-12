import 'dotenv/config';
import connectDB from '../config/db.js';
import Project from '../models/Project.js';
import { portfolioProjects } from '../data/portfolioProjects.js';

const FORCE = process.env.PORTFOLIO_FORCE === 'true';

const mutableFields = [
  'slug',
  'title',
  'summary',
  'shortDescription',
  'fullDescription',
  'projectClassification',
  'industry',
  'websiteType',
  'platform',
  'technologies',
  'repositoryUrl',
  'liveUrl',
  'thumbnail',
  'mockupImages',
  'galleryImages',
  'featured',
  'published',
  'displayOrder',
  'completionDate',
  'clientName',
  'projectOverview',
  'challenge',
  'solution',
  'keyFeatures',
  'responsiveHighlights',
  'servicesProvided',
  'resultSummary',
  'status',
  'seoTitle',
  'seoDescription',
  'imageAltText',
];

function isUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function validate(project) {
  const errors = [];
  if (!project.slug) errors.push('missing slug');
  if (!project.title) errors.push('missing title');
  for (const key of ['liveUrl', 'repositoryUrl', 'thumbnail']) {
    if (!isUrl(project[key])) errors.push(`invalid ${key}`);
  }
  if (project.published && !project.liveUrl) errors.push('published project requires liveUrl');
  return errors;
}

function buildPatch(existing, project) {
  const patch = {};
  for (const key of mutableFields) {
    if (!(key in project)) continue;
    const incoming = project[key];
    const current = existing?.[key];
    const emptyCurrent =
      current === undefined ||
      current === null ||
      current === '' ||
      (Array.isArray(current) && current.length === 0);

    if (
      key === 'slug' ||
      FORCE ||
      emptyCurrent ||
      ['published', 'featured', 'displayOrder', 'status'].includes(key)
    ) {
      patch[key] = incoming;
    }
  }
  return patch;
}

async function run() {
  await connectDB();

  const report = {
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    items: [],
  };

  for (const project of portfolioProjects) {
    const errors = validate(project);
    if (errors.length) {
      report.failed += 1;
      report.items.push({ slug: project.slug || project.title, status: 'failed', errors });
      continue;
    }

    try {
      const existing = await Project.findOne({
        $or: [
          { slug: project.slug },
          { title: project.title },
        ],
      });
      if (!existing) {
        await Project.create(project);
        report.imported += 1;
        report.items.push({ slug: project.slug, status: 'imported', published: project.published });
        continue;
      }

      const patch = buildPatch(existing.toObject(), project);
      if (!Object.keys(patch).length) {
        report.skipped += 1;
        report.items.push({ slug: project.slug, status: 'skipped' });
        continue;
      }

      await Project.updateOne({ _id: existing._id }, { $set: patch }, { runValidators: true });
      report.updated += 1;
      report.items.push({ slug: project.slug, status: 'updated', fields: Object.keys(patch) });
    } catch (error) {
      report.failed += 1;
      report.items.push({
        slug: project.slug,
        status: 'failed',
        errors: [error.message || 'unknown error'],
      });
    }
  }

  console.log(JSON.stringify(report, null, 2));
  await Project.db.close();
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
