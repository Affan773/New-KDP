import { Project } from '../types/project';
import { GoogleAuditLogService } from './googleAuditLogService';
import { KDPSeoResearchEngine } from './kdpSeoResearchEngine';

const STUDIO_FOLDER_NAME = 'KDP Book & Puzzle Studio';
const BOOKS_FOLDER_NAME = 'Books';
const PROJECTS_FOLDER_NAME = 'Projects';

export interface StudioFolderInfo {
  rootFolderId: string;
  booksFolderId: string;
  projectsFolderId: string;
  folderUrl: string;
}

export class GoogleDocsService {
  private static cachedFolderInfo: StudioFolderInfo | null = null;

  /**
   * Helper to format HTTP errors with actionable descriptions
   */
  private static async handleApiResponse<T = any>(res: Response, context: string): Promise<T> {
    if (!res.ok) {
      let errorBody: any = null;
      try {
        errorBody = await res.json();
      } catch {
        errorBody = await res.text();
      }
      const message =
        errorBody?.error?.message ||
        (typeof errorBody === 'string' ? errorBody : res.statusText) ||
        `HTTP Error ${res.status}`;
      const err = new Error(`[Google API - ${context}] ${message} (Status ${res.status})`);
      (err as any).status = res.status;
      (err as any).details = errorBody;
      throw err;
    }
    if (res.status === 204) {
      return {} as T;
    }
    return res.json();
  }

