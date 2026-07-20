function AuditReportSkeletonContent() {
  return (
    <div className="audit-report-page audit-report-skeleton" aria-busy="true" aria-label="Loading audit report">
      <div className="audit-report-skeleton__breadcrumb" />
      <div className="audit-report-skeleton__hero">
        <div className="audit-report-skeleton__hero-main">
          <div className="audit-report-skeleton__line audit-report-skeleton__line--sm" />
          <div className="audit-report-skeleton__line audit-report-skeleton__line--title" />
          <div className="audit-report-skeleton__line audit-report-skeleton__line--md" />
          <div className="audit-report-skeleton__chips">
            <div className="audit-report-skeleton__chip" />
            <div className="audit-report-skeleton__chip" />
            <div className="audit-report-skeleton__chip" />
          </div>
        </div>
        <div className="audit-report-skeleton__score" />
      </div>
      <div className="audit-report-skeleton__nav" />
      <div className="audit-report-layout">
        <div className="audit-report-layout__main">
          <div className="audit-report-skeleton__section">
            <div className="audit-report-skeleton__line audit-report-skeleton__line--sm" />
            <div className="audit-report-skeleton__line audit-report-skeleton__line--lg" />
            <div className="audit-report-skeleton__cards">
              <div className="audit-report-skeleton__card" />
              <div className="audit-report-skeleton__card" />
              <div className="audit-report-skeleton__card" />
            </div>
          </div>
          <div className="audit-report-skeleton__section">
            <div className="audit-report-skeleton__line audit-report-skeleton__line--lg" />
            <div className="audit-report-skeleton__block" />
          </div>
        </div>
        <aside className="audit-report-layout__rail">
          <div className="audit-report-skeleton__rail" />
        </aside>
      </div>
    </div>
  )
}

export { AuditReportSkeletonContent }
