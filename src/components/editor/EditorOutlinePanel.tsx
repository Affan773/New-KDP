import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  FileText,
  Trash2,
  Edit2,
  Plus,
  Grid,
  CheckCircle2,
  AlertTriangle,
  Key,
  Layers,
  Sparkles,
  MoreVertical,
  Search,
  ArrowUp,
  ArrowDown,
  Copy,
  Sliders,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useApp } from '../../context/AppContext';
import { BookSection } from '../../types/book';
import { PageModel } from '../../types/project';
import { PageNumberingService } from '../../services/pageNumberingService';

interface EditorOutlinePanelProps {
  onOpenSettings?: () => void;
  onOpenValidation?: () => void;
  onOpenBulkEdit?: () => void;
  onOpenStyles?: () => void;
  onOpenPreview?: () => void;
}

export const EditorOutlinePanel: React.FC<EditorOutlinePanelProps> = ({
  onOpenSettings,
  onOpenValidation,
  onOpenBulkEdit,
  onOpenStyles,
  onOpenPreview,
}) => {
  const {
    document,
    currentPageIndex,
    selectPage,
    addPage,
    deletePage,
    duplicatePage,
    reorderPage,
    updateDocument,
  } = useEditor();

  const { activeProject, updateProject, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [showNewSectionInput, setShowNewSectionInput] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const pages = document?.pages || [];
  const sections = activeProject?.sections || [];

  // Filtered pages based on search
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages;
    const q = searchQuery.toLowerCase();
    return pages.filter(p => {
      if (p.name?.toLowerCase().includes(q)) return true;
      if (p.notes?.toLowerCase().includes(q)) return true;
      if (`page ${p.pageNumber}`.includes(q)) return true;
      return p.elements.some(
        el =>
          el.name?.toLowerCase().includes(q) ||
          (el.type === 'text' && el.content?.toLowerCase().includes(q)) ||
          (el.type === 'puzzle' && el.title?.toLowerCase().includes(q))
      );
    });
  }, [pages, searchQuery]);

  if (!document) {
    return (
      <div className="p-6 text-center text-xs text-neutral-400">
        No document active.
      </div>
    );
  }

  const frontMatterPages = pages.filter(
    p => p.pageType && ['title', 'copyright', 'instructions', 'toc', 'introduction', 'disclaimer'].includes(p.pageType)
  );
  const backMatterPages = pages.filter(p => p.isAnswerKey || p.pageType === 'answer_key');
  const contentPages = pages.filter(
    p => !frontMatterPages.includes(p) && !backMatterPages.includes(p)
  );

  const toggleCollapse = (id: string) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim() || !activeProject) return;

    const newSection: BookSection = {
      id: `sec-${Date.now()}`,
      title: newSectionTitle.trim(),
      order: (activeProject.sections?.length || 0) + 1,
      pageIds: [],
    };

    const updatedSections = [...(activeProject.sections || []), newSection];
    updateProject({
      ...activeProject,
      sections: updatedSections,
    });

    setNewSectionTitle('');
    setShowNewSectionInput(false);
    showToast({
      type: 'success',
      message: `Section "${newSection.title}" created.`,
    });
  };

  const handleDeleteSection = (sectionId: string, sectionTitle: string) => {
    if (!activeProject) return;
    const updatedSections = (activeProject.sections || []).filter(s => s.id !== sectionId);

    // Unassign pages in this section
    const updatedPages = document.pages.map(p =>
      p.sectionId === sectionId ? { ...p, sectionId: undefined } : p
    );

    updateProject({
      ...activeProject,
      sections: updatedSections,
    });
    updateDocument({ ...document, pages: updatedPages });

    showToast({
      type: 'info',
      message: `Section "${sectionTitle}" removed. Pages preserved.`,
    });
  };

  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    reorderPage(index, targetIndex);
  };

  const getPageIcon = (page: PageModel) => {
    if (page.pageType === 'title') return <FileText className="w-3.5 h-3.5 text-amber-500" />;
    if (page.pageType === 'copyright') return <FileText className="w-3.5 h-3.5 text-neutral-400" />;
    if (page.pageType === 'instructions') return <Sparkles className="w-3.5 h-3.5 text-blue-500" />;
    if (page.pageType === 'toc') return <Grid className="w-3.5 h-3.5 text-purple-500" />;
    if (page.isAnswerKey || page.pageType === 'answer_key') return <Key className="w-3.5 h-3.5 text-emerald-500" />;
    return <FileText className="w-3.5 h-3.5 text-neutral-500" />;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 select-none overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Book Structure Outline
            </h3>
            <p className="text-[10px] text-neutral-400">
              {pages.length} Total Pages • {sections.length} Sections
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowNewSectionInput(!showNewSectionInput)}
              title="Add Section"
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => addPage()}
              title="Add Blank Page"
              className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search pages, puzzles, titles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        {/* Inline Add Section Form */}
        {showNewSectionInput && (
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              placeholder="Section Name (e.g. Medium Mazes)"
              value={newSectionTitle}
              onChange={e => setNewSectionTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSection()}
              className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddSection}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-neutral-950 text-xs font-bold"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
        {/* If Searching, show Flat Results */}
        {searchQuery.trim() ? (
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-neutral-400 px-2 uppercase tracking-wider">
              Search Results ({filteredPages.length})
            </div>
            {filteredPages.map(page => {
              const pIndex = pages.findIndex(p => p.id === page.id);
              const isActive = pIndex === currentPageIndex;

              return (
                <div
                  key={page.id}
                  onClick={() => selectPage(pIndex)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getPageIcon(page)}
                    <span className="truncate">
                      {page.name || `Page ${page.pageNumber}`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60">
                    p.{page.pageNumber}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {/* 1. FRONT MATTER */}
            {frontMatterPages.length > 0 && (
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleCollapse('front_matter')}
                  className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-bold text-neutral-600 dark:text-neutral-300"
                >
                  <div className="flex items-center gap-1.5">
                    {collapsedSections['front_matter'] ? (
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                    <span>📖 Front Matter</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800">
                    {frontMatterPages.length}
                  </span>
                </button>

                {!collapsedSections['front_matter'] && (
                  <div className="pl-3 space-y-0.5 border-l border-neutral-200 dark:border-neutral-800 ml-2.5">
                    {frontMatterPages.map(page => {
                      const pIndex = pages.findIndex(p => p.id === page.id);
                      const isActive = pIndex === currentPageIndex;

                      return (
                        <div
                          key={page.id}
                          onClick={() => selectPage(pIndex)}
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                            isActive
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate flex-1">
                            {getPageIcon(page)}
                            <span className="truncate text-xs">
                              {page.name || `Page ${page.pageNumber}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                duplicatePage(pIndex);
                              }}
                              title="Duplicate Page"
                              className="p-1 hover:text-amber-500"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                deletePage(pIndex);
                              }}
                              title="Delete Page"
                              className="p-1 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. CUSTOM SECTIONS OR FLAT CONTENT */}
            {sections.length > 0 ? (
              sections.map(section => {
                const sectionPages = pages.filter(p => p.sectionId === section.id);
                const isCollapsed = !!collapsedSections[section.id];

                return (
                  <div key={section.id} className="space-y-0.5">
                    <div className="group flex items-center justify-between p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-bold text-neutral-700 dark:text-neutral-200">
                      <button
                        type="button"
                        onClick={() => toggleCollapse(section.id)}
                        className="flex items-center gap-1.5 truncate flex-1 text-left"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                        <span className="truncate">📂 {section.title}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800">
                          {sectionPages.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(section.id, section.title)}
                          title="Delete Section"
                          className="p-1 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="pl-3 space-y-0.5 border-l border-neutral-200 dark:border-neutral-800 ml-2.5">
                        {sectionPages.map(page => {
                          const pIndex = pages.findIndex(p => p.id === page.id);
                          const isActive = pIndex === currentPageIndex;

                          return (
                            <div
                              key={page.id}
                              onClick={() => selectPage(pIndex)}
                              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                                isActive
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate flex-1">
                                {getPageIcon(page)}
                                <span className="truncate text-xs">
                                  {page.name || `Page ${page.pageNumber}`}
                                </span>
                              </div>

                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleMovePage(pIndex, 'up');
                                  }}
                                  disabled={pIndex === 0}
                                  className="p-1 hover:text-amber-500 disabled:opacity-20"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleMovePage(pIndex, 'down');
                                  }}
                                  disabled={pIndex === pages.length - 1}
                                  className="p-1 hover:text-amber-500 disabled:opacity-20"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    duplicatePage(pIndex);
                                  }}
                                  title="Duplicate"
                                  className="p-1 hover:text-amber-500"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    deletePage(pIndex);
                                  }}
                                  title="Delete"
                                  className="p-1 hover:text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              /* Flat Content Group */
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleCollapse('main_content')}
                  className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-bold text-neutral-600 dark:text-neutral-300"
                >
                  <div className="flex items-center gap-1.5">
                    {collapsedSections['main_content'] ? (
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                    <span>📑 Interior Puzzles</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800">
                    {contentPages.length}
                  </span>
                </button>

                {!collapsedSections['main_content'] && (
                  <div className="pl-3 space-y-0.5 border-l border-neutral-200 dark:border-neutral-800 ml-2.5">
                    {contentPages.map(page => {
                      const pIndex = pages.findIndex(p => p.id === page.id);
                      const isActive = pIndex === currentPageIndex;

                      return (
                        <div
                          key={page.id}
                          onClick={() => selectPage(pIndex)}
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                            isActive
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate flex-1">
                            {getPageIcon(page)}
                            <span className="truncate text-xs">
                              {page.name || `Page ${page.pageNumber}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleMovePage(pIndex, 'up');
                              }}
                              disabled={pIndex === 0}
                              className="p-1 hover:text-amber-500 disabled:opacity-20"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleMovePage(pIndex, 'down');
                              }}
                              disabled={pIndex === pages.length - 1}
                              className="p-1 hover:text-amber-500 disabled:opacity-20"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                duplicatePage(pIndex);
                              }}
                              title="Duplicate"
                              className="p-1 hover:text-amber-500"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                deletePage(pIndex);
                              }}
                              title="Delete"
                              className="p-1 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. ANSWER KEYS / SOLUTIONS */}
            {backMatterPages.length > 0 && (
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleCollapse('back_matter')}
                  className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-bold text-neutral-600 dark:text-neutral-300"
                >
                  <div className="flex items-center gap-1.5">
                    {collapsedSections['back_matter'] ? (
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                    <span>🔑 Answer Keys</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800">
                    {backMatterPages.length}
                  </span>
                </button>

                {!collapsedSections['back_matter'] && (
                  <div className="pl-3 space-y-0.5 border-l border-neutral-200 dark:border-neutral-800 ml-2.5">
                    {backMatterPages.map(page => {
                      const pIndex = pages.findIndex(p => p.id === page.id);
                      const isActive = pIndex === currentPageIndex;

                      return (
                        <div
                          key={page.id}
                          onClick={() => selectPage(pIndex)}
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                            isActive
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate flex-1">
                            {getPageIcon(page)}
                            <span className="truncate text-xs">
                              {PageNumberingService.isSolutionPage(page)
                                ? PageNumberingService.getSolutionPageHeading(page, pages, activeProject)
                                : page.name || `Page ${page.pageNumber}`}
                            </span>
                          </div>

                          <span className="text-[10px] font-mono opacity-60">
                            p.{page.pageNumber}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Launch Action Bar at Bottom of Outline */}
      <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/60 grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={onOpenBulkEdit}
          title="Bulk Edit Pages"
          className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-400"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-500" />
          <span>Bulk</span>
        </button>

        <button
          type="button"
          onClick={onOpenStyles}
          title="Book Styles"
          className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-400"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Styles</span>
        </button>

        <button
          type="button"
          onClick={onOpenValidation}
          title="KDP Preflight"
          className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-400"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Preflight</span>
        </button>

        <button
          type="button"
          onClick={onOpenPreview}
          title="Full Book Preview"
          className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-400"
        >
          <Eye className="w-3.5 h-3.5 text-purple-500" />
          <span>Spread</span>
        </button>
      </div>
    </div>
  );
};