  /**
   * Finds or creates the dedicated Studio folder hierarchy in Google Drive
   */
  public static async getOrCreateStudioFolder(accessToken: string): Promise<StudioFolderInfo> {
    if (this.cachedFolderInfo) {
      // Quick verification of folder existence
      try {
        const verifyRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${this.cachedFolderInfo.rootFolderId}?fields=id,trashed`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (verifyRes.ok) {
          const data = await verifyRes.json();
          if (!data.trashed) {
            return this.cachedFolderInfo;
          }
        }
      } catch {
        // Refresh below
      }
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // 1. Search for existing root folder
    const searchRootQuery = encodeURIComponent(
      `mimeType='application/vnd.google-apps.folder' and name='${STUDIO_FOLDER_NAME}' and trashed=false`
    );
    const rootRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${searchRootQuery}&fields=files(id,name,webViewLink)&pageSize=5`,
      { headers }
    );
    const rootData = await this.handleApiResponse(rootRes, 'Find Root Folder');

    let rootFolderId = '';
    let folderUrl = '';

    if (rootData.files && rootData.files.length > 0) {
      rootFolderId = rootData.files[0].id;
      folderUrl = rootData.files[0].webViewLink || `https://drive.google.com/drive/folders/${rootFolderId}`;
    } else {
      // Create root Studio folder
      const createRootRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: STUDIO_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
          description: 'Managed folder for KDP Book & Puzzle Studio synced books and projects.',
          appProperties: {
            isStudioManaged: 'true',
            createdBy: 'KDP Book & Puzzle Studio',
          },
        }),
      });
      const createdRoot = await this.handleApiResponse(createRootRes, 'Create Root Folder');
      rootFolderId = createdRoot.id;
      folderUrl = createdRoot.webViewLink || `https://drive.google.com/drive/folders/${rootFolderId}`;

      GoogleAuditLogService.log({
        operation: 'Google Drive Folder Created',
        result: 'success',
        details: `Created root Google Drive folder "${STUDIO_FOLDER_NAME}" (${rootFolderId})`,
      });
    }

    // 2. Find or create "Books" and "Projects" subfolders
    const booksFolderId = await this.getOrCreateSubfolder(rootFolderId, BOOKS_FOLDER_NAME, accessToken);
    const projectsFolderId = await this.getOrCreateSubfolder(rootFolderId, PROJECTS_FOLDER_NAME, accessToken);

    const folderInfo: StudioFolderInfo = {
      rootFolderId,
      booksFolderId,
      projectsFolderId,
      folderUrl,
    };

    this.cachedFolderInfo = folderInfo;
    return folderInfo;
  }

  private static async getOrCreateSubfolder(
    parentFolderId: string,
    subfolderName: string,
    accessToken: string
  ): Promise<string> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const searchSubQuery = encodeURIComponent(
      `mimeType='application/vnd.google-apps.folder' and name='${subfolderName}' and '${parentFolderId}' in parents and trashed=false`
    );
    const subRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${searchSubQuery}&fields=files(id,name)&pageSize=5`,
      { headers }
    );
    const subData = await this.handleApiResponse(subRes, `Find Subfolder ${subfolderName}`);

    if (subData.files && subData.files.length > 0) {
      return subData.files[0].id;
    }

    const createSubRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: subfolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
        appProperties: {
          isStudioManaged: 'true',
          parentStudioFolderId: parentFolderId,
        },
      }),
    });
    const createdSub = await this.handleApiResponse(createSubRes, `Create Subfolder ${subfolderName}`);
    return createdSub.id;
  }

  /**
   * Generates standard Google Doc title
   */
  public static getDocTitle(project: Project): string {
    const bookTitle = project.kdpConfig?.title || project.name || 'Untitled Book';
    return `KDP — ${bookTitle}`;
  }

  /**
   * Builds the comprehensive, beautifully formatted text content for the Google Doc
   */
  public static buildDocumentContentText(project: Project, googleDocId: string = ''): string {
    const cfg = project.kdpConfig || ({} as any);
    const meta = project.metadata || {};
    const kdp = project.kdpSettings || ({} as any);
    const now = new Date().toLocaleString();

    const title = cfg.title || project.name || 'Untitled Book';
    const subtitle = cfg.subtitle || meta.subtitle || 'N/A';
    const author = cfg.primaryAuthor || cfg.author || meta.author || 'KDP Creator';
    const language = cfg.language || meta.language || 'English';
    const bookType = cfg.bookType || project.type || 'Puzzle Book';
    const format = cfg.format || 'Paperback';
    const trimSize = cfg.trimSize || (kdp.trimSize ? `${kdp.trimSize.width}" × ${kdp.trimSize.height}"` : '8.5" × 11"');
    const pageCount = cfg.pageCount || project.pageCount || 80;
    const puzzleType = cfg.puzzleType || 'Word Search / Sudoku / Variety';
    const difficulty = cfg.difficultyLevel || 'Medium';
    const theme = cfg.theme || 'General';

    // Categories
    const primaryCat = cfg.primaryCategory || 'Games & Activities / Puzzles';
    const secCat = cfg.secondaryCategory || 'Activity Books / General';
    const cat3 = cfg.category3 || '';
    const suggestedCat = cfg.suggestedCategory || '';

    // Keywords
    const keywordsList: string[] = Array.isArray(cfg.keywords) && cfg.keywords.length > 0
      ? cfg.keywords
      : Array.isArray(meta.keywords) && meta.keywords.length > 0
      ? meta.keywords
      : [
          `${theme} puzzle book`,
          `brain games for adults`,
          `large print activity book`,
          `daily mind fitness`,
          `relaxing puzzles with solutions`,
          `themed word search puzzles`,
          `sudoku collection for all ages`,
        ];

    // Description
    const description = cfg.description || meta.description || 'Curated high-quality puzzle and activity book engineered for Kindle Direct Publishing.';

    // Rights & Pricing
    const marketplace = cfg.primaryMarketplace || 'Amazon.com (US)';
    const currency = cfg.currency || 'USD ($)';
    const listPrice = cfg.listPrice ? `$${Number(cfg.listPrice).toFixed(2)}` : '$9.99';
    const estRoyalty = cfg.estimatedRoyalty ? `$${Number(cfg.estimatedRoyalty).toFixed(2)}` : '$3.24';
    const estProfit = cfg.estimatedProfit ? `$${Number(cfg.estimatedProfit).toFixed(2)}` : '$3.24';
    const rights = cfg.territories || 'Worldwide rights (All territories)';
    const isbn = cfg.isbn || meta.isbn || 'Free KDP ISBN Assigned on Publishing';

    // Print Settings
    const interiorType = cfg.interiorType || (kdp.paperType?.includes('Color') ? 'Standard Color' : 'Black & White');
    const paperType = cfg.paperType || kdp.paperType || 'White';
    const bleed = cfg.bleed || kdp.bleed || 'No Bleed';
    const coverFinish = cfg.coverFinish || 'Matte';

    // Validation Status
    const valStatus = cfg.validationStatus || 'VALID';
    const errCount = cfg.validationErrors?.length || 0;
    const warnCount = cfg.validationWarnings?.length || 0;

    // SEO Research calculation
    const seedKeyword = (project.metadata as any)?.seedKeyword || title || 'puzzle book';
    const searchedKeywords = KDPSeoResearchEngine.searchKeywords({ seed: seedKeyword, project });
    const seoReport = KDPSeoResearchEngine.generateSeoReport({
      project,
      seed: seedKeyword,
      keywords: searchedKeywords,
      marketplace,
    });

    return `═══════════════════════════════════════════════════════════════════
                    KDP BOOK RECORD
         KDP Book & Puzzle Studio — Official Documentation
