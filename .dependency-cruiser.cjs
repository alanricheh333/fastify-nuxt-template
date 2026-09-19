const API = '^apps/api/src/'
const WEB = '^apps/web/app/'

module.exports = {
  forbidden: [
    {
      name: 'no-circular-dependencies',
      severity: 'error',
      comment: 'Circular dependencies make slice boundaries and initialization order unpredictable.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'api-shared-must-not-depend-on-slices',
      severity: 'error',
      comment: 'Backend shared code is lower-level and must not depend on feature slices.',
      from: { path: `${API}shared/` },
      to: { path: `${API}slices/` },
    },
    {
      name: 'web-shared-must-not-depend-on-slices',
      severity: 'error',
      comment: 'Frontend shared code is lower-level and must not depend on feature slices.',
      from: { path: `${WEB}shared/` },
      to: { path: `${WEB}slices/` },
    },
    {
      name: 'api-http-and-events-must-not-bypass-facade',
      severity: 'error',
      comment: 'HTTP/event adapters may depend on facade, DTO/schema, local transport helpers, types, const, errors, and shared code; they must not call service/rule/query/repository/db internals directly.',
      from: { path: `${API}slices/.+\\.(http|event)\\.ts$` },
      to: {
        path: `${API}slices/.*(?:\\.service\\.ts$|\\.rule\\.ts$|\\.query\\.ts$|\\.repository\\.ts$|/db/)`,
      },
    },
    {
      name: 'api-rules-must-not-depend-on-application-or-infrastructure',
      severity: 'error',
      comment: 'Rules must remain pure and may only depend on pure/local types, const, errors, helpers, other pure rules, and shared pure code.',
      from: { path: `${API}slices/.+\\.rule\\.ts$` },
      to: {
        path: `${API}slices/.*(?:\\.service\\.ts$|\\.facade\\.ts$|\\.query\\.ts$|\\.repository\\.ts$|\\.http\\.ts$|\\.event\\.ts$|/db/|/dto/)`,
      },
    },
    {
      name: 'api-queries-must-not-depend-upward',
      severity: 'error',
      comment: 'Queries may depend on DB/tables, DTOs/read-model types, const, errors, helpers, and shared code; they must not depend on services, rules, facades, HTTP, or events.',
      from: { path: `${API}slices/.+\\.query\\.ts$` },
      to: {
        path: `${API}slices/.*(?:\\.service\\.ts$|\\.rule\\.ts$|\\.facade\\.ts$|\\.http\\.ts$|\\.event\\.ts$)`,
      },
    },
    {
      name: 'api-repositories-must-not-depend-upward',
      severity: 'error',
      comment: 'Repositories are infrastructure operations and must not depend on service/rule/facade/query/transport code.',
      from: { path: `${API}slices/.+\\.repository\\.ts$` },
      to: {
        path: `${API}slices/.*(?:\\.service\\.ts$|\\.rule\\.ts$|\\.facade\\.ts$|\\.query\\.ts$|\\.http\\.ts$|\\.event\\.ts$)`,
      },
    },
    {
      name: 'api-cross-slice-access-only-through-facade',
      severity: 'error',
      comment: 'A backend slice may use another slice only through that target slice facade. Facade/service/query may freely use their own slice DTOs and shared code.',
      from: { path: `${API}slices/([^/]+)/.+` },
      to: {
        path: `${API}slices/(?!$1/)[^/]+/.+`,
        pathNot: `${API}slices/[^/]+/[^/]+\\.facade\\.ts$`,
      },
    },
    {
      name: 'web-pages-must-not-depend-on-slice-internals',
      severity: 'error',
      comment: 'Pages compose slices through their public entry points instead of deep-importing slice internals.',
      from: { path: `${WEB}pages/` },
      to: {
        path: `${WEB}slices/[^/]+/.+`,
        pathNot: `${WEB}slices/[^/]+/index\\.(ts|js)$`,
      },
    },
    {
      name: 'web-cross-slice-deep-imports-forbidden',
      severity: 'error',
      comment: 'A frontend slice may depend on another slice only through that target slice public index.',
      from: { path: `${WEB}slices/([^/]+)/.+` },
      to: {
        path: `${WEB}slices/(?!$1/)[^/]+/.+`,
        pathNot: `${WEB}slices/[^/]+/index\\.(ts|js)$`,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: '(^|/)(node_modules|dist|\\.nuxt|\\.output|coverage)/',
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
}
