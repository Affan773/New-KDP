import { KdpNicheResearchResult } from '../types/niche';

export class KdpNicheExportService {
  /**
   * Generates and downloads KDP-Niche-Research.csv
   * Columns: Niche, Score, Audience, Sub-Niche, Keyword, Competition Signal, Opportunity, Source
   */
  public static exportToCsv(result: KdpNicheResearchResult): void {
    const headers = [
      'Niche',
      'Score',
      'Audience',
      'Sub-Niche',
      'Keyword',
      'Competition Signal',
      'Opportunity',
      'Source',
    ];

    const rows: string[][] = [];

    // Map sub-niches & keywords into comprehensive tabular rows
    const maxRows = Math.max(
      result.subNiches.length,
      result.keywords.coreKeywords.length,
      result.keywords.longTailKeywords.length,
      result.competitors.length
    );

    for (let i = 0; i < maxRows; i++) {
      const sub = result.subNiches[i];
      const kw = result.keywords.coreKeywords[i] || result.keywords.longTailKeywords[i - result.keywords.coreKeywords.length] || '';
      const comp = result.competitors[i];

      rows.push([
        this.escapeCsv(result.niche),
        this.escapeCsv(`${result.score.overallScore}/100 (${result.score.grade})`),
        this.escapeCsv(result.targetAudience),
        this.escapeCsv(sub ? sub.name : ''),
        this.escapeCsv(kw),
        this.escapeCsv(sub ? sub.competitionSignal : result.score.components.competitionSignal),
        this.escapeCsv(sub ? `${sub.opportunityScore}/100` : `${result.score.overallScore}/100`),
        this.escapeCsv(comp ? `${comp.source} (${comp.dataSource})` : 'KDP Studio Engine (Calculated)'),
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `KDP-Niche-Research-${result.niche.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a clean printable HTML document for saving as PDF
   */
  public static exportToPdfReport(result: KdpNicheResearchResult): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to generate the KDP Niche Research PDF report.');
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KDP Niche Research Report — ${result.niche}</title>
  <style>
    @media print {
      body { margin: 0; padding: 16mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
      .page-break { page-break-before: always; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      background-color: #ffffff;
      line-height: 1.5;
      padding: 32px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 4px 0;
    }
    .subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
    .score-badge {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 8px 16px;
      border-radius: 8px;
      text-align: right;
    }
    .score-number {
      font-size: 24px;
      font-weight: 800;
      line-height: 1;
    }
    .score-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin: 24px 0 12px 0;
      border-left: 4px solid #f59e0b;
      padding-left: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px;
      background: #f9fafb;
    }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      color: #4b5563;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 20px 0;
      font-size: 13px;
    }
    .table th {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      color: #374151;
    }
    .table td {
      border: 1px solid #e5e7eb;
      padding: 8px 10px;
      color: #1f2937;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      background: #e5e7eb;
      color: #374151;
    }
    .badge-high { background: #d1fae5; color: #065f46; }
    .badge-mod { background: #dbeafe; color: #1e40af; }
    .badge-user { background: #fef3c7; color: #92400e; }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      display: flex;
      justify-content: space-between;
    }
    .btn-print {
      background: #f59e0b;
      color: #000;
      border: none;
      padding: 10px 20px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: right; margin-bottom: 16px;">
    <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <h1 class="title">KDP Niche & Competitor Research Report</h1>
      <p class="subtitle">Topic: <strong>${result.niche}</strong> | Book Type: <strong>${result.bookType}</strong> | Audience: <strong>${result.targetAudience}</strong></p>
      <p class="subtitle" style="font-size: 12px; margin-top: 4px;">Marketplace: ${result.marketplace} | Date: ${result.timestamp}</p>
    </div>
    <div class="score-badge">
      <div class="score-number">${result.score.overallScore}/100</div>
      <div class="score-label">${result.score.grade}</div>
    </div>
  </div>

  <div class="card" style="margin-bottom: 20px;">
    <div class="card-title">Opportunity Summary & Studio Analysis</div>
    <p style="margin: 0; font-size: 13px; color: #374151;">${result.score.explanation}</p>
    <div style="margin-top: 10px; display: flex; gap: 12px; font-size: 12px;">
      <span><strong>Demand Signal:</strong> <span class="badge badge-high">${result.score.components.demandSignal}</span></span>
      <span><strong>Competition Signal:</strong> <span class="badge badge-mod">${result.score.components.competitionSignal}</span></span>
      <span><strong>Validation Status:</strong> <span class="badge ${result.validation.status === 'READY TO CREATE' ? 'badge-high' : 'badge-user'}">${result.validation.status}</span></span>
    </div>
  </div>

  <div class="section-title">1. Sub-Niche Discoveries & Opportunity Ratings</div>
  <table class="table">
    <thead>
      <tr>
        <th>Sub-Niche Direction</th>
        <th>Target Audience</th>
        <th>Opportunity</th>
        <th>Competition</th>
        <th>Differentiation Angle</th>
      </tr>
    </thead>
    <tbody>
      ${result.subNiches.map(s => `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td>${s.targetAudience}</td>
          <td><span class="badge ${s.opportunityScore >= 80 ? 'badge-high' : 'badge-mod'}">${s.opportunityScore}/100</span></td>
          <td>${s.competitionSignal}</td>
          <td style="font-size: 12px; color: #4b5563;">${s.differentiationAngle}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">2. Competitor Analysis & Public Catalog Benchmarks</div>
  <table class="table">
    <thead>
      <tr>
        <th>Book Title</th>
        <th>Author</th>
        <th>Format & Pages</th>
        <th>Price</th>
        <th>Reviews / Rating</th>
        <th>Source</th>
      </tr>
    </thead>
    <tbody>
      ${result.competitors.map(c => `
        <tr>
          <td><strong>${c.title}</strong><br><span style="font-size: 11px; color: #6b7280;">${c.subtitle || ''}</span></td>
          <td>${c.author}</td>
          <td>${c.format} (${c.pageCount || '—'}p)</td>
          <td>${c.price !== null ? (typeof c.price === 'number' ? `$${c.price.toFixed(2)}` : c.price) : '—'}</td>
          <td>${c.rating ? `★ ${c.rating} (${c.reviewCount || 0})` : '—'}</td>
          <td><span class="badge ${c.dataSource === 'User Provided' ? 'badge-user' : 'badge-mod'}">${c.dataSource}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">3. Content Gaps & Differentiation Strategies</div>
  <div class="grid-2">
    <div class="card">
      <div class="card-title">Identified Content Gaps (Opportunities)</div>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #374151;">
        ${result.contentGaps.map(g => `<li style="margin-bottom: 8px;"><strong>${g.potentialGap}</strong><br><span style="font-size: 11px; color: #6b7280;">${g.actionableAdvice}</span></li>`).join('')}
      </ul>
    </div>
    <div class="card">
      <div class="card-title">Recommended Differentiation Angles</div>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #374151;">
        ${result.differentiation.formatAngles.slice(0, 2).map(a => `<li style="margin-bottom: 6px;">${a}</li>`).join('')}
        ${result.differentiation.themeAngles.slice(0, 2).map(a => `<li style="margin-bottom: 6px;">${a}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="section-title">4. High-Opportunity Keywords (Phase 10 SEO Integration)</div>
  <div class="grid-2">
    <div class="card">
      <div class="card-title">Core Search Keywords</div>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px;">
        ${result.keywords.coreKeywords.map(k => `<li>${k}</li>`).join('')}
      </ul>
    </div>
    <div class="card">
      <div class="card-title">Long-Tail & Audience Phrases</div>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px;">
        ${result.keywords.longTailKeywords.map(k => `<li>${k}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="section-title">5. Data Transparency & Source Attribution</div>
  <table class="table">
    <thead>
      <tr>
        <th>Metric / Analysis Area</th>
        <th>Data Source</th>
        <th>Classification</th>
        <th>Timestamp</th>
      </tr>
    </thead>
    <tbody>
      ${result.dataSources.map(d => `
        <tr>
          <td><strong>${d.metric}</strong></td>
          <td>${d.source}</td>
          <td><span class="badge ${d.status === 'Verified' ? 'badge-high' : d.status === 'User Provided' ? 'badge-user' : 'badge-mod'}">${d.status}</span></td>
          <td>${d.timestamp}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <span>KDP Book & Puzzle Studio v2.5 — Niche & Competitor Research Engine</span>
    <span>Internal Studio Estimation — Not affiliated with Amazon Inc.</span>
  </div>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  private static escapeCsv(text: string): string {
    if (!text) return '""';
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
  }
}