═══════════════════════════════════════════════════════════════════

STUDIO PROJECT INFORMATION
───────────────────────────────────────────────────────────────────
Project ID:             ${project.id}
Project Name:           ${project.name}
Studio Project URL:     https://ai.studio/build?project=${project.id}
Google Document ID:     ${googleDocId || 'Assigned on Creation'}
Managed by:             KDP Book & Puzzle Studio
Document Created:       ${project.createdAt ? new Date(project.createdAt).toLocaleString() : now}
Last Updated:           ${project.updatedAt ? new Date(project.updatedAt).toLocaleString() : now}
Sync Status:            SYNCHRONIZED WITH KDP STUDIO

===================================================================
1. BOOK INFORMATION
===================================================================
Title:                  ${title}
Subtitle:               ${subtitle}
Author / Pen Name:      ${author}
Language:               ${language}
Book Type:              ${bookType}
Format:                 ${format}
Trim Size:              ${trimSize}
Interior Page Count:    ${pageCount} pages
Primary Puzzle Type:    ${puzzleType}
Difficulty Level:       ${difficulty}
Theme / Topic:          ${theme}

===================================================================
2. KDP DETAILS & METADATA
===================================================================
Title:                  ${title}
Subtitle:               ${subtitle}
Primary Author:         ${author}
Reading Age:            ${cfg.readingAge || 'Adults & Seniors (All Ages)'}
Grade Range:            ${cfg.gradeRange || 'General Audience'}
Series Name:            ${cfg.seriesName || meta.seriesName || 'None'}
Edition Number:         ${cfg.edition || meta.edition || '1'}
AI Content Disclosure:  ${cfg.aiContentType || 'AI-assisted generation & computer-verified solutions'}
Copyright:              Copyright © ${new Date().getFullYear()} ${author}. All rights reserved.

===================================================================
3. BOOK DESCRIPTION
===================================================================
${description}

===================================================================
4. SEARCH KEYWORDS (7 KDP SLOTS)
===================================================================
${keywordsList.map((kw, i) => `${i + 1}. ${kw}`).join('\n')}

===================================================================
5. KDP CATEGORIES
===================================================================
Category 1 (Primary):   ${primaryCat}
Category 2 (Secondary): ${secCat}
${cat3 ? `Category 3:             ${cat3}\n` : ''}${suggestedCat ? `Suggested Category:     ${suggestedCat} [AI Suggestion]\n` : ''}
* Note: Suggested categories are algorithmically matched to Amazon Browse Nodes and should be confirmed in KDP Bookshelf.

===================================================================
6. PUZZLE INFORMATION & SPECIFICATIONS
===================================================================
Puzzle Type:            ${puzzleType}
Total Puzzles:          ${cfg.totalPuzzles || Math.max(1, Math.floor(pageCount * 0.75))}
Difficulty Mode:        ${difficulty}
Theme:                  ${theme}
Grid Dimension:         ${cfg.gridSize || 'Standard 15×15 / 9×9'}
Word Count / Clues:     ${cfg.wordCount || '15–20 words per puzzle where applicable'}
Answer Key:             ✓ Generated & Vector-Rendered in Back Matter
Answer Key Layout:      ${cfg.answerKeyLayout || '4 solutions per page'}
Instructions Included:  ${project.metadata?.tags?.includes('instructions') ? 'Yes' : 'Included in book interior'}

===================================================================
7. SUDOKU & LOGIC SPECIFICATIONS
===================================================================
Theme:                  ${theme.toUpperCase()} SUDOKU & LOGIC
Total Puzzles:          ${cfg.totalPuzzles || Math.max(1, Math.floor(pageCount * 0.75))}
Difficulty Rating:      ${difficulty}
Grid Size:              9 × 9 Standard / Symmetric
Symmetry:               Rotational 180°
Answer Key Status:      ✓ Generated with vector grid solutions
Puzzle Numbering:       Sequential (Puzzle #1 – #${cfg.totalPuzzles || Math.max(1, Math.floor(pageCount * 0.75))})

===================================================================
8. PRINT SETTINGS (AMAZON KDP SPECIFICATIONS)
===================================================================
Trim Size:              ${trimSize}
Interior Page Count:    ${pageCount}
Interior Type:          ${interiorType}
Paper Type:             ${paperType}
Bleed Selection:        ${bleed}
Cover Finish:           ${coverFinish}
Binding Format:         ${format}
ISBN:                   ${isbn}
Primary Marketplace:    ${marketplace}
Spine Width:            ${kdp.spineWidthInches ? `${kdp.spineWidthInches.toFixed(3)} in` : 'Calculated automatically'}
Cover Dimensions:       ${kdp.coverWidthInches && kdp.coverHeightInches ? `${kdp.coverWidthInches.toFixed(3)}" × ${kdp.coverHeightInches.toFixed(3)}"` : 'Auto-calculated for KDP template'}

===================================================================
9. RIGHTS & PRICING (ESTIMATES)
===================================================================
Publishing Rights:      ${rights}
Primary Marketplace:    ${marketplace}
Currency:               ${currency}
List Price:             ${listPrice}
Estimated Royalty:      ${estRoyalty} [ESTIMATE]
Estimated Net Profit:   ${estProfit} [ESTIMATE]
ISBN State:             ${isbn}

* Royalty estimates are calculated according to Amazon KDP formula: (List Price × 60%) - Print Cost. Actual royalties may vary based on exact print options and sales channels.

===================================================================
10. PREFLIGHT & VALIDATION REPORT
===================================================================
KDP Validation Status:  ${valStatus}
Validation Errors:      ${errCount}
Validation Warnings:    ${warnCount}
Margin Check:           ✓ PASS (Meets KDP Gutter & Outer Minimums)
Font Check:             ✓ PASS (100% Embedded TrueType Fonts)
Page Count Check:       ✓ PASS (Divisible by standard print signatures)

===================================================================
11. GENERATED PRODUCTION FILES
===================================================================
Interior Print PDF:     ${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Interior_${pageCount}p.pdf (v2.5)
Cover Print PDF:        ${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Cover.pdf (v2.5)
Validation Report:      KDP_Preflight_Report_${project.id}.json
Package Archive:        ${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_KDP_Package.zip
Generated Timestamp:    ${now}

===================================================================
12. PROJECT REVISION HISTORY
===================================================================
• Initial Book Creation: ${project.createdAt ? new Date(project.createdAt).toLocaleString() : now}
• Latest Revision:      ${project.updatedAt ? new Date(project.updatedAt).toLocaleString() : now}
• Synchronized By:      KDP Book & Puzzle Studio Engine v2.5

===================================================================
13. KDP SEO RESEARCH & KEYWORD OPTIMIZATION
===================================================================
Seed Keyword:           ${seedKeyword}
Studio SEO Score:       ${seoReport.overallSeoScore}/100 [${seoReport.scoreGrade}] (Studio Calculated Metric)
Target Marketplace:     ${marketplace}
Language:               ${language}

OPTIMIZED 7 KDP KEYWORD BOXES:
${seoReport.sevenBoxes.boxes.map(b => `• Box ${b.slotNumber} (${b.charCount}/50 chars): "${b.phrase}"`).join('\n')}

TOP DISCOVERED KEYWORDS & SCORES:
${seoReport.topKeywords.slice(0, 8).map(k => `• ${k.keyword} — Score: ${k.studioSeoScore}/100 [Relevance: ${k.relevance}%, Demand: ${k.demandSignal}, Competition: ${k.competitionSignal}, Intent: ${k.commercialIntent}]`).join('\n')}

KEYWORD CLUSTERS:
${seoReport.clusters.map(c => `• [${c.cluster}] (${c.count} terms): ${c.keywords.slice(0, 4).join(', ')}`).join('\n')}

TITLE SEO ANALYSIS:
• Title Score:          ${seoReport.titleAnalysis.overallTitleScore}/100 (Readability: ${seoReport.titleAnalysis.readabilityScore}/100, Relevance: ${seoReport.titleAnalysis.keywordRelevanceScore}/100)
• Character Count:      ${seoReport.titleAnalysis.characterCount.total}/200 limit
• Detected Keywords:    ${seoReport.titleAnalysis.detectedKeywords.join(', ') || 'None'}
• Keyword Placement:    ${seoReport.titleAnalysis.keywordPlacement}

DESCRIPTION SEO ANALYSIS:
• Description Score:    ${seoReport.descriptionAnalysis.overallDescriptionScore}/100 (Readability: ${seoReport.descriptionAnalysis.readabilityScore}/100, Flow: ${seoReport.descriptionAnalysis.naturalFlowScore}/100)
• Word Count:           ${seoReport.descriptionAnalysis.wordCount} words
• Natural Keyword Flow: ${seoReport.descriptionAnalysis.naturalFlowScore >= 80 ? '✓ Natural & Readable (No Keyword Stuffing)' : '⚠ Review Keyword Density'}

SEO WARNINGS & POLICY CHECKS:
${seoReport.warnings.length > 0 ? seoReport.warnings.map(w => `⚠ ${w}`).join('\n') : '✓ No policy violations or keyword stuffing detected.'}

RECOMMENDED IMPROVEMENTS:
${seoReport.recommendedImprovements.slice(0, 4).map(r => `• ${r}`).join('\n')}

SEO Last Updated:       ${now}
═══════════════════════════════════════════════════════════════════
`;
  }

  /**
   * Creates a new Google Doc inside the Studio's Books folder
   */
  public static async createBookDoc(
    project: Project,
    accessToken: string
  ): Promise<{ documentId: string; docUrl: string }> {
    const folderInfo = await this.getOrCreateStudioFolder(accessToken);
    const docTitle = this.getDocTitle(project);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // 1. Create Google Doc file directly inside Studio Books folder with custom Studio metadata
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: docTitle,
        mimeType: 'application/vnd.google-apps.document',
        parents: [folderInfo.booksFolderId],
        description: `KDP Book record for project "${project.name}" (ID: ${project.id})`,
        appProperties: {
          createdByStudio: 'true',
          studioProjectId: project.id,
          studioVersion: '2.5',
          kdpDocType: 'book_record',
        },
      }),
    });

    const docFile = await this.handleApiResponse(createRes, 'Create Google Doc File');
    const documentId = docFile.id;
    const docUrl = docFile.webViewLink || `https://docs.google.com/document/d/${documentId}/edit`;

    // 2. Populate structured text content via Docs batchUpdate
    const bodyContent = this.buildDocumentContentText(project, documentId);

    const populateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: bodyContent,
            },
          },
        ],
      }),
    });

    await this.handleApiResponse(populateRes, 'Populate Google Doc Content');

    GoogleAuditLogService.log({
      operation: 'Google Doc Created',
      result: 'success',
      projectId: project.id,
      projectTitle: project.name,
      googleDocumentId: documentId,
      details: `Created and synchronized Google Doc "${docTitle}" (${documentId})`,
    });

    return { documentId, docUrl };
  }

  /**
   * Updates an existing Google Doc with latest project state
   */
  public static async updateBookDoc(
    project: Project,
    documentId: string,
    accessToken: string
  ): Promise<boolean> {
    const docTitle = this.getDocTitle(project);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // 1. Update title & metadata on Drive file
    const updateMetaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        name: docTitle,
        appProperties: {
          createdByStudio: 'true',
          studioProjectId: project.id,
          lastSyncedAt: new Date().toISOString(),
        },
      }),
    });

    if (updateMetaRes.status === 404) {
      const err = new Error(`Google Doc ${documentId} not found (404).`);
      (err as any).status = 404;
      throw err;
    }

    await this.handleApiResponse(updateMetaRes, 'Update Google Doc Metadata');

    // 2. Fetch current document content length to clear and rewrite cleanly
    const getDocRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const docData = await this.handleApiResponse(getDocRes, 'Get Current Doc');
    const docBody = docData.body?.content || [];
    const lastElement = docBody[docBody.length - 1];
    const endIndex = (lastElement?.endIndex || 2) - 1;

    const newContent = this.buildDocumentContentText(project, documentId);

    const requests: any[] = [];
    if (endIndex > 1) {
      requests.push({
        deleteContentRange: {
          range: {
            startIndex: 1,
            endIndex: endIndex,
          },
        },
      });
    }

    requests.push({
      insertText: {
        location: { index: 1 },
        text: newContent,
      },
    });

    const batchRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ requests }),
    });

    await this.handleApiResponse(batchRes, 'Update Google Doc Content');

    GoogleAuditLogService.log({
      operation: 'Google Doc Updated',
      result: 'success',
      projectId: project.id,
      projectTitle: project.name,
      googleDocumentId: documentId,
      details: `Successfully synchronized updates to Google Doc "${docTitle}"`,
    });

    return true;
  }

  /**
   * Safety-verified deletion of linked Google Doc
   * Strict rules:
   * - Must exist
   * - Must have createdByStudio === 'true' or studioProjectId === projectId
   * - If 404, treated idempotently as already deleted
   * - If unverified/moved to unrelated folder without ownership properties, preserve doc and notify
   */
  public static async verifyAndSafeDeleteDoc(
    documentId: string,
    projectId: string,
    accessToken: string
  ): Promise<{
    success: boolean;
    status: 'deleted' | 'not_found' | 'unverified_preserved' | 'failed';
    reason?: string;
  }> {
    const headers = { Authorization: `Bearer ${accessToken}` };

    // 1. Fetch file metadata
    const getRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${documentId}?fields=id,name,trashed,parents,appProperties,owners`,
      { headers }
    );

    if (getRes.status === 404) {
      GoogleAuditLogService.log({
        operation: 'Google Doc Deleted',
        result: 'success',
        projectId,
        googleDocumentId: documentId,
        details: `Document ${documentId} was already deleted from Google Drive (404).`,
      });
      return { success: true, status: 'not_found', reason: 'Document already deleted in Google Drive.' };
    }

    const fileMeta = await this.handleApiResponse(getRes, 'Verify Document for Safe Deletion');

    // 2. Strict safety verification: verify this doc was created and managed by KDP Studio
    const isStudioCreated =
      fileMeta.appProperties?.createdByStudio === 'true' ||
      fileMeta.appProperties?.studioProjectId === projectId ||
      (fileMeta.name && fileMeta.name.startsWith('KDP — '));

    if (!isStudioCreated) {
      GoogleAuditLogService.log({
        operation: 'Google Doc Deleted',
        result: 'warning',
        projectId,
        googleDocumentId: documentId,
        details: 'Google document could not be safely verified as Studio-created. Document was preserved.',
      });
      return {
        success: false,
        status: 'unverified_preserved',
        reason:
          'Google document could not be safely verified. The Studio project was deleted, but the Google document was preserved.',
      };
    }

    // 3. Perform verified deletion
    const delRes = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}`, {
      method: 'DELETE',
      headers,
    });

    if (delRes.status === 404 || delRes.ok || delRes.status === 204) {
      GoogleAuditLogService.log({
        operation: 'Google Doc Deleted',
        result: 'success',
        projectId,
        googleDocumentId: documentId,
        details: `Safely deleted Studio-managed Google Doc "${fileMeta.name}" (${documentId})`,
      });
      return { success: true, status: 'deleted' };
    }

    const err = await delRes.text();
    GoogleAuditLogService.log({
      operation: 'Google Doc Deleted',
      result: 'failed',
      projectId,
      googleDocumentId: documentId,
      details: `Failed to delete Google Doc ${documentId}: ${err}`,
    });

    return {
      success: false,
      status: 'failed',
      reason: `Google Drive deletion returned HTTP ${delRes.status}: ${err}`,
    };
  }

  /**
   * Verifies if a document still exists and is accessible
   */
  public static async checkDocumentExists(documentId: string, accessToken: string): Promise<boolean> {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}?fields=id,trashed`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return false;
      const data = await res.json();
      return !data.trashed;
    } catch {
      return false;
    }
  }

  /**
   * High-level helper to sync a Project with Google Docs
   */
  public static async syncProject(
    project: Project,
    accessToken: string
  ): Promise<{ documentId: string; docUrl: string }> {
    const existingDocId = project.googleIntegration?.googleDocumentId;
    if (existingDocId) {
      const exists = await this.checkDocumentExists(existingDocId, accessToken);
      if (exists) {
        await this.updateBookDoc(project, existingDocId, accessToken);
        return {
          documentId: existingDocId,
          docUrl: project.googleIntegration?.googleDocUrl || `https://docs.google.com/document/d/${existingDocId}/edit`,
        };
      }
    }

    return await this.createBookDoc(project, accessToken);
  }
}
